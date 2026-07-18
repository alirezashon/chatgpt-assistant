import { ArrowLeft, ArrowRight, Shield, SlidersHorizontal } from 'lucide-react';

import { APP_NAME, APP_VERSION } from '@/constants';
import { APP_LOCALE_OPTIONS, copyForLocale, localeDirection, useAppLocale } from '@/i18n';
import {
  Badge,
  Button,
  MetricRow,
  PageHeader,
  Panel,
  SectionTitle,
  SurfaceRoot,
} from '@/design-system';
import { runtimeConfig } from '@/lib/config/runtime-config';

export function OptionsApp() {
  const [locale, setLocale] = useAppLocale();
  const copy = copyForLocale(locale);
  const BackIcon = locale === 'fa' ? ArrowRight : ArrowLeft;
  const handleBack = (): void => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.close();
  };

  return (
    <SurfaceRoot dir={localeDirection(locale)} lang={locale} size="content">
      <PageHeader
        actions={
          <div className="flex items-center gap-[var(--ds-space-2)]">
            <Button icon={BackIcon} size="sm" variant="secondary" onClick={handleBack}>
              {copy.options.back}
            </Button>
            <Badge>v{APP_VERSION}</Badge>
          </div>
        }
        icon={SlidersHorizontal}
        subtitle={copy.options.subtitle}
        title={`${APP_NAME} ${copy.options.titleSuffix}`}
      />

      <div className="grid gap-[var(--ds-space-4)] px-[var(--ds-space-4)] py-[var(--ds-space-4)] sm:grid-cols-2">
        <Panel className="p-[var(--ds-space-4)]">
          <SectionTitle icon={Shield} title={copy.options.privacyTitle} />
          <p className="mt-[var(--ds-space-3)] text-[length:var(--ds-font-body)] leading-[var(--ds-line-body)] text-[color:var(--ds-color-text-muted)]">
            {copy.options.privacyBody}
          </p>
        </Panel>
        <Panel className="p-[var(--ds-space-4)]">
          <SectionTitle icon={SlidersHorizontal} title={copy.options.runtimeTitle} />
          <dl className="mt-[var(--ds-space-3)] grid gap-[var(--ds-space-2)]">
            <MetricRow label={copy.options.environment} value={runtimeConfig.appEnvironment} />
            <MetricRow
              label={copy.options.aiBaseUrl}
              value={
                runtimeConfig.aiApiBaseUrl.length > 0
                  ? copy.options.aiConfigured
                  : copy.options.aiNotConfigured
              }
            />
          </dl>
        </Panel>
        <Panel className="p-[var(--ds-space-4)] sm:col-span-2">
          <SectionTitle icon={SlidersHorizontal} title={copy.options.languageTitle} />
          <p className="mt-[var(--ds-space-3)] text-[length:var(--ds-font-body)] leading-[var(--ds-line-body)] text-[color:var(--ds-color-text-muted)]">
            {copy.options.languageDescription}
          </p>
          <div className="mt-[var(--ds-space-3)] flex flex-wrap gap-[var(--ds-space-2)]">
            {APP_LOCALE_OPTIONS.map((option) => (
              <Button
                aria-pressed={locale === option.locale}
                key={option.locale}
                size="sm"
                variant={locale === option.locale ? 'primary' : 'secondary'}
                onClick={() => {
                  void setLocale(option.locale);
                }}
              >
                {option.nativeLabel}
              </Button>
            ))}
          </div>
        </Panel>
      </div>
    </SurfaceRoot>
  );
}
