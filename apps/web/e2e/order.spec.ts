import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow, mockTableSession } from "./helpers";

test.beforeEach(async ({ page }) => {
  await mockTableSession(page);
});

test("sipariş ekranı sabit sepet çubuğu ve sepet sheet'i gösterir", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/siparis");

  await expect(page.getByRole("heading", { name: "Masa 4" })).toBeVisible();
  await expect(page.getByText("Salon")).toBeVisible();

  const cartButton = page.getByRole("button", { name: /Sepet/ });
  await expect(cartButton).toBeDisabled();

  await page.getByRole("button", { name: "Flat White adedini artır" }).click();
  await page.getByRole("button", { name: "Flat White adedini artır" }).click();
  await expect(cartButton).toContainText("2 ürün");
  await expect(cartButton).toContainText("₺250,00");

  // Sabit çubuk her zaman ekranda kalmalı.
  const box = await cartButton.boundingBox();
  expect(box).not.toBeNull();
  expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(844);

  await cartButton.click();
  const sheet = page.getByRole("dialog");
  await expect(sheet).toBeVisible();
  await expect(sheet.getByText("₺125,00 × 2")).toBeVisible();
  await expect(
    sheet.getByRole("button", { name: /Siparişi gönder/ }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("sipariş gönderimi başarı ekranı ve teslim numarası gösterir", async ({
  page,
}) => {
  await page.route("**/backend/api/table/orders", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        id: "o1",
        state: "SUBMITTED",
        estimatedTotal: 125,
        currency: "TRY",
        version: 1,
        pickupNumber: "A17",
      }),
    }),
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/siparis");

  await page.getByRole("radio", { name: "Gel-al / self servis" }).click();
  await page.getByRole("button", { name: "Flat White adedini artır" }).click();
  await page.getByRole("button", { name: /Sepet/ }).click();
  await page.getByRole("button", { name: /Siparişi gönder/ }).click();

  await expect(
    page.getByRole("heading", { name: "Siparişin alındı" }),
  ).toBeVisible();
  await expect(page.getByText("A17")).toBeVisible();
  await expect(
    page.getByText(/ödeme, POS veya mali belge değildir/i).first(),
  ).toBeVisible();
});

test("garson çağırma ana sipariş aksiyonundan ayrı bir düğmedir", async ({
  page,
}) => {
  await page.route("**/backend/api/table/waiter-calls", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ id: "c1" }),
    }),
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/siparis");

  const waiter = page.getByRole("button", { name: "Garson çağır" });
  await expect(waiter).toBeVisible();
  await waiter.click();
  await expect(page.getByText(/Garson çağrıldı/)).toBeVisible();
});

test("kategori navigasyonu masa menüsünde de çalışır", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/siparis");

  const nav = page.getByRole("navigation", { name: "Kategoriler" });
  await expect(nav).toBeVisible();
  await nav.getByRole("link", { name: "Tatlılar" }).click();
  await expect(
    page.getByRole("heading", { name: "Tatlılar", level: 2 }),
  ).toBeInViewport();
  await expectNoHorizontalOverflow(page);
});
