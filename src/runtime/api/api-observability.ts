import type { APIUsageRecord } from './api-types';

/** API request analytics, usage, latency, and error tracker. */
export class APIObservability {
  private readonly records: APIUsageRecord[] = [];

  /** Records request usage. */
  public record(input: Omit<APIUsageRecord, 'id' | 'timestamp'>): APIUsageRecord {
    const record: APIUsageRecord = {
      ...input,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    this.records.push(record);
    return record;
  }

  /** Lists records. */
  public list(applicationId?: string): readonly APIUsageRecord[] {
    return this.records.filter((record) => applicationId === undefined || record.applicationId === applicationId);
  }

  /** Summarizes API usage. */
  public summary(applicationId: string) {
    const records = this.list(applicationId);
    const errors = records.filter((record) => record.status >= 400).length;
    const latency = records.length === 0 ? 0 : records.reduce((sum, record) => sum + record.latencyMs, 0) / records.length;
    return {
      applicationId,
      errors,
      averageLatencyMs: latency,
      requests: records.length,
    };
  }
}
