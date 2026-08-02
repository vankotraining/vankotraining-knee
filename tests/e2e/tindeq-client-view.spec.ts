import { expect, test } from "@playwright/test";
import { strToU8, zipSync } from "fflate";

const repetitions = 8;
const workDurationSeconds = 5;
const pauseSeconds = 2;
const sampleIntervalSeconds = 0.05;

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

async function uploadArchive(page: import("@playwright/test").Page, name: string, data: Uint8Array) {
  await page.locator('input[type="file"]').setInputFiles({
    name,
    mimeType: "application/zip",
    buffer: Buffer.from(data),
  });
}

test("klientský výsledek je výchozí, responzivní a přepíná bez nové analýzy", async ({
  page,
}, testInfo) => {
  await page.goto("/tindeq");
  await uploadArchive(page, "single-tindeq.zip", tindeqArchive("Klient Test"));

  const clientTab = page.getByRole("tab", { name: "Pro klienta" });
  const trainerTab = page.getByRole("tab", { name: "Detail pro trenéra" });
  await expect(clientTab).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("heading", { name: "Velmi dobrá série" })).toBeVisible();
  await expect(page.getByText("Nahrát jiný Tindeq ZIP", { exact: true })).toBeVisible();
  await expect(page.getByText("Nahrát Tindeq ZIP", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Dosažení cílové síly", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Stabilita síly", { exact: true })).toBeVisible();
  await expect(page.getByText("Udržení výkonu", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Levá noha", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pravá noha", exact: true })).toBeVisible();
  await expect(page.getByRole("img")).toHaveAttribute(
    "aria-label",
    /průběhu síly levé a pravé nohy/i,
  );

  const stabilityColor = await page
    .getByText("Velmi stabilní", { exact: true })
    .first()
    .evaluate((element) => getComputedStyle(element).color);
  const maintenanceColor = await page
    .getByText("Bez výrazného poklesu", { exact: true })
    .evaluate((element) => getComputedStyle(element).color);
  expect(maintenanceColor).toBe(stabilityColor);

  for (const width of [360, 390, 720, 1024, 1440]) {
    await page.setViewportSize({ width, height: width <= 390 ? 844 : 900 });
    const overflow = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);

    const leftBox = await page
      .getByRole("heading", { name: "Levá noha", exact: true })
      .boundingBox();
    const rightBox = await page
      .getByRole("heading", { name: "Pravá noha", exact: true })
      .boundingBox();
    expect(leftBox).not.toBeNull();
    expect(rightBox).not.toBeNull();
    if (leftBox && rightBox && width <= 720) {
      expect(rightBox.y).toBeGreaterThan(leftBox.y + 80);
    }
    if (leftBox && rightBox && width >= 1024) {
      expect(Math.abs(rightBox.y - leftBox.y)).toBeLessThan(10);
    }

    await page.screenshot({
      fullPage: true,
      path: testInfo.outputPath(`client-${width}.png`),
    });
  }

  await trainerTab.focus();
  await page.keyboard.press("Enter");
  await expect(trainerTab).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText("Vzorkovací frekvence", { exact: true })).toBeVisible();
  await expect(page.getByText("CV během opakování", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Jednotlivá opakování" })).toBeVisible();

  await page.keyboard.press("ArrowLeft");
  await expect(clientTab).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("heading", { name: "Velmi dobrá série" })).toBeVisible();
  await expect(page.getByText("Vzorkovací frekvence", { exact: true })).toHaveCount(0);
});

test("balík více měření se načte a umožní změnit klienta", async ({ page }) => {
  await page.goto("/tindeq");
  await uploadArchive(page, "batch-tindeq.zip", tindeqBatchArchive());

  const navigation = page.getByRole("navigation", { name: "Importovaná měření" });
  await expect(navigation.getByRole("button")).toHaveCount(2);
  await expect(page.getByRole("heading", { name: "Klient A" })).toBeVisible();

  await navigation.getByRole("button", { name: /Klient B/ }).click();
  await expect(page.getByRole("heading", { name: "Klient B" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Pro klienta" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});
