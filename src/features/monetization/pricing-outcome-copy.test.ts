import { describe, expect, it } from 'vitest';

import { PRICING_OUTCOME_COPY } from '@/features/monetization/pricing-outcome-copy';

describe('pricing outcome copy', () => {
  it('groups paid plan copy by buyer outcomes', () => {
    expect(PRICING_OUTCOME_COPY.map((outcome) => outcome.id)).toEqual([
      'organize',
      'export',
      'automate',
      'protect',
    ]);
    expect(PRICING_OUTCOME_COPY.every((outcome) => outcome.body.length > 20)).toBe(true);
  });
});
