import type { ServiceResolver } from '@/runtime/di';
import type { Disposable } from '@/runtime/utils';

/** Module lifecycle state. */
export type RuntimeModuleState =
  'destroyed' | 'disabled' | 'enabled' | 'initialized' | 'registered';

/** Module health state used by kernel diagnostics. */
export type RuntimeModuleHealthStatus = 'degraded' | 'healthy' | 'unhealthy' | 'unknown';

/** Static module metadata. */
export interface RuntimeModuleMetadata {
  /** Stable module id. */
  readonly id: string;
  /** Human-readable name. */
  readonly name: string;
  /** Module version. */
  readonly version: string;
  /** Required module ids. */
  readonly dependencies?: readonly string[];
  /** Capabilities provided by this module. */
  readonly capabilities?: readonly string[];
}

/** Module health result. */
export interface RuntimeModuleHealth {
  /** Health status. */
  readonly status: RuntimeModuleHealthStatus;
  /** Optional diagnostic message. */
  readonly message?: string;
}

/** Context passed to modules during initialization. */
export interface RuntimeModuleContext {
  /** Service resolver for declared dependencies. */
  readonly services: ServiceResolver;
}

/** Runtime module contract implemented by every feature/plugin module. */
export interface RuntimeModule extends Disposable {
  /** Static module metadata. */
  readonly metadata: RuntimeModuleMetadata;
  /** Initializes module resources. */
  initialize?(context: RuntimeModuleContext): Promise<void> | void;
  /** Enables runtime behavior. */
  enable?(): Promise<void> | void;
  /** Disables runtime behavior without destroying persistent state. */
  disable?(reason?: string): Promise<void> | void;
  /** Returns current module health. */
  health?(): Promise<RuntimeModuleHealth> | RuntimeModuleHealth;
}
