import type { ActionUpgradePrompt } from '@/features/actions/action-types';
import type { PremiumFeatureId } from '@/features/entitlements';
import { getFeatureDefinition } from '@/features/entitlements';

export function createContextualUpgradePrompt(
  featureId: PremiumFeatureId,
  context: 'ai-summary' | 'export-profile' | 'pdf-export',
): ActionUpgradePrompt {
  const feature = getFeatureDefinition(featureId);

  if (context === 'ai-summary') {
    return {
      body: 'Turn long ChatGPT threads into concise briefs with decisions, next steps, and follow-ups.',
      ctaLabel: 'Upgrade for AI summaries',
      title: feature.name,
    };
  }

  if (context === 'export-profile') {
    return {
      body: 'Save repeat client handoff settings once, then reuse formats, folders, tags, and branding.',
      ctaLabel: 'Upgrade for export profiles',
      title: feature.name,
    };
  }

  return {
    body: 'Create polished PDF packets for archiving, reviews, and client handoffs.',
    ctaLabel: 'Upgrade for PDF export',
    title: feature.name,
  };
}
