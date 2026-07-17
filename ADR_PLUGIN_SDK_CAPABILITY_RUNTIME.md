# ADR: Plugin SDK And Capability-Based Extension Runtime

## Status

Accepted

## Context

The extension is becoming a platform. Commands, context detectors, AI tools, workflows, UI
surfaces, integrations, automation, and data sources must be extendable by internal teams and
eventually third-party developers without changing the core runtime.

The dependency direction is strict:

- plugin.
- SDK contract.
- kernel capability boundary.

The kernel must never import plugin implementations. Plugins must never import kernel internals,
Chrome APIs, raw storage, AI provider adapters, or private services.

## Architectures Considered

### 1. Monolithic Extension Architecture

All features ship as first-party code inside the extension bundle.

Security: simple but no third-party isolation. Performance: fastest startup for bundled features but
poor long-term bundle growth. Developer experience: easy for core engineers, unusable for external
developers. API evolution: no stable contract. Enterprise deployment: difficult to audit per
capability. Rejected because every new capability would require core changes.

### 2. Plugin Registry

A registry stores manifests and lifecycle state, but plugins still call shared services directly.

Security: weak because registry does not enforce capability boundaries. Performance: good. Developer
experience: acceptable. Isolation: poor. Rejected as insufficient alone.

### 3. Micro Kernel Architecture

A small kernel exposes typed services and lifecycle hooks while features are modules.

Security: good when paired with permissions. Performance: good. Developer experience: strong.
Migration cost: low because the current runtime already has DI, event bus, storage, modules, and AI
gateway primitives. Accepted as the foundation.

### 4. Capability-Based Security Model

Every API is gated by declared and granted capabilities.

Security: strong. Performance: cheap runtime checks. Developer experience: explicit and predictable.
Enterprise deployment: strong auditability. Accepted as mandatory.

### 5. Sandboxed Plugin Runtime

Plugins execute behind an API membrane with resource limits and no direct shared mutable state.

Security: strong. Browser compatibility: good when implemented with workers or iframes. Complexity:
moderate. Accepted as the runtime contract.

### 6. WebAssembly Plugin Runtime

Plugins compile to WASM and call host functions.

Security: strong. Performance: good for compute. Developer experience: too restrictive for web
integration plugins. Browser extension compatibility: viable but heavy. Rejected for v1, retained as
a future isolation option.

### 7. Iframe Isolation Model

Plugins run in sandboxed iframes and communicate through postMessage.

Security: strong for UI plugins. Performance: heavier memory footprint. Developer experience:
reasonable for UI. Accepted as a future implementation for UI surfaces, not the universal v1 runtime.

### 8. Worker-Based Plugin Runtime

Plugins run in dedicated workers and communicate through messages.

Security: strong for non-DOM plugins. Performance: good but startup has worker overhead. Browser
compatibility: good in extension pages, more nuanced for content scripts. Accepted as a future
sandbox backend behind the same SDK.

### 9. Hybrid Architecture

Use a micro-kernel plus capability SDK today, with sandbox backends that can evolve from in-process
membranes to worker/iframe/WASM execution depending on plugin type.

Security: strong enough now, stronger over time. Performance: lazy activation and bounded APIs.
Developer experience: stable TypeScript SDK. API evolution: versioned. Enterprise deployment:
auditable. Accepted.

## Decision

Use a hybrid micro-kernel plugin architecture:

- plugin manifests declare permissions, capabilities, contributions, dependencies, kernel version,
  configuration schema, and security policy.
- the plugin runtime validates manifests before installation.
- the permission manager grants explicit capabilities and denies all other access.
- plugins receive only a versioned SDK object created by the sandbox.
- commands, context providers, AI tools, UI surfaces, integrations, automation, and data providers
  register through SDK APIs.
- communication is through event bus, command bus, and capability APIs.
- plugin failures are contained by lifecycle manager and health monitor.

## Trade-Offs

- In-process SDK membranes are lighter than worker isolation but provide weaker memory isolation.
- Strong capability checks add small runtime overhead but prevent accidental privilege leakage.
- Manifest validation increases installation complexity but enables marketplace and enterprise
  review.
- Versioned SDK contracts slow down breaking changes but protect third-party developers.

## Consequences

- Core runtime does not change when new plugins appear.
- Feature code can become plugin-hosted over time.
- API keys and provider logic remain behind capability APIs.
- Marketplace scanning can reason over manifests without executing plugins.
- Enterprise deployments can pre-approve or block capabilities.

## Future Migration Plan

1. Start with the in-process SDK membrane for internal and trusted plugins.
2. Move automation/data plugins to worker-backed sandbox execution.
3. Move custom UI surface plugins to iframe-backed isolation.
4. Add package signature verification against marketplace trust roots.
5. Add remote update channels, security scanning, and enterprise policy sync.
6. Add WASM host functions for compute-heavy or untrusted plugins.
