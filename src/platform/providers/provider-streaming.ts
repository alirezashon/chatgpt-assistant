import type { ProviderEvents } from '@/platform/providers/provider-events';
import type { ProviderStreamingStatus } from '@/platform/providers/provider-types';
import { createProviderId } from '@/platform/providers/provider-utils';

export interface ProviderStreamChunk {
  readonly content: string;
  readonly index: number;
  readonly streamId: string;
}

export interface ProviderStreamState {
  readonly progress: number;
  readonly providerId: string;
  readonly status: ProviderStreamingStatus;
  readonly streamId: string;
}

export class ProviderStreaming {
  private readonly events: ProviderEvents;
  private readonly streams = new Map<string, ProviderStreamState>();

  public constructor(events: ProviderEvents) {
    this.events = events;
  }

  public start(providerId: string): ProviderStreamState {
    const stream: ProviderStreamState = {
      progress: 0,
      providerId,
      status: 'running',
      streamId: createProviderId('provider-stream'),
    };

    this.streams.set(stream.streamId, stream);
    this.events.emit('streamingStarted', {
      providerId,
      streamId: stream.streamId,
    });

    return stream;
  }

  public update(streamId: string, progress: number): ProviderStreamState | null {
    const stream = this.streams.get(streamId);

    if (stream === undefined) {
      return null;
    }

    const nextStream = {
      ...stream,
      progress,
    };

    this.streams.set(streamId, nextStream);

    return nextStream;
  }

  public pause(streamId: string): void {
    this.setStatus(streamId, 'paused');
  }

  public resume(streamId: string): void {
    this.setStatus(streamId, 'running');
  }

  public cancel(streamId: string): void {
    this.setStatus(streamId, 'cancelled');
  }

  public complete(streamId: string): void {
    this.setStatus(streamId, 'completed');
    this.events.emit('streamingFinished', {
      streamId,
    });
  }

  private setStatus(streamId: string, status: ProviderStreamingStatus): void {
    const stream = this.streams.get(streamId);

    if (stream === undefined) {
      return;
    }

    this.streams.set(streamId, {
      ...stream,
      status,
    });
  }
}
