import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow, sweepWidths } from "./helpers";

test.describe("landing sayfası", () => {
  test("değer önerisi ve iki ana CTA görünür", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "masa akışta",
    );
    await expect(
      page.getByRole("link", { name: "Ücretsiz menü oluştur" }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Demo menüyü incele" }),
    ).toBeVisible();
    await expect(
      page.getByText(/eklenti olarak açarsın/).first(),
    ).toBeVisible();
  });

  test("mobilde açılır navigasyon çalışır, masaüstünde inline menü var", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const toggle = page.getByRole("button", { name: "Menüyü aç" });
    await expect(toggle).toBeVisible();
    await toggle.click();
    const mobileNav = page.getByRole("navigation", { name: "Mobil menü" });
    await expect(mobileNav).toBeVisible();
    await expect(mobileNav.getByRole("link", { name: "Özellikler" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(mobileNav).toBeHidden();

    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.getByRole("button", { name: "Menüyü aç" })).toBeHidden();
    await expect(
      page.getByRole("navigation", { name: "Ana menü" }),
    ).toBeVisible();
  });

  test("bölüm bağlantıları sayfa içinde çalışır", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await page
      .getByRole("navigation", { name: "Ana menü" })
      .getByRole("link", { name: "Eklentiler" })
      .click();
    await expect(page).toHaveURL(/#eklentiler$/);
    await expect(
      page.getByRole("heading", { name: "Operasyon eklentileri" }),
    ).toBeInViewport();
    await expectNoHorizontalOverflow(page);
  });

  test("tüm kırılım noktalarında yatay taşma yok", async ({ page }) => {
    test.setTimeout(180_000);
    await sweepWidths(page, "/");
  });
});
