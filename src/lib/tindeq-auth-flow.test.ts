import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workspaceSource = readFileSync("src/app/tindeq/TindeqWorkspace.tsx", "utf8");
const guardSource = readFileSync("src/app/tindeq/TindeqEnvironmentGuard.tsx", "utf8");
const sessionSource = readFileSync("src/lib/use-supabase-session.ts", "utf8");
const supabaseSource = readFileSync("src/lib/supabase-browser.ts", "utf8");

test("Tindeq magic link derives its redirect from the current approved browser URL", () => {
  assert.match(
    workspaceSource,
    /const emailRedirectTo = getTindeqMagicLinkRedirect\(window\.location\.href\)/,
  );
  assert.match(workspaceSource, /emailRedirectTo,/);
  assert.match(workspaceSource, /shouldCreateUser:\s*false/);
  assert.match(workspaceSource, /if \(!emailRedirectTo\)/);
});

test("redirect logic does not trust a manipulated next query parameter", () => {
  assert.doesNotMatch(workspaceSource, /searchParams|get\(["']next["']\)|URLSearchParams/);
  assert.doesNotMatch(guardSource, /get\(["']next["']\)|URLSearchParams/);
});

test("Tindeq auth source does not hardcode Workout, localhost, or one preview hostname", () => {
  assert.doesNotMatch(workspaceSource, /app\.vankotraining\.cz/);
  assert.doesNotMatch(workspaceSource, /https:\/\/[^\s"']+\.vercel\.app/);
  assert.doesNotMatch(workspaceSource, /emailRedirectTo:\s*["'`]http:\/\/localhost/);
});

test("environment guard validates both Knee location and configured Supabase project before rendering workspace", () => {
  assert.match(guardSource, /validateTindeqEnvironment\(href, getConfiguredSupabaseUrl\(\)\)/);
  assert.match(guardSource, /if \(!validation\.allowed \|\| !redirectUrl\)/);
  assert.match(guardSource, /modul nenačítá klienty ani neumožní zápis Tindeq dat/);
});

test("preview diagnostics expose origin and computed redirect without query or hash", () => {
  assert.match(guardSource, /const safeLocation = `\$\{currentUrl\.origin\}\$\{currentUrl\.pathname\}`/);
  assert.match(guardSource, /Origin:/);
  assert.match(guardSource, /Magic link z této stránky bude požadovat návrat na:/);
  assert.doesNotMatch(guardSource, /<strong>\{href\}<\/strong>/);
  assert.doesNotMatch(guardSource, /currentUrl\.search|currentUrl\.hash/);
});

test("browser Supabase config has no hardcoded production URL or legacy anon-key fallback", () => {
  assert.doesNotMatch(supabaseSource, /zxvndqicslyulrinbpyn\.supabase\.co/);
  assert.doesNotMatch(supabaseSource, /legacyAnonKey/);
  assert.match(supabaseSource, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(supabaseSource, /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  assert.match(supabaseSource, /NEXT_PUBLIC_SUPABASE_ANON_KEY/);
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
