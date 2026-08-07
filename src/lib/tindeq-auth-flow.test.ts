import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workspaceSource = readFileSync("src/app/tindeq/TindeqWorkspace.tsx", "utf8");
const guardSource = readFileSync("src/app/tindeq/TindeqEnvironmentGuard.tsx", "utf8");
const sessionSource = readFileSync("src/lib/use-supabase-session.ts", "utf8");

test("Tindeq magic link uses the current browser origin and fixed /tindeq path", () => {
  assert.match(
    workspaceSource,
    /emailRedirectTo:\s*new URL\("\/tindeq",\s*window\.location\.origin\)\.toString\(\)/,
  );
  assert.match(workspaceSource, /shouldCreateUser:\s*false/);
});

test("redirect logic does not trust a manipulated next query parameter", () => {
  assert.doesNotMatch(workspaceSource, /searchParams|get\(["']next["']\)|URLSearchParams/);
  assert.doesNotMatch(guardSource, /get\(["']next["']\)|URLSearchParams/);
});

test("Tindeq auth source does not hardcode Workout or one preview hostname", () => {
  assert.doesNotMatch(workspaceSource, /app\.vankotraining\.cz/);
  assert.doesNotMatch(workspaceSource, /https:\/\/[^\s"']+\.vercel\.app/);
});

test("environment guard permits only Knee production, localhost and Knee previews on /tindeq", () => {
  assert.match(guardSource, /hostname === "knee\.vankotraining\.cz"/);
  assert.match(guardSource, /hostname\.startsWith\("vankotraining-knee-"\)/);
  assert.match(guardSource, /pathname === "\/tindeq" \|\| pathname\.startsWith\("\/tindeq\/"\)/);
  assert.match(guardSource, /isTindeqPath && \(isProduction \|\| isLocal \|\| isVercelPreview\)/);
});

test("session callback updates protected-route state and unsubscribes", () => {
  assert.match(sessionSource, /supabase\.auth\.getSession\(\)/);
  assert.match(sessionSource, /supabase\.auth\.onAuthStateChange/);
  assert.match(sessionSource, /setState\(nextSession \? "signed-in" : "signed-out"\)/);
  assert.match(sessionSource, /subscription\.unsubscribe\(\)/);
});

test("signed-out workspace returns the auth gate before ZIP and athlete UI", () => {
  const gateIndex = workspaceSource.indexOf('if (authState === "signed-out")');
  const workspaceIndex = workspaceSource.indexOf('className={styles.workspace}');
  assert.ok(gateIndex >= 0 && workspaceIndex > gateIndex);
  assert.match(workspaceSource.slice(gateIndex, workspaceIndex), /Přihlášení do Knee Data/);
});
