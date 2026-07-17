import type { ContextAdapter, ContextAdapterResult } from './context-adapter';
import { actionCandidate } from './context-adapter';

export class JiraAdapter implements ContextAdapter {
  public readonly id = 'jira';

  public detect(input: { readonly url: URL }): boolean {
    return (
      input.url.hostname.includes('jira') ||
      input.url.hostname.includes('atlassian.net') ||
      input.url.hostname.includes('linear.app')
    );
  }

  public extract(): ContextAdapterResult {
    return {
      application: 'jira',
      availableActions: [
        actionCandidate('page.summarize', 0.78, 'Issue tracker context'),
        actionCandidate('research.topic', 0.62, 'Ticket research context'),
        actionCandidate('workflow.start', 0.58, 'Multi-step product work'),
      ],
      pageKind: 'issue-tracker',
    };
  }

  public requiredPermissions(): readonly string[] {
    return ['activeTab', 'contentScript'];
  }
}
