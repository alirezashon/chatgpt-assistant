import { createDisposable, type CancellationToken, type Disposable } from '@/runtime/utils';

import type { MessageTransport } from './messaging-types';

/** In-memory transport used by tests and local runtimes. */
export class MemoryMessageTransport implements MessageTransport {
  private listener: ((message: unknown) => unknown) | undefined;

  /** Optional peer transport. */
  public peer: MemoryMessageTransport | undefined;

  /** Sends a message to the peer listener. */
  public async send(message: unknown, token?: CancellationToken): Promise<unknown> {
    token?.throwIfCancellationRequested();

    if (this.peer?.listener === undefined) {
      return { error: 'No peer listener registered.', ok: false };
    }

    return await Promise.resolve(this.peer.listener(message));
  }

  /** Registers the inbound listener. */
  public listen(listener: (message: unknown) => unknown): Disposable {
    this.listener = listener;

    return createDisposable(() => {
      if (this.listener === listener) {
        this.listener = undefined;
      }
    });
  }
}
