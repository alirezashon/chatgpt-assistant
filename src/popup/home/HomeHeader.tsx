import { Settings } from 'lucide-react';

import { APP_NAME } from '@/constants';
import { IconButton, StatusIndicator } from '@/design-system';
import { getExtensionUrl, openOptionsPage } from '@/lib/chrome/chrome-api';

import type { HomeStatus } from './home-types';

export function HomeHeader({ status }: { readonly status: HomeStatus }) {
  const statusLabel = {
    offline: 'Offline',
    ready: 'Ready',
    working: 'Working',
  } satisfies Record<HomeStatus, string>;
  const statusIntent = status === 'offline' ? 'warning' : status === 'working' ? 'info' : 'success';

  return (
    <header className="flex items-center justify-between gap-[var(--ds-space-3)]">
      <div className="flex min-w-0 items-center gap-[var(--ds-space-3)]">
        <img
          alt=""
          className="h-8 w-8 rounded-[var(--ds-radius-lg)] shadow-[0_0_0_1px_var(--ds-color-border)]"
          src={getExtensionUrl('icons/icon-128.png')}
        />
        <div className="min-w-0">
          <h1 className="truncate text-[length:var(--ds-font-title)] font-semibold leading-[var(--ds-line-title)] tracking-normal text-[color:var(--ds-color-text-strong)]">
            {APP_NAME}
          </h1>
          <div className="text-[length:var(--ds-font-caption)] leading-[var(--ds-line-caption)] text-[color:var(--ds-color-text-muted)]">
            <StatusIndicator intent={statusIntent} label={statusLabel[status]} />
          </div>
        </div>
      </div>
      <IconButton
        icon={Settings}
        label="Open settings"
        size="sm"
        onClick={() => {
          void openOptionsPage();
          window.close();
        }}
      />
    </header>
  );
}
