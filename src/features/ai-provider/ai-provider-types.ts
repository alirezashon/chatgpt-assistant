export type AIProviderId = 'local' | 'openai-compatible';

export interface AIProviderRequest {
  readonly abortSignal?: AbortSignal;
  readonly input: string;
  readonly metadata?: Readonly<Record<string, string>>;
  readonly systemInstruction: string;
}

export interface AIProviderResponse {
  readonly model: string;
  readonly output: string;
  readonly providerId: AIProviderId;
}

export interface AIProvider {
  readonly id: AIProviderId;
  complete(request: AIProviderRequest): Promise<AIProviderResponse>;
}
