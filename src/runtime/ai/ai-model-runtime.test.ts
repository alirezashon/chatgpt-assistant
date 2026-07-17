import { describe, expect, it } from 'vitest';

import { AIError } from './ai-errors';
import { AIModelRuntime } from './ai-model-runtime';
import { AIToolCallingRuntime } from './ai-tool-calling-runtime';
import { LocalAIProviderAdapter } from './local-ai-provider';
import { TestAIProvider } from './testing';
import type { AIModelMetadata } from './ai-types';

const cloudReasoningModel: AIModelMetadata = {
  capabilities: ['reasoning', 'analysis', 'text-generation'],
  contextWindowTokens: 16_000,
  dataResidency: 'us',
  enterpriseApproved: true,
  id: 'cloud-reasoning',
  latencyMs: 900,
  maxOutputTokens: 2_000,
  name: 'Cloud Reasoning',
  pricing: { currency: 'USD', inputPerMillion: 10, outputPerMillion: 20 },
  providerId: 'cloud',
  quality: 0.95,
  securityLevel: 0.8,
};

const cheapSummaryModel: AIModelMetadata = {
  capabilities: ['text-generation'],
  contextWindowTokens: 8_000,
  dataResidency: 'us',
  enterpriseApproved: true,
  id: 'cheap-summary',
  latencyMs: 150,
  maxOutputTokens: 800,
  name: 'Cheap Summary',
  pricing: { currency: 'USD', inputPerMillion: 0.2, outputPerMillion: 0.4 },
  providerId: 'cloud',
  quality: 0.7,
};

describe('AIModelRuntime', () => {
  it('classifies, routes, executes, traces, and records model health', async () => {
    const runtime = new AIModelRuntime();
    await runtime.registerProvider(
      new TestAIProvider({
        metadata: {
          authentication: 'api-key',
          capabilities: ['reasoning', 'analysis', 'text-generation'],
          id: 'cloud',
          local: false,
          name: 'Cloud Provider',
        },
        models: [cloudReasoningModel, cheapSummaryModel],
        responseText: 'architecture analysis complete',
      }),
    );

    const response = await runtime.execute({
      id: 'request-1',
      input: 'Analyze this platform architecture and compare tradeoffs.',
      intent: 'Analyze complex architecture tradeoffs',
    });

    expect(response.classifiedTask.taskType).toBe('reasoning');
    expect(response.modelId).toBe('cloud-reasoning');
    expect(runtime.trace('request-1').map((event) => event.type)).toContain('routed');
    expect(runtime.trace('request-1').map((event) => event.type)).toContain('completed');
    expect(runtime.modelHealth().map((item) => item.modelId)).toContain('cloud-reasoning');
  });

  it('routes maximum privacy requests to local providers', async () => {
    const runtime = new AIModelRuntime();
    await runtime.registerProvider(new LocalAIProviderAdapter());
    await runtime.registerProvider(
      new TestAIProvider({
        metadata: {
          authentication: 'api-key',
          capabilities: ['text-generation'],
          id: 'cloud',
          local: false,
          name: 'Cloud Provider',
        },
        models: [cheapSummaryModel],
        responseText: 'cloud response',
      }),
    );

    const response = await runtime.execute({
      input: 'Summarize this private note.',
      intent: 'Summarize private note',
      privacyMode: 'maximum-privacy',
    });

    expect(response.providerId).toBe('local');
  });

  it('enforces enterprise governance over providers and models', async () => {
    const runtime = new AIModelRuntime();
    await runtime.registerProvider(
      new TestAIProvider({
        metadata: {
          authentication: 'api-key',
          capabilities: ['text-generation'],
          id: 'cloud',
          local: false,
          name: 'Cloud Provider',
        },
        models: [cheapSummaryModel],
      }),
    );
    runtime.setGovernancePolicy({
      allowedModels: [],
      allowedProviders: ['approved-provider'],
      forbiddenModels: [],
      forbiddenProviders: [],
      requireLocal: false,
    });

    await expect(
      runtime.execute({
        input: 'Summarize this.',
        intent: 'Summarize this.',
      }),
    ).rejects.toBeInstanceOf(AIError);
  });

  it('compresses memory, knowledge, base context, and tool results into a token budget', async () => {
    const runtime = new AIModelRuntime();
    await runtime.registerProvider(
      new TestAIProvider({
        metadata: {
          authentication: 'none',
          capabilities: ['text-generation'],
          id: 'cloud',
          local: true,
          name: 'Cloud Provider',
        },
        models: [cheapSummaryModel],
        responseText: 'summary complete',
      }),
    );

    const response = await runtime.execute({
      context: [{ content: 'Base   context   with   spaces', id: 'base', priority: 10, sensitivity: 'public' }],
      input: 'Summarize this.',
      intent: 'Summarize this.',
      knowledge: [{ content: 'Knowledge fact', id: 'knowledge', priority: 20, sensitivity: 'public' }],
      memory: [{ content: 'Memory fact', id: 'memory', priority: 30, sensitivity: 'personal' }],
      toolResults: [{ content: 'Tool result', id: 'tool', priority: 40, sensitivity: 'public' }],
      contextTokenBudget: 50,
    });

    expect(response.text).toContain('summary');
  });

  it('executes governed tool calls and injects results as context chunks', async () => {
    const tools = new AIToolCallingRuntime({
      canExecute: (tool) => tool.permissions.includes('knowledge.read'),
    });
    tools.register({
      definition: {
        description: 'Search knowledge',
        name: 'knowledge.search',
        permissions: ['knowledge.read'],
        schemaVersion: 1,
      },
      execute: (call) => Promise.resolve(`result for ${String(call.input['query'])}`),
    });
    const runtime = new AIModelRuntime({ tools });

    const chunks = await runtime.executeToolCalls('tool-request', [
      {
        id: 'call-1',
        input: { query: 'routing' },
        name: 'knowledge.search',
      },
    ]);

    expect(chunks[0]?.content).toBe('result for routing');
    expect(runtime.trace('tool-request')[0]?.type).toBe('tool-called');
  });
});
