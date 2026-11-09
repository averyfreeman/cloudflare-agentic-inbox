# Architecture-Driven Implementation Plan

## Accepted decisions

- `ADR-001`: adopt an upstream-safe modular monolith with ports and adapters, Cloudflare-first email transport, provider-configurable AI, and an isolated pristine-upstream recovery path.
- Architecture contract revision `1`: mailbox policy owns the workflows; AI, email, access, integrations, and operations are replaceable boundaries.
- This is a coding handoff. The architect workflow records the approved design but does not change application source, infrastructure, DNS, secrets, or deployments.

## Milestones

### M0 — Establish provenance, refresh, and recovery controls

- Outcome: custom work is isolated from upstream, and a refresh can produce an auditable downstream result.
- Scope: Git refs and branch workflow; upstream fetch/rebase or patch application; CI quality gates; staging and recovery Worker configuration; isolated Durable Object migrations and R2 buckets or prefixes.
- Constraints: preserve `upstream/main`; create downstream work on `codex/agentic-inbox-custom`; preserve the existing untracked `assets/`; recovery must be access-protected and must not share production state. (`ADR-001`, contract `reversible-operations`)
- Dependencies: confirmed upstream repository/ref; chosen Cloudflare account and separate recovery resource names.
- Verification: refresh a clean checkout; demonstrate a no-conflict run and a synthetic conflict report; verify recovery bindings are distinct; exercise a documented promotion and rollback rehearsal without touching production mail.

### M1 — Introduce configuration and provider ports

- Outcome: model, gateway, domains, addresses, and transport settings are configuration-driven and provider adapters are independently testable.
- Scope: `workers/lib/ai.ts`, `workers/agent/index.ts`, mailbox configuration, Wrangler environment configuration, and adapter/interface modules.
- Constraints: mailbox-domain code cannot import OpenAI, Workers AI, or transport SDK details; use OpenAI API through Cloudflare AI Gateway as the primary quality route and Workers AI as a fallback. (`ADR-001`, contract `provider-replaceability`)
- Dependencies: M0 environment separation; secret names and gateway route chosen without storing values in the repository.
- Verification: unit tests for adapter selection, configuration validation, timeout/retry behavior, and provider fallback; static secret scan; verify no hard-coded deprecated model remains in the application path.

### M2 — Restore dependable AI drafting and safety behavior

- Outcome: tool-calling produces useful drafts, provider/verifier failures preserve the original draft, and hostile email content cannot expand authority.
- Scope: prompt/tool orchestration, injection detection, draft verification, draft persistence, chat-state logging, retry/backoff, and idempotent new-mail processing.
- Constraints: AI drafts only; explicit-send approval remains required; verification failure preserves a usable draft and never an empty body; redact prompts, message content, and credentials from logs. (`ADR-001`, contract `mailbox-safety`)
- Dependencies: M1 provider ports and representative fixtures.
- Verification: model tool-calling tests; provider timeout/error and verifier failure tests; prompt-injection fixtures; draft-preservation assertions; duplicate inbound event tests; secret-leakage tests; attachment and thread-context tests.

### M3 — Expand addresses and migrate transport in stages

- Outcome: multiple configured addresses work through the inbox, first on `busser.mba`, then for `avery@unixgreybeard.org` after explicit promotion.
- Scope: `wrangler.jsonc`, inbound recipient selection, Cloudflare Email Service routes, outbound sender validation, attachments, threading, drafts, and explicit-send flows.
- Constraints: stage inbound, attachment, threading, draft, and outbound tests before DNS/mail cutover; account for Workers Paid requirements and documented size/rate limits; preserve idempotent processing and delivery outcomes. (`ADR-001`, contract `email-transport`)
- Dependencies: M2 passing; Cloudflare Email Service route/DNS changes approved separately; verified outbound destinations and sender policy.
- Verification: delivery matrix for every configured address and both domains; attachment-size and malformed-message cases; thread continuity; send-approval audit; inbound duplicate and retry cases; rollback to the prior route.

### M4 — Harden access, operations, and observability

- Outcome: the one-operator deployment is diagnosable and has safe promotion, rollback, and mailbox recovery procedures.
- Scope: Access policy checks, mailbox authorization seam, redacted structured logs, metrics/traces through the gateway and Worker, backups/export checks, runbooks, and CI/CD promotion gates.
- Constraints: do not imply per-mailbox authorization until implemented; never log tokens, refresh credentials, message bodies, or API keys; production promotion requires explicit approval and a tested rollback target. (`ADR-001`, contract `access-boundary`, `operations`)
- Dependencies: M0–M3.
- Verification: unauthorized request tests; secret scanning; failure-mode dashboards or log queries; backup/restore drill; rollback deployment drill; recovery Worker smoke test.

### M5 — Add EmDash as a later one-way adapter

- Outcome: selected inbox data can create EmDash content or notifications through a least-privilege plugin/API boundary.
- Scope: EmDash plugin, capability-scoped API route, allowlisted outbound host, authentication, selected read model, and retry/idempotency behavior.
- Constraints: no direct Agentic Inbox database coupling and no bidirectional synchronization in the first release. (`ADR-001`, contract `integration-adapters`)
- Dependencies: Q-002 answered; core mailbox and security milestones complete; EmDash plugin deployment access available.
- Verification: contract tests against a local/staging endpoint; authorization and replay tests; failure queue/retry tests; verify no raw mailbox schema is exposed.

## Cross-cutting constraints

- Keep the single-Worker operational shape unless measured scale or fault isolation creates a new approved decision. (`ADR-001`)
- Treat Cloudflare Email Service as transport and the application Durable Objects/R2 as mailbox storage. (`ADR-001`, project context)
- Keep AI, email, EmDash, and local-assistant integrations behind adapters; local assistants may consume a deliberately scoped API/MCP surface only. (contract `dependency_rules`)
- Use bounded retries with backoff and idempotency keys for model calls and inbound/outbound processing. (contract `required_practices`)
- Keep AI-generated content untrusted; tool permissions and explicit-send approval are application policy. (contract `mailbox-safety`)
- Manage OpenAI API billing separately from ChatGPT; do not represent a personal ChatGPT subscription as an API funding mechanism.
- Do not create Gmail OAuth credentials while Cloudflare Email Service is authoritative. If Gmail becomes authoritative, make that a new ADR covering scopes, refresh-token storage, verification, and dual-delivery migration.
- Keep staging, production, and pristine recovery namespaces, bindings, and secrets distinguishable and separately access-controlled.
- The full test plan includes tool calling, provider failure, prompt injection, draft preservation, inbound delivery for both domains, attachments, threading, explicit-send approval, rollback deployment, and secret leakage.

## Explicit non-goals

- No application source modification, deployment, DNS cutover, Cloudflare mutation, email send, or secret creation in this architecture-recording step.
- No Google Workspace/Gmail OAuth migration while Cloudflare Email Service is the system of record.
- No service-oriented split into independently deployed AI and mailbox services.
- No direct EmDash database/schema sharing or first-release bidirectional synchronization.
- No automatic sending based solely on model output.
- No claim that Workers AI or a third-party subscription is an unlimited substitute for separately budgeted production API usage.

## Unresolved questions

- `Q-001` — Which OpenAI model, gateway budget, and fallback thresholds win the representative quality/cost evaluation? Blocks final M1/M2 production configuration.
- `Q-002` — Which EmDash fields and events are valuable for the first plugin? Blocks M5 API and capability design.
- Before M3 promotion, confirm the DNS/routing cutover window, verified outbound destinations, and acceptable Cloudflare Email Service limits for the mailbox workload.
