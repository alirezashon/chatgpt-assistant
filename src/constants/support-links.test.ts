import { describe, expect, it } from 'vitest';

import { SUPPORT_LINKS } from '@/constants/support-links';

describe('support links', () => {
  it('includes a support mail draft, support guide, and privacy policy', () => {
    expect(SUPPORT_LINKS.map((link) => link.label)).toEqual([
      'Email support draft',
      'Support guide',
      'Privacy policy',
    ]);
  });

  it('keeps every support link usable in settings', () => {
    for (const link of SUPPORT_LINKS) {
      expect(link.description.length).toBeGreaterThan(0);
      expect(link.href.length).toBeGreaterThan(0);
    }

    expect(SUPPORT_LINKS[0]?.href).toContain('subject=ChatGPT%20Workspace%20support');
    expect(SUPPORT_LINKS.slice(1).every((link) => link.href.endsWith('.html'))).toBe(true);
  });
});
