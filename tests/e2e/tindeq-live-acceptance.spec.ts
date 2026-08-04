import { expect, test } from "@playwright/test";
import { strToU8, zipSync } from "fflate";

const devUrl = "https://twndqnmrvefhwuwuglju.supabase.co";
const devAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6InR3bmRxbm1ydmVmaHd1d3VnbGp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NzgzNTksImV4cCI6MjEwMTM1NDM1OX0.57nqPEbbhZVT2iN3itPEMSFdd5kK3-nV7PB2XM7rVuA";
const temporaryPassword = "Acceptance-20260804-e2e!";

function buildArchive() {
  const info = [
    "date,tag,comment,unit,reps,work dur.,pause btw. reps,sets,pause btw. sets,type,mvc left,mvc right,Work Level (% of mvc),Rest level (% of mvc)",
    "2026-08-04 05:45:00,Acceptance Tindeq,Synthetic live acceptance,kg,8,5,5,1,0,Repeaters,50,55,70,10",
  ].join("\n");
  const rows = ["time left,weight left,time right,weight right"];
  const hz = 20;
  for (let index = 0; index < 8 * 10 * hz; index += 1) {
    const time = index / hz;
    const phase = time % 10;
    const repetition = Math.floor(time / 10);
    let force = 5;
    if (phase >= 0.5 && phase < 1) {
      force = 5 + ((phase - 0.5) / 0.5) * 29.5;
    } else if (phase >= 1 && phase < 5) {
      force =
        34.5 -
        repetition * 0.25 +
        0.5 * Math.sin(((phase - 1) * 2 * Math.PI) / 1.6);
    } else if (phase >= 5 && phase < 5.5) {
      force = 5 + ((5.5 - phase) / 0.5) * (29.5 - repetition * 0.25);
    }
    rows.push(
      `${time.toFixed(3)},${force.toFixed(3)},${time.toFixed(3)},${(
        force * 1.08
      ).toFixed(3)}`,
    );
  }
  return Buffer.from(
    zipSync({
      "info.csv": strToU8(info),
      "data_set_1.csv": strToU8(rows.join("\n")),
    }),
  );
}

test("live dev Supabase import survives a page reload", async ({ page, request }) => {
  test.skip(process.env.LIVE_TINDEQ_ACCEPTANCE !== "1", "One-off live acceptance only");

  const authResponse = await request.post(`${devUrl}/auth/v1/token?grant_type=password`, {
    headers: {
      apikey: devAnonKey,
      "Content-Type": "application/json",
    },
    data: {
      email: "martin@vankotraining.cz",
      password: temporaryPassword,
    },
  });
  const authBody = await authResponse.text();
  expect(authResponse.ok(), authBody).toBeTruthy();
  const session = JSON.parse(authBody);

  await page.addInitScript(
    ({ value }) =>
      localStorage.setItem("sb-twndqnmrvefhwuwuglju-auth-token", JSON.stringify(value)),
    { value: session },
  );
  await page.goto("/");

  await expect(page.getByText("Acceptance Tindeq", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Přidat Tindeq záznam" }).click();
  await page.getByLabel("Tindeq ZIP").setInputFiles({
    name: "acceptance_tindeq_20260804.zip",
    mimeType: "application/zip",
    buffer: buildArchive(),
  });

  await expect(page.getByText(/Načteno 1 záznam/)).toBeVisible();
  await page.getByLabel("Bolest před").fill("0");
  await page.getByLabel("Bolest během max").fill("2");
  await page.getByLabel("Bolest po").fill("1");
  await page.getByRole("button", { name: "Uložit klientovi Acceptance Tindeq" }).click();
  await expect(
    page.getByText("Uloženo bez původního ZIPu a raw časové řady."),
  ).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: "Historie Tindeq" })).toBeVisible();
  const history = page.locator("details").filter({ hasText: "Levá" }).first();
  await expect(history).toBeVisible();
  await history.locator("summary").click();
  await expect(history.getByText("0 / 2 / 1", { exact: true })).toBeVisible();
  await expect(history.getByText("70 %", { exact: false })).toBeVisible();
});
