import { describe, expect, it } from 'vitest';

import { APIGateway } from './api-gateway';
import { APIWebhookEngine } from './webhook-engine';
import type { APIGatewayRequest, APIRateLimitPlan, APIWebhookDeliveryAdapter } from './api-types';

describe('APIGateway', () => {
  it('authenticates, authorizes scopes, routes versioned requests, and records usage', async () => {
    const gateway = gatewayWithAgentRoute();
    const issued = issue(gateway, ['agent.execute']);

    const response = await gateway.handle(request({
      path: '/api/agents/tasks',
      secret: issued.secret,
    }));

    expect(response.status).toBe(200);
    expect(response.headers['x-api-version']).toBe('v1');
    expect(response.body).toMatchObject({ taskId: 'task-1' });
    expect(gateway.observability.summary(issued.applicationId).requests).toBe(1);
  });

  it('denies requests missing required capability scopes', async () => {
    const gateway = gatewayWithAgentRoute();
    const issued = issue(gateway, ['agent.read']);

    const response = await gateway.handle(request({
      path: '/api/agents/tasks',
      secret: issued.secret,
    }));

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({ code: 'API_FORBIDDEN' });
  });

  it('rotates and revokes credentials', async () => {
    const gateway = gatewayWithAgentRoute();
    const issued = issue(gateway, ['agent.execute']);
    const rotated = gateway.auth.rotateCredential(issued.credentialId);

    const oldResponse = await gateway.handle(request({
      path: '/api/agents/tasks',
      secret: issued.secret,
    }));
    const newResponse = await gateway.handle(request({
      path: '/api/agents/tasks',
      secret: rotated.secret,
    }));

    expect(oldResponse.status).toBe(401);
    expect(newResponse.status).toBe(200);
  });

  it('rate limits per application environment', async () => {
    const gateway = gatewayWithAgentRoute();
    const issued = issue(gateway, ['agent.execute'], {
      burst: 0,
      capacity: 1,
      priority: 'normal',
      refillPerMinute: 0,
    });

    const first = await gateway.handle(request({ path: '/api/agents/tasks', secret: issued.secret }));
    const second = await gateway.handle(request({ path: '/api/agents/tasks', secret: issued.secret }));

    expect(first.status).toBe(200);
    expect(second.status).toBe(429);
  });

  it('delivers signed webhooks with retry logs and replay protection', async () => {
    let attempts = 0;
    const adapter: APIWebhookDeliveryAdapter = {
      deliver: () => {
        attempts += 1;
        return Promise.resolve({ status: attempts === 1 ? 500 : 204 });
      },
    };
    const gateway = new APIGateway({
      webhooks: new APIWebhookEngine(adapter),
    });
    const issued = issue(gateway, ['workflow.execute']);
    const endpoint = gateway.webhooks.registerEndpoint({
      applicationId: issued.applicationId,
      environmentId: issued.environmentId,
      events: ['workflow.completed'],
      secret: 'webhook-secret',
      url: 'https://example.com/webhook',
    });

    const deliveries = await gateway.publishEvent({
      payload: { workflowId: 'wf-1' },
      type: 'workflow.completed',
    });
    const last = deliveries[0];

    expect(last?.status).toBe('succeeded');
    expect(gateway.webhooks.logs(endpoint.id)).toHaveLength(2);
    expect(() =>
      gateway.webhooks.verifyReplay({
        eventId: last?.eventId ?? '',
        signature: last?.signature ?? '',
        timestamp: Date.now(),
      }),
    ).not.toThrow();
    expect(() =>
      gateway.webhooks.verifyReplay({
        eventId: last?.eventId ?? '',
        signature: last?.signature ?? '',
        timestamp: Date.now(),
      }),
    ).toThrow();
  });

  it('generates SDK clients from registered routes', () => {
    const gateway = gatewayWithAgentRoute();

    expect(gateway.generateSDK('typescript')).toContain('class PlatformClient');
    expect(gateway.generateSDK('python')).toContain('def agent_post_api_agents_tasks');
  });

  it('rejects injection-shaped payloads', async () => {
    const gateway = gatewayWithAgentRoute();
    const issued = issue(gateway, ['agent.execute']);
    const response = await gateway.handle(request({
      body: { ['__proto__']: { polluted: true } },
      path: '/api/agents/tasks',
      secret: issued.secret,
    }));

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ code: 'API_VALIDATION_FAILED' });
  });
});

function gatewayWithAgentRoute(): APIGateway {
  const gateway = new APIGateway();
  gateway.registerRoute(
    {
      domain: 'agent',
      id: 'agent.create-task.v1',
      method: 'POST',
      path: '/api/agents/tasks',
      protocol: 'rest',
      requiredScopes: ['agent.execute'],
      version: 'v1',
    },
    () => ({
      body: { status: 'queued', taskId: 'task-1' },
      headers: {},
      status: 200,
    }),
  );
  return gateway;
}

function issue(gateway: APIGateway, scopes: Parameters<APIGateway['auth']['issueCredential']>[0]['scopes'], rateLimit?: APIRateLimitPlan) {
  const application = gateway.auth.createApplication({
    allowedOrigins: ['https://client.example.com'],
    description: 'External integration',
    developerId: 'developer-1',
    name: 'External App',
  });
  const environment = gateway.auth.createEnvironment({
    applicationId: application.id,
    ...(rateLimit === undefined ? {} : { rateLimit }),
    type: 'production',
  });
  const issued = gateway.auth.issueCredential({
    applicationId: application.id,
    environmentId: environment.id,
    name: 'Production Key',
    scopes,
  });

  return {
    applicationId: application.id,
    credentialId: issued.credential.id,
    environmentId: environment.id,
    secret: issued.secret,
  };
}

function request(input: {
  readonly body?: APIGatewayRequest['body'];
  readonly path: string;
  readonly secret: string;
}): APIGatewayRequest {
  return {
    body: input.body ?? { objective: 'Run task' },
    headers: {
      authorization: `Bearer ${input.secret}`,
      origin: 'https://client.example.com',
      'x-api-timestamp': Date.now().toString(),
    },
    id: crypto.randomUUID(),
    method: 'POST',
    path: input.path,
    protocol: 'rest',
    query: {},
    timestamp: Date.now(),
    version: 'v1',
  };
}
