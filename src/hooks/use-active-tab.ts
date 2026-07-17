import { useEffect, useState } from 'react';

import { getActiveTab } from '@/lib/chrome/chrome-api';

export function useActiveTab() {
  const [activeTab, setActiveTab] = useState<chrome.tabs.Tab | null>(null);

  useEffect(() => {
    let cancelled = false;

    void getActiveTab().then((tab) => {
      if (!cancelled) {
        setActiveTab(tab);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return activeTab;
}
