import { describe, expect, it } from 'vitest';

import {
  createClientHandoffExportProfile,
  createExportProfileDraft,
} from '@/features/actions/export-profile-builder';

describe('export profile builder', () => {
  it('normalizes repeat export settings behind a Pro feature gate', () => {
    expect(
      createExportProfileDraft({
        brandingEnabled: true,
        formats: ['pdf', 'html', 'pdf'],
        name: '  Client   Delivery  ',
        targetIds: ['conversation-1', 'conversation-1', 'conversation-2'],
      }),
    ).toEqual({
      brandingEnabled: true,
      formats: ['pdf', 'html'],
      gatedFeatureId: 'saved-export-profiles',
      includeFolders: true,
      includeTags: true,
      name: 'Client Delivery',
      targetCount: 2,
    });
  });

  it('creates the default client handoff profile', () => {
    expect(createClientHandoffExportProfile(['conversation-1'])).toMatchObject({
      brandingEnabled: true,
      formats: ['pdf', 'html', 'json'],
      gatedFeatureId: 'saved-export-profiles',
      name: 'Client handoff profile',
      targetCount: 1,
    });
  });
});
