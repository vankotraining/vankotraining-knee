import { expect, test, type Page } from "@playwright/test";
import { strToU8, zipSync } from "fflate";

const repetitions = 8;
const workDurationSeconds = 5;
const pauseSeconds = 2;
const sampleIntervalSeconds = 0.05;
const authStorageKey = "sb-zxvndqicslyulrinbpyn-auth-token";
const athleteId = "11111111-1111-4111-8111-111111111111";
const secondAthleteId = "22222222-2222-4222-8222-222222222222";

type MockOptions = {
  failFirstForTag?: string;
  failEverySave?: boolean;
};

function infoCsv(tag: string, protocol = "Repeaters") {
  const headers = [
    "date", "tag", "comment", "unit", "reps", "work dur.",
    "pause btw. reps", "sets", "pause btw. sets", "type",
    "mvc left", "mvc right", "Work Level (% of mvc)", "Rest level (% of mvc)",
  ];
  const values = [
    "2026-08-02 10:00:00", tag, "Syntetický browser test", "kg",
    String(repetitions), String(workDurationSeconds), String(pauseSeconds),
    "1", "0", protocol, "50", "52", "80", "0",
  ];
  return `${headers.join(",")}\n${values.join(",")}\n`;
}

function forceAt(time: number, target: number, sideOffset: number, seriesOffset: number) {
  const firstStart = 1;
  const cycleDuration = workDurationSeconds + pauseSeconds;
  const repetitionIndex = Math.floor((time - firstStart) / cycleDuration);
  if (repetitionIndex < 0 || repetitionIndex >= repetitions) return 0;
  const localTime = time - firstStart - repetitionIndex * cycleDuration;
  if (localTime < 0 || localTime > workDurationSeconds) return 0;
  const ramp = Math.min(1, localTime / 0.35);
  return target * ramp * (1 + sideOffset + seriesOffset + Math.sin(localTime * 3) * 0.006);
}

function datasetCsv(seriesOffset = 0) {
  const rows = ["time left,weight left,time right,weight right"];
  const totalDuration = 1 + repetitions * (workDurationSeconds + pauseSeconds) + 1;
  const sampleCount = Math.floor(totalDuration / sampleIntervalSeconds) + 1;
  for (let index = 0; index < sampleCount; index += 1) {
    const time = index * sampleIntervalSeconds;
    const left = forceAt(time, 40, -0.004, seriesOffset);
    const right = forceAt(time, 41.6, 0.004, seriesOffset);
    rows.push(`${time.toFixed(2)},${left.toFixed(3)},${time.toFixed(2)},${right.toFixed(3)}`);
  }
  return `${rows.join("\n")}\n`;
}

function tindeqArchive(tag: string, seriesOffset = 0, protocol = "Repeaters") {
  return zipSync(
    {
      "info.csv": strToU8(infoCsv(tag, protocol)),
      "data_set_1.csv": strToU8(datasetCsv(seriesOffset)),
    },
    { level: 0 },
  );
}

function tindeqBatchArchive() {
  return zipSync(
    {
      "klient-a.zip": tindeqArchive("Klient A"),
      "klient-b.zip": tindeqArchive("Klient B", -0.02),
    },
    { level: 0 },
  );
}

async function uploadArchive(page: Page, name: string, data: Uint8Array) {
  await page.locator('input[type="file"]').first().setInputFiles({
    name,
    mimeType: "application/zip",
    buffer: Buffer.from(data),
  });
}

