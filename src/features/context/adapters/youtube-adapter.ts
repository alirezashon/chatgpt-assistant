import type { ContextAdapter, ContextAdapterResult } from './context-adapter';
import { actionCandidate } from './context-adapter';

export class YouTubeAdapter implements ContextAdapter {
  public readonly id = 'youtube';

  public detect(input: { readonly url: URL }): boolean {
    return input.url.hostname.includes('youtube.com') || input.url.hostname.includes('youtu.be');
  }

  public extract(): ContextAdapterResult {
    return {
      application: 'youtube',
      availableActions: [
        actionCandidate('youtube.summarize', 0.94, 'YouTube video page'),
        actionCandidate('youtube.notes', 0.82, 'Learning video context'),
        actionCandidate('youtube.chapters', 0.78, 'Timeline extraction available'),
      ],
      pageKind: 'video',
    };
  }

  public requiredPermissions(): readonly string[] {
    return ['activeTab', 'contentScript'];
  }
}
