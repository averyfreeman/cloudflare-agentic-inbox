import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const repository = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = new Set(process.argv.slice(2));

if (args.has("--help")) {
	console.log(`Usage:
  node scripts/upstream-refresh.mjs                 Check upstream/main in a temporary worktree
  node scripts/upstream-refresh.mjs --apply         Apply a conflict-free upstream/main merge
  node scripts/upstream-refresh.mjs --simulate-conflict  Exercise the conflict report`);
	process.exit(0);
}

if (args.has("--apply") && args.has("--simulate-conflict")) {
	fail("--apply and --simulate-conflict cannot be combined");
}

function fail(message) {
	console.error(`Upstream refresh stopped: ${message}`);
	process.exitCode = 1;
}

function git(gitArgs, cwd = repository) {
	return execFileSync("git", gitArgs, {
		cwd,
		encoding: "utf8",
		stdio: ["ignore", "pipe", "pipe"],
	});
}

function gitStatus() {
	return git(["status", "--porcelain=v1"])
		.split("\n")
		.map((line) => line.trimEnd())
		.filter(Boolean);
}

function assertRefreshableWorktree() {
	const unexpected = gitStatus().filter((line) => {
		if (!line.startsWith("?? ")) return true;
		const path = line.slice(3);
		return path !== ".ai-architect/" && !path.startsWith(".ai-architect/") && path !== "assets/" && !path.startsWith("assets/");
	});

	if (unexpected.length > 0) {
		throw new Error(
			`worktree has changes outside the preserved plan/assets paths:\n${unexpected.join("\n")}`,
		);
	}
}

function runConflictCheck(cwd, upstreamRef) {
	const result = spawnSync(
		"git",
		["merge", "--no-commit", "--no-ff", upstreamRef],
		{ cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
	);
	const conflicts = git(["diff", "--name-only", "--diff-filter=U"], cwd)
		.split("\n")
		.filter(Boolean);

	if (result.status === 0 && conflicts.length === 0) {
		return { ok: true, conflicts: [] };
	}

	spawnSync("git", ["merge", "--abort"], {
		cwd,
		encoding: "utf8",
		stdio: ["ignore", "pipe", "pipe"],
	});
	return { ok: false, conflicts };
}

function checkUpstream() {
	git(["remote", "get-url", "upstream"]);
	git(["fetch", "--quiet", "upstream", "main"]);

	const worktree = mkdtempSync(join(tmpdir(), "agentic-inbox-upstream-"));
	try {
		git(["worktree", "add", "--detach", "--quiet", worktree, "HEAD"]);
		const report = runConflictCheck(worktree, "upstream/main");
		if (!report.ok) {
			throw new Error(
				`upstream/main conflicts with the current branch in:\n${report.conflicts.join("\n") || "unknown files"}`,
			);
		}
		console.log("Upstream refresh check passed in a temporary worktree.");
	} finally {
		spawnSync("git", ["worktree", "remove", "--force", worktree], {
			cwd: repository,
			encoding: "utf8",
			stdio: ["ignore", "pipe", "pipe"],
		});
		rmSync(worktree, { recursive: true, force: true });
	}
}

function applyUpstream() {
	checkUpstream();
	assertRefreshableWorktree();
	git(["merge", "--no-edit", "upstream/main"]);
	console.log("Applied the conflict-free upstream/main merge.");
}

function simulateConflict() {
	const worktree = mkdtempSync(join(tmpdir(), "agentic-inbox-conflict-"));
	try {
		git(["init", "--quiet", "--initial-branch=main"], worktree);
		git(["config", "user.email", "codex@example.invalid"], worktree);
		git(["config", "user.name", "Upstream refresh check"], worktree);
		writeFileSync(join(worktree, "conflict.txt"), "base\n");
		git(["add", "conflict.txt"], worktree);
		git(["commit", "--quiet", "-m", "base"], worktree);
		git(["branch", "upstream"], worktree);
		git(["branch", "downstream"], worktree);
		git(["switch", "--quiet", "upstream"], worktree);
		writeFileSync(join(worktree, "conflict.txt"), "upstream\n");
		git(["commit", "--quiet", "-am", "upstream"], worktree);
		git(["switch", "--quiet", "downstream"], worktree);
		writeFileSync(join(worktree, "conflict.txt"), "downstream\n");
		git(["commit", "--quiet", "-am", "downstream"], worktree);

		const report = runConflictCheck(worktree, "upstream");
		if (report.ok || report.conflicts.length !== 1 || readFileSync(join(worktree, "conflict.txt"), "utf8") !== "downstream\n") {
			throw new Error("synthetic conflict report did not detect the expected conflict");
		}
		console.log(`Synthetic conflict report passed: ${report.conflicts[0]}`);
	} finally {
		rmSync(worktree, { recursive: true, force: true });
	}
}

try {
	if (args.has("--simulate-conflict")) {
		simulateConflict();
	} else if (args.has("--apply")) {
		applyUpstream();
	} else {
		checkUpstream();
	}
} catch (error) {
	fail(error instanceof Error ? error.message : String(error));
}
