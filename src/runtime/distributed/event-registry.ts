import type { DistributedEvent, DistributedEventSchema } from './distributed-types';
import { DistributedRuntimeError } from './distributed-types';

/** Registry for long-lived versioned event schemas and compatibility. */
export class DistributedEventRegistry {
  private readonly schemas = new Map<string, DistributedEventSchema>();
  private readonly migrations = new Map<string, (event: DistributedEvent) => DistributedEvent>();

  /** Registers a schema. */
  public register(schema: DistributedEventSchema): void {
    this.schemas.set(key(schema.type, schema.version), schema);
  }

  /** Registers migration from one version to another. */
  public registerMigration(
    type: string,
    fromVersion: number,
    toVersion: number,
    migrate: (event: DistributedEvent) => DistributedEvent,
  ): void {
    this.migrations.set(`${type}:${fromVersion.toString()}->${toVersion.toString()}`, migrate);
  }

  /** Validates an event against its schema. */
  public validate(event: DistributedEvent): void {
    const schema = this.schemas.get(key(event.type, event.version));

    if (schema === undefined) {
      throw new DistributedRuntimeError('DISTRIBUTED_SCHEMA_INVALID', `Event schema not registered: ${event.type}@${event.version.toString()}`);
    }

    if (schema.deprecated) {
      return;
    }

    const payload = isRecord(event.payload) ? event.payload : {};
    const missing = schema.requiredFields.filter((field) => payload[field] === undefined);

    if (missing.length > 0) {
      throw new DistributedRuntimeError('DISTRIBUTED_SCHEMA_INVALID', 'Event payload is missing required fields.', {
        missing: missing.join(','),
        type: event.type,
      });
    }
  }

  /** Migrates event to target version when a migration exists. */
  public migrate(event: DistributedEvent, toVersion: number): DistributedEvent {
    if (event.version === toVersion) {
      return event;
    }

    const migrate = this.migrations.get(`${event.type}:${event.version.toString()}->${toVersion.toString()}`);

    if (migrate === undefined) {
      throw new DistributedRuntimeError('DISTRIBUTED_SCHEMA_INVALID', 'No event migration is registered.', {
        from: event.version,
        to: toVersion,
        type: event.type,
      });
    }

    return migrate(event);
  }
}

function key(type: string, version: number): string {
  return `${type}@${version.toString()}`;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
