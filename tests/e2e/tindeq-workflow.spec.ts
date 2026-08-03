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

async function setupSignedInWorkflowMock(page: Page) {
  const accessToken = fakeJwt();
  await page.addInitScript(
    ({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
    {
      key: authStorageKey,
      value: {
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
      },
    },
  );

  await page.route("**/rest/v1/**", async (route) => {
    const request = route.request();
    const table = new URL(request.url()).pathname.split("/").pop();
    const headers = {
      "access-control-allow-origin": "*",
      "content-type": "application/json",
    };
    const rows: Record<string, unknown[]> = {
      athletes: [{ id: athleteId, display_name: "Kominak Norbert", name_key: "kominak-norbert", note: null }],
      athlete_profiles: [{
        id: "22222222-2222-4222-8222-222222222222",
        athlete_id: athleteId,
        body_weight_kg: 80,
        shin_length_cm: 40,
        profile_date: "2026-08-01",
        updated_at: "2026-08-01T10:00:00Z",
      }],
      knee_extension_tests: [{
        id: "44444444-4444-4444-8444-444444444444",
        athlete_id: athleteId,
        test_date: "2026-08-01",
        left_force_kg: 50,
        right_force_kg: 55,
        left_moment_nm: 196.133,
        right_moment_nm: 215.7463,
        left_nm_per_kg: 2.4517,
        right_nm_per_kg: 2.6968,
        asymmetry_pct: 9.0909,
        weaker_side: "left",
        body_weight_kg: 80,
        shin_length_cm: 40,
        source_force_unit: "kg",
        source_left_force: 50,
        source_right_force: 55,
        note: null,
        created_at: "2026-08-01T10:00:00Z",
      }],
      tindeq_prescriptions: [{
        id: "55555555-5555-4555-8555-555555555555",
        athlete_id: athleteId,
        reference_test_id: "44444444-4444-4444-8444-444444444444",
        reference_test_date: "2026-08-01",
        exercise_side: "left",
        reference_force_kg: 50,
        prescribed_pct: 70,
        target_force_kg: 35,
        force_unit: "kg",
        note: null,
        created_at: "2026-08-01T11:00:00Z",
      }],
      tindeq_sessions: [],
    };
    if (request.method() === "GET" && table && table in rows) {
      await route.fulfill({ status: 200, headers, body: JSON.stringify(rows[table]) });
      return;
    }
    await route.fulfill({ status: 200, headers, body: "[]" });
  });
}

test("signed-out workflow exposes no client data", async ({ page }) => {
  await page.goto("/tindeq/workflow");
  await expect(page.getByRole("heading", { name: "Přihlášení do klientského workflow" })).toBeVisible();
  await expect(page.getByText("Kominak Norbert", { exact: true })).toHaveCount(0);
});

test("signed-in workflow connects client, maximum, prescription and import sections", async ({ page }) => {
  await setupSignedInWorkflowMock(page);
  await page.goto("/tindeq/workflow");

  await expect(page.getByRole("heading", { name: "Vytvoř nebo vyber klienta" })).toBeVisible();
  await expect(page.getByRole("option", { name: "Kominak Norbert" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("heading", { name: "Ručně zapiš levé a pravé maximum" })).toBeVisible();
  await expect(page.getByText("Aktuální reference", { exact: true })).toBeVisible();
  await expect(page.getByText("Cíl 35,0 kg", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Importuj skutečný Tindeq export a potvrď klienta" })).toBeVisible();

  for (const width of [360, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const overflow = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
  }
});
