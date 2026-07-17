import type { ContextAdapter, ContextAdapterResult } from './context-adapter';
import { actionCandidate } from './context-adapter';

export class NotionAdapter implements ContextAdapter {
  public readonly id = 'notion';

  public detect(input: { readonly url: URL }): boolean {
    return input.url.hostname.includes('notion.so');
  }

  public extract(): ContextAdapterResult {
    return {
      application: 'notion',
      availableActions: [
        actionCandidate('page.summarize', 0.74, 'Notion document context'),
        actionCandidate('meeting.createNotes', 0.64, 'Notes workspace context'),
        actionCandidate('memory.saveContext', 0.62, 'Knowledge workspace context'),
      ],
      pageKind: 'document',
    };
  }

  public requiredPermissions(): readonly string[] {
    return ['activeTab', 'contentScript'];
  }
}
