export type ProviderErrorCode =
  | 'PROVIDER_AUTH_FAILED'
  | 'PROVIDER_CAPABILITY_UNAVAILABLE'
  | 'PROVIDER_DISCONNECTED'
  | 'PROVIDER_NOT_FOUND'
  | 'PROVIDER_STREAM_FAILED';

export class ProviderError extends Error {
  public readonly code: ProviderErrorCode;

  public constructor(code: ProviderErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'ProviderError';
  }
}
