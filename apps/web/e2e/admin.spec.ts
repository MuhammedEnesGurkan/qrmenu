import { expect, test } from "@playwright/test";
import {
  expectNoHorizontalOverflow,
  mockAdminSession,
  sweepWidths,
} from "./helpers";

test.beforeEach(async ({ page }) => {
  await mockAdminSession(page);
});

test("admin shell masaüstünde sidebar, mobilde açılır menü gösterir", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/admin");

  const nav = page.getByRole("navigation", { name: "Yönetim menüsü" }).first();
  await expect(nav).toBeVisible();
  await expect(nav.getByRole("link", { name: "Genel bakış" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(page.getByRole("button", { name: "Menüyü aç", exact: true })).toBeHidden();

  await page.setViewportSize({ width: 390, height: 844 });
  const toggle = page.getByRole("button", { name: "Menüyü aç", exact: true });
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(
    page.getByRole("button", { name: "Menüyü kapat" }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("genel bakış özet kartlarını ve yayın durumunu gösterir", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/admin");

  await expect(page.getByRole("heading", { name: "Genel bakış" })).toBeVisible();
  await expect(page.getByText("Yayında", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("/m/test-kafe")).toBeVisible();
  await expect(page.getByText("Kategori", { exact: true })).toBeVisible();
});

test("yayından kaldırma onay diyaloğu ister", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  let unpublished = false;
  await page.route("**/backend/api/admin/catalog/unpublish", (route) => {
    unpublished = true;
    return route.fulfill({ status: 204, body: "" });
  });

  await page.goto("/admin");
  await page.getByRole("button", { name: "Yayından kaldır" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("heading", { name: "Menü yayından kaldırılsın mı?" }),
  ).toBeVisible();
  expect(unpublished).toBe(false);

  await dialog.getByRole("button", { name: "Vazgeç" }).click();
  await expect(dialog).toHaveCount(0);
  expect(unpublished).toBe(false);
});

test("sipariş ekranı backend enumu yerine Türkçe etiket kullanır", async ({
  page,
}) => {
  await page.route("**/backend/api/admin/orders", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: "o1",
          tableId: "t1",
          tableName: "Masa 4",
          serviceMode: "DINE_IN",
          state: "SUBMITTED",
          estimatedTotal: 250,
          currency: "TRY",
          customerNote: null,
          pickupNumber: null,
          version: 1,
          submittedAt: new Date(Date.now() - 4 * 60000).toISOString(),
          items: [
            { name: "Flat White", quantity: 2, unitPrice: 125, currency: "TRY" },
          ],
        },
      ]),
    }),
  );

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/admin/siparisler");

  await expect(page.getByText("Masa 4")).toBeVisible();
  await expect(page.getByText("Yeni", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("SUBMITTED")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Onaylandı" }),
  ).toBeVisible();
});

test("mutfak ekranı tablet yatay görünümde okunur kalır", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/admin/mutfak");

  await expect(
    page.getByRole("heading", { name: "Mutfak istasyonları" }),
  ).toBeVisible();
  await expect(page.getByRole("tab", { name: "Sıcak mutfak" })).toBeVisible();
  await expect(page.getByText("2× Flat White")).toBeVisible();
  await expect(page.getByText("Az sütlü")).toBeVisible();

  const action = page.getByRole("button", { name: "Hazırlamaya başla" });
  const box = await action.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(48);
  await expectNoHorizontalOverflow(page);
});

test("tüm yönetim ekranları kırılım noktalarında taşmıyor", async ({ page }) => {
  test.setTimeout(600_000);
  const routes = [
    "/admin",
    "/admin/menu",
    "/admin/masalar",
    "/admin/siparisler",
    "/admin/mutfak",
    "/admin/katalog-pro",
    "/admin/personel",
    "/admin/eklentiler",
    "/admin/ayarlar",
  ];
  for (const route of routes) {
    await sweepWidths(page, route);
  }
});
