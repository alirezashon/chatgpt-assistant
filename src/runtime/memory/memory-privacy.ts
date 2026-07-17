import type { MemoryItem, MemoryObservation, MemoryPrivacyPolicy } from './memory-types';

const SENSITIVE_HINTS = [
  'password',
  'secret',
  'token',
  'api key',
  'credit card',
  'ssn',
  'bank account',
  'medical record',
];

/** Enforces privacy policy before memory storage and retrieval. */
export class MemoryPrivacyManager {
  public constructor(
    private readonly policy: MemoryPrivacyPolicy = {
      allowRestricted: false,
      localOnly: true,
      requireApprovalForImplicit: true,
    },
  ) {}

  /** Returns true when observation may be extracted. */
  public canExtract(observation: MemoryObservation): boolean {
    if (!this.policy.allowRestricted && observation.sensitivity === 'restricted') {
      return false;
    }

    return !SENSITIVE_HINTS.some((hint) => observation.text.toLowerCase().includes(hint));
  }

  /** Returns true when memory may be retrieved with current policy. */
  public canRetrieve(item: MemoryItem): boolean {
    return this.policy.allowRestricted || item.sensitivity !== 'restricted';
  }

  /** Returns approval state for a candidate observation. */
  public approvalFor(observation: MemoryObservation): 'approved' | 'pending' {
    return this.policy.requireApprovalForImplicit && !observation.userConfirmed
      ? 'pending'
      : 'approved';
  }
}
