import assert from "node:assert/strict";
import test from "node:test";
import {
  extractSupabaseProjectRef,
  getTindeqMagicLinkRedirect,
  TINDEQ_DEVELOPMENT_SUPABASE_REF,
  TINDEQ_PRODUCTION_SUPABASE_REF,
  validateTindeqEnvironment,
} from "./tindeq-environment.js";

const prodUrl = `https://${TINDEQ_PRODUCTION_SUPABASE_REF}.supabase.co`;
const devUrl = `https://${TINDEQ_DEVELOPMENT_SUPABASE_REF}.supabase.co`;
const deploymentPreview = "https://vankotraining-knee-9to0jbe71-vankotrainings-projects.vercel.app/tindeq";
const branchPreview = "https://vankotraining-knee-git-agent-tin-d8df0b-vankotrainings-projects.vercel.app/tindeq";

test("extracts the hosted Supabase project ref only from a valid HTTPS project URL", () => {
  assert.equal(extractSupabaseProjectRef(prodUrl), TINDEQ_PRODUCTION_SUPABASE_REF);
  assert.equal(extractSupabaseProjectRef("http://zxvndqicslyulrinbpyn.supabase.co"), null);
  assert.equal(extractSupabaseProjectRef("https://example.com"), null);
  assert.equal(extractSupabaseProjectRef(""), null);
});

test("Knee production accepts only the production Supabase project", () => {
  assert.equal(validateTindeqEnvironment("https://knee.vankotraining.cz/tindeq", prodUrl).allowed, true);
  const mismatch = validateTindeqEnvironment("https://knee.vankotraining.cz/tindeq", devUrl);
  assert.equal(mismatch.allowed, false);
  assert.equal(mismatch.expectedProjectRef, TINDEQ_PRODUCTION_SUPABASE_REF);
  assert.equal(mismatch.actualProjectRef, TINDEQ_DEVELOPMENT_SUPABASE_REF);
});

test("Knee Vercel previews accept only the development Supabase project", () => {
  const href = "https://vankotraining-knee-example-vankotrainings-projects.vercel.app/tindeq";
  assert.equal(validateTindeqEnvironment(href, devUrl).allowed, true);
  const mismatch = validateTindeqEnvironment(href, prodUrl);
  assert.equal(mismatch.allowed, false);
  assert.equal(mismatch.expectedProjectRef, TINDEQ_DEVELOPMENT_SUPABASE_REF);
  assert.equal(mismatch.actualProjectRef, TINDEQ_PRODUCTION_SUPABASE_REF);
});

test("magic-link redirect remains on the exact approved Knee origin", () => {
  assert.equal(
    getTindeqMagicLinkRedirect(deploymentPreview),
    "https://vankotraining-knee-9to0jbe71-vankotrainings-projects.vercel.app/tindeq",
  );
  assert.equal(
    getTindeqMagicLinkRedirect(branchPreview),
    "https://vankotraining-knee-git-agent-tin-d8df0b-vankotrainings-projects.vercel.app/tindeq",
  );
  assert.equal(
    getTindeqMagicLinkRedirect("https://knee.vankotraining.cz/tindeq?source=test#ignored"),
    "https://knee.vankotraining.cz/tindeq",
  );
});

test("localhost is used for magic-link redirect only when the browser is actually local", () => {
  assert.equal(
    getTindeqMagicLinkRedirect("http://localhost:3000/tindeq"),
    "http://localhost:3000/tindeq",
  );
  assert.equal(
    getTindeqMagicLinkRedirect("http://127.0.0.1:3000/tindeq/reports"),
    "http://127.0.0.1:3000/tindeq",
  );
  assert.equal(getTindeqMagicLinkRedirect(deploymentPreview)?.includes("localhost"), false);
  assert.equal(getTindeqMagicLinkRedirect(branchPreview)?.includes("localhost"), false);
});

test("magic-link redirect fails closed for unapproved hosts and paths", () => {
  assert.equal(getTindeqMagicLinkRedirect("https://app.vankotraining.cz/tindeq"), null);
  assert.equal(getTindeqMagicLinkRedirect("https://example.vercel.app/tindeq"), null);
  assert.equal(getTindeqMagicLinkRedirect("https://knee.vankotraining.cz/"), null);
  assert.equal(getTindeqMagicLinkRedirect("not-a-url"), null);
});

test("localhost is development-only", () => {
  assert.equal(validateTindeqEnvironment("http://127.0.0.1:3000/tindeq", devUrl).allowed, true);
  assert.equal(validateTindeqEnvironment("http://localhost:3000/tindeq/reports", prodUrl).allowed, false);
});

test("missing or invalid Supabase configuration fails closed", () => {
  const missing = validateTindeqEnvironment("https://knee.vankotraining.cz/tindeq", "");
  assert.equal(missing.allowed, false);
  assert.equal(missing.actualProjectRef, null);

  const invalid = validateTindeqEnvironment("https://knee.vankotraining.cz/tindeq", "https://example.com");
  assert.equal(invalid.allowed, false);
  assert.equal(invalid.actualProjectRef, null);
});

test("unapproved hostnames and non-Tindeq paths fail closed", () => {
  assert.equal(validateTindeqEnvironment("https://app.vankotraining.cz/tindeq", devUrl).allowed, false);
  assert.equal(validateTindeqEnvironment("https://knee.vankotraining.cz/", prodUrl).allowed, false);
});
