import type { CancellationToken, Disposable } from '@/runtime/utils';

/** Message contract map keyed by message type. */
export type MessageContractMap = Readonly<
  Record<
    string,
    {
      readonly request: unknown;
      readonly response: unknown;
    }
  >
>;

/** Runtime message envelope. */
export interface RuntimeMessageEnvelope<Type extends string, Payload> {
  /** Message id used for correlation. */
  readonly id: string;
  /** Message type. */
  readonly type: Type;
  /** Message payload. */
  readonly payload: Payload;
  /** Sender logical runtime. */
  readonly source: string;
  /** Optional target logical runtime. */
  readonly target?: string;
  /** Timestamp in milliseconds. */
  readonly timestamp: number;
}

/** Runtime response envelope. */
export type RuntimeMessageResponse<Payload> =
  | {
      /** Successful response. */
      readonly ok: true;
      /** Response payload. */
      readonly payload: Payload;
    }
  | {
      /** Failed response. */
      readonly ok: false;
      /** Safe error message. */
      readonly error: string;
    };

/** Transport used by messaging runtime. */
export interface MessageTransport {
  /** Sends a serialized message and returns serialized response. */
  send(message: unknown, token?: CancellationToken): Promise<unknown>;
  /** Subscribes to inbound messages. */
  listen(listener: (message: unknown) => unknown): Disposable;
}

/** Request options. */
export interface MessageRequestOptions {
  /** Timeout in milliseconds. */
  readonly timeoutMs?: number;
  /** Retry attempts. */
  readonly retries?: number;
  /** Cancellation token. */
  readonly token?: CancellationToken;
}

/** Validator for inbound/outbound payloads. */
export type MessageValidator<Payload> = (payload: unknown) => payload is Payload;
