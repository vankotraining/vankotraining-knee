import assert from "node:assert/strict";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { importTindeqArchive } from "./tindeq-browser.js";
import { saveTindeqSessions } from "./tindeq-persistence.js";
import { fileFromBytes, syntheticTindeqZip } from "./tindeq-test-fixture.js";

const athleteId = "11111111-1111-4111-8111-111111111111";

async function fixture() {
  const result = await importTindeqArchive(
    fileFromBytes("session.zip", syntheticTindeqZip()),
  );
  return result.sessions[0];
}

function raceClient(duplicateResults: unknown[][]) {
  const duplicateQueries = [...duplicateResults];
  let insertCount = 0;

  const client = {
    from(table: string) {
      assert.equal(table, "tindeq_sessions");
      return {
        select() {
          const chain = {
            eq() { return chain; },
            contains() { return chain; },
            is() { return chain; },
            async limit() {
              return { data: duplicateQueries.shift() ?? [], error: null };
            },
          };
          return chain;
        },
        insert() {
          insertCount += 1;
          return {
            select() {
              return {
                async single() {
                  return {
                    data: null,
                    error: {
                      code: "23505",
                      message: "duplicate key value violates unique constraint",
                      details: null,
                      hint: null,
                    },
                  };
                },
              };
            },
          };
        },
      };
    },
  } as unknown as SupabaseClient;

  return { client, getInsertCount: () => insertCount };
}

test("concurrent unique violation is recovered as an idempotent duplicate", async () => {
  const session = await fixture();
  const existing = { id: "db-race-winner", athlete_id: athleteId };
  const { client, getInsertCount } = raceClient([[], [existing]]);

  const results = await saveTindeqSessions(client, [session], athleteId);

  assert.equal(getInsertCount(), 1);
  assert.equal(results[0].ok, true);
  if (results[0].ok) {
    assert.equal(results[0].duplicate, true);
    assert.deepEqual(results[0].record, existing);
  }
});

test("unresolved unique violation is not mislabeled as a duplicate", async () => {
  const session = await fixture();
  const { client } = raceClient([[], []]);

  const results = await saveTindeqSessions(client, [session], athleteId);

  assert.equal(results[0].ok, false);
  if (!results[0].ok) {
    assert.equal(results[0].error, "duplicate key value violates unique constraint");
  }
});
