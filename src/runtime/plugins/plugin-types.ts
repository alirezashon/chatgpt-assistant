import type { Disposable, RuntimeResult } from '@/runtime/utils';

/** Stable SDK version exposed to plugins. */
export const PLUGIN_SDK_VERSION = '1.0.0';

/** Capability ids a plugin can request. */
export type PluginCapability =
  | 'ai.request'
  | 'clipboard.read'
  | 'clipboard.write'
  | 'command.register'
  | 'config.read'
  | 'config.write'
  | 'context.read'
  | 'events.publish'
  | 'events.subscribe'
  | 'network.request'
  | 'notifications.show'
  | 'selection.read'
  | 'storage.read'
  | 'storage.write'
  | 'tabs.control'
  | 'tabs.read'
  | 'telemetry.write'
  | 'ui.register';

/** Supported plugin contribution families. */
export type PluginType =
  | 'ai-tool'
  | 'automation'
  | 'command'
  | 'context'
  | 'data'
  | 'integration'
  | 'ui-surface'
  | 'workflow';

/** Plugin lifecycle state. */
export type PluginState =
  'activated' | 'destroyed' | 'failed' | 'initialized' | 'installed' | 'registered' | 'uninstalled';

/** Runtime plugin health state. */
export type PluginHealthStatus = 'degraded' | 'healthy' | 'unhealthy' | 'unknown';

/** Plugin author metadata. */
export interface PluginAuthor {
  /** Author name or organization. */
  readonly name: string;
  /** Optional contact URL or email. */
  readonly url?: string;
}

/** Resource limits enforced by sandbox backends. */
export interface PluginResourceLimits {
  /** Activation budget in milliseconds. */
  readonly activationTimeoutMs: number;
  /** Approximate memory budget in megabytes. */
  readonly memoryMb: number;
  /** Maximum event handlers registered by this plugin. */
  readonly maxEventSubscriptions: number;
}

/** Plugin security policy declared by the package. */
export interface PluginSecurityPolicy {
  /** Whether package signature verification is required. */
  readonly requireSignature: boolean;
  /** Package signature or digest assertion. */
  readonly signature?: string;
  /** Allowed network origins for future network capability gateways. */
  readonly allowedOrigins?: readonly string[];
  /** Runtime resource limits. */
  readonly resourceLimits: PluginResourceLimits;
}

/** Plugin dependency descriptor. */
export interface PluginDependency {
  /** Required plugin id. */
  readonly id: string;
  /** Minimum required version. */
  readonly minimumVersion: string;
}

/** JSON-like configuration schema boundary for marketplace and settings UIs. */
export interface PluginConfigurationSchema {
  /** Schema version. */
  readonly version: number;
  /** Property definitions keyed by setting name. */
  readonly properties: Readonly<Record<string, PluginConfigurationProperty>>;
}

/** Supported configuration property descriptor. */
export interface PluginConfigurationProperty {
  /** Value type. */
  readonly type: 'boolean' | 'number' | 'string';
  /** Human-readable label. */
  readonly title: string;
  /** Optional default value. */
  readonly defaultValue?: boolean | number | string;
  /** Whether the setting is required. */
  readonly required: boolean;
}

/** Command contribution metadata. */
export interface PluginCommandContribution {
  /** Stable command id. */
  readonly id: string;
  /** Display title. */
  readonly title: string;
  /** Searchable description. */
  readonly description: string;
  /** Optional default shortcut chord. */
  readonly defaultShortcut?: string;
}

/** Context provider contribution metadata. */
export interface PluginContextContribution {
  /** Stable context provider id. */
  readonly id: string;
  /** Context type produced by the provider. */
  readonly type: string;
  /** URL match patterns where provider can activate. */
  readonly matches: readonly string[];
}

/** AI tool contribution metadata. */
export interface PluginAIToolContribution {
  /** Stable tool id. */
  readonly id: string;
  /** Human-readable tool name. */
  readonly name: string;
  /** Tool input schema version. */
  readonly schemaVersion: number;
}

/** UI surface contribution metadata. */
export interface PluginUISurfaceContribution {
  /** Stable surface id. */
  readonly id: string;
  /** Surface placement. */
  readonly placement: 'command-palette' | 'floating-toolbar' | 'popup' | 'sidebar';
  /** Human-readable label. */
  readonly title: string;
}

