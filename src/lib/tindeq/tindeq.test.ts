import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { strToU8, zipSync } from "fflate";
import { analyzeTindeqExport } from "./analysis";
import { requireTindeqUser } from "./auth";
import { normalizeAthleteTag } from "./csv";
import { TindeqImportError } from "./errors";
import { importTindeqFile } from "./import-service";
import { parseTindeqZip } from "./parser";
import { validateClinicalScale } from "./validation";

function dataCsv(endSeconds = 5, includeRelaxation = true) {
  const rows = ["time;left;right"];
  const step = 0.02;
  const total = includeRelaxation ? endSeconds + 1 : endSeconds;
  for (let time = 0; time <= total + 0.0001; time += step) {
    const active = time >= 0.2 && time <= endSeconds;
    const left = active ? 50 : 0;
    const right = active ? 52 : 0;
    rows.push(`${time.toFixed(2)};${left};${right}`);
  }
  return rows.join("\n");
}

function exportZip(options: {
  tag?: string | null;
  includeInfo?: boolean;
  includeData?: boolean;
  workDuration?: number;
  data?: string;
} = {}) {
  const entries: Record<string, Uint8Array> = {};
  if (options.includeInfo !== false) {
    entries["info.csv"] = strToU8([
      `tag;${options.tag === undefined ? "Rosová Štěpánka" : options.tag ?? ""}`,
      "date;2026-08-01",
      "protocol;Repeaters",
      "left mvc;100",
      "right mvc;104",
      "work percentage;50",
      `work duration;${options.workDuration ?? 4.8}`,
      "rest duration;3",
      "repetitions;1",
    ].join("\n"));
  }
  if (options.includeData !== false) {
    entries["data_set_1.csv"] = strToU8(options.data ?? dataCsv());
  }
  return zipSync(entries);
}

describe("Tindeq Repeaters parser and analysis", () => {
  it("normalizes names with diacritics and separators", () => {
    assert.equal(normalizeAthleteTag(" Rosová  Štěpánka "), "rosova-stepanka");
    assert.equal(normalizeAthleteTag("Rosova_Stepanka"), "rosova-stepanka");
  });

  it("parses one valid bilateral Tindeq ZIP and calculates sampling frequency", () => {
    const parsed = parseTindeqZip(exportZip());
    assert.equal(parsed.length, 1);
    assert.equal(parsed[0].info.normalizedTag, "rosova-stepanka");
    assert.ok(parsed[0].samplingFrequencyHz > 49 && parsed[0].samplingFrequencyHz < 51);
    assert.equal(parsed[0].samples[20].left, 50);
    assert.equal(parsed[0].samples[20].right, 52);
  });

  it("parses an outer ZIP containing multiple original exports", () => {
    const outer = zipSync({
      "first.zip": exportZip({ tag: "První Klient" }),
      "second.zip": exportZip({ tag: "Druhý Klient" }),
    });
    const parsed = parseTindeqZip(outer, "batch.zip");
    assert.equal(parsed.length, 2);
  });

  it("returns stable errors for missing info.csv and data_set_1.csv", () => {
    assert.throws(
      () => parseTindeqZip(exportZip({ includeInfo: false })),
      (error) => error instanceof TindeqImportError && error.code === "MISSING_INFO_CSV",
    );
    assert.throws(
      () => parseTindeqZip(exportZip({ includeData: false })),
      (error) => error instanceof TindeqImportError && error.code === "MISSING_DATA_CSV",
    );
  });

  it("rejects a damaged CSV time series", () => {
    assert.throws(
      () => parseTindeqZip(exportZip({ data: "time;left\nnot-a-time;bad" })),
      (error) => error instanceof TindeqImportError && error.code === "INVALID_CSV",
    );
  });

  it("keeps a missing tag as an unassigned measurement", () => {
    const parsed = parseTindeqZip(exportZip({ tag: null }))[0];
    assert.equal(parsed.info.originalTag, null);
    assert.equal(parsed.info.normalizedTag, null);
  });

  it("detects a complete repetition that ends without relaxation", () => {
    const parsed = parseTindeqZip(exportZip({
      workDuration: 4.8,
      data: dataCsv(5, false),
    }))[0];
    const analysis = analyzeTindeqExport(parsed);
    assert.equal(analysis.repetitions.length, 1);
    assert.equal(analysis.repetitions[0].isValid, true);
    assert.ok(analysis.repetitions[0].warnings.includes("recording_ended_without_relaxation"));
  });

  it("marks an incomplete work interval invalid", () => {
    const parsed = parseTindeqZip(exportZip({
      workDuration: 5,
      data: dataCsv(2, true),
    }))[0];
    const analysis = analyzeTindeqExport(parsed);
    assert.equal(analysis.repetitions[0].isValid, false);
    assert.ok(analysis.repetitions[0].warnings.includes("incomplete_work_interval"));
  });

  it("distinguishes pain null, zero and values 1-10", () => {
    assert.equal(validateClinicalScale(null, "pain"), null);
    assert.equal(validateClinicalScale("", "pain"), null);
    assert.equal(validateClinicalScale(0, "pain"), 0);
    assert.equal(validateClinicalScale(7, "pain"), 7);
    assert.throws(() => validateClinicalScale(11, "pain"));
  });

  it("returns the existing measurement for a duplicate upload", async () => {
    const query = {
      select() {
        return this;
      },
      eq() {
        return this;
      },
      async maybeSingle() {
        return {
          data: { id: "existing-session", athlete_id: null },
          error: null,
        };
      },
    };
    const supabase = {
      from(table: string) {
        assert.equal(table, "tindeq_repeaters_sessions");
        return query;
      },
    } as unknown as SupabaseClient;
    const zip = exportZip();
    const file = new File([zip], "repeaters.zip", { type: "application/zip" });

    const result = await importTindeqFile(supabase, "user-1", file);

    assert.equal(result.duplicate, true);
    assert.equal(result.importedCount, 0);
    assert.equal(result.measurementId, "existing-session");
    assert.equal(result.detailUrl, "/repeaters/existing-session");
  });

  it("rejects an import without an authenticated user", async () => {
    const supabase = {
      auth: {
        async getUser() {
          return { data: { user: null }, error: null };
        },
      },
    } as unknown as Pick<SupabaseClient, "auth">;

    await assert.rejects(
      () => requireTindeqUser(supabase),
      (error) => error instanceof TindeqImportError
        && error.code === "UNAUTHORIZED"
        && error.status === 401,
    );
  });
});
