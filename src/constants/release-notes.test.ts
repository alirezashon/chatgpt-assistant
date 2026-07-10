import { describe, expect, it } from 'vitest';

import { APP_VERSION } from '@/constants/app';
import { RELEASE_NOTES } from '@/constants/release-notes';

describe('release notes', () => {
  it('documents the current app version first', () => {
    expect(RELEASE_NOTES[0]?.version).toBe(APP_VERSION);
  });

  it('keeps each release note useful for the settings page', () => {
    for (const note of RELEASE_NOTES) {
      expect(note.date).toMatch(/^\d{4}-\d{2}-\d{2}$/u);
      expect(note.highlights.length).toBeGreaterThanOrEqual(3);
      expect(note.label.length).toBeGreaterThan(0);
      expect(note.summary.length).toBeGreaterThan(0);
    }
  });
});
