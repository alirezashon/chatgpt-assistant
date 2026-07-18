import type { ContextAdapter, ContextAdapterResult } from './context-adapter';
import { actionCandidate } from './context-adapter';

export class GenericWebAdapter implements ContextAdapter {
  public readonly id = 'generic-web';

  public detect(): boolean {
    return true;
  }

  public extract(input: {
    readonly documentRef: Document;
    readonly url: URL;
  }): ContextAdapterResult {
    const imageCount = input.documentRef.querySelectorAll(
      'img[src], picture source[srcset]',
    ).length;
    const videoCount = input.documentRef.querySelectorAll('video, source[type^="video/"]').length;
    const pageKind =
      input.url.pathname.endsWith('.pdf') || input.documentRef.contentType === 'application/pdf'
        ? 'pdf'
        : input.documentRef.querySelector('article') === null
          ? 'generic'
          : 'article';

    return {
      application: pageKind === 'pdf' ? 'pdf-viewer' : 'generic-web',
      availableActions: [
        actionCandidate('page.summarize', 0.66, 'Readable web page'),
        actionCandidate('research.topic', 0.58, 'General web context'),
        actionCandidate('data.extractStructured', 0.46, 'Potential structured content'),
        ...(imageCount > 0
          ? [actionCandidate('image.edit', 0.7, 'Page contains editable images')]
          : []),
        ...(videoCount > 0
          ? [actionCandidate('video.cut', 0.72, 'Page contains video media')]
          : []),
      ],
      pageKind,
    };
  }

  public requiredPermissions(): readonly string[] {
    return ['activeTab', 'contentScript'];
  }
}
