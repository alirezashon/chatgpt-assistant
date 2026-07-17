import type {
  DataClassification,
  GovernedDataRecord,
  SecurityCapability,
} from './security-types';

/** Tracks data ownership, origin, classification, retention, permissions, and access history. */
export class DataGovernanceManager {
  private readonly records = new Map<string, GovernedDataRecord>();

  /** Registers governed data. */
  public register(input: {
    readonly classification: DataClassification;
    readonly expiresAt?: number;
    readonly id?: string;
    readonly origin: string;
    readonly ownerId: string;
    readonly permissions: readonly SecurityCapability[];
  }): GovernedDataRecord {
    const record: GovernedDataRecord = {
      accessHistory: [],
      classification: input.classification,
      ...(input.expiresAt === undefined ? {} : { expiresAt: input.expiresAt }),
      id: input.id ?? crypto.randomUUID(),
      origin: input.origin,
      ownerId: input.ownerId,
      permissions: input.permissions,
    };
    this.records.set(record.id, record);
    return record;
  }

  /** Records access. */
  public recordAccess(dataId: string, principalId: string, action: string): GovernedDataRecord | undefined {
    const record = this.records.get(dataId);

    if (record === undefined) {
      return undefined;
    }

    const next: GovernedDataRecord = {
      ...record,
      accessHistory: [
        ...record.accessHistory,
        {
          action,
          principalId,
          timestamp: Date.now(),
        },
      ],
    };
    this.records.set(dataId, next);
    return next;
  }

  /** Reads a record. */
  public get(dataId: string): GovernedDataRecord | undefined {
    return this.records.get(dataId);
  }
}
