---
schema_version: 1.0.0
revision: 1
decision:
  id: ADR-001
  title: Adopt an upstream-safe Cloudflare modular monolith
  status: accepted
  context: Agentic Inbox needs multiple configured addresses, dependable AI drafting, maintainable downstream customization, and a reversible pristine-upstream recovery path while remaining simple for one operator.
  drivers:
    - upstream-mergeability
    - provider-replaceability
    - mailbox-safety
    - operational-simplicity
    - reversible-deployment
  considered_option_ids:
    - OPT-001
    - OPT-002
    - OPT-003
    - OPT-004
    - OPT-005
  selected_option_id: OPT-001
  decision: Use a modular monolith with explicit ports and adapters, Cloudflare-first email transport, OpenAI API through Cloudflare AI Gateway as the quality path, Workers AI as a configurable fallback, automated upstream refresh gates, and a separately isolated pristine-upstream recovery Worker.
  positive_consequences:
    - Custom behavior has explicit ownership and provider seams while retaining one primary deployment.
    - Upstream updates, staging promotion, and recovery become repeatable operational workflows.
    - Cloudflare Email Service avoids unnecessary Gmail OAuth complexity when Cloudflare is the mail system of record.
  negative_consequences:
    - Module boundaries and adapter contracts require ongoing discipline.
    - OpenAI API usage requires separate billing and budget controls from a personal ChatGPT subscription.
    - The recovery Worker needs isolated resources and compatibility checks rather than immediate shared mailbox state.
  assumptions:
    - One operator remains the primary authorization scope.
    - Cloudflare Email Service routing and sending are acceptable transport boundaries for the target domains.
    - The current Durable Object and R2 mailbox data model remains the application store.
    - EmDash integration can wait until the core mailbox and AI path are reliable.
  validation_criteria:
    - An upstream refresh reports conflicts before promotion and leaves the prior downstream deployment available.
    - AI model selection is configuration-driven, tool-calling works, and provider/verifier failure preserves a usable draft.
    - Staging handles every configured address, inbound mail, attachments, threads, drafts, and explicit-send approval before target-domain cutover.
    - The pristine-upstream Worker is access-protected and isolated from production Durable Object and R2 state.
    - EmDash, when implemented, uses a capability-scoped adapter without direct database coupling.
  supersedes: []
---

# ADR-001: Adopt an upstream-safe Cloudflare modular monolith

## Context

Agentic Inbox is already a single Cloudflare Worker, but AI behavior is hard-coded and has a draft-preservation failure path. The requested outcome is a high-quality, maintainable inbox for several addresses that can follow upstream and still be replaced temporarily by a pristine upstream deployment for debugging or disaster recovery.

## Drivers

The decision is governed by upstream mergeability, provider replaceability, mailbox safety, operational simplicity, and reversible deployment for one operator.

## Considered options

- `OPT-001` — Modular Monolith: retain one Worker while separating mailbox policy, AI orchestration, transport, access, integrations, and operations behind interfaces.
- `OPT-002` — Hexagonal Architecture: maximize provider portability through ports and adapters, with more abstraction than every current path requires.
- `OPT-003` — Layered Architecture: minimize migration cost, with weaker guarantees that provider and upstream boundaries remain explicit.
- `OPT-004` — Service-Oriented Architecture: deploy AI and mailbox services independently, adding networking, authentication, migration, and release burden.
- `OPT-005` — No pattern: continue modifying upstream directly, which minimizes immediate work but leaves merges and recovery fragile.

## Decision

Select `OPT-001`. Keep custom work on a downstream branch with `upstream/main` as the pristine tracking ref. Build an automated refresh pipeline that applies or rebases the downstream patch set, reports conflicts, runs quality gates, deploys staging, and requires explicit promotion. Maintain a separately access-protected pristine-upstream Worker with isolated state.

Within that monolith, use explicit ports and adapters. Route the quality-oriented AI path through the OpenAI API via Cloudflare AI Gateway, retain Workers AI as a configurable fallback, move model selection into configuration, preserve drafts on verifier/provider failures, and keep tool use subordinate to mailbox policy. Use Cloudflare Email Service as the staged inbound/outbound transport boundary and keep application Durable Objects/R2 as the mailbox store. Defer Gmail OAuth unless Gmail becomes authoritative. Add EmDash later through a narrow one-way plugin/API adapter.

## Consequences

The design keeps deployment and operations proportionate to one operator while creating test seams for OpenAI, Workers AI, Cloudflare Email Service, local assistants, and future integrations. It also makes provider cost and availability explicit: a personal ChatGPT subscription does not pay for OpenAI API calls. The main liabilities are the discipline required to preserve boundaries, the extra isolated recovery configuration, and the need to validate Cloudflare Email Service limits and DNS cutover before migration.

## Validation

The implementation handoff defines observable checks for upstream refresh conflicts, provider selection and fallback, tool-calling, prompt injection, draft preservation, inbound delivery for both domains, attachments, threading, explicit-send approval, rollback, recovery isolation, and secret leakage.
