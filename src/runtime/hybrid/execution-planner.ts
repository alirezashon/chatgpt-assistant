import { CapabilityResolver } from './capability-resolver';
import { DeviceCapabilityDetector } from './device-capability-detector';
import { PlacementEngine } from './placement-engine';
import type { ExecutionRequest, PlacementDecision, RuntimeDescriptor } from './hybrid-types';

/** Execution planner, runtime selector, and decision engine. */
export class ExecutionPlanner {
  public constructor(
    private readonly deviceDetector = new DeviceCapabilityDetector(),
    private readonly resolver = new CapabilityResolver(),
    private readonly placement = new PlacementEngine(),
  ) {}

  /** Creates placement decision. */
  public plan(request: ExecutionRequest, runtimes: readonly RuntimeDescriptor[]): PlacementDecision {
    const device = this.deviceDetector.detect();
    const candidates = this.resolver.resolve(request.capability, runtimes, device);
    return this.placement.choose(request, candidates, device);
  }
}
