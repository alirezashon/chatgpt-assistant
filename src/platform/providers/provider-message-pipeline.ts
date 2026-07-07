import type { ProviderMessage } from '@/platform/providers/provider-types';

export type ProviderMessageMiddleware = (
  message: ProviderMessage,
) => Promise<ProviderMessage> | ProviderMessage;

export class ProviderMessagePipeline {
  private readonly incoming: ProviderMessageMiddleware[] = [];
  private readonly outgoing: ProviderMessageMiddleware[] = [];

  public useIncoming(middleware: ProviderMessageMiddleware): void {
    this.incoming.push(middleware);
  }

  public useOutgoing(middleware: ProviderMessageMiddleware): void {
    this.outgoing.push(middleware);
  }

  public async transformIncoming(message: ProviderMessage): Promise<ProviderMessage> {
    return await this.run(this.incoming, message);
  }

  public async transformOutgoing(message: ProviderMessage): Promise<ProviderMessage> {
    return await this.run(this.outgoing, message);
  }

  private async run(
    middlewares: readonly ProviderMessageMiddleware[],
    message: ProviderMessage,
  ): Promise<ProviderMessage> {
    let nextMessage = message;

    for (const middleware of middlewares) {
      nextMessage = await middleware(nextMessage);
    }

    return nextMessage;
  }
}
