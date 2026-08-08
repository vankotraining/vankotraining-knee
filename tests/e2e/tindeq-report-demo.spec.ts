import { expect, test } from "@playwright/test";

test("ukázkový report je dostupný bez přihlášení", async ({ page }) => {
  await page.goto("/tindeq/reports/demo");

  await expect(page.getByRole("heading", { name: "Ukázkový Tindeq report" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Anonymní a smyšlená data" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Rozhodovací report Tindeq" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ukázkový klient" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "progrese" })).toBeVisible();
  await expect(page.getByText("60°", { exact: true })).toBeVisible();
  await expect(page.getByText("1/10 / 2/10 / 1/10", { exact: true }).first()).toBeVisible();
});
