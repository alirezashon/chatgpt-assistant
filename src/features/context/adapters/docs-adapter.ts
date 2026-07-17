import type { ContextAdapter, ContextAdapterResult } from './context-adapter';
import { actionCandidate } from './context-adapter';

export class DocsAdapter implements ContextAdapter {
  public readonly id = 'docs';

  public detect(input: { readonly url: URL }): boolean {
    return input.url.hostname.includes('docs.google.com');
  }

  public extract(): ContextAdapterResult {
    return {
      application: 'google-docs',
      availableActions: [
        actionCandidate('page.summarize', 0.78, 'Document context'),
        actionCandidate('content.generateDocumentation', 0.7, 'Writing context'),
        actionCandidate('meeting.createNotes', 0.64, 'Document notes context'),
        actionCandidate('data.extractStructured', 0.56, 'Structured document context'),
      ],
      pageKind: 'document',
    };
  }

  public requiredPermissions(): readonly string[] {
    return ['activeTab', 'contentScript'];
  }
}
