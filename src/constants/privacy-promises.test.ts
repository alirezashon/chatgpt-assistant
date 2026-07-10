import { describe, expect, it } from 'vitest';

import { PRIVACY_PROMISES } from '@/constants/privacy-promises';

describe('privacy promises', () => {
  it('documents local-only, cloud sync, and AI processing promises', () => {
    expect(PRIVACY_PROMISES.map((promise) => promise.id)).toEqual([
      'local-only',
      'cloud-sync',
      'ai-processing',
    ]);
  });

  it('keeps current local storage promise active and future data sharing opt-in', () => {
    expect(PRIVACY_PROMISES.find((promise) => promise.id === 'local-only')?.status).toBe(
      'local-now',
    );
    expect(
      PRIVACY_PROMISES.filter((promise) => promise.id !== 'local-only').every(
        (promise) => promise.status === 'future-opt-in',
      ),
    ).toBe(true);
  });
});
