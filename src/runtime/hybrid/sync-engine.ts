import type { HybridValue, SyncRecord, VersionVector } from './hybrid-types';

/** Sync engine with version vectors and deterministic conflict resolution. */
export class SyncEngine {
  private readonly records = new Map<string, SyncRecord>();

  /** Writes local or remote record. */
  public write(input: {
    readonly deviceId: string;
    readonly id: string;
    readonly value: HybridValue;
  }): SyncRecord {
    const existing = this.records.get(input.id);
    const vector = increment(existing?.vector ?? {}, input.deviceId);
    const record: SyncRecord = {
      id: input.id,
      updatedAt: Date.now(),
      value: input.value,
      vector,
    };
    this.records.set(record.id, record);
    return record;
  }

  /** Merges two records by version vector, last-write timestamp, and deterministic id tie-break. */
  public merge(left: SyncRecord, right: SyncRecord): SyncRecord {
    const comparison = compareVectors(left.vector, right.vector);

    if (comparison === 'left') {
      this.records.set(left.id, left);
      return left;
    }

    if (comparison === 'right') {
      this.records.set(right.id, right);
      return right;
    }

    const winner = right.updatedAt > left.updatedAt || (right.updatedAt === left.updatedAt && JSON.stringify(right.value) > JSON.stringify(left.value)) ? right : left;
    const merged: SyncRecord = {
      ...winner,
      vector: mergeVectors(left.vector, right.vector),
    };
    this.records.set(merged.id, merged);
    return merged;
  }

  /** Reads record. */
  public get(id: string): SyncRecord | undefined {
    return this.records.get(id);
  }
}

function increment(vector: VersionVector, deviceId: string): VersionVector {
  return {
    ...vector,
    [deviceId]: (vector[deviceId] ?? 0) + 1,
  };
}

function compareVectors(left: VersionVector, right: VersionVector): 'conflict' | 'left' | 'right' {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  let leftGreater = false;
  let rightGreater = false;

  for (const key of keys) {
    const leftValue = left[key] ?? 0;
    const rightValue = right[key] ?? 0;
    leftGreater ||= leftValue > rightValue;
    rightGreater ||= rightValue > leftValue;
  }

  if (leftGreater && !rightGreater) {
    return 'left';
  }

  if (rightGreater && !leftGreater) {
    return 'right';
  }

  return 'conflict';
}

function mergeVectors(left: VersionVector, right: VersionVector): VersionVector {
  const output: Record<string, number> = {};
  for (const key of new Set([...Object.keys(left), ...Object.keys(right)])) {
    output[key] = Math.max(left[key] ?? 0, right[key] ?? 0);
  }
  return output;
}
