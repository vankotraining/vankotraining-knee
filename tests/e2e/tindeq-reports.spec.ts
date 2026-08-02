import { expect, test, type Page } from "@playwright/test";

const authStorageKey = "sb-zxvndqicslyulrinbpyn-auth-token";
const athleteId = "11111111-1111-4111-8111-111111111111";

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

function sideSummary() {
  return {
    meanPctTarget: 100,
    betweenRepCvPct: 4,
    medianWithinRepCvPct: 3,
    meanTimeIn5Pct: 80,
    meanTimeIn10Pct: 90,
    meanAbsErrorPctPoints: 2,
    trendPctTargetPerRep: -0.2,
    firstToLastChangePctPoints: -2,
  };
}

function sideMetrics(meanForceKg: number) {
  return {
    meanForceKg,
    meanPctTarget: 100,
    cvPct: 3,
    meanAbsErrorPctPoints: 2,
    timeIn5Pct: 80,
    timeIn10Pct: 90,
    peakPctTarget: 103,
    overshootPctPoints: 3,
    driftPctTargetPerSecond: -0.1,
    timeTo95Seconds: 0.5,
  };
}

function storedRecord() {
  return {
    id: "44444444-4444-4444-8444-000000000001",
    athlete_id: athleteId,
    measured_at: "2026-08-02T10:00:00.000Z",
    imported_at: "2026-08-02T10:05:00.000Z",
    source_filename: "fixture.zip",
    source_dataset_name: "data_set_1.csv",
    source_tag: "Klient Test",
    protocol_name: "Repeaters",
    target_force_left_kg: 40,
    target_force_right_kg: 41.6,
    sampling_rate_hz: 80,
    detected_repetitions: 5,
    expected_repetitions: 5,
    left_summary: sideSummary(),
    right_summary: sideSummary(),
    overall_summary: {
      domains: { accuracy: "Dobra", control: "Stabilni", maintenance: "Bez poklesu" },
      meanAbsOnsetDifferenceSeconds: 0.1,
      meanSignedOnsetDifferenceSeconds: 0.05,
      restTargetLeftKg: 2.5,
      restTargetRightKg: 2.6,
      sourceForceUnit: "kg",
      storedForceUnit: "kg",
    },
    repetitions: Array.from({ length: 5 }, (_, index) => ({
      repetition: index + 1,
      onsetSeconds: index * 10,
      endSeconds: index * 10 + 5,
      durationSeconds: 5,
      incompleteEnd: false,
      releaseRecorded: true,
      rightMinusLeftOnsetSeconds: 0.1,
      left: sideMetrics(40),
      right: sideMetrics(41.6),
      flags: [],
      curveLeftPct: [95, 100, 101],
      curveRightPct: [96, 100, 102],
    })),
    warnings: [],
    analysis_version: "tindeq-repeaters-v1",
    raw_metadata: {
      tindeqSessionId: "session-1",
      tagKey: "klient test",
      comment: "",
      sourceForceUnit: "kg",
      repetitions: 5,
      workDurationSeconds: 5,
      pauseBetweenRepetitionsSeconds: 5,
      sets: 1,
      pauseBetweenSetsSeconds: 0,
      mvcLeftKg: 50,
      mvcRightKg: 52,
      workLevelPct: 80,
      restLevelPct: 5,
    },
    created_at: "2026-08-02T10:05:00.000Z",
  };
}

async function setupSignedInMock(page: Page) {
  const session = {
    access_token: fakeJwt(),
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
    const table = new URL(request.url()).pathname.split("/").pop();
    const headers = { "access-control-allow-origin": "*", "content-type": "application/json" };
    if (table === "athletes") {
      await route.fulfill({
        status: 200,
        headers,
        body: JSON.stringify([
          { id: athleteId, display_name: "Klient Test", name_key: "klient-test", note: null },
        ]),
      });
      return;
    }
    if (table === "tindeq_sessions") {
      await route.fulfill({ status: 200, headers, body: JSON.stringify([storedRecord()]) });
      return;
    }
    await route.fulfill({ status: 404, headers, body: JSON.stringify({ message: "Unknown route" }) });
  });
}

test("reporty zustavaji skryte bez session", async ({ page }) => {
  await page.goto("/tindeq/reports");
  await expect(page.getByRole("heading", { name: "Pro reporty je nutne prihlaseni" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Rozhodovaci report Tindeq" })).toHaveCount(0);
});

test("mockovana session nacte historii a klinicky kontext zmeni doporuceni", async ({ page }) => {
  await setupSignedInMock(page);
  await page.goto("/tindeq/reports");

  await expect(page.getByRole("heading", { name: "Vyber klienta pro report" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Rozhodovaci report Tindeq" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "doplnění údajů před rozhodnutím" })).toBeVisible();

  await page.getByLabel("Uhel kolene (°)").fill("60");
  await page.getByLabel("Bolest pred (0–10)").fill("1");
  await page.getByLabel("Bolest behem (0–10)").fill("2");
  await page.getByLabel("Bolest po (0–10)").fill("1");

  await expect(page.getByRole("heading", { name: "progrese" })).toBeVisible();
  await expect(page.getByText("60°", { exact: true })).toBeVisible();
  await expect(page.getByText("1/10 / 2/10 / 1/10", { exact: true })).toBeVisible();
});
