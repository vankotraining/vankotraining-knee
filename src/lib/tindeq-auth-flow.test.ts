import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workspaceSource = readFileSync(
  "src/app/tindeq/TindeqWorkspace.tsx",
  "utf8",
);

test("Tindeq magic link uses the current browser origin", () => {
  assert.match(
    workspaceSource,
    /emailRedirectTo:\s*new URL\("\/tindeq",\s*window\.location\.origin\)\.toString\(\)/,
  );
});

test("Tindeq magic link explicitly returns to /tindeq", () => {
  assert.match(workspaceSource, /new URL\("\/tindeq",/);
});

test("Tindeq magic link does not create new users", () => {
  assert.match(workspaceSource, /shouldCreateUser:\s*false/);
});

test("Tindeq auth source does not hardcode the Workout hostname", () => {
  assert.doesNotMatch(workspaceSource, /app\.vankotraining\.cz/);
});

test("Tindeq auth source does not hardcode a Vercel preview hostname", () => {
  assert.doesNotMatch(workspaceSource, /https:\/\/[^\s"']+\.vercel\.app/);
});
