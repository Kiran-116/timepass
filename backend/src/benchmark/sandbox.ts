import { spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { SandboxExecutionResult } from "./types";

// Check if Docker daemon is accessible
export async function checkDockerAvailable(): Promise<{ available: boolean; error?: string }> {
  return new Promise((resolve) => {
    const proc = spawn("docker", ["info", "--format", "{{.ServerVersion}}"]);
    let errorOutput = "";

    proc.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    proc.on("error", (err) => {
      resolve({ available: false, error: err.message });
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve({ available: true });
      } else {
        resolve({
          available: false,
          error: errorOutput.trim() || `Docker exited with code ${code}`,
        });
      }
    });
  });
}

// Generate Python telemetry runner wrapper
function generatePythonWrapper(userCodeFileName: string): string {
  return `import sys
import time
import tracemalloc
import json

def run():
    tracemalloc.start()
    start_wall = time.perf_counter()
    start_cpu = time.process_time()

    try:
        with open('${userCodeFileName}', 'r', encoding='utf-8') as f:
            code_content = f.read()
        global_scope = {'__name__': '__main__'}
        exec(compile(code_content, '${userCodeFileName}', 'exec'), global_scope)
        exit_code = 0
    except Exception as e:
        print(f"Execution Error: {e}", file=sys.stderr)
        exit_code = 1

    end_wall = time.perf_counter()
    end_cpu = time.process_time()
    current_mem, peak_mem = tracemalloc.get_traced_memory()
    tracemalloc.stop()

    wall_duration_ms = max(0.1, (end_wall - start_wall) * 1000)
    cpu_duration_ms = max(0.0, (end_cpu - start_cpu) * 1000)
    cpu_percent = min(100.0, max(1.0, (cpu_duration_ms / wall_duration_ms) * 100.0))
    memory_mb = max(0.5, peak_mem / (1024 * 1024))

    telemetry = {
        "executionTimeMs": round(wall_duration_ms, 2),
        "cpuUsagePercent": round(cpu_percent, 1),
        "memoryMb": round(memory_mb, 2),
        "exitCode": exit_code
    }
    print("__GREENOPS_TELEMETRY__" + json.dumps(telemetry))

if __name__ == '__main__':
    run()
`;
}

// Generate JavaScript/Node.js telemetry runner wrapper
function generateNodeWrapper(userCodeFileName: string): string {
  return `const fs = require('fs');
const { performance } = require('perf_hooks');

async function run() {
  const startMem = process.memoryUsage().heapUsed;
  const startCpu = process.cpuUsage();
  const startWall = performance.now();
  let exitCode = 0;

  try {
    const code = fs.readFileSync('${userCodeFileName}', 'utf-8');
    const fn = new Function('require', 'console', 'process', code);
    await fn(require, console, process);
  } catch (err) {
    console.error('Execution Error:', err.message);
    exitCode = 1;
  }

  const endWall = performance.now();
  const cpuDiff = process.cpuUsage(startCpu);
  const endMem = process.memoryUsage().heapUsed;

  const wallDurationMs = Math.max(0.1, endWall - startWall);
  const cpuDurationMs = (cpuDiff.user + cpuDiff.system) / 1000;
  const cpuPercent = Math.min(100.0, Math.max(1.0, (cpuDurationMs / wallDurationMs) * 100.0));
  const memoryMb = Math.max(1.0, endMem / (1024 * 1024));

  const telemetry = {
    executionTimeMs: Number(wallDurationMs.toFixed(2)),
    cpuUsagePercent: Number(cpuPercent.toFixed(1)),
    memoryMb: Number(memoryMb.toFixed(2)),
    exitCode
  };
  console.log('__GREENOPS_TELEMETRY__' + JSON.stringify(telemetry));
}

run();
`;
}

