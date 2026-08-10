import { expect, test } from "@playwright/test";

const mobileViewports = [
  { width: 390, height: 844 },
  { width: 320, height: 568 },
];

for (const viewport of mobileViewports) {
  test(`Tindeq header navigation does not overlap at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/tindeq");

    const reportsLink = page.getByRole("link", { name: "Otevřít reporty" });
    const clientsLink = page.getByRole("link", { name: "Zpět na klienty" });

    await expect(reportsLink).toBeVisible();
    await expect(clientsLink).toBeVisible();

    const [reportsBox, clientsBox] = await Promise.all([
      reportsLink.boundingBox(),
      clientsLink.boundingBox(),
    ]);

    expect(reportsBox).not.toBeNull();
    expect(clientsBox).not.toBeNull();

    if (!reportsBox || !clientsBox) {
      throw new Error("Tindeq navigation links do not have measurable bounding boxes.");
    }

    const overlapWidth =
      Math.min(reportsBox.x + reportsBox.width, clientsBox.x + clientsBox.width) -
      Math.max(reportsBox.x, clientsBox.x);
    const overlapHeight =
      Math.min(reportsBox.y + reportsBox.height, clientsBox.y + clientsBox.height) -
      Math.max(reportsBox.y, clientsBox.y);

    expect(overlapWidth > 0 && overlapHeight > 0).toBe(false);

    for (const box of [reportsBox, clientsBox]) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    }
  });
}
