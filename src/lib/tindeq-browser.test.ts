import assert from "node:assert/strict";
import test from "node:test";
import { importTindeqArchive } from "./tindeq-browser.js";
import { fileFromBytes, syntheticTindeqBatchZip, syntheticTindeqZip } from "./tindeq-test-fixture.js";

function hasNonFinite(value: unknown): boolean {
  if (typeof value === "number") return !Number.isFinite(value);
  if (Array.isArray(value)) return value.some(hasNonFinite);
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).some(hasNonFinite);
  }
  return false;
}

async function measuredAt(date: string): Promise<string> {
  const result = await importTindeqArchive(
    fileFromBytes("date-regression.zip", syntheticTindeqZip({ date })),
  );
  return result.sessions[0].metadata.measuredAt;
}

test("validní Tindeq ZIP vytvoří normalizovanou session", async () => {
  const result = await importTindeqArchive(fileFromBytes("valid.zip", syntheticTindeqZip()));
  assert.equal(result.errors.length, 0);
  assert.equal(result.sessions.length, 1);
  assert.match(result.sessions[0].id, /^[0-9a-f]{20}$/);
  assert.equal(result.sessions[0].datasetName, "data_set_1.csv");
  assert.equal(result.sessions[0].analysis.detectedRepetitions, 8);
});

test("Tindeq datum 2026-04-08 znamená 4. srpna 2026", async () => {
  assert.equal(await measuredAt("2026-04-08 10:11:12"), "2026-08-04T10:11:12");
});

test("Tindeq datum 2026-05-08 znamená 5. srpna 2026", async () => {
  assert.equal(await measuredAt("2026-05-08 10:11:12"), "2026-08-05T10:11:12");
});

test("Tindeq datum 2026-07-08 znamená 7. srpna 2026", async () => {
  assert.equal(await measuredAt("2026-07-08 10:11:12"), "2026-08-07T10:11:12");
});

test("Tindeq datum s dnem nad 12 se čte jako YYYY-DD-MM", async () => {
  assert.equal(await measuredAt("2026-13-07 10:11:12"), "2026-07-13T10:11:12");
});

test("jednoznačné Tindeq datum se normalizuje bez heuristiky", async () => {
  assert.equal(await measuredAt("2026-08-08 10:11:12"), "2026-08-08T10:11:12");
});

test("neplatné datum se neodhaduje a import je odmítnut", async () => {
  await assert.rejects(
    importTindeqArchive(
      fileFromBytes("unsafe-date.zip", syntheticTindeqZip({ date: "2026-31-02 10:11:12" })),
    ),
    /datum nelze bezpečně určit/,
  );
});

test("datum měření nemění výsledek silové analýzy", async () => {
  const august = await importTindeqArchive(
    fileFromBytes("august.zip", syntheticTindeqZip({ date: "2026-04-08 10:11:12" })),
  );
  const september = await importTindeqArchive(
    fileFromBytes("september.zip", syntheticTindeqZip({ date: "2026-04-09 10:11:12" })),
  );
  assert.deepEqual(august.sessions[0].analysis, september.sessions[0].analysis);
});

test("identifikátor session zůstává deterministický pro stejný ZIP", async () => {
  const bytes = syntheticTindeqZip({ date: "2026-04-08 10:11:12" });
  const first = await importTindeqArchive(fileFromBytes("first-name.zip", bytes));
  const second = await importTindeqArchive(fileFromBytes("renamed.zip", bytes));
  assert.equal(first.sessions[0].id, second.sessions[0].id);
});

test("ZIP bez info.csv je odmítnut konkrétní chybou", async () => {
  await assert.rejects(
    importTindeqArchive(fileFromBytes("missing-info.zip", syntheticTindeqZip({ includeInfo: false }))),
    /není Tindeq export ani balík Tindeq ZIPů/,
  );
});

test("ZIP bez datového CSV je odmítnut konkrétní chybou", async () => {
  await assert.rejects(
    importTindeqArchive(fileFromBytes("missing-data.zip", syntheticTindeqZip({ includeDataset: false }))),
    /neobsahuje data_set_\*\.csv/,
  );
});

test("ZIP s více datovými sessions vrátí všechny sessions", async () => {
  const result = await importTindeqArchive(fileFromBytes("multi.zip", syntheticTindeqZip({ datasetCount: 2 })));
  assert.equal(result.sessions.length, 2);
  assert.deepEqual(result.sessions.map((session) => session.datasetName), ["data_set_1.csv", "data_set_2.csv"]);
});

test("vnější ZIP s více exporty zachová dílčí výsledky", async () => {
  const result = await importTindeqArchive(fileFromBytes("batch.zip", syntheticTindeqBatchZip()));
  assert.equal(result.sessions.length, 2);
  assert.equal(result.errors.length, 0);
});

test("neúplná session zůstane označena technickým varováním", async () => {
  const result = await importTindeqArchive(
    fileFromBytes("incomplete.zip", syntheticTindeqZip({ expectedRepetitions: 8, generatedRepetitions: 3 })),
  );
  assert.equal(result.sessions[0].analysis.detectedRepetitions, 3);
  assert.match(result.sessions[0].analysis.warnings.join(" "), /Detekováno 3 z očekávaných 8/);
});

test("neznámý protokol se importuje transparentně", async () => {
  const result = await importTindeqArchive(
    fileFromBytes("unknown.zip", syntheticTindeqZip({ protocol: "Experimental protocol" })),
  );
  assert.equal(result.sessions[0].metadata.type, "Experimental protocol");
});

test("prázdný soubor je odmítnut", async () => {
  await assert.rejects(
    importTindeqArchive(fileFromBytes("empty.zip", new Uint8Array())),
    /ZIP nemá platný centrální adresář/,
  );
});

test("poškozený ZIP je odmítnut", async () => {
  const bytes = syntheticTindeqZip();
  await assert.rejects(
    importTindeqArchive(fileFromBytes("corrupt.zip", bytes.subarray(0, bytes.length - 15))),
    /ZIP nemá platný centrální adresář/,
  );
});

test("výsledek neobsahuje NaN ani Infinity", async () => {
  const result = await importTindeqArchive(fileFromBytes("finite.zip", syntheticTindeqZip()));
  assert.equal(hasNonFinite(result), false);
});
