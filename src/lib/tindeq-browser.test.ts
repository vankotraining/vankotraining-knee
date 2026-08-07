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

test("validní Tindeq ZIP vytvoří normalizovanou session", async () => {
  const result = await importTindeqArchive(fileFromBytes("valid.zip", syntheticTindeqZip()));
  assert.equal(result.errors.length, 0);
  assert.equal(result.sessions.length, 1);
  assert.match(result.sessions[0].id, /^[0-9a-f]{20}$/);
  assert.equal(result.sessions[0].datasetName, "data_set_1.csv");
  assert.equal(result.sessions[0].analysis.detectedRepetitions, 8);
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
