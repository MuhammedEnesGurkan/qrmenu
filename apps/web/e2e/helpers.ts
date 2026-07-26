import { expect, type Page } from "@playwright/test";

/** Spec'te istenen tüm kırılım noktaları. */
export const BREAKPOINTS = [320, 360, 390, 430, 768, 1024, 1280, 1440];

export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    return {
      scrollWidth: root.scrollWidth,
      clientWidth: root.clientWidth,
    };
  });
  // 1px yuvarlama toleransı bırakılır.
  expect(
    overflow.scrollWidth,
    `yatay taşma: ${overflow.scrollWidth} > ${overflow.clientWidth}`,
  ).toBeLessThanOrEqual(overflow.clientWidth + 1);
}

/**
 * Sayfayı tüm kırılım noktalarında gezip yatay taşma olmadığını doğrular.
 * networkidle kullanılmaz: sipariş/mutfak ekranlarında SSE ve periyodik
 * yenileme nedeniyle ağ hiç boşa düşmez.
 */
export async function sweepWidths(page: Page, path: string) {
  for (const width of BREAKPOINTS) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");
    // İstemci tarafı ilk render ve veri yerleşimi için kısa bekleme.
    await page.waitForTimeout(300);
    await expectNoHorizontalOverflow(page);
  }
}

export async function expectTouchTarget(
  page: Page,
  selector: string,
  minimum = 44,
) {
  const box = await page.locator(selector).first().boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(minimum);
}

const OWNER = {
  userId: "00000000-0000-0000-0000-000000000001",
  tenantId: "00000000-0000-0000-0000-000000000002",
  branchId: "00000000-0000-0000-0000-000000000003",
  displayName: "Test Sahibi",
  role: "OWNER",
  permissions: [
    "tenant/manage",
    "catalog/write",
    "price/write",
    "order/accept-reject",
    "order/prepare-ready",
    "order/deliver",
    "membership/manage",
    "subscription/manage",
    "table/manage",
    "read",
  ],
};

const CATALOG = {
  menu: {
    id: "10000000-0000-0000-0000-000000000001",
    slug: "test-kafe",
    name: "Test Kafe",
    description: "Test menüsü",
    logoUrl: null,
    locale: "tr",
    published: true,
  },
  categories: [
    {
      id: "20000000-0000-0000-0000-000000000001",
      name: "Kahveler",
      sortOrder: 0,
      active: true,
      products: [
        {
          id: "30000000-0000-0000-0000-000000000001",
          categoryId: "20000000-0000-0000-0000-000000000001",
          sku: "CF-01",
          name: "Flat White",
          description: "Çift shot espresso",
          allergenInfo: "Süt içerir.",
          imageUrl: null,
          price: 125,
          currency: "TRY",
          sortOrder: 0,
          active: true,
          available: true,
          version: 1,
        },
      ],
    },
  ],
};

function jsonRoute(body: unknown) {
  return {
    contentType: "application/json",
    body: JSON.stringify(body),
  };
}

/** Yönetim ekranlarını backend olmadan çalıştırmak için ortak mock seti. */
export async function mockAdminSession(page: Page) {
  const routes: [string, unknown][] = [
    ["**/backend/api/auth/me", OWNER],
    ["**/backend/api/admin/catalog", CATALOG],
    ["**/backend/api/admin/addons", []],
    ["**/backend/api/admin/staff", []],
    ["**/backend/api/admin/orders", []],
    ["**/backend/api/admin/orders/waiter-calls", []],
    ["**/backend/api/admin/tables", []],
    [
      "**/backend/api/admin/features",
      {
        branches: [
          { id: "b1", name: "Merkez", active: true, current: true },
          { id: "b2", name: "Şube 2", active: true, current: false },
        ],
        branding: {
          primaryColor: "#14624b",
          surfaceColor: "#ffffff",
          font: "SYSTEM",
          layout: "CARDS",
          hidePoweredBy: false,
        },
        translations: [],
        totalProducts: 1,
      },
    ],
    [
      "**/backend/api/admin/kitchen",
      {
        publicPickupUrl: "/hazir/merkez",
        stations: [
          {
            id: "s1",
            name: "Sıcak mutfak",
            sortOrder: 0,
            active: true,
            categoryIds: ["20000000-0000-0000-0000-000000000001"],
          },
        ],
      },
    ],
    [
      "**/backend/api/admin/kitchen/stations/*/queue",
      [
        {
          itemId: "i1",
          orderId: "o1",
          productName: "Flat White",
          quantity: 2,
          notes: "Az sütlü",
          kitchenState: "QUEUED",
          orderState: "ACCEPTED",
          serviceMode: "DINE_IN",
          pickupNumber: null,
          tableName: "Masa 4",
          submittedAt: new Date(Date.now() - 6 * 60000).toISOString(),
        },
      ],
    ],
  ];

  for (const [pattern, body] of routes) {
    await page.route(pattern, (route) => route.fulfill(jsonRoute(body)));
  }

  // SSE akışı testte gerekmiyor; bağlantıyı boş bırak.
  await page.route("**/backend/api/admin/order-events", (route) =>
    route.fulfill({ contentType: "text/event-stream", body: "" }),
  );
}

export async function mockTableSession(page: Page) {
  await page.route("**/backend/api/table/menu", (route) =>
    route.fulfill(
      jsonRoute({
        tableName: "Masa 4",
        areaName: "Salon",
        orderingEnabled: true,
        selfServiceEnabled: true,
        menu: {
          name: "Test Kafe",
          categories: [
            {
              name: "Kahveler",
              products: [
                {
                  id: "30000000-0000-0000-0000-000000000001",
                  name: "Flat White",
                  description: "Çift shot espresso",
                  allergenInfo: null,
                  imageUrl: null,
                  price: 125,
                  currency: "TRY",
                  available: true,
                },
              ],
            },
            {
              name: "Tatlılar",
              products: [
                {
                  id: "30000000-0000-0000-0000-000000000002",
                  name: "San Sebastian",
                  description: "Fırın cheesecake",
                  allergenInfo: "Gluten içerir.",
                  imageUrl: null,
                  price: 185,
                  currency: "TRY",
                  available: true,
                },
              ],
            },
          ],
        },
      }),
    ),
  );
}
