import { Shield, SlidersHorizontal } from 'lucide-react';

import { APP_NAME, APP_VERSION } from '@/constants';
import { Badge, MetricRow, PageHeader, Panel, SectionTitle, SurfaceRoot } from '@/design-system';
import { runtimeConfig } from '@/lib/config/runtime-config';

export function OptionsApp() {
  return (
    <SurfaceRoot size="content">
      <PageHeader
        actions={<Badge>v{APP_VERSION}</Badge>}
        icon={SlidersHorizontal}
        subtitle="Provider, privacy, shortcut, and runtime preferences only."
        title={`${APP_NAME} Settings`}
      />

      <div className="grid gap-[var(--ds-space-4)] px-[var(--ds-space-4)] py-[var(--ds-space-4)] sm:grid-cols-2">
        <Panel className="p-[var(--ds-space-4)]">
          <SectionTitle icon={Shield} title="Privacy baseline" />
          <p className="mt-[var(--ds-space-3)] text-[length:var(--ds-font-body)] leading-[var(--ds-line-body)] text-[color:var(--ds-color-text-muted)]">
              Page content is captured only after user interaction. Future provider calls should
              flow through the background worker and the typed command contracts.
          </p>
        </Panel>
        <Panel className="p-[var(--ds-space-4)]">
          <SectionTitle icon={SlidersHorizontal} title="Runtime" />
          <dl className="mt-[var(--ds-space-3)] grid gap-[var(--ds-space-2)]">
            <MetricRow label="Environment" value={runtimeConfig.appEnvironment} />
            <MetricRow
              label="AI base URL"
              value={runtimeConfig.aiApiBaseUrl.length > 0 ? 'configured' : 'not configured'}
            />
          </dl>
        </Panel>
      </div>
    </SurfaceRoot>
  );
}
