import type { ContextAdapter, ContextAdapterResult } from './context-adapter';
import { actionCandidate } from './context-adapter';

export class StackOverflowAdapter implements ContextAdapter {
  public readonly id = 'stackoverflow';

  public detect(input: { readonly url: URL }): boolean {
    return input.url.hostname.includes('stackoverflow.com');
  }

  public extract(): ContextAdapterResult {
    return {
      application: 'stackoverflow',
      availableActions: [
        actionCandidate('selection.explain', 0.82, 'Developer Q&A context'),
        actionCandidate('code.findBug', 0.78, 'Debugging context'),
        actionCandidate('research.topic', 0.58, 'Technical research context'),
      ],
      pageKind: 'code',
    };
  }

  public requiredPermissions(): readonly string[] {
    return ['activeTab', 'contentScript'];
  }
}
