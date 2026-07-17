import type { APIRoute, APISDKLanguage } from './api-types';

/** Generates lightweight SDK client skeletons from registered API routes. */
export class APISDKGenerator {
  /** Generates SDK source text. */
  public generate(language: APISDKLanguage, routes: readonly APIRoute[]): string {
    if (language === 'typescript') {
      return typescript(routes);
    }

    if (language === 'python') {
      return python(routes);
    }

    if (language === 'java') {
      return java(routes);
    }

    if (language === 'go') {
      return go(routes);
    }

    return csharp(routes);
  }
}

function methodName(route: APIRoute): string {
  return `${route.domain}_${route.method.toLowerCase()}_${route.path.replaceAll(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '')}`;
}

function typescript(routes: readonly APIRoute[]): string {
  const methods = routes
    .map((route) => `  async ${methodName(route)}(body: unknown) { return this.request('${route.method}', '${route.path}', body); }`)
    .join('\n');
  return `export class PlatformClient {\n  constructor(private readonly apiKey: string, private readonly baseUrl: string) {}\n  private async request(method: string, path: string, body: unknown) { return { method, path, body }; }\n${methods}\n}\n`;
}

function python(routes: readonly APIRoute[]): string {
  return routes.map((route) => `def ${methodName(route)}(client, body):\n    return client.request("${route.method}", "${route.path}", body)\n`).join('\n');
}

function java(routes: readonly APIRoute[]): string {
  return `public final class PlatformClient {\n${routes.map((route) => `  public Object ${methodName(route)}(Object body) { return body; }`).join('\n')}\n}\n`;
}

function go(routes: readonly APIRoute[]): string {
  return `package platform\n\n${routes.map((route) => `func ${methodName(route)}(body any) any { return body }`).join('\n')}\n`;
}

function csharp(routes: readonly APIRoute[]): string {
  return `public sealed class PlatformClient {\n${routes.map((route) => `  public object ${methodName(route)}(object body) => body;`).join('\n')}\n`;
}
