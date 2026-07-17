# ADR: Hybrid Edge Runtime And Browser Execution Infrastructure

## Status

Accepted

## Context

The AI browser platform now contains agents, workflows, knowledge, memory, AI runtime, marketplace,
enterprise, API gateway, security, and distributed infrastructure. Applications must not decide where
their logic runs. They should request capabilities such as OCR, local embeddings, browser DOM
inspection, heavy reasoning, or enterprise integration, and the runtime should choose browser UI,
content script, service worker, offscreen document, shared worker, local runtime, edge, or cloud.

## Architectures Considered

### 1. Hardcoded Runtime Placement

Simple but brittle. It breaks offline mode, privacy routing, fallback, migration, and future devices.
Rejected.

### 2. Cloud-First Runtime

Powerful for heavy workloads but violates privacy, offline, cost, and latency requirements. Rejected
as the default.

### 3. Browser-Only Runtime

Excellent for privacy and low latency, but insufficient for long-running workflows, large indexing,
and multi-agent orchestration. Rejected as the whole model.

### 4. Edge-First Runtime

Good latency/data residency trade-off, but still depends on network and regional infrastructure.
Accepted as a placement target.

### 5. Local AI Runtime

Required for offline, private, and device-sensitive workloads. Accepted as a first-class target.

### 6. Hybrid Placement Engine

Best fit: evaluate capability, privacy, latency, cost, device resources, network, battery, policy,
and health, then choose the execution runtime. Accepted.

### 7. Actor Migration Runtime

Useful for resumable execution and device handoff, but too low-level alone. Accepted as migration
support over checkpoints.

### 8. CRDT/Operational Transform Sync Runtime

Excellent for collaborative/offline state. Accepted as version-vector and merge support now, with
full CRDT adapters later.

## Decision

Implement a hybrid execution runtime:

- applications submit capability-based execution requests.
- device capability detector reports CPU/GPU/RAM/battery/network/WebGPU/WASM/storage/local models.
- placement engine scores browser, content script, service worker, offscreen, shared worker, local,
  edge, and cloud targets.
- execution planner applies privacy, data placement, resource, cost, latency, and offline policy.
- migration engine checkpoints and moves sessions across runtimes.
- offline engine queues work and syncs when network returns.
- sync engine uses version vectors and deterministic conflict resolution.
- local model manager handles download, verify, cache, load, unload, update, and fallback.
- telemetry records selection logs, migration logs, latency, energy, diagnostics, and failures.

## Consequences

- Runtime placement is policy-driven and replaceable.
- Sensitive data can remain on device.
- Local AI can replace cloud when available.
- Browser reloads can recover from checkpoints.
- Edge/cloud outages can trigger fallback without changing application logic.

## Future Migration Plan

- Add Chrome API-backed device detection in production surfaces.
- Add WebGPU/WebNN/local model adapters.
- Add edge worker and cloud job adapters.
- Add encrypted persistent local stores.
- Add full CRDT data types for collaborative documents.
- Add thermal and power APIs where browsers expose them.
