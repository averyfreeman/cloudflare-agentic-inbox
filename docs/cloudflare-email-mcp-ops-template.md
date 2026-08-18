# Agentic Inbox — Cloudflare MCP Operations Template

Use this template for Cloudflare MCP work on Agentic Inbox. It keeps account discovery, deployment, email routing, Access, and mailbox operations explicit and minimizes unnecessary tool discovery.

## Scope

- Cloudflare account: Averyfreeman@gmail.com's Account
- Account ID: `ea4a1a68f997fc4d394b95cc6af56a6f`
- Primary test domain: `busser.mba`
- Later domain: `unixgreybeard.org`
- First mailbox: `avery@busser.mba`
- Worker name: `agentic-inbox`
- Worker MCP endpoint after deployment: `https://<worker-hostname>/mcp`

## Required MCP operation sequence

1. **Read-only discovery first**
   - List zones with `GET /zones?per_page=100`.
   - Confirm the target zone ID and status.
   - List Workers with `GET /accounts/{account_id}/workers/scripts`.
   - Inspect Email Routing with `GET /zones/{zone_id}/email/routing`.
   - Inspect routing rules with `GET /zones/{zone_id}/email/routing/rules`.
   - Inspect Access applications with `GET /accounts/{account_id}/access/apps`.
   - Inspect R2 with `GET /accounts/{account_id}/r2/buckets`.
   - Inspect email sending limits with `GET /accounts/{account_id}/email/sending/limits`.

2. **Deployment**
   - Prefer the repository's verified `npm run deploy` / Wrangler path for this project because the Worker contains modules, assets, Durable Objects, migrations, R2, Workers AI, and a `send_email` binding.
   - Do not upload a guessed raw Worker script through the API.
   - Verify the deployed Worker by listing Workers and requesting its deployment/details.
   - Confirm the R2 bucket `agentic-inbox`, Durable Object migrations, Workers AI binding, and `EMAIL` send binding.

3. **Cloudflare Access**
   - Create or enable Access protection for the deployed application before exposing it publicly.
   - Record the resulting `aud` / `POLICY_AUD` and team domain / `TEAM_DOMAIN`.
   - Set Worker secrets only after values are verified:
     - `POLICY_AUD`
     - `TEAM_DOMAIN`
   - Never place secrets in `wrangler.jsonc`, git, or this document.
   - Use a restrictive policy allowing only Avery's verified identity initially.

4. **Email Routing**
   - Enable Email Routing for the target zone if it is unconfigured.
   - Confirm Cloudflare-managed MX/DNS records before changing DNS.
   - Create a routing rule sending the target address or catch-all to the Worker.
   - Verify the rule and Email Routing status by reading them back.
   - Do not configure the second domain until the first mailbox passes inbound/outbound testing.

5. **Mailbox and testing**
   - Open the deployed app through Access.
   - Create `avery@busser.mba` in the app.
   - Send a test message from an external address to `avery@busser.mba`.
   - Verify receipt, parsed body, thread, attachment handling, and auto-draft behavior.
   - Send a test reply to a verified destination first, then an arbitrary external recipient only after Email Service sending is enabled.
   - Treat sending, deleting, moving, archiving, or campaign actions as approval-gated mutations.

## Agentic Inbox MCP tools

The deployed `/mcp` endpoint exposes these mailbox tools. Always call `list_mailboxes` first and use the exact returned `mailboxId`.

- `list_mailboxes`
- `list_emails(mailboxId, folder, limit, page)`
- `get_email(mailboxId, emailId)`
- `get_thread(mailboxId, threadId)`
- `search_emails(mailboxId, query, folder?)`
- `draft_reply(mailboxId, originalEmailId, to, subject, bodyHtml)`
- `create_draft(mailboxId, to?, subject, bodyHtml, in_reply_to?, thread_id?)`
- `update_draft(...)`
- `delete_email(mailboxId, emailId)`
- `send_reply(...)`
- `send_email(...)`
- `mark_email_read(mailboxId, emailId, read?)`
- `move_email(mailboxId, emailId, folder)`

For inbox coordination, default to read/search/thread retrieval and drafts. Do not send, delete, move, or archive without explicit approval. For campaigns, add a separate consent and recipient-suppression review; this app is an inbox client, not yet a complete campaign-compliance system.

## Compact prompt template

> Work on Agentic Inbox in `/Users/avery/build/cloudflare/agentic-inbox` using the Cloudflare MCP. Account ID is `ea4a1a68f997fc4d394b95cc6af56a6f`. Target zone is `busser.mba`, first mailbox `avery@busser.mba`, Worker `agentic-inbox`. Start with read-only discovery of zone, Worker, R2, Email Routing, Access, and Email Service status. Do not mutate Cloudflare or send/delete email until I explicitly approve the proposed changes. Use the repository's Wrangler deployment path, then verify every binding and read back all created resources. For mailbox work, call `list_mailboxes` first, retrieve complete threads, and draft rather than send by default.

## Known prerequisites

- A Cloudflare Workers Paid plan is required for outbound mail to arbitrary recipients; current Cloudflare documentation lists $5/month minimum per account, with 3,000 outbound emails included monthly and $0.35 per additional 1,000.
- Email Routing inbound delivery is available on Free and Paid plans.
- R2 must be enabled in the Cloudflare account before this Worker can provision/use its bucket.
- Cloudflare Access production secrets must be available before the app will serve requests.
- Domain DNS must be controlled by Cloudflare for Email Routing setup.
- A verified destination address is useful for the first safe send test; it does not make the app a full IMAP/SMTP mailbox provider.

## Verification record

Record these after deployment:

- Worker hostname:
- Deployment/version ID:
- Access application ID:
- Access audience (`POLICY_AUD`):
- Access team domain (`TEAM_DOMAIN`):
- R2 bucket status:
- Email Routing status:
- Routing rule ID:
- Mailbox ID:
- Inbound test result:
- Verified-destination outbound test result:
- Arbitrary-recipient outbound test result:
- Remaining blocker:

Never record API tokens, Access service-token secrets, or other credentials here.