export async function executeInDockerSandbox(
  code: string,
  options: {
    language?: string;
    fileName?: string;
    timeoutMs?: number;
    cpuLimit?: number;
    memoryLimitMb?: number;
  } = {}
): Promise<SandboxExecutionResult> {
  const language = (options.language || "python").toLowerCase();
  const isPython = language === "python" || options.fileName?.endsWith(".py");
  const timeoutMs = options.timeoutMs || 10000;
  const cpuLimit = options.cpuLimit || 1.0;
  const memoryLimitMb = options.memoryLimitMb || 256;

  // Check Docker availability first
  const dockerStatus = await checkDockerAvailable();
  if (!dockerStatus.available) {
    return {
      success: false,
      executionTimeMs: 0,
      cpuUsagePercent: 0,
      memoryMb: 0,
      exitCode: 1,
      error: `Docker sandbox unavailable: ${dockerStatus.error || "Docker daemon is not running"}`,
    };
  }

  // Create isolated temp directory
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "greenops-sandbox-"));
  const userFileName = isPython ? "workload.py" : "workload.js";
  const runnerFileName = isPython ? "runner.py" : "runner.js";
  const image = isPython ? "python:3.11-alpine" : "node:20-alpine";
  const cmd = isPython ? ["python", `/app/${runnerFileName}`] : ["node", `/app/${runnerFileName}`];

  try {
    // Write user code and telemetry wrapper
    fs.writeFileSync(path.join(tempDir, userFileName), code, "utf-8");
    const wrapperContent = isPython
      ? generatePythonWrapper(userFileName)
      : generateNodeWrapper(userFileName);
    fs.writeFileSync(path.join(tempDir, runnerFileName), wrapperContent, "utf-8");

    // Build secure Docker arguments:
    // 1. --rm: remove container upon exit
    // 2. --network none: strictly isolate network
    // 3. --memory ${memoryLimitMb}m --memory-swap ${memoryLimitMb}m: enforce strict memory limit
    // 4. --cpus ${cpuLimit}: enforce CPU limits
    // 5. --pids-limit 64: prevent fork bombs
    // 6. --cap-drop ALL: drop all Linux capabilities
    // 7. -v ${tempDir}:/app:ro: mount temp directory read-only
    // 8. -w /app: working directory
    // NO --privileged flag used
    const dockerArgs = [
      "run",
      "--rm",
      "--network",
      "none",
      `--memory=${memoryLimitMb}m`,
      `--memory-swap=${memoryLimitMb}m`,
      `--cpus=${cpuLimit}`,
      "--pids-limit=64",
      "--cap-drop=ALL",
      "-v",
      `${tempDir}:/app:ro`,
      "-w",
      "/app",
      image,
      ...cmd,
    ];

    return await new Promise<SandboxExecutionResult>((resolve) => {
      let stdout = "";
      let stderr = "";
      let isTimedOut = false;

      const proc = spawn("docker", dockerArgs);

      const timer = setTimeout(() => {
        isTimedOut = true;
        proc.kill("SIGKILL");
        resolve({
          success: false,
          executionTimeMs: timeoutMs,
          cpuUsagePercent: 0,
          memoryMb: 0,
          exitCode: 124,
          isTimeout: true,
          error: `Execution timed out after ${timeoutMs}ms`,
        });
      }, timeoutMs);

      proc.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      proc.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      proc.on("error", (err) => {
        clearTimeout(timer);
        if (!isTimedOut) {
          resolve({
            success: false,
            executionTimeMs: 0,
            cpuUsagePercent: 0,
            memoryMb: 0,
            exitCode: 1,
            error: `Failed to spawn Docker sandbox: ${err.message}`,
          });
        }
      });

      proc.on("close", (code) => {
        clearTimeout(timer);
        if (isTimedOut) return;

        // Parse structured telemetry
        const telemetryMarker = "__GREENOPS_TELEMETRY__";
        const markerIndex = stdout.indexOf(telemetryMarker);

        if (markerIndex !== -1) {
          try {
            const telemetryJson = stdout.substring(markerIndex + telemetryMarker.length).trim();
            const telemetry = JSON.parse(telemetryJson);
            resolve({
              success: code === 0,
              executionTimeMs: telemetry.executionTimeMs || 0,
              cpuUsagePercent: telemetry.cpuUsagePercent || 0,
              memoryMb: telemetry.memoryMb || 0,
              exitCode: code || 0,
              stdout: stdout.substring(0, markerIndex).trim(),
              stderr: stderr.trim(),
            });
            return;
          } catch {
            // fallback if JSON parse fails
          }
        }

        resolve({
          success: code === 0,
          executionTimeMs: 0,
          cpuUsagePercent: 0,
          memoryMb: 0,
          exitCode: code || 0,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          error: code !== 0 ? stderr.trim() || `Process exited with code ${code}` : undefined,
        });
      });
    });
  } finally {
    // Clean up temporary sandbox directory
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup error
    }
  }
}
