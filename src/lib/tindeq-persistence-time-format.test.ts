import assert from "node:assert/strict";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { importTindeqArchive } from "./tindeq-browser.js";
import { mapTindeqSessionToInsert, saveTindeqSessions } from "./tindeq-persistence.js";
import { fileFromBytes, syntheticTindeqZip } from "./tindeq-test-fixture.js";

const athleteId = "11111111-1111-4111-8111-111111111111";

test("semantic duplicate fallback accepts equivalent timestamp text formats", async () => {
  const result = await importTindeqArchive(
    fileFromBytes("session.zip", syntheticTindeqZip()),
  );
  const session = result.sessions[0];
  const payload = mapTindeqSessionToInsert(session, athleteId);
  const legacyExisting = {
    ...payload,
    id: "db-legacy",
    imported_at: "2026-08-01T10:00:00.000Z",
    created_at: "2026-08-01T10:00:00.000Z",
    measured_at: payload.measured_at.replace(".000Z", "+00:00"),
    source_filename: "older-export-name.zip",
    raw_metadata: {
      ...payload.raw_metadata,
      tindeqSessionId: "aaaaaaaaaaaaaaaaaaaa",
    },
  };

  const inserted: unknown[] = [];
  const duplicateResponses: unknown[][] = [[], [legacyExisting]];
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
              return { data: duplicateResponses.shift() ?? [], error: null };
            },
          };
          return chain;
        },
        insert(value: unknown) {
          inserted.push(value);
          return {
            select() {
              return {
                async single() {
                  return { data: null, error: { message: "unexpected insert" } };
                },
              };
            },
          };
        },
      };
    },
  } as unknown as SupabaseClient;

  const saveResult = await saveTindeqSessions(client, [session], athleteId);
  assert.equal(saveResult[0].ok, true);
  if (saveResult[0].ok) assert.equal(saveResult[0].duplicate, true);
  assert.equal(inserted.length, 0);
});
