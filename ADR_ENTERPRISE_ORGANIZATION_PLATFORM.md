# ADR: Enterprise Organization Platform

## Status

Accepted

## Context

Companies need to deploy the AI browser platform across organizations, workspaces, teams, users,
agents, workflows, plugins, models, knowledge, billing, and compliance boundaries. This cannot be a
basic user table or dashboard. The enterprise layer must become the operating model for safe,
auditable, multi-tenant use.

## Architectures Considered

### 1. Single Tenant Architecture

Strong isolation and simple compliance, but expensive and operationally heavy for most customers.
Rejected as the only architecture.

### 2. Multi Tenant SaaS Architecture

Efficient, scalable, and commercially practical. Requires strict tenant boundaries and policy
evaluation on every access. Accepted.

### 3. Hybrid Enterprise Cloud

Balances SaaS control plane with customer-controlled data plane. Good for enterprise adoption.
Accepted as the long-term deployment model.

### 4. Organization Workspace Model

Maps naturally to companies, departments, projects, and environments. Accepted as the product and
data model.

### 5. Zero Trust Enterprise Model

Correct security posture for users, agents, plugins, workflows, and integrations. Accepted.

### 6. Federated Identity Architecture

Required for SSO, SAML, OAuth, SCIM, and directory sync. Accepted behind identity adapters.

### 7. Private Deployment Architecture

Required for regulated customers and VPC/on-prem deployments. Accepted as a future deployment target
through control-plane/data-plane separation.

## Decision

Use a hybrid multi-tenant organization workspace architecture:

- organizations are the hard tenant boundary.
- workspaces, teams, projects, environments, resources, roles, policies, audit, usage, billing, and
  knowledge objects are always organization-scoped.
- RBAC supports built-in templates and custom roles.
- enterprise policy controls AI models, providers, data access, plugins, agents, workflows, browser
  permissions, memory, and external integrations.
- audit and metering are append-only per organization.
- admin APIs sit on top of the runtime and enforce RBAC before returning scoped data.
- deployment model separates future control plane from data plane.

## Trade-Offs

- Every operation must carry `organizationId`, which adds ceremony but prevents cross-tenant leaks.
- Policy and RBAC checks add overhead, so in-memory indexes and caches are used at runtime.
- Billing and compliance are implemented as local foundations now, with external adapters later.

## Consequences

- Organizations do not share data.
- Admins can enforce AI governance and plugin/agent/workflow controls.
- Custom roles avoid hardcoded enterprise authorization.
- Billing can meter seats, tokens, AI credits, agents, workflows, plugins, and storage.
- Private deployment and enterprise identity integrations can be added without replacing the model.

## Future Migration Plan

- Add encrypted persistent stores partitioned by organization.
- Add SSO/SAML/OAuth/SCIM adapters behind the identity interfaces.
- Add external billing provider adapters.
- Add audit export destinations and compliance report templates.
- Add control-plane/data-plane deployment packaging for private cloud, VPC, and on-premise.
