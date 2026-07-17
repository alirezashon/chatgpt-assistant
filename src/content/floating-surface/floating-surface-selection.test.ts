import { describe, expect, it } from 'vitest';

import { isValidSelectionText } from './floating-surface-selection';

describe('floating surface selection validation', () => {
  it('rejects tiny or blank selections', () => {
    expect(isValidSelectionText('')).toBe(false);
    expect(isValidSelectionText('a')).toBe(false);
  });

  it('accepts useful selections', () => {
    expect(isValidSelectionText('hello')).toBe(true);
  });
});
