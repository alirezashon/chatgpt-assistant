# Monetization Decisions

Last updated: 2026-07-10

This file records product decisions that shape the paid launch. The goal is to keep Free Local
useful while making future paid features financially sustainable.

## Decision: First Paid Launch Model

The first paid launch should be subscription-only.

Supported launch plans:

- Monthly Pro subscription.
- Annual Pro subscription with a discount.

Deferred plans:

- Lifetime licenses.
- One-time perpetual licenses.
- Team billing.
- Usage-only AI credit packs as the primary paid model.

## Rationale

The most valuable paid features on the roadmap create recurring cost or recurring maintenance:

- Cloud sync and backups require storage, reliability work, and ongoing support.
- Hosted AI summaries, semantic search, and cleanup workflows require provider usage costs.
- Priority compatibility alerts require monitoring ChatGPT UI changes over time.
- Priority support and diagnostic bundles create ongoing operational work.

A lifetime license is attractive for early buyers, but it can underprice long-running infrastructure
and support obligations. It also makes pricing harder before retention, AI usage, and support load
are measured.

## Product Boundary

Free Local remains account-free and useful:

- Local folders.
- Conversation assignments.
- Basic search.
- Favorites.
- Local persistence.
- Local export and backup basics.

Pro subscription is reserved for features with durable cost, strong professional value, or clear
automation value:

- Cloud sync.
- Scheduled encrypted backups.
- Hosted AI summaries and suggestions.
- Advanced exports.
- Priority support and diagnostics.
- Team or agency workflows later.

## Revisit Criteria

Reconsider lifetime or one-time offers only after at least one paid cohort has enough data for:

- Retention.
- Average support load.
- AI usage cost.
- Sync and backup storage cost.
- Refund rate.
- Conversion from free to Pro.

If a lifetime offer is tested later, it should be a limited founder promotion rather than the default
pricing model.

## Decision: Billing Ownership

Use Stripe Billing for the first paid launch.

Billing split:

- Stripe Billing owns checkout, invoices, subscription lifecycle, taxes, and customer portal.
- A small Workspace backend owns account identity, entitlement lookup, webhook handling, license
  refresh, and offline grace-period policy.

Deferred or rejected for first launch:

- Chrome Web Store payments: rejected because Chrome Web Store payments were deprecated and Google
  directed extension developers to migrate to another payment processor.
- Custom billing only: deferred because it creates unnecessary PCI, invoice, tax, and subscription
  lifecycle work.
- Lemon Squeezy first: deferred as a fallback if merchant-of-record needs outweigh Stripe control.

## Decision: First Premium AI Provider Flow

Support user-owned API keys first. Add hosted API usage later.

Launch sequence:

- First: user provides their own provider API key for premium AI workflows.
- Later: hosted AI usage after billing, quotas, abuse controls, privacy review, and cost visibility
  exist.

Rationale:

- User-owned keys preserve the local-first privacy posture.
- User-owned keys avoid absorbing unknown model usage cost before paid retention is measured.
- Hosted AI can become a stronger Pro feature after the subscription and backend foundation is
  stable.

## Free Plan Guarantees

These features stay free and account-free:

- Local folder management.
- Conversation assignment to folders.

They should not require sign-in, subscription lookup, cloud sync, hosted AI, or billing state.
