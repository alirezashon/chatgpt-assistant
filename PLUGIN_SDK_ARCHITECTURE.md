# Plugin SDK Architecture

The plugin SDK turns the extension into a capability-based platform. Plugins are not feature files
with privileged imports. They are packages with manifests, lifecycle hooks, and a versioned SDK
surface.

## Manifest Fields

- `id`: globally stable plugin id.
- `name`: human-readable display name.
- `version`: semantic plugin version.
- `author`: developer or organization metadata.
- `description`: marketplace and permission-review summary.
- `permissions`: requested runtime capabilities.
- `capabilities`: plugin type families, such as command, context, AI tool, workflow, UI surface,
  integration, automation, and data.
- `commands`: commands contributed by the plugin.
- `contexts`: context providers contributed by the plugin.
- `aiTools`: callable AI tools exposed through the AI gateway.
- `uiSurfaces`: sidebar, floating surface, popup, palette, or panel extensions.
- `dependencies`: plugin id and version ranges required before activation.
- `minimumKernelVersion`: oldest compatible kernel version.
- `configurationSchema`: JSON-like configuration schema for settings UI and validation.
- `securityPolicy`: signature, network, storage, and resource restrictions.
- `license`: license identifier for marketplace and enterprise compliance.

## Capability Model

Plugins request capabilities in their manifest. The permission manager grants explicit capabilities
after validation, policy review, or user approval. The sandbox checks both requested and granted
capabilities before exposing SDK methods.

Capabilities include:

- `context.read`
- `selection.read`
- `command.register`
- `storage.read`
- `storage.write`
- `ai.request`
- `tabs.read`
- `tabs.control`
- `clipboard.read`
- `clipboard.write`
- `network.request`
- `events.publish`
- `events.subscribe`
- `ui.register`
- `notifications.show`
- `telemetry.write`
- `config.read`
- `config.write`

## Lifecycle

1. `install`: package is validated, policy checked, and stored.
2. `validate`: manifest, dependencies, signatures, and contributions are checked.
3. `register`: plugin is added to the registry without side effects.
4. `initialize`: SDK context is created and plugin resources are prepared.
5. `activate`: contributions become available to the extension.
6. `deactivate`: runtime behavior is paused without deleting data.
7. `update`: old package is deactivated, replacement is validated, then activated.
8. `uninstall`: plugin is deactivated and removed.
9. `destroy`: sandbox resources and plugin disposables are released.

## Communication Rules

- Plugins communicate through event bus, command bus, and capability APIs.
- Plugins never import kernel internals.
- Plugins never share mutable state with the kernel or other plugins.
- Plugin SDK APIs are versioned and backwards compatible.
- Plugin failures are converted into plugin health state and audit events.

## Performance Targets

- manifest validation: under 5 ms for normal packages.
- lazy activation: plugins activate only when contribution type is needed.
- command contribution registration: under 10 ms per plugin.
- memory budget: default 16 MB estimated per active plugin.
- activation budget: default 50 ms for trusted in-process plugins.
- unload: deactivate inactive plugins and dispose SDK subscriptions.