function fakeJwt() {
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode({
    aud: "authenticated",
    exp: 2_100_000_000,
    sub: "33333333-3333-4333-8333-333333333333",
    email: "trainer@example.test",
    role: "authenticated",
  })}.test-signature`;
}

function containedSessionId(url: URL) {
  const raw = url.searchParams.get("raw_metadata");
  if (!raw) return null;
  try {
    return String((JSON.parse(raw.replace(/^cs\./, "")) as { tindeqSessionId?: string }).tindeqSessionId ?? "");
  } catch {
    return null;
  }
}

async function setupSignedInSupabaseMock(page: Page, options: MockOptions = {}) {
  const accessToken = fakeJwt();
  const storedRecords: Array<Record<string, unknown>> = [];
  const postTags: string[] = [];
  const failedTags = new Set<string>();
  const athletes = [
    { id: athleteId, display_name: "Klient Test", name_key: "klient-test", note: null },
    { id: secondAthleteId, display_name: "Jiný klient", name_key: "jiny-klient", note: null },
  ];
  const session = {
    access_token: accessToken,
    refresh_token: "test-refresh-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: 2_100_000_000,
    user: {
      id: "33333333-3333-4333-8333-333333333333",
      aud: "authenticated",
      role: "authenticated",
      email: "trainer@example.test",
      app_metadata: { provider: "email", providers: ["email"] },
      user_metadata: {},
      created_at: "2026-08-01T00:00:00.000Z",
    },
  };

  await page.addInitScript(
    ({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
    { key: authStorageKey, value: session },
  );

  await page.route("**/rest/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const table = url.pathname.split("/").pop();
    const headers = {
      "access-control-allow-origin": "*",
      "content-type": "application/json",
    };

    if (table === "athletes" && request.method() === "GET") {
      await route.fulfill({ status: 200, headers, body: JSON.stringify(athletes) });
      return;
    }

    if (table === "tindeq_sessions" && request.method() === "GET") {
      const athleteFilter = (url.searchParams.get("athlete_id") ?? "").replace(/^eq\./, "");
      const sessionId = containedSessionId(url);
      const rows = storedRecords
        .filter((record) => record.athlete_id === athleteFilter)
        .filter((record) => {
          if (!sessionId) return true;
          const metadata = record.raw_metadata as { tindeqSessionId?: string } | undefined;
          return metadata?.tindeqSessionId === sessionId;
        })
        .sort((a, b) => String(b.measured_at).localeCompare(String(a.measured_at)));
      await route.fulfill({ status: 200, headers, body: JSON.stringify(rows) });
      return;
    }

    if (table === "tindeq_sessions" && request.method() === "POST") {
      const payload = request.postDataJSON() as Record<string, unknown>;
      const sourceTag = String(payload.source_tag ?? "");
      postTags.push(sourceTag);
      const shouldFailOnce = options.failFirstForTag === sourceTag && !failedTags.has(sourceTag);
      if (shouldFailOnce) failedTags.add(sourceTag);
      if (options.failEverySave || shouldFailOnce) {
        await route.fulfill({
          status: 400,
          headers,
          body: JSON.stringify({ message: "Testovací chyba uložení" }),
        });
        return;
      }
      const now = "2026-08-02T11:00:00.000Z";
      const record = {
        id: `44444444-4444-4444-8444-${String(storedRecords.length + 1).padStart(12, "0")}`,
        ...payload,
        imported_at: now,
        created_at: now,
      };
      storedRecords.push(record);
      await route.fulfill({ status: 201, headers, body: JSON.stringify(record) });
      return;
    }

    await route.fulfill({ status: 404, headers, body: JSON.stringify({ message: "Unknown test route" }) });
  });

  return { storedRecords, postTags };
}

test("nepřihlášený uživatel nevidí klienty, import ani výsledky", async ({ page }) => {
  await page.goto("/tindeq");
  await expect(page.getByRole("heading", { name: "Přihlášení do Knee Data" })).toBeVisible();
  await expect(page.getByText("Nahrát Tindeq ZIP", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Uložená Tindeq měření", { exact: true })).toHaveCount(0);
});

test("ZIP se analyzuje před explicitním výběrem klienta a teprve potom lze uložit", async ({ page }, testInfo) => {
  const mock = await setupSignedInSupabaseMock(page);
  await page.goto("/tindeq");

  await expect(page.getByRole("option", { name: "Klient Test" })).toHaveAttribute("aria-selected", "false");

  await uploadArchive(page, "single-tindeq.zip", tindeqArchive("Klient Test"));
  await expect(page.getByRole("heading", { name: "Velmi dobrá série" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Uložit měření ke klientovi" })).toBeDisabled();

  await page.getByRole("option", { name: "Klient Test" }).click();
  await expect(page.getByRole("button", { name: "Uložit měření ke klientovi" })).toBeEnabled();
  await page.getByRole("button", { name: "Uložit měření ke klientovi" }).click();
  await expect(page.getByText("Všechna měření byla bezpečně uložena.")).toBeVisible();
  await expect(page.getByText("Uloženo v historii", { exact: true })).toBeVisible();
  expect(mock.storedRecords).toHaveLength(1);
  expect(mock.storedRecords[0].athlete_id).toBe(athleteId);
  expect(mock.storedRecords[0].source_filename).toBe("single-tindeq.zip");
  expect(mock.storedRecords[0]).not.toHaveProperty("raw_zip");
  expect(JSON.stringify(mock.storedRecords[0])).not.toContain("timeLeft");

  for (const width of [360, 390, 720, 1024, 1440]) {
    await page.setViewportSize({ width, height: width <= 390 ? 844 : 900 });
    const overflow = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
    await page.screenshot({ fullPage: true, path: testInfo.outputPath(`client-${width}.png`) });
  }
});

test("název souboru ani tag nikdy automaticky nepřiřadí klienta", async ({ page }) => {
  await setupSignedInSupabaseMock(page);
  await page.goto("/tindeq");
  await uploadArchive(page, "Jiny-klient.zip", tindeqArchive("Jiný klient"));
  await expect(page.getByRole("option", { name: "Jiný klient" })).toHaveAttribute("aria-selected", "false");
  await expect(page.getByRole("button", { name: "Uložit měření ke klientovi" })).toBeDisabled();
});

test("neplatný ZIP zobrazí klidnou konkrétní chybu", async ({ page }) => {
  await setupSignedInSupabaseMock(page);
  await page.goto("/tindeq");
  await uploadArchive(page, "invalid.zip", new Uint8Array([1, 2, 3, 4]));
  await expect(page.getByText(/ZIP nemá platný centrální adresář/)).toBeVisible();
});

test("opakovaný upload stejného ZIPu nevytvoří druhý záznam", async ({ page }) => {
  const mock = await setupSignedInSupabaseMock(page);
  const archive = tindeqArchive("Klient Test");
  await page.goto("/tindeq");
  await page.getByRole("option", { name: "Klient Test" }).click();
  await uploadArchive(page, "same.zip", archive);
  await page.getByRole("button", { name: "Uložit měření ke klientovi" }).click();
  await expect(page.getByText("Všechna měření byla bezpečně uložena.")).toBeVisible();

  await uploadArchive(page, "same.zip", archive);
  await page.getByRole("button", { name: "Uložit měření ke klientovi" }).click();
  await expect(
    page.getByText("Všechna měření už byla dříve uložena. Nevznikl žádný nový záznam."),
  ).toBeVisible();
  await expect(page.getByText("již dříve uloženo – nevytvořen nový záznam")).toBeVisible();
  await expect(page.getByRole("button", { name: "Měření již uloženo" })).toBeDisabled();
  expect(mock.storedRecords).toHaveLength(1);
  expect(mock.postTags).toEqual(["Klient Test"]);
});

test("chyba uložení zachová výsledek a umožní opakování", async ({ page }) => {
  await setupSignedInSupabaseMock(page, { failEverySave: true });
  await page.goto("/tindeq");
  await page.getByRole("option", { name: "Klient Test" }).click();
  await uploadArchive(page, "failed-save.zip", tindeqArchive("Klient Test"));
  await page.getByRole("button", { name: "Uložit měření ke klientovi" }).click();
  await expect(page.getByText("Uložení selhalo. Analyzovaný výsledek zůstává na obrazovce.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Velmi dobrá série" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Uložit měření ke klientovi" })).toBeEnabled();
});

test("částečné selhání opakuje pouze neúspěšnou session", async ({ page }) => {
  const mock = await setupSignedInSupabaseMock(page, { failFirstForTag: "Klient B" });
  await page.goto("/tindeq");
  await page.getByRole("option", { name: "Jiný klient" }).click();
  await uploadArchive(page, "batch-tindeq.zip", tindeqBatchArchive());
  await page.getByRole("button", { name: "Uložit 2 měření ke klientovi" }).click();
  await expect(page.getByText("Část měření byla uložena. Znovu se odešlou pouze neúspěšné položky.")).toBeVisible();
  await page.getByRole("button", { name: "Uložit 1 měření ke klientovi" }).click();
  await expect(page.getByText("Všechna měření byla bezpečně uložena.")).toBeVisible();
  expect(mock.postTags).toEqual(["Klient A", "Klient B", "Klient B"]);
  expect(mock.storedRecords).toHaveLength(2);
});