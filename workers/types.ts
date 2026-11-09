// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

export interface Env extends Cloudflare.Env {
	POLICY_AUD: string;
	TEAM_DOMAIN: string;
	AI: NonNullable<Cloudflare.Env["AI"]>;
	BUCKET: NonNullable<Cloudflare.Env["BUCKET"]>;
	EMAIL: NonNullable<Cloudflare.Env["EMAIL"]>;
	MAILBOX: NonNullable<Cloudflare.Env["MAILBOX"]>;
	EMAIL_AGENT: NonNullable<Cloudflare.Env["EMAIL_AGENT"]>;
	EMAIL_MCP: NonNullable<Cloudflare.Env["EMAIL_MCP"]>;
	DOMAINS: Cloudflare.Env["DOMAINS"];
	EMAIL_ADDRESSES: Cloudflare.Env["EMAIL_ADDRESSES"];
}
