import assert from "node:assert/strict";
import test from "node:test";
import {
  extractSupabaseProjectRef,
  TINDEQ_DEVELOPMENT_SUPABASE_REF,
  TINDEQ_PRODUCTION_SUPABASE_REF,
  validateTindeqEnvironment,
} from "./tindeq-environment.js";

const prodUrl = `https://${TINDEQ_PRODUCTION_SUPABASE_REF}.supabase.co`;
const devUrl = `https://${TINDEQ_DEVELOPMENT_SUPABASE_REF}.supabase.co`;

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
