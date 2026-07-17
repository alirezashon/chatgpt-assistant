import { useEffect, useMemo, useState } from 'react';

import type { PageContextSnapshot } from '@/features/context';
import { useActiveTab } from '@/hooks';
import { sendTabMessage } from '@/lib/chrome/chrome-api';
import { createMessage } from '@/lib/messaging';

import { buildHomePageContext } from './home/home-context';
import { HomeExperience } from './home/HomeExperience';

export function PopupApp() {
  const activeTab = useActiveTab();
  const [pageContext, setPageContext] = useState<PageContextSnapshot | null>(null);
  const [contextLoading, setContextLoading] = useState(true);
  const canMessageTab = activeTab?.id !== undefined && activeTab.url?.startsWith('http') === true;
  const homeContext = useMemo(
    () => buildHomePageContext(activeTab, pageContext),
    [activeTab, pageContext],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadContext(): Promise<void> {
      const tabId = activeTab === null ? undefined : activeTab.id;

      if (!canMessageTab || tabId === undefined) {
        setContextLoading(false);
        return;
      }

      setContextLoading(true);

      try {
        const response = await sendTabMessage<{ readonly data: PageContextSnapshot; readonly ok: true }>(
          tabId,
          createMessage('popup', 'context.getActive', undefined),
        );

        if (!cancelled) {
          setPageContext(response.data);
        }
      } catch {
        if (!cancelled) {
          setPageContext(null);
        }
      } finally {
        if (!cancelled) {
          setContextLoading(false);
        }
      }
    }

    void loadContext();

    return () => {
      cancelled = true;
    };
  }, [activeTab, canMessageTab]);

  return (
    <HomeExperience
      canMessageTab={canMessageTab}
      context={homeContext}
      contextLoading={contextLoading}
      tabId={activeTab?.id}
      windowId={activeTab?.windowId}
    />
  );
}
