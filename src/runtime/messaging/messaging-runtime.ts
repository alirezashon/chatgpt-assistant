import {
  CancellationTokenSource,
  RuntimeError,
  retry,
  sleep,
  toRuntimeError,
} from '@/runtime/utils';

import type {
  MessageContractMap,
  MessageRequestOptions,
  MessageTransport,
  MessageValidator,
  RuntimeMessageEnvelope,
  RuntimeMessageResponse,
} from './messaging-types';

type MessageHandler<Contracts extends MessageContractMap, Type extends keyof Contracts & string> = (
  payload: Contracts[Type]['request'],
  envelope: RuntimeMessageEnvelope<Type, Contracts[Type]['request']>,
) => Promise<Contracts[Type]['response']> | Contracts[Type]['response'];

type UntypedMessageHandler = (
  payload: unknown,
  envelope: RuntimeMessageEnvelope<string, unknown>,
) => unknown;

/** Typed messaging runtime over a pluggable transport. */
export class MessagingRuntime<Contracts extends MessageContractMap> {
  private readonly handlers = new Map<string, UntypedMessageHandler>();
  private readonly validators = new Map<string, MessageValidator<unknown>>();

  public constructor(
    private readonly source: string,
    private readonly transport: MessageTransport,
  ) {
    this.transport.listen((message) => this.handleIncoming(message));
  }

  /** Registers a payload validator for a message type. */
  public validate<Type extends keyof Contracts & string>(
    type: Type,
    validator: MessageValidator<Contracts[Type]['request']>,
  ): void {
    this.validators.set(type, validator);
  }

  /** Registers a typed request handler. */
  public handle<Type extends keyof Contracts & string>(
    type: Type,
    handler: MessageHandler<Contracts, Type>,
  ): void {
    const wrapped: UntypedMessageHandler = (payload, envelope) =>
      handler(payload, {
        id: envelope.id,
        payload,
        source: envelope.source,
        timestamp: envelope.timestamp,
        type,
        ...(envelope.target === undefined ? {} : { target: envelope.target }),
      });

    this.handlers.set(type, wrapped);
  }

  /** Sends a typed request and returns a typed response payload. */
  public async request<Type extends keyof Contracts & string>(
    type: Type,
    payload: Contracts[Type]['request'],
    options: MessageRequestOptions = {},
  ): Promise<Contracts[Type]['response']> {
    const envelope: RuntimeMessageEnvelope<Type, Contracts[Type]['request']> = {
      id: crypto.randomUUID(),
      payload,
      source: this.source,
      timestamp: Date.now(),
      type,
    };

    const operation = async (): Promise<Contracts[Type]['response']> => {
      const response = await this.sendWithTimeout(envelope, options);
      const parsed = response as RuntimeMessageResponse<Contracts[Type]['response']>;

      if (!parsed.ok) {
        throw new RuntimeError('UNKNOWN', parsed.error);
      }

      return parsed.payload;
    };

    if ((options.retries ?? 0) <= 0) {
      return operation();
    }

    return retry(
      operation,
      {
        initialDelayMs: 50,
        maxAttempts: (options.retries ?? 0) + 1,
        multiplier: 2,
      },
      options.token,
    );
  }

  private async sendWithTimeout<Type extends keyof Contracts & string>(
    envelope: RuntimeMessageEnvelope<Type, Contracts[Type]['request']>,
    options: MessageRequestOptions,
  ): Promise<unknown> {
    if (options.timeoutMs === undefined) {
      return this.transport.send(envelope, options.token);
    }

    const timeoutSource = new CancellationTokenSource();
    const timeout = sleep(options.timeoutMs, options.token).then(() => {
      timeoutSource.cancel();
      throw new RuntimeError('TIMEOUT', `Message timed out: ${envelope.type}`);
    });

    return Promise.race([this.transport.send(envelope, timeoutSource.token), timeout]);
  }

  private async handleIncoming(message: unknown): Promise<RuntimeMessageResponse<unknown>> {
    if (!isEnvelope(message)) {
      return { error: 'Invalid message envelope.', ok: false };
    }

    const validator = this.validators.get(message.type);

    if (validator !== undefined && !validator(message.payload)) {
      return { error: `Invalid payload for message: ${message.type}`, ok: false };
    }

    const handler = this.handlers.get(message.type);

    if (handler === undefined) {
      return { error: `No handler for message: ${message.type}`, ok: false };
    }

    try {
      const payload = await handler(message.payload, message);

      return { ok: true, payload };
    } catch (error) {
      return { error: toRuntimeError(error).message, ok: false };
    }
  }
}

function isEnvelope(value: unknown): value is RuntimeMessageEnvelope<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Readonly<Record<string, unknown>>;

  return (
    typeof candidate['id'] === 'string' &&
    typeof candidate['type'] === 'string' &&
    typeof candidate['source'] === 'string' &&
    typeof candidate['timestamp'] === 'number' &&
    'payload' in candidate
  );
}
