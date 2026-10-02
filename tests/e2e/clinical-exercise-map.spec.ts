import { expect, test, type Page } from "@playwright/test";

const authStorageKey = "sb-zxvndqicslyulrinbpyn-auth-token";

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

async function setupSignedInClinicalMap(page: Page) {
  const accessToken = fakeJwt();
  const methods: string[] = [];
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
      created_at: "2026-10-02T00:00:00.000Z",
    },
  };

  await page.addInitScript(
    ({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
    { key: authStorageKey, value: session },
  );

  await page.route("**/rest/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    methods.push(request.method());

    if (url.pathname.endsWith("/rest/v1/exercises") && request.method() === "GET") {
      await route.fulfill({
        status: 200,
        headers: {
          "access-control-allow-origin": "*",
          "content-type": "application/json",
        },
        body: JSON.stringify([
          {
            id: "57256826-2c12-49c3-a0e6-7a29d11d37ea",
            name: "Single leg wall sit",
            family_slug: "squat",
            category: "Squat",
            training_type: "Isometric",
            laterality: "unilateral",
            equipment: [],
            segments: ["hip", "knee"],
            source: "google_sheets",
            source_row: 6,
            is_active: true,
          },
          {
            id: "742d3714-3fa8-4aad-af13-4b187f32754f",
            name: "Split squat",
            family_slug: "split_squat",
            category: "Squat",
            training_type: "Strength",
            laterality: "unilateral",
            equipment: [],
            segments: ["hip", "knee"],
            source: "google_sheets",
            source_row: 157,
            is_active: true,
          },
          {
            id: "ed5bd1f9-b48c-4ac3-b41c-5b97950e5d62",
            name: "Isometric seated leg extension with miniband",
            family_slug: "leg_extension",
            category: "Squat",
            training_type: "Isometric",
            laterality: "unilateral",
            equipment: ["miniband"],
            segments: ["hip", "knee"],
            source: "google_sheets",
            source_row: 2,
            is_active: true,
          },
        ]),
      });
      return;
    }

    await route.fulfill({
      status: 404,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "Unexpected Clinical Map test request" }),
    });
  });

  return methods;
}

test("Clinical Map remains protected when signed out", async ({ page }) => {
  await page.goto("/clinical/exercises");
  await expect(page.getByRole("heading", { name: "Nejdřív se přihlas" })).toBeVisible();
  await expect(page.getByRole("grid", { name: "Clinical Exercise Capacity Map" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Klienti" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Clinical Map" })).toHaveAttribute("aria-current", "page");
});

test("signed-in Clinical Map renders live Training overlay, provenance and A/B/C states", async ({ page }) => {
  const methods = await setupSignedInClinicalMap(page);
  await page.goto("/clinical/exercises");

  await expect(page.getByRole("heading", { name: "Clinical Map" })).toBeVisible();
  await expect(page.getByText("Training live: 3 active exercises")).toBeVisible();
  await expect(page.getByRole("grid", { name: "Clinical Exercise Capacity Map" })).toBeVisible();

  await page.getByRole("button", { name: /Single-leg wall sit/ }).click();
  await expect(page.getByText("A · direct clinical use", { exact: true }).last()).toBeVisible();
  await expect(page.getByText("57256826-2c12-49c3-a0e6-7a29d11d37ea", { exact: true })).toBeVisible();
  await expect(page.getByText("Visit 2026-09-29", { exact: false })).toBeVisible();
  await expect(page.getByText("Single leg wall sit", { exact: true }).last()).toBeVisible();

  await page.getByRole("button", { name: /Isometric knee extension/ }).click();
  await expect(page.getByText("B · probable canonical mapping", { exact: true }).last()).toBeVisible();

  await page.getByRole("button", { name: /Step-down/ }).click();
  await expect(page.getByText("C · unresolved / clinician decision", { exact: true })).toBeVisible();
  await expect(page.getByText("exercise_id unresolved", { exact: true }).last()).toBeVisible();
  await expect(page.getByText("No safe exact Training exercise mapping was found.", { exact: false })).toBeVisible();

  expect(methods.length).toBeGreaterThan(0);
  expect(methods.every((method) => method === "GET")).toBe(true);
});

for (const viewport of [
  { width: 320, height: 700 },
  { width: 390, height: 844 },
]) {
  test(`Clinical Map keeps horizontal matrix scroll local at ${viewport.width}px`, async ({ page }) => {
    await setupSignedInClinicalMap(page);
    await page.setViewportSize(viewport);
    await page.goto("/clinical/exercises");
    await expect(page.getByRole("heading", { name: "Clinical Map" })).toBeVisible();

    const documentOverflow = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(documentOverflow.scrollWidth).toBeLessThanOrEqual(documentOverflow.clientWidth + 1);

    const matrixOverflow = await page.getByTestId("clinical-map-matrix-viewport").evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
    expect(matrixOverflow.scrollWidth).toBeGreaterThan(matrixOverflow.clientWidth);

    const navLinks = [
      page.getByRole("link", { name: "Klienti", exact: true }),
      page.getByRole("link", { name: "Clinical Map", exact: true }),
      page.getByRole("link", { name: "Tindeq", exact: true }),
      page.getByRole("link", { name: "Reporty", exact: true }),
    ];
    const boxes = await Promise.all(navLinks.map((link) => link.boundingBox()));
    for (const box of boxes) {
      expect(box).not.toBeNull();
      if (!box) continue;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    }
  });
}
