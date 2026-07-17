# ADR: AI Platform Marketplace And Developer Ecosystem

## Status

Accepted

## Context

The platform needs an ecosystem where developers, companies, and internal teams can build, publish,
distribute, install, update, monetize, and monitor plugins, agents, workflows, commands, connectors,
AI tools, templates, and knowledge packs. This is not a plugin list; it is the economy layer of the
AI browser platform.

## Architectures Considered

### 1. Centralized Marketplace

Strong discovery, monetization, trust ranking, analytics, and security enforcement. Accepted as the
public distribution channel.

### 2. Open Plugin Registry

Great developer freedom but weak trust and review. Accepted only as a package format inspiration.

### 3. Enterprise Private Marketplace

Required for internal tools, approved apps, and organization-only distribution. Accepted.

### 4. Federated Marketplace

Useful for future regional/private catalogs, but harder to secure and rank. Deferred.

### 5. Package Registry Model

Excellent for semantic versioning, dependencies, rollback, and CLI workflows. Accepted.

### 6. App Store Model

Strong review, monetization, and user trust. Accepted for publishing workflow and policy controls.

### 7. Web Extension Store Model

Relevant for permission review, malware scanning, and staged approvals. Accepted for security
pipeline design.

## Decision

Use a hybrid centralized marketplace + package registry + enterprise private marketplace:

- packages have manifests, permissions, dependencies, assets, docs, configuration, version metadata,
  and compatibility constraints.
- developers publish versions through a security pipeline: static analysis, permission review,
  dependency scan, malware detection, AI behavior testing, sandbox execution, and human review gates.
- approved versions become catalog listings with categories, ratings, reviews, compatibility,
  security score, trust rank, and monetization metadata.
- enterprise organizations can approve public packages or publish private packages.
- runtime installation supports install, enable, disable, update, rollback, remove, dependencies,
  permission conflicts, and migrations.
- analytics, metering, revenue, invoices, payouts, ratings, reviews, abuse reports, and security
  reports are first-class marketplace records.

## Trade-Offs

- More workflow state than a direct install flow, but necessary for security and monetization.
- Trust ranking requires enough signals to mature over time.
- In-memory stores are used now for deterministic local runtime tests; persistent stores can be
  added behind the same boundaries.

## Consequences

- Developers can publish through a real pipeline.
- Users can trust packages through visible security, identity, permission, popularity, and feedback
  signals.
- Enterprises can isolate approved/internal apps.
- Updates and rollback are modeled from day one.
- Monetization and developer analytics can scale without redesigning package primitives.

## Future Migration Plan

- Add CDN-backed package storage and signed artifact verification.
- Add hosted developer portal UI over the same runtime APIs.
- Add external payment processor and payout adapters.
- Add vector-backed recommendations and abuse-detection models.
- Add federated catalog replication for private cloud and on-premise deployments.
