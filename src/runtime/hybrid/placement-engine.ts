import type {
  DeviceCapabilityProfile,
  ExecutionRequest,
  PlacementDecision,
  RuntimeDescriptor,
  RuntimeTarget,
} from './hybrid-types';
import { HybridRuntimeError } from './hybrid-types';

/** Scores eligible runtimes by privacy, latency, cost, offline support, resources, and policy. */
export class PlacementEngine {
  /** Chooses best runtime target. */
  public choose(
    request: ExecutionRequest,
    candidates: readonly RuntimeDescriptor[],
    device: DeviceCapabilityProfile,
  ): PlacementDecision {
    const allowed = candidates.filter((runtime) => request.policy.allowedTargets.includes(runtime.target));
    const dataPlaced = allowed.filter((runtime) => allowedByDataPlacement(request.policy.dataPlacement, runtime.target));
    const feasible = dataPlaced
      .filter((runtime) => runtime.latencyMs <= request.policy.maxLatencyMs || request.priority === 'critical')
      .filter((runtime) => runtime.costScore <= request.policy.maxCostScore)
      .filter((runtime) => !request.policy.requireOffline || runtime.supportsOffline)
      .filter((runtime) => request.policy.dataResidency === undefined || runtime.region === undefined || runtime.region === request.policy.dataResidency);

    if (feasible.length === 0) {
      throw new HybridRuntimeError('HYBRID_PLACEMENT_DENIED', 'No runtime target satisfies execution policy.');
    }

    const ranked = feasible
      .map((runtime) => ({
        reasons: reasonsFor(request, runtime, device),
        runtime,
        score: score(request, runtime, device),
      }))
      .sort((left, right) => right.score - left.score);
    const selected = ranked[0];

    if (selected === undefined) {
      throw new HybridRuntimeError('HYBRID_PLACEMENT_DENIED', 'No runtime target could be selected.');
    }

    return {
      fallbackTargets: ranked.slice(1).map((item) => item.runtime.target),
      reasons: selected.reasons,
      requestId: request.id,
      score: selected.score,
      target: selected.runtime.target,
    };
  }
}

function allowedByDataPlacement(placement: ExecutionRequest['policy']['dataPlacement'], target: RuntimeTarget): boolean {
  if (placement === 'never-leave-device' || placement === 'personally-sensitive') {
    return ['browser-ui', 'content-script', 'extension-service-worker', 'offscreen-document', 'shared-worker', 'local'].includes(target);
  }

  if (placement === 'can-use-edge') {
    return target !== 'cloud';
  }

  if (placement === 'enterprise-restricted') {
    return target !== 'cloud';
  }

  return true;
}

function score(request: ExecutionRequest, runtime: RuntimeDescriptor, device: DeviceCapabilityProfile): number {
  const latency = 1 - runtime.latencyMs / Math.max(request.policy.maxLatencyMs, runtime.latencyMs, 1);
  const cost = 1 - runtime.costScore / Math.max(request.policy.maxCostScore, runtime.costScore, 1);
  const privacy = runtime.privacyScore;
  const localBonus = request.policy.preferLocal && runtime.target === 'local' ? 0.2 : 0;
  const batteryPenalty = device.batteryLevel < 0.2 && !device.charging && ['local', 'browser-ui', 'content-script'].includes(runtime.target) ? 0.25 : 0;
  return Math.max(0, latency * 0.25 + cost * 0.2 + privacy * 0.35 + localBonus - batteryPenalty);
}

function reasonsFor(
  request: ExecutionRequest,
  runtime: RuntimeDescriptor,
  device: DeviceCapabilityProfile,
): readonly string[] {
  const reasons = [`capability=${request.capability}`, `target=${runtime.target}`, `latency=${runtime.latencyMs.toString()}ms`];

  if (request.policy.preferLocal && runtime.target === 'local') {
    reasons.push('local-preferred');
  }

  if (device.network === 'offline') {
    reasons.push('offline-compatible');
  }

  if (runtime.region !== undefined) {
    reasons.push(`region=${runtime.region}`);
  }

  return reasons;
}
