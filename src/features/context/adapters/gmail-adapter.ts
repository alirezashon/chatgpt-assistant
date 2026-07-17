import type { ContextAdapter, ContextAdapterResult } from './context-adapter';
import { actionCandidate } from './context-adapter';

export class GmailAdapter implements ContextAdapter {
  public readonly id = 'gmail';

  public detect(input: { readonly url: URL }): boolean {
    return input.url.hostname.includes('mail.google.com') || input.url.hostname.includes('outlook.');
  }

  public extract(): ContextAdapterResult {
    return {
      application: 'gmail',
      availableActions: [
        actionCandidate('email.reply', 0.92, 'Email thread context'),
        actionCandidate('email.summarizeThread', 0.84, 'Visible email thread'),
        actionCandidate('email.improveDraft', 0.72, 'Email drafting context'),
        actionCandidate('email.translate', 0.58, 'Email language action'),
      ],
      pageKind: 'email',
    };
  }

  public requiredPermissions(): readonly string[] {
    return ['activeTab', 'contentScript'];
  }
}