/** Complete plugin manifest. */
export interface PluginManifest {
  /** Globally stable plugin id. */
  readonly id: string;
  /** Display name. */
  readonly name: string;
  /** Semantic plugin version. */
  readonly version: string;
  /** Plugin author. */
  readonly author: PluginAuthor;
  /** Marketplace and review description. */
  readonly description: string;
  /** Requested runtime capabilities. */
  readonly permissions: readonly PluginCapability[];
  /** Contribution families implemented by this plugin. */
  readonly capabilities: readonly PluginType[];
  /** Command contributions. */
  readonly commands?: readonly PluginCommandContribution[];
  /** Context provider contributions. */
  readonly contexts?: readonly PluginContextContribution[];
  /** AI tool contributions. */
  readonly aiTools?: readonly PluginAIToolContribution[];
  /** UI surface contributions. */
  readonly uiSurfaces?: readonly PluginUISurfaceContribution[];
  /** Required plugin dependencies. */
  readonly dependencies?: readonly PluginDependency[];
  /** Minimum compatible kernel version. */
  readonly minimumKernelVersion: string;
  /** Optional configuration schema. */
  readonly configurationSchema?: PluginConfigurationSchema;
  /** Plugin security policy. */
  readonly securityPolicy: PluginSecurityPolicy;
  /** License identifier. */
  readonly license: string;
}

/** Packaged plugin loaded by the runtime. */
export interface PluginPackage {
  /** Manifest. */
  readonly manifest: PluginManifest;
  /** Module factory. */
  readonly moduleFactory: PluginModuleFactory;
  /** Optional source digest for signature verification. */
  readonly sourceDigest?: string;
}

/** Plugin module factory. */
export type PluginModuleFactory = () => PluginModule | Promise<PluginModule>;

/** Plugin module implemented by internal or external plugin packages. */
export interface PluginModule extends Disposable {
  /** Optional install hook. */
  install?(sdk: PluginSdk): Promise<void> | void;
  /** Optional validation hook. */
  validate?(sdk: PluginSdk): Promise<void> | void;
  /** Optional registration hook. */
  register?(sdk: PluginSdk): Promise<void> | void;
  /** Optional initialization hook. */
  initialize?(sdk: PluginSdk): Promise<void> | void;
  /** Optional activation hook. */
  activate?(sdk: PluginSdk): Promise<void> | void;
  /** Optional deactivation hook. */
  deactivate?(reason?: string): Promise<void> | void;
  /** Optional update hook. */
  update?(previousVersion: string, sdk: PluginSdk): Promise<void> | void;
  /** Optional uninstall hook. */
  uninstall?(): Promise<void> | void;
  /** Optional health hook. */
  health?(): Promise<PluginHealth> | PluginHealth;
}

/** Plugin health result. */
export interface PluginHealth {
  /** Health status. */
  readonly status: PluginHealthStatus;
  /** Optional diagnostic message. */
  readonly message?: string;
}

/** Versioned SDK object exposed to plugins. */
export interface PluginSdk {
  /** SDK version. */
  readonly version: string;
  /** Plugin manifest visible to its own code. */
  readonly manifest: PluginManifest;
  /** Command contribution API. */
  readonly commands: PluginCommandApi;
  /** Context contribution API. */
  readonly context: PluginContextApi;
  /** AI tool API. */
  readonly ai: PluginAIApi;
  /** Namespaced storage API. */
  readonly storage: PluginStorageApi;
  /** Event API. */
  readonly events: PluginEventApi;
  /** UI extension API. */
  readonly ui: PluginUIApi;
  /** Notification API. */
  readonly notifications: PluginNotificationApi;
  /** Logging API. */
  readonly logging: PluginLoggingApi;
  /** Telemetry API. */
  readonly telemetry: PluginTelemetryApi;
  /** Configuration API. */
  readonly configuration: PluginConfigurationApi;
}

/** Command SDK API. */
export interface PluginCommandApi {
  /** Registers a command handler. */
  register(commandId: string, handler: PluginCommandHandler): Disposable;
}

/** Plugin command handler. */
export type PluginCommandResult =
  Readonly<Record<string, unknown>> | boolean | null | number | string;

/** Plugin command handler. */
export type PluginCommandHandler = (
  input: Readonly<Record<string, unknown>>,
) => PluginCommandResult | Promise<PluginCommandResult>;

/** Context SDK API. */
export interface PluginContextApi {
  /** Registers a context provider. */
  register(providerId: string, provider: PluginContextProvider): Disposable;
}

/** Context provider callback. */
export type PluginContextProvider = () =>
  Promise<Readonly<Record<string, unknown>>> | Readonly<Record<string, unknown>>;

/** AI SDK API. */
export interface PluginAIApi {
  /** Requests AI through the kernel AI gateway. */
  request(input: PluginAIRequest): Promise<PluginAIResponse>;
}

/** Plugin AI request boundary. */
export interface PluginAIRequest {
  /** Task type or plugin-specific intent family. */
  readonly taskType: string;
  /** User intent. */
  readonly intent: string;
  /** Prompt variables. */
  readonly variables: Readonly<Record<string, string>>;
}

/** Plugin AI response boundary. */
export interface PluginAIResponse {
  /** Response text. */
  readonly text: string;
  /** Model id used by the gateway. */
  readonly modelId: string;
}

