# Hybrid Edge Runtime

The Hybrid Edge Runtime is the browser-native execution operating system. Applications request
capabilities; the runtime chooses the best execution location.

## Execution Targets

- browser UI
- content script
- extension service worker
- offscreen document
- shared worker
- local runtime
- edge runtime
- cloud runtime

## Planning Inputs

- requested capability
- privacy mode and data classification
- latency and cost budgets
- CPU/GPU/RAM/battery/network profile
- WebGPU/WebAssembly/storage/browser API support
- local model availability
- edge/cloud health
- enterprise data placement policy

## Core Systems

- `HybridRuntime`
- `ExecutionPlanner`
- `RuntimeSelector`
- `PlacementEngine`
- `CapabilityResolver`
- `DeviceCapabilityDetector`
- `LocalModelManager`
- `OfflineEngine`
- `SyncEngine`
- `MigrationEngine`
- `ResourceManager`
- `HybridTelemetry`

## Principle

Applications never decide where code runs. Capabilities are stable; runtimes are replaceable.
