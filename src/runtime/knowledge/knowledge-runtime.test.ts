import { describe, expect, it } from 'vitest';

import { KnowledgeRuntime } from './knowledge-runtime';
import type { KnowledgeConnector, KnowledgeSourceRecord } from './knowledge-types';

describe('KnowledgeRuntime', () => {
  it('syncs connector records and retrieves source-grounded results', async () => {
    const runtime = new KnowledgeRuntime();
    await runtime.registerConnector(
      connector([
        record({
          content:
            'MongoDB authentication failed because the API used the wrong credential source. Fix by setting authSource=admin in the connection string.',
          id: 'mongodb-auth',
          title: 'MongoDB auth incident',
        }),
      ]),
    );

    const sync = await runtime.syncConnector('fixture');
    const results = await runtime.search({
      limit: 5,
      permissions: ['knowledge.read'],
      text: 'How did we solve MongoDB authentication last time?',
    });

    expect(sync.documents).toBe(1);
    expect(sync.chunks).toBeGreaterThan(0);
    expect(results[0]?.source.sourceId).toBe('mongodb-auth');
    expect(results[0]?.source.title).toBe('MongoDB auth incident');
    expect(results[0]?.reasons.some((reason) => reason.startsWith('keyword='))).toBe(true);
  });

  it('filters confidential knowledge unless the caller has the required permission', async () => {
    const runtime = new KnowledgeRuntime();
    await runtime.registerConnector(
      connector([
        record({
          content: 'Confidential OAuth rotation playbook: rotate the GitHub application secret first.',
          id: 'secret-playbook',
          permissions: ['knowledge.read', 'knowledge.read.confidential'],
          title: 'OAuth secret rotation',
        }),
      ]),
    );

    await runtime.syncConnector('fixture');

    await expect(
      runtime.search({
        limit: 5,
        permissions: ['knowledge.read'],
        text: 'OAuth secret rotation',
      }),
    ).resolves.toHaveLength(0);

    await expect(
      runtime.search({
        limit: 5,
        permissions: ['knowledge.read', 'knowledge.read.confidential'],
        text: 'OAuth secret rotation',
      }),
    ).resolves.toHaveLength(1);
  });

  it('handles incremental deletions', async () => {
    const source = record({
      content: 'Docker release checklist includes build, scan, sign, and publish steps.',
      id: 'docker-release',
      title: 'Docker release checklist',
    });
    const first = [source];
    const second = [{ ...source, deleted: true }];
    const runtime = new KnowledgeRuntime();
    await runtime.registerConnector(sequenceConnector([first, second]));

    await runtime.syncConnector('fixture');
    expect(
      await runtime.search({
        limit: 5,
        permissions: ['knowledge.read'],
        text: 'Docker release checklist',
      }),
    ).toHaveLength(1);

    const deleted = await runtime.syncConnector('fixture', 1_001);

    expect(deleted.deleted).toBe(1);
    expect(
      await runtime.search({
        limit: 5,
        permissions: ['knowledge.read'],
        text: 'Docker release checklist',
      }),
    ).toHaveLength(0);
  });

  it('builds transparent RAG context and exposes a graph snapshot', async () => {
    const runtime = new KnowledgeRuntime();
    await runtime.registerConnector(
      connector([
        record({
          content:
            'TypeScript API docs: create small service boundaries, validate input, and expose typed responses from GitHub integrations.',
          id: 'typed-api',
          title: 'TypeScript API guidance',
        }),
      ]),
    );

    await runtime.syncConnector('fixture');
    const context = await runtime.buildContext({
      limit: 5,
      permissions: ['knowledge.read'],
      text: 'typed GitHub API service boundaries',
      tokenBudget: 120,
    });
    const graph = runtime.graphSnapshot();

    expect(context.blocks).toHaveLength(1);
    expect(context.sources[0]?.sourceId).toBe('typed-api');
    expect(context.totalTokens).toBeLessThanOrEqual(120);
    expect(graph.entities.some((entity) => entity.label === 'TypeScript API guidance')).toBe(true);
    expect(graph.relationships.length).toBeGreaterThan(0);
  });

  it('can be exposed as an agent retrieval tool', async () => {
    const runtime = new KnowledgeRuntime();
    await runtime.registerConnector(
      connector([
        record({
          content: 'Jira estimates should include QA risk, integration uncertainty, and rollout sequencing.',
          id: 'jira-estimation',
          sourceType: 'jira',
          title: 'Jira estimation guidance',
        }),
      ]),
    );
    await runtime.syncConnector('fixture');

    const tool = runtime.createAgentTool();
    const response = await tool.execute({
      dryRun: false,
      input: {
        query: 'Jira estimation QA risk',
        tokenBudget: 100,
      },
      sessionId: 'session-1',
      stepId: 'step-1',
    });

    expect(tool.metadata.name).toBe('knowledge.search');
    expect(response.observation.success).toBe(true);
    expect(response.observation.source).toBe('knowledge.search');
    expect(response.output).toMatchObject({
      totalTokens: expect.any(Number) as number,
    });
  });
});

function connector(records: readonly KnowledgeSourceRecord[]): KnowledgeConnector {
  return sequenceConnector([records]);
}

function sequenceConnector(batches: readonly (readonly KnowledgeSourceRecord[])[]): KnowledgeConnector {
  let index = 0;

  return {
    fetch: () => {
      const batch = batches[Math.min(index, batches.length - 1)] ?? [];
      index += 1;
      return Promise.resolve(batch);
    },
    metadata: {
      authentication: 'none',
      authority: 0.9,
      id: 'fixture',
      name: 'Fixture connector',
      permissions: ['knowledge.read'],
      sourceType: 'document',
      syncStrategy: 'manual',
    },
  };
}

function record(input: {
  readonly content: string;
  readonly id: string;
  readonly permissions?: readonly ['knowledge.read', 'knowledge.read.confidential'] | readonly ['knowledge.read'];
  readonly sourceType?: KnowledgeSourceRecord['sourceType'];
  readonly title: string;
}): KnowledgeSourceRecord {
  return {
    content: input.content,
    id: input.id,
    metadata: {},
    modifiedAt: 1_000,
    permissions: input.permissions ?? ['knowledge.read'],
    sourceType: input.sourceType ?? 'document',
    title: input.title,
    uri: `https://example.com/${input.id}`,
    version: '1',
  };
}
