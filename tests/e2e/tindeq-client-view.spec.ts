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

function infoCsv(tag: string): string {
  const headers = [
    "date",
    "tag",
    "comment",
    "unit",
    "reps",
    "work dur.",
    "pause btw. reps",
    "sets",
    "pause btw. sets",
    "type",
    "mvc left",
    "mvc right",
    "Work Level (% of mvc)",
    "Rest level (% of mvc)",
  ];
  const values = [
    "2026-08-02 10:00:00",
    tag,
    "Automatický test klientského zobrazení",
    "kg",
    String(repetitions),
    String(workDurationSeconds),
    String(pauseSeconds),
    "1",
    "0",
    "Repeaters",
    "50",
    "52",
    "80",
    "0",
  ];
  return `${headers.join(",")}\n${values.join(",")}\n`;
}

function forceAt(
  time: number,
  target: number,
  sideOffset: number,
  seriesOffset: number,
): number {
  const firstStart = 1;
  const cycleDuration = workDurationSeconds + pauseSeconds;
  const repetitionIndex = Math.floor((time - firstStart) / cycleDuration);
  if (repetitionIndex < 0 || repetitionIndex >= repetitions) return 0;
  const localTime = time - firstStart - repetitionIndex * cycleDuration;
  if (localTime < 0 || localTime > workDurationSeconds) return 0;
  const ramp = Math.min(1, localTime / 0.35);
  const controlledVariation = 1 + sideOffset + seriesOffset + Math.sin(localTime * 3) * 0.006;
  return target * ramp * controlledVariation;
}

function datasetCsv(seriesOffset = 0): string {
  const rows = ["time left,weight left,time right,weight right"];
  const totalDuration = 1 + repetitions * (workDurationSeconds + pauseSeconds) + 1;
  const sampleCount = Math.floor(totalDuration / sampleIntervalSeconds) + 1;
  for (let index = 0; index < sampleCount; index += 1) {
    const time = index * sampleIntervalSeconds;
    const left = forceAt(time, 40, -0.004, seriesOffset);
    const right = forceAt(time, 41.6, 0.004, seriesOffset);
    rows.push(
      `${time.toFixed(2)},${left.toFixed(3)},${time.toFixed(2)},${right.toFixed(3)}`,
    );
  }
  return `${rows.join("\n")}\n`;
}

function tindeqArchive(tag: string, seriesOffset = 0): Uint8Array {
  return zipSync(
    {
      "info.csv": strToU8(infoCsv(tag)),
      "data_set_1.csv": strToU8(datasetCsv(seriesOffset)),
    },
    { level: 0 },
  );
}

function tindeqBatchArchive(): Uint8Array {
  return zipSync(
    {
      "klient-a.zip": tindeqArchive("Klient A"),
      "klient-b.zip": tindeqArchive("Klient B", -0.02),
    },
    { level: 0 },
  );
}

async function uploadArchive(page: Page, name: string, data: Uint8Array) {
  await page.locator('input[type="file"]').setInputFiles({
    name,
    mimeType: "application/zip",
    buffer: Buffer.from(data),
  });
}

