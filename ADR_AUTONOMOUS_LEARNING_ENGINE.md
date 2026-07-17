# ADR-026: Autonomous Learning and Continuous Improvement Engine

## Status

Accepted

## Context

The platform needs to improve agent decisions, workflow execution, prompt quality, tool selection, model routing, personalization, automation recommendations, and policy suggestions without changing application code or retraining foundation models automatically. Learning must be explainable, auditable, reversible, opt-in, privacy-preserving, and resistant to feedback poisoning.

The runtime already contains separate systems for AI routing, workflows, memory, knowledge, observability, security, enterprise governance, and multi-agent coordination. The learning layer must observe outcomes across those systems and produce recommendations or staged policy updates through controlled deployment workflows.

## Decision

Implement a new `src/runtime/learning` package using a versioned pipeline architecture:

1. Collect trust-weighted signals from user feedback, workflow outcomes, model/tool performance, retrieval quality, latency, cost, and corrections.
2. Validate and normalize signals before feature extraction.
3. Store immutable signals, derived features, recommendations, experiments, learned profiles, and deployment records in a learning store.
4. Produce explainable recommendations for personalization, prompts, model routing, tools, workflows, knowledge, memory, and policies.
5. Require evidence and confidence thresholds before promotion.
6. Deploy learned behavior as reversible policy versions, not direct code changes or model retraining.
7. Support experiments, canary rollout, shadow evaluation, A/B testing, feature flags, and automatic rollback on regression.
8. Enforce privacy controls including opt-in, retention, export/delete, scope isolation, and data minimization.

## Alternatives

### Direct Online Reinforcement Learning

Rejected. It could adapt quickly but is too risky for a browser extension platform because poisoned feedback or sparse reward signals could mutate behavior opaquely.

### Batch Analytics Only

Rejected. Safe and easy to audit, but too slow for personalization, routing improvements, and prompt comparison.

### Feature-Specific Learning Modules

Rejected. Each feature would learn in a different way, causing inconsistent privacy controls, duplicated experiment logic, and weak explainability.

### Foundation Model Fine-Tuning Loop

Rejected. The RFC explicitly forbids automatic foundation model retraining. Fine-tuning also creates privacy, rollback, and model governance concerns.

### Centralized Versioned Learning Platform

Accepted. It provides one auditable pipeline, one privacy model, one experiment model, and reversible deployment records while allowing specialized optimizers to evolve independently.

## Trade-Offs

- The runtime starts with deterministic scoring and recommendations instead of opaque ML models.
- More metadata is stored per learning decision, but every recommendation can explain its evidence and rollback path.
- Automatic adoption is intentionally conservative; many outputs require user or administrator review.
- Per-user and per-organization learning require strict scope handling and deletion/export paths.

## Consequences

- Future features emit signals instead of embedding their own learning loops.
- Prompt, model, workflow, and policy changes are recommendations or versioned deployments.
- Experiments can be promoted, paused, or rolled back without application code changes.
- Security reviews can inspect trust scores, poisoning flags, evidence, and decision history.

## Future Migration Plan

The initial implementation uses an in-memory store suitable for extension runtime tests and local execution. It can migrate to durable local storage, encrypted enterprise storage, or federated aggregation by preserving the typed store contract and event schema. Future on-device models may generate richer features, but they must write the same explainability and rollback metadata.
