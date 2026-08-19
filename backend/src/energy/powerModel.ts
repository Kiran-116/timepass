/**
 * GreenOps AI - Phase 6: PowerModel Abstraction & Interfaces
 * 
 * Core Principle: AI proposes. Measurement verifies.
 * Allows replacing model-based estimation with calibrated hardware
 * or cloud energy telemetry in the future without architectural redesign.
 */

export interface PowerModelConfig {
  id: string;
  name: string;
  idlePowerW: number;   // Power consumption at 0% CPU (Watts)
  activePowerW: number; // Power consumption at 100% CPU (Watts)
  memoryPowerPerGbW?: number; // Additional power per GB RAM (Watts)
  description?: string;
}

export interface PowerModel {
  readonly id: string;
  readonly name: string;
  readonly idlePowerW: number;
  readonly activePowerW: number;

  /**
   * Calculates instantaneous power draw in Watts for given telemetry signals.
   * @param cpuUtilizationPercent CPU load between 0 and 100
   * @param memoryMb Memory usage in MB
   */
  calculatePower(cpuUtilizationPercent: number, memoryMb?: number): number;
}

/**
 * Default linear interpolation PowerModel implementation.
 * Power(W) = Idle(W) + (Active(W) - Idle(W)) * (CPU% / 100) + MemoryPower(W)
 */
export class ConfigurablePowerModel implements PowerModel {
  public readonly id: string;
  public readonly name: string;
  public readonly idlePowerW: number;
  public readonly activePowerW: number;
  public readonly memoryPowerPerGbW: number;

  constructor(config: PowerModelConfig) {
    if (config.idlePowerW < 0 || config.activePowerW < 0) {
      throw new Error("Power model values (idlePowerW, activePowerW) cannot be negative.");
    }
    if (config.activePowerW < config.idlePowerW) {
      throw new Error("Active power (activePowerW) cannot be less than idle power (idlePowerW).");
    }

    this.id = config.id;
    this.name = config.name;
    this.idlePowerW = config.idlePowerW;
    this.activePowerW = config.activePowerW;
    this.memoryPowerPerGbW = config.memoryPowerPerGbW ?? 0.38;
  }

  public calculatePower(cpuUtilizationPercent: number, memoryMb: number = 256): number {
    const clampedCpu = Math.min(Math.max(cpuUtilizationPercent, 0), 100);
    const clampedMem = Math.max(memoryMb, 0);

    const cpuFraction = clampedCpu / 100;
    const dynamicCpuPower = (this.activePowerW - this.idlePowerW) * cpuFraction;
    const memoryGb = clampedMem / 1024;
    const memoryPower = this.memoryPowerPerGbW * memoryGb;

    const totalPower = this.idlePowerW + dynamicCpuPower + memoryPower;
    return Number(totalPower.toFixed(4));
  }
}

// Preset Hardware Power Profiles
export const DEMO_POWER_PROFILE = new ConfigurablePowerModel({
  id: "demo-profile",
  name: "Demo Server Profile",
  idlePowerW: 30.0,
  activePowerW: 80.0,
  memoryPowerPerGbW: 0.38,
  description: "Standard hackathon demo hardware profile (30W idle, 80W active)"
});

export const CLOUD_STANDARD_PROFILE = new ConfigurablePowerModel({
  id: "cloud-standard",
  name: "Standard Cloud VM (2 vCPU, 4GB RAM)",
  idlePowerW: 25.0,
  activePowerW: 85.0,
  memoryPowerPerGbW: 0.38,
  description: "General purpose cloud compute node"
});

export const ARM_EFFICIENT_PROFILE = new ConfigurablePowerModel({
  id: "arm-efficient",
  name: "ARM Eco-Node (Graviton / Apple Silicon)",
  idlePowerW: 10.0,
  activePowerW: 45.0,
  memoryPowerPerGbW: 0.25,
  description: "High-efficiency ARM server profile"
});
