import type { APIGatewayRequest, APIRoute, APIRouteHandler } from './api-types';
import { APIRuntimeError } from './api-types';

interface RouteRecord {
  readonly route: APIRoute;
  readonly handler: APIRouteHandler;
}

/** Versioned route registry for REST, GraphQL, Event, Webhook, Realtime, and SDK APIs. */
export class APIRouteRegistry {
  private readonly routes = new Map<string, RouteRecord>();

  /** Registers route. */
  public register(route: APIRoute, handler: APIRouteHandler): void {
    this.routes.set(route.id, { handler, route });
  }

  /** Matches a request. */
  public match(request: APIGatewayRequest): RouteRecord {
    const route = [...this.routes.values()].find(
      (record) =>
        record.route.version === request.version &&
        record.route.protocol === request.protocol &&
        record.route.method === request.method &&
        record.route.path === request.path,
    );

    if (route === undefined) {
      throw new APIRuntimeError('API_NOT_FOUND', `API route not found: ${request.method} ${request.path}`);
    }

    return route;
  }

  /** Lists routes. */
  public list(): readonly APIRoute[] {
    return [...this.routes.values()].map((record) => record.route);
  }
}
