import { describe, expect, it } from 'vitest';

import { MarketplaceRuntime } from './marketplace-runtime';
import { MarketplaceRuntimeError, type MarketplacePackageBundle } from './marketplace-types';

describe('MarketplaceRuntime', () => {
  it('publishes an auto-approved package and makes it discoverable', () => {
    const runtime = new MarketplaceRuntime();
    const { app, developer } = createApp(runtime);
    const version = runtime.publishVersion({
      applicationId: app.id,
      bundle: bundle(),
      releaseNotes: 'Initial release',
      version: '1.0.0',
    });

    const results = runtime.search({ text: 'jira', type: 'agent' });

    expect(version.status).toBe('approved');
    expect(results[0]?.applicationId).toBe(app.id);
    expect(results[0]?.trustScore).toBeGreaterThan(0);
    expect(runtime.developerAnalytics(developer.id)).toHaveLength(0);
  });

  it('requires review for high-risk permissions and rejects blocked packages', () => {
    const runtime = new MarketplaceRuntime();
    const { app } = createApp(runtime);
    const highRisk = runtime.publishVersion({
      applicationId: app.id,
      bundle: bundle({
        permissions: ['browser.click'],
      }),
      releaseNotes: 'Needs review',
      version: '1.1.0',
    });
    const blocked = runtime.publishVersion({
      applicationId: app.id,
      bundle: bundle({
        code: 'export function run(){ return document.cookie }',
        permissions: ['memory.read'],
      }),
      releaseNotes: 'Unsafe release',
      version: '2.0.0',
    });

    expect(highRisk.status).toBe('reviewing');
    expect(runtime.reviewVersion({
      decision: 'approve',
      reason: 'Reviewed permission usage.',
      versionId: highRisk.id,
    }).status).toBe('approved');
    expect(() =>
      runtime.reviewVersion({
        decision: 'approve',
        reason: 'Cannot approve critical scan.',
        versionId: blocked.id,
      }),
    ).toThrow(MarketplaceRuntimeError);
  });

  it('installs, disables, updates, and rolls back approved versions', () => {
    const runtime = new MarketplaceRuntime();
    const { app } = createApp(runtime);
    const first = runtime.publishVersion({
      applicationId: app.id,
      bundle: bundle({ code: 'export function run(){ return "v1" }' }),
      releaseNotes: 'Initial release',
      version: '1.0.0',
    });
    const install = runtime.install({
      applicationId: app.id,
      permissionsAccepted: [],
      userId: 'user-1',
    });
    const second = runtime.publishVersion({
      applicationId: app.id,
      bundle: bundle({ code: 'export function run(){ return "v2" }' }),
      releaseNotes: 'Second release',
      version: '1.1.0',
    });
    const updated = runtime.updateInstallation(install.id, app.id);
    const rolledBack = runtime.installations.rollback(install.id);
    const disabled = runtime.installations.disable(install.id);

    expect(first.status).toBe('approved');
    expect(second.status).toBe('approved');
    expect(updated.versionId).toBe(second.id);
    expect(rolledBack.versionId).toBe(first.id);
    expect(disabled.status).toBe('disabled');
  });

  it('enforces enterprise-private marketplace visibility', () => {
    const runtime = new MarketplaceRuntime();
    const { app } = createApp(runtime, {
      distribution: 'enterprise-private',
      organizationId: 'org-1',
    });
    runtime.publishVersion({
      applicationId: app.id,
      bundle: bundle(),
      releaseNotes: 'Private release',
      version: '1.0.0',
    });

    expect(runtime.search({ includePrivate: true, organizationId: 'org-1' })).toHaveLength(1);
    expect(runtime.search({ includePrivate: true, organizationId: 'org-2' })).toHaveLength(0);
    expect(() =>
      runtime.install({
        applicationId: app.id,
        organizationId: 'org-2',
        permissionsAccepted: [],
        userId: 'user-1',
      }),
    ).toThrow(MarketplaceRuntimeError);
  });

  it('records paid installs as revenue and analytics', () => {
    const runtime = new MarketplaceRuntime();
    const { app, developer } = createApp(runtime, {
      pricing: {
        currency: 'USD',
        model: 'paid',
        priceCents: 2_000,
        revenueShareBps: 8_500,
      },
    });
    runtime.publishVersion({
      applicationId: app.id,
      bundle: bundle(),
      releaseNotes: 'Paid release',
      version: '1.0.0',
    });

    runtime.install({
      applicationId: app.id,
      permissionsAccepted: [],
      userId: 'user-1',
    });

    expect(runtime.developerRevenue(developer.id)[0]?.developerNetCents).toBe(1_700);
    expect(runtime.developerAnalytics(developer.id).some((event) => event.type === 'install')).toBe(true);
  });

  it('updates ratings and trust score from reviews', () => {
    const runtime = new MarketplaceRuntime();
    const { app } = createApp(runtime);
    runtime.publishVersion({
      applicationId: app.id,
      bundle: bundle(),
      releaseNotes: 'Initial release',
      version: '1.0.0',
    });

    runtime.addReview({
      applicationId: app.id,
      body: 'Excellent automation.',
      rating: 5,
      title: 'Great',
      userId: 'user-1',
    });

    const listing = runtime.search({ text: 'jira' })[0];

    expect(listing?.ratingAverage).toBe(5);
    expect(listing?.reviewCount).toBe(1);
  });
});

function createApp(
  runtime: MarketplaceRuntime,
  options: Partial<Parameters<MarketplaceRuntime['createApplication']>[0]> = {},
) {
  const developer = runtime.createDeveloper({
    displayName: 'Ava Platform',
    email: 'ava@example.com',
    verified: true,
  });
  const project = runtime.createProject({
    description: 'Jira AI project manager package.',
    developerId: developer.id,
    name: 'Jira Agent',
  });
  const app = runtime.createApplication({
    category: 'productivity',
    developerId: developer.id,
    displayName: 'Jira AI Project Manager',
    packageName: 'jira-agent',
    projectId: project.id,
    summary: 'Plan Jira projects with an AI agent.',
    type: 'agent',
    ...options,
  });

  return { app, developer, project };
}

function bundle(input: {
  readonly code?: string;
  readonly permissions?: readonly string[];
} = {}): MarketplacePackageBundle {
  return {
    assets: {},
    checksum: 'checksum-123',
    codeFiles: {
      'agent.js': input.code ?? 'export function run(){ return "ok" }',
    },
    docs: {
      'README.md': '# Jira Agent\nSafe project management agent.',
    },
    manifest: {
      compatibility: {
        minPlatformVersion: '1.0.0',
        runtimes: ['browser-extension'],
      },
      configuration: {},
      dependencies: [],
      description: 'Plan Jira projects with an AI project manager agent.',
      displayName: 'Jira AI Project Manager',
      entrypoints: ['agent.js'],
      packageName: 'jira-agent',
      permissions: input.permissions ?? [],
      type: 'agent',
    },
  };
}
