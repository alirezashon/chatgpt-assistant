import type { DeviceCapabilityProfile, ResourceBudget } from './hybrid-types';

/** Resource manager for CPU, GPU, memory, AI cost, battery awareness, and adaptive throttling. */
export class ResourceManager {
  private budget: ResourceBudget = {
    aiCostScore: 1,
    batteryAware: true,
    cpuPercent: 80,
    gpuPercent: 80,
    memoryMb: 1_024,
  };

  /** Sets budget. */
  public setBudget(budget: ResourceBudget): void {
    this.budget = budget;
  }

  /** Returns whether local execution should be throttled. */
  public shouldThrottle(device: DeviceCapabilityProfile, memoryNeededMb: number): boolean {
    if (memoryNeededMb > this.budget.memoryMb || memoryNeededMb > device.ramMb * 0.5) {
      return true;
    }

    return this.budget.batteryAware && !device.charging && device.batteryLevel < 0.2;
  }

  /** Budget snapshot. */
  public currentBudget(): ResourceBudget {
    return this.budget;
  }
}
