import type { ContextAdapter, ContextAdapterResult } from './context-adapter';
import { actionCandidate } from './context-adapter';

export class GitHubAdapter implements ContextAdapter {
  public readonly id = 'github';

  public detect(input: { readonly url: URL }): boolean {
    return input.url.hostname.includes('github.com');
  }

  public extract(input: { readonly url: URL }): ContextAdapterResult {
    const isPullRequest = /\/pull\/\d+/u.test(input.url.pathname);

    return {
      application: 'github',
      availableActions: isPullRequest
        ? [
            actionCandidate('github.reviewPr', 0.96, 'GitHub pull request'),
            actionCandidate('code.generateTests', 0.82, 'Changed code context'),
            actionCandidate('code.findBug', 0.78, 'Review risk context'),
            actionCandidate('github.generateCommit', 0.62, 'Repository change context'),
          ]
        : [
            actionCandidate('github.summarizeRepo', 0.84, 'GitHub repository'),
            actionCandidate('content.generateDocumentation', 0.68, 'Repository documentation context'),
            actionCandidate('selection.explain', 0.62, 'Code host'),
          ],
      pageKind: 'code',
    };
  }

  public requiredPermissions(): readonly string[] {
    return ['activeTab', 'contentScript'];
  }
}
