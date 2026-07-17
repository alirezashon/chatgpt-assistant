import { useEffect, useState } from 'react';

import { homeStatus } from './home-context';
import { loadHomeActivity } from './home-activity';
import { FavoritesSection } from './FavoritesSection';
import { HomeFooter } from './HomeFooter';
import { HomeHeader } from './HomeHeader';
import { PageContextSection } from './PageContextSection';
import { PrimaryActionsSection } from './PrimaryActionsSection';
import { RecentActivitySection } from './RecentActivitySection';
import { SmartSuggestionsSection } from './SmartSuggestionsSection';
import type { HomeActivityState, HomePageContext } from './home-types';

export function HomeExperience({
  canMessageTab,
  context,
  contextLoading,
  tabId,
  windowId,
}: {
  readonly canMessageTab: boolean;
  readonly context: HomePageContext | null;
  readonly contextLoading: boolean;
  readonly tabId: number | undefined;
  readonly windowId: number | undefined;
}) {
  const [activity, setActivity] = useState<HomeActivityState>({
    recent: [],
    smartSuggestions: [],
  });

  useEffect(() => {
    let cancelled = false;

    void loadHomeActivity().then((loaded) => {
      if (!cancelled) {
        setActivity(loaded);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="w-[var(--ds-popup-width)] bg-[var(--ds-color-background)] text-[color:var(--ds-color-text)]">
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-[var(--ds-popup-glow-height)] bg-[radial-gradient(circle_at_80%_0%,var(--ds-color-accent-glow),transparent_42%)]" />
        <div className="relative p-[var(--ds-space-3)]">
          <HomeHeader status={homeStatus({ canMessageTab, contextLoading })} />
          <PrimaryActionsSection
            canMessageTab={canMessageTab}
            context={context}
            tabId={tabId}
            windowId={windowId}
          />
          <PageContextSection
            canMessageTab={canMessageTab}
            context={context}
            tabId={tabId}
            windowId={windowId}
          />
          <SmartSuggestionsSection
            context={context}
            suggestions={activity.smartSuggestions}
            tabId={tabId}
            windowId={windowId}
          />
          <RecentActivitySection
            canMessageTab={canMessageTab}
            context={context}
            recent={activity.recent}
            tabId={tabId}
            windowId={windowId}
          />
          <FavoritesSection
            canMessageTab={canMessageTab}
            context={context}
            tabId={tabId}
            windowId={windowId}
          />
          <HomeFooter canMessageTab={canMessageTab} tabId={tabId} />
        </div>
      </div>
    </main>
  );
}
