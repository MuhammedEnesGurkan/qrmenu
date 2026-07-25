import { expect, test } from "@playwright/test";

test("public menu has no horizontal overflow and usable touch targets", async ({
  page,
}) => {
  await page.goto("/m/demo-kafe");
  await expect(page.getByRole("heading", { name: "Demo Kafe" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Kahveler" })).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
  await expect(page.locator("meta[name=viewport]")).toHaveAttribute("content",/width=device-width/);

  const searchBox = page.getByPlaceholder("Menüde ara");
  const box = await searchBox.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
  await searchBox.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
});
