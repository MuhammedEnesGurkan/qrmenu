import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow, sweepWidths } from "./helpers";

test.describe("public QR menü", () => {
  test("başlık, kategoriler ve ürünler görünür", async ({ page }) => {
    await page.goto("/m/demo-kafe");
    await expect(
      page.getByRole("heading", { name: "Demo Kafe", level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Kahveler", level: 2 }),
    ).toBeVisible();
    await expect(page.getByText("₺125,00").first()).toBeVisible();
    await expect(page.locator("meta[name=viewport]")).toHaveAttribute(
      "content",
      /width=device-width/,
    );
  });

  test("logo yoksa işletme adından baş harf üretilir", async ({ page }) => {
    await page.goto("/m/demo-kafe");
    // Sabit "M" harfi değil, işletme adının baş harfleri kullanılır.
    await expect(page.getByText("DK", { exact: true })).toBeVisible();
  });

  test("arama sonuçları filtreler ve boş sonucu bildirir", async ({ page }) => {
    await page.goto("/m/demo-kafe");
    const search = page.getByRole("searchbox", { name: "Menüde ara" });
    await expect(search).toBeVisible();

    const box = await search.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);

    // WebKit'te fill() type="search" alanlarında React onChange tetiklemiyor;
    // gerçek tuş vuruşu hem daha gerçekçi hem tüm motorlarda güvenilir.
    await search.click();
    await search.pressSequentially("san");
    await expect(
      page.getByRole("heading", { name: "Tatlılar", level: 2 }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Kahveler", level: 2 }),
    ).toHaveCount(0);

    await page.getByRole("button", { name: "Aramayı temizle" }).click();
    await search.pressSequentially("bulunmayanurun");
    await expect(
      page.getByRole("heading", { name: "Aramana uygun ürün yok" }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("kategori navigasyonu ilgili bölüme götürür", async ({ page }) => {
    await page.goto("/m/demo-kafe");
    const nav = page.getByRole("navigation", { name: "Kategoriler" });
    await expect(nav).toBeVisible();
    await nav.getByRole("link", { name: "Tatlılar" }).click();
    await expect(page).toHaveURL(/#kategori-1-tatlilar$/);
    // Yumuşak kaydırmanın oturması için kısa bekleme.
    await page.waitForTimeout(800);
    await expect(
      page.getByRole("heading", { name: "Tatlılar", level: 2 }),
    ).toBeInViewport();
  });

  test("ürün detayı dialog olarak açılır ve Escape ile kapanır", async ({
    page,
  }) => {
    await page.goto("/m/demo-kafe");
    await page.getByRole("button", { name: /Flat White/ }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("heading", { name: "Flat White" }),
    ).toBeVisible();
    await expect(dialog.getByText("Alerjen bilgisi")).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
  });

  test("tüm kırılım noktalarında yatay taşma yok", async ({ page }) => {
    test.setTimeout(180_000);
    await sweepWidths(page, "/m/demo-kafe");
  });
});
