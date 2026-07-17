import type { ContextAdapter, ContextAdapterResult } from './context-adapter';
import { actionCandidate } from './context-adapter';

export class GenericWebAdapter implements ContextAdapter {
  public readonly id = 'generic-web';

  public detect(): boolean {
    return true;
  }

  public extract(input: { readonly documentRef: Document; readonly url: URL }): ContextAdapterResult {
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
      ],
      pageKind,
    };
  }

  public requiredPermissions(): readonly string[] {
    return ['activeTab', 'contentScript'];
  }
}
