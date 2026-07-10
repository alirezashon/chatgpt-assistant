export const BILLING_DECISION = {
  billingOwner: 'stripe-billing',
  entitlementOwner: 'workspace-backend',
  rejectedOwners: ['chrome-web-store-payments', 'custom-billing-only', 'lemon-squeezy-first'],
  summary:
    'Use Stripe Billing for checkout, invoices, subscriptions, taxes, and customer portal. Use a small backend only for identity, entitlement lookup, license refresh, and webhook handling.',
} as const;

export const PREMIUM_AI_PROVIDER_DECISION = {
  firstFlow: 'user-api-key-first',
  futureFlow: 'hosted-api-after-billing-controls',
  summary:
    'Support user-owned provider API keys first so premium AI can launch without absorbing model usage cost. Add hosted AI later after billing, quotas, privacy review, and abuse controls exist.',
} as const;

export const FREE_PLAN_GUARANTEES = {
  accountRequired: false,
  guaranteedFeatureIds: [
    'folder-management',
    'conversation-assignment',
    'basic-search',
    'favorites',
    'local-persistence',
  ] as const,
  summary: 'Core local organization features stay free, local-first, and account-free.',
} as const;
