# Agentic Inbox Project Context

## User intent

Maintain a downstream Agentic Inbox that tracks Cloudflare upstream safely, accepts several configured email addresses, provides dependable agent-assisted drafting, and can be replaced by a pristine upstream deployment for recovery or debugging. The preferred operating model is one operator with the best practical AI quality and a Cloudflare-first mail path.

## Repository evidence

- The checkout is `main` at tag `0.1.2`, tracking `upstream/main`; `assets/` is currently untracked and must be preserved.
- The application is a single Cloudflare Worker with React, Hono, Durable Objects, SQLite, R2, Workers AI, Email Service, Access, and MCP. `wrangler.jsonc` currently configures `busser.mba`, `avery@unixgreybeard.org`, and `inbox.busser.mba`.
- `workers/agent/index.ts` hard-codes a Workers AI model, while `workers/lib/ai.ts` has a verifier failure path that returns an empty body. `workers/index.ts` already owns inbound parsing, mailbox persistence, attachments, threading, and outbound transport.
- The mailbox store is the repository’s Durable Object and R2 data; Cloudflare Email Service is the routing and sending boundary. This is an implementation inference from static source inspection and platform documentation, not a parser-verified fact.
- The supplied EmDash URL is a WordPress importer. Public EmDash plugin documentation indicates that a capability-scoped plugin and API route can provide a later, one-way integration without sharing the inbox database.

## Approved direction

Adopt a modular monolith with explicit ports and adapters. Keep upstream provenance and downstream customization separate, automate upstream refresh and quality gates, deploy an access-protected pristine-upstream recovery Worker with isolated state, use OpenAI API through Cloudflare AI Gateway as the quality path, retain Workers AI as a configurable fallback, and migrate the target mailbox to Cloudflare Email Service only after staging tests pass.

## Constraints and assumptions

- A personal ChatGPT subscription does not fund OpenAI API usage; production OpenAI calls require separately managed API billing.
- Cloudflare Email Service is treated as transport, not as a complete hosted mailbox product; the application remains responsible for mailbox UI and persistence.
- Gmail OAuth is out of scope while Cloudflare Email Service is the system of record. Reconsider it only if Gmail becomes authoritative again.
- Sending remains an explicit user-approved action. AI may draft and organize, but must not silently send.
- One operator is the current authorization scope. Future multi-user access requires an explicit authorization decision rather than an incidental route change.
- No production DNS, Cloudflare resource, email-routing, secret, or deployment mutation is part of this architecture handoff.

## Evidence limits

Evidence was collected through bounded static reads. The repository snapshot utility was blocked by the repository safety hook, and application code was not executed, built, tested, or dynamically inspected. Generated code, reflection, runtime configuration, and omitted files may change the implementation assessment.
