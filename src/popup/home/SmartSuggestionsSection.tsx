import { Sparkles } from 'lucide-react';

import { CompactActionRow, Panel, SectionTitle } from '@/design-system';

import { runHomeAction } from './home-runner';
import type { HomeActivity, HomePageContext } from './home-types';

export function SmartSuggestionsSection({
  context,
  suggestions,
  tabId,
  windowId,
}: {
  readonly context: HomePageContext | null;
  readonly suggestions: readonly HomeActivity[];
  readonly tabId: number | undefined;
  readonly windowId: number | undefined;
}) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <section className="mt-[var(--ds-space-3)]">
      <div className="mb-[var(--ds-space-2)]">
        <SectionTitle icon={Sparkles} title="Suggested next" />
      </div>
      <Panel className="grid gap-[var(--ds-space-1)] p-[var(--ds-space-2)]">
        {suggestions.slice(0, 2).map((suggestion) => (
          <CompactActionRow
            aria-label={suggestion.action.description}
            icon={suggestion.action.icon}
            key={suggestion.id}
            title={suggestion.label}
            onClick={() => {
              void runHomeAction({ action: suggestion.action, context, tabId, windowId });
            }}
          />
        ))}
      </Panel>
    </section>
  );
}