/** Serializable value allowed in plugin storage and configuration. */
export type PluginSerializableValue =
  | boolean
  | null
  | number
  | string
  | { readonly [key: string]: PluginSerializableValue }
  | readonly PluginSerializableValue[];

/** Storage SDK API. */
export interface PluginStorageApi {
  /** Reads a namespaced value. */
  get(key: string): Promise<PluginSerializableValue>;
  /** Writes a namespaced value. */
  set(key: string, value: PluginSerializableValue): Promise<void>;
  /** Removes a namespaced value. */
  remove(key: string): Promise<void>;
}

/** Event SDK API. */
export interface PluginEventApi {
  /** Publishes a plugin event. */
  publish(name: string, payload: unknown): Promise<void>;
  /** Subscribes to a plugin event name. */
  subscribe(name: string, listener: PluginEventListener): Disposable;
}

/** Plugin event listener. */
export type PluginEventListener = (payload: unknown) => void | Promise<void>;

/** UI SDK API. */
export interface PluginUIApi {
  /** Registers a UI surface contribution handler. */
  registerSurface(surfaceId: string, handler: PluginUISurfaceHandler): Disposable;
}

/** UI surface handler boundary. */
export type PluginUISurfaceResult = Readonly<Record<string, unknown>> | null | string;

/** UI surface handler boundary. */
export type PluginUISurfaceHandler = () => PluginUISurfaceResult | Promise<PluginUISurfaceResult>;

/** Notification SDK API. */
export interface PluginNotificationApi {
  /** Shows a notification through the host notification service. */
  show(message: string): Promise<void>;
}

/** Logging SDK API. */
export interface PluginLoggingApi {
  /** Writes an info log. */
  info(message: string, metadata?: Readonly<Record<string, unknown>>): void;
  /** Writes an error log. */
  error(message: string, metadata?: Readonly<Record<string, unknown>>): void;
}

/** Telemetry SDK API. */
export interface PluginTelemetryApi {
  /** Records telemetry through host-approved sinks. */
  record(event: string, properties?: Readonly<Record<string, unknown>>): void;
}

/** Configuration SDK API. */
export interface PluginConfigurationApi {
  /** Reads a configuration value. */
  get(key: string): Promise<PluginSerializableValue>;
  /** Writes a configuration value. */
  set(key: string, value: PluginSerializableValue): Promise<void>;
}

/** Runtime events emitted by plugin infrastructure. */
export interface PluginRuntimeEvents {
  readonly 'plugin.audit': PluginAuditEntry;
  readonly 'plugin.event': PluginPublishedEvent;
  readonly 'plugin.failed': PluginFailureEvent;
  readonly 'plugin.lifecycle': PluginLifecycleEvent;
}

/** Plugin audit entry. */
export interface PluginAuditEntry {
  /** Plugin id. */
  readonly pluginId: string;
  /** Audit action. */
  readonly action: string;
  /** Optional capability. */
  readonly capability?: PluginCapability;
  /** Timestamp. */
  readonly timestamp: number;
}

/** Plugin-published event. */
export interface PluginPublishedEvent {
  /** Plugin id. */
  readonly pluginId: string;
  /** Event name. */
  readonly name: string;
  /** Event payload. */
  readonly payload: unknown;
}

/** Plugin lifecycle event. */
export interface PluginLifecycleEvent {
  /** Plugin id. */
  readonly pluginId: string;
  /** Lifecycle state. */
  readonly state: PluginState;
}

/** Plugin failure event. */
export interface PluginFailureEvent {
  /** Plugin id. */
  readonly pluginId: string;
  /** Failed operation. */
  readonly operation: string;
  /** Error message. */
  readonly message: string;
}

/** Plugin operation result. */
export type PluginOperationResult<Value = void> = RuntimeResult<Value, PluginRuntimeError>;

/** Stable plugin runtime error code. */
export type PluginRuntimeErrorCode =
  | 'PLUGIN_CAPABILITY_DENIED'
  | 'PLUGIN_DEPENDENCY_MISSING'
  | 'PLUGIN_INVALID_MANIFEST'
  | 'PLUGIN_NOT_FOUND'
  | 'PLUGIN_SIGNATURE_INVALID'
  | 'PLUGIN_STATE_ERROR'
  | 'PLUGIN_TIMEOUT'
  | 'PLUGIN_UNHEALTHY';

/** Structured plugin runtime error. */
export class PluginRuntimeError extends Error {
  /** Stable error code. */
  public readonly code: PluginRuntimeErrorCode;

  /** Optional safe diagnostic details. */
  public readonly details: Readonly<Record<string, unknown>> | undefined;

  public constructor(
    code: PluginRuntimeErrorCode,
    message: string,
    details?: Readonly<Record<string, unknown>>,
  ) {
    super(message);
    this.name = 'PluginRuntimeError';
    this.code = code;
    this.details = details;
  }
}