function fakeJwt() {
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode({
    aud: "authenticated",
    exp: 2_100_000_000,
    sub: "33333333-3333-4333-8333-333333333333",
    email: "trainer@example.test",
    role: "authenticated",
  })}.test-signature`;
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
      const athleteFilter = url.searchParams.get("athlete_id") ?? "";
      const selectedId = athleteFilter.replace(/^eq\./, "");
      const rows = storedRecords
        .filter((record) => record.athlete_id === selectedId)
        .sort((a, b) => String(b.measured_at).localeCompare(String(a.measured_at)));
      await route.fulfill({ status: 200, headers, body: JSON.stringify(rows) });
      return;
    }

    if (table === "tindeq_sessions" && request.method() === "POST") {
      const payload = request.postDataJSON() as Record<string, unknown>;
      const sourceTag = String(payload.source_tag ?? "");
      postTags.push(sourceTag);
      const shouldFailOnce =
        options.failFirstForTag === sourceTag && !failedTags.has(sourceTag);
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
  await expect(page.getByText("Vyber klienta z databáze", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Nahrát Tindeq ZIP", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Uložená Tindeq měření", { exact: true })).toHaveCount(0);
});

test("přihlášený tok načte klienty, uloží výsledek a zobrazí historii", async ({
  page,
}, testInfo) => {
  const mock = await setupSignedInSupabaseMock(page);
  await page.goto("/tindeq");

  await expect(page.getByRole("heading", { name: "Vyber klienta z databáze" })).toBeVisible();
  await expect(page.getByRole("option", { name: "Klient Test" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await uploadArchive(page, "single-tindeq.zip", tindeqArchive("Klient Test"));

  const clientTab = page.getByRole("tab", { name: "Pro klienta" });
  const trainerTab = page.getByRole("tab", { name: "Detail pro trenéra" });
  await expect(clientTab).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("heading", { name: "Velmi dobrá série" })).toBeVisible();
  await expect(page.getByText("Nahrát jiný Tindeq ZIP", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Uložit měření ke klientovi" })).toBeEnabled();

  await page.getByRole("button", { name: "Uložit měření ke klientovi" }).click();
  await expect(page.getByText("Všechna měření byla bezpečně uložena.")).toBeVisible();
  await expect(page.getByText("Uloženo v historii", { exact: true })).toBeVisible();
  expect(mock.storedRecords).toHaveLength(1);
  expect(mock.storedRecords[0].athlete_id).toBe(athleteId);
  expect(mock.storedRecords[0].source_filename).toBe("single-tindeq.zip");
  expect(mock.storedRecords[0]).not.toHaveProperty("raw_zip");

  const historySection = page
    .getByRole("heading", { name: "Uložená Tindeq měření" })
    .locator("xpath=ancestor::section[1]");
  await historySection.getByRole("button", { name: "Otevřít detail" }).click();
  await expect(historySection.getByText("tindeq-repeaters-v1", { exact: true })).toBeVisible();

  for (const width of [360, 390, 720, 1024, 1440]) {
    await page.setViewportSize({ width, height: width <= 390 ? 844 : 900 });
    const overflow = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
    await page.screenshot({
      fullPage: true,
      path: testInfo.outputPath(`client-${width}.png`),
    });
  }

  await trainerTab.focus();
  await page.keyboard.press("Enter");
  await expect(trainerTab).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText("Vzorkovací frekvence", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Jednotlivá opakování" })).toBeVisible();
  await page.keyboard.press("ArrowLeft");
  await expect(clientTab).toHaveAttribute("aria-selected", "true");
});

test("chyba uložení zachová analyzovaný výsledek a umožní opakování", async ({ page }) => {
  await setupSignedInSupabaseMock(page, { failEverySave: true });
  await page.goto("/tindeq");
  await uploadArchive(page, "failed-save.zip", tindeqArchive("Klient Test"));
  await page.getByRole("button", { name: "Uložit měření ke klientovi" }).click();

  await expect(page.getByText("Uložení selhalo. Analyzovaný výsledek zůstává na obrazovce.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Velmi dobrá série" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Uložit měření ke klientovi" })).toBeEnabled();
  await expect(page.getByText("Pro vybraného klienta zatím není uloženo žádné Tindeq měření.")).toBeVisible();
});

test("více sessions hlásí částečné selhání a neopakuje úspěšný insert", async ({ page }) => {
  const mock = await setupSignedInSupabaseMock(page, { failFirstForTag: "Klient B" });
  await page.goto("/tindeq");
  await page.getByRole("option", { name: "Jiný klient" }).click();
  await uploadArchive(page, "batch-tindeq.zip", tindeqBatchArchive());

  const navigation = page.getByRole("navigation", { name: "Importovaná měření" });
  await expect(navigation.getByRole("button")).toHaveCount(2);
  await expect(page.getByText("Zkontroluj přiřazení klienta.")).toBeVisible();

  await page.getByRole("button", { name: "Uložit 2 měření ke klientovi" }).click();
  await expect(page.getByText("Část měření byla uložena. Znovu se odešlou pouze neúspěšné položky.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Uložit 1 měření ke klientovi" })).toBeEnabled();

  await page.getByRole("button", { name: "Uložit 1 měření ke klientovi" }).click();
  await expect(page.getByText("Všechna měření byla bezpečně uložena.")).toBeVisible();
  expect(mock.postTags).toEqual(["Klient A", "Klient B", "Klient B"]);
  expect(mock.storedRecords).toHaveLength(2);
});
