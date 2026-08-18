export interface AnalysisFinding {
  category:
    | "NESTED_ITERATION"
    | "N_PLUS_ONE_QUERY"
    | "REPEATED_API_CALL"
    | "REDUNDANT_COMPUTATION"
    | "EXCESSIVE_MEMORY_ALLOCATION"
    | string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  file: string;
  line: number;
  description: string;
  recommendation: string;
}

export interface AnalyzerOptions {
  fileName?: string;
  language?: string;
}

// Patterns for detecting loop headers
const PYTHON_LOOP_PATTERN = /^\s*(for\s+\w+(\s*,\s*\w+)*\s+in\s+|while\s+)/;
const JS_LOOP_PATTERN = /^\s*(for\s*\(|while\s*\(|for\s+await\s*\()/;
const GENERIC_LOOP_PATTERN = /^\s*(for|while)\b/;

// Patterns for database operations inside loops
const DB_PATTERN =
  /\b(db|cursor|session|models?|connection|client|conn|orm|prisma|knex|sequelize|typeorm|mongoose|repository)\s*(\.|->)\s*(query|execute|executemany|find|findOne|findMany|findAll|findUnique|insert|update|delete|select|raw|save|create|bulkCreate|destroy)\s*\(|\b(SELECT|INSERT|UPDATE|DELETE)\s+.*\s+(FROM|INTO|WHERE)\b/i;

// Patterns for API/network calls inside loops
const API_PATTERN =
  /\b(fetch|axios|axios\.(get|post|put|patch|delete)|requests\.(get|post|put|patch|delete|request)|http\.(get|request)|https\.(get|request)|urllib\.request\.\w+|client\.(get|post|put|delete))\s*\(/i;

// Patterns for expensive/redundant computation
const EXPENSIVE_COMPUTATION_PATTERN =
  /\b(Math\.(pow|sqrt|sin|cos|tan|log|log10|exp|asin|acos|atan)|math\.(pow|sqrt|sin|cos|tan|log|log10|exp|asin|acos|atan)|JSON\.(parse|stringify)|json\.(loads|dumps)|re\.compile|RegExp)\s*\([^)]+\)/i;

// Patterns for repeated memory allocation inside loops
const MEMORY_ALLOCATION_PATTERN =
  /\b(new\s+(Array|Map|Set|Object|Buffer|Uint8Array|Float64Array)|Array\s*\(\s*\d+\s*\)|Buffer\.alloc|bytearray\s*\(|bytes\s*\(|\[\s*0\s*\]\s*\*\s*\d+|\[\s*None\s*\]\s*\*\s*\d+|list\s*\(\s*range\s*\(|new\s+\w+\s*\[\s*\d+\s*\])/i;

interface LoopScope {
  lineIndex: number;
  indent: number;
  depth: number;
}

function getIndentation(line: string): number {
  const match = line.match(/^(\s*)/);
  return match ? match[1].length : 0;
}

function isLoopHeader(line: string, isPython: boolean): boolean {
  if (isPython) {
    return PYTHON_LOOP_PATTERN.test(line) && line.trim().endsWith(":");
  }
  return JS_LOOP_PATTERN.test(line) || GENERIC_LOOP_PATTERN.test(line);
}

export function analyzeCode(code: string, options: AnalyzerOptions = {}): AnalysisFinding[] {
  const fileName = options.fileName || "service.py";
  const language = (options.language || "python").toLowerCase();
  const isPython = language === "python" || fileName.endsWith(".py");

  const rawLines = code.split(/\r?\n/);
  const findings: AnalysisFinding[] = [];

  // Track active loops by scope (line index, indentation level, and block depth)
  const activeLoops: LoopScope[] = [];
  const nestedLoopLinesReported = new Set<number>();

  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i];
    const trimmedLine = rawLine.trim();

    // Skip empty lines or pure comment lines
    if (!trimmedLine || trimmedLine.startsWith("#") || trimmedLine.startsWith("//")) {
      continue;
    }

    const currentIndent = getIndentation(rawLine);
    const lineNumber = i + 1;

    // In Python: pop loop scopes whose indentation is >= current indentation
    if (isPython) {
      while (activeLoops.length > 0) {
        const top = activeLoops[activeLoops.length - 1];
        if (currentIndent <= top.indent) {
          activeLoops.pop();
        } else {
          break;
        }
      }
    }

    const isLoop = isLoopHeader(trimmedLine, isPython);

    if (isLoop) {
      // 1. O(n²) / Nested Iteration Detection
      if (activeLoops.length > 0) {
        if (!nestedLoopLinesReported.has(lineNumber)) {
          nestedLoopLinesReported.add(lineNumber);
          findings.push({
            category: "NESTED_ITERATION",
            severity: "HIGH",
            file: fileName,
            line: lineNumber,
            description:
              "Potential compute hotspot: nested iteration can cause quadratic growth in computation.",
            recommendation:
              "Consider reducing nested iteration, using a more efficient algorithm, or using a suitable lookup structure.",
          });
        }
      }

      // Push this loop to active scopes
      activeLoops.push({
        lineIndex: i,
        indent: currentIndent,
        depth: activeLoops.length + 1,
      });
      continue;
    }

    // Only inspect loop-body patterns if currently inside at least one loop
    if (activeLoops.length > 0) {
      // 2. N+1 Database Query Detection
      if (DB_PATTERN.test(trimmedLine)) {
        findings.push({
          category: "N_PLUS_ONE_QUERY",
          severity: "HIGH",
          file: fileName,
          line: lineNumber,
          description:
            "A database operation appears inside a loop and may create an N+1 query pattern.",
          recommendation:
            "Move the database operation outside the loop or use batching/eager loading where appropriate.",
        });
      }

      // 3. Repeated API Calls Detection
      if (API_PATTERN.test(trimmedLine)) {
        findings.push({
          category: "REPEATED_API_CALL",
          severity: "HIGH",
          file: fileName,
          line: lineNumber,
          description: "An API call appears inside a loop and may repeatedly perform network work.",
          recommendation:
            "Batch requests, cache reusable responses, or move the API call outside the loop where possible.",
        });
      }

      // 5. Excessive Memory Allocation Detection
      if (MEMORY_ALLOCATION_PATTERN.test(trimmedLine)) {
        findings.push({
          category: "EXCESSIVE_MEMORY_ALLOCATION",
          severity: "MEDIUM",
          file: fileName,
          line: lineNumber,
          description:
            "Repeated memory allocation inside a loop may increase memory usage and garbage-collection work.",
          recommendation:
            "Reuse allocated objects or buffers where practical instead of creating them repeatedly.",
        });
      }
    }
  }

  // 4. Redundant Computation Detection across the whole file
  const expressionLocations = new Map<string, number[]>();

  for (let i = 0; i < rawLines.length; i++) {
    const trimmedLine = rawLines[i].trim();
    if (!trimmedLine || trimmedLine.startsWith("#") || trimmedLine.startsWith("//")) {
      continue;
    }

    const matches = trimmedLine.match(EXPENSIVE_COMPUTATION_PATTERN);
    if (matches) {
      const expr = matches[0].replace(/\s+/g, "").toLowerCase();
      const list = expressionLocations.get(expr) || [];
      list.push(i + 1);
      expressionLocations.set(expr, list);
    }
  }

  for (const [expr, lines] of expressionLocations.entries()) {
    if (lines.length >= 2) {
      // Report the second occurrence as redundant computation
      findings.push({
        category: "REDUNDANT_COMPUTATION",
        severity: "MEDIUM",
        file: fileName,
        line: lines[1],
        description: `The expensive expression ${expr} appears multiple times and may be unnecessarily recomputed.`,
        recommendation: "Store the computed result and reuse it when the inputs have not changed.",
      });
    }
  }

  // Sort findings by line number
  return findings.sort((a, b) => a.line - b.line);
}
