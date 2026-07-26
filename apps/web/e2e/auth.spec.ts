import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow, sweepWidths } from "./helpers";

test("registration form hydrates and sends a POST request", async ({ page }) => {
  let registerMethod = "";
  await page.route("**/backend/api/auth/register", async (route) => {
    registerMethod = route.request().method();
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        userId: "00000000-0000-0000-0000-000000000001",
        tenantId: "00000000-0000-0000-0000-000000000002",
        branchId: "00000000-0000-0000-0000-000000000003",
        displayName: "Test User",
        role: "OWNER",
        permissions: [],
      }),
    });
  });

  await page.goto("/admin/kayit");
  await page.getByLabel("Ad soyad").fill("Test User");
  await page.getByLabel("İşletme adı").fill("Test Kafe");
  await page.getByLabel("E-posta").fill("test@example.com");
  await page.getByLabel("Parola", { exact: true }).fill("guvenli-parola-123");
  await page.getByRole("button", { name: "Hesap oluştur" }).click();

  await expect.poll(() => registerMethod).toBe("POST");
  await expect(page).not.toHaveURL(/\?/);
});

test("giriş formu parola göster/gizle ve alan hatası gösterir", async ({
  page,
}) => {
  await page.goto("/admin/giris");
  await expect(
    page.getByRole("heading", { name: "Yönetim paneline gir" }),
  ).toBeVisible();

  const password = page.getByLabel("Parola", { exact: true });
  await password.fill("gizli-parola");
  await expect(password).toHaveAttribute("type", "password");

  await page.getByRole("button", { name: "Parolayı göster" }).click();
  await expect(password).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Parolayı gizle" }).click();
  await expect(password).toHaveAttribute("type", "password");

  // Geçersiz e-posta ile alan bazlı hata görünür ve istek gönderilmez.
  let requested = false;
  await page.route("**/backend/api/auth/login", (route) => {
    requested = true;
    return route.fulfill({ status: 401, body: "{}" });
  });
  await page.getByLabel("E-posta").fill("gecersiz");
  await page.getByRole("button", { name: "Giriş yap" }).click();
  await expect(
    page.getByText("Geçerli bir e-posta adresi gir."),
  ).toBeVisible();
  expect(requested).toBe(false);
});

test("kayıt sunucu hatasını genel uyarı olarak gösterir", async ({ page }) => {
  await page.route("**/backend/api/auth/register", (route) =>
    route.fulfill({
      status: 409,
      contentType: "application/json",
      body: JSON.stringify({ message: "Bu e-posta zaten kayıtlı." }),
    }),
  );

  await page.goto("/admin/kayit");
  await page.getByLabel("Ad soyad").fill("Test User");
  await page.getByLabel("İşletme adı").fill("Test Kafe");
  await page.getByLabel("E-posta").fill("test@example.com");
  await page.getByLabel("Parola", { exact: true }).fill("guvenli-parola-123");
  await page.getByRole("button", { name: "Hesap oluştur" }).click();

  await expect(page.getByText("Bu e-posta zaten kayıtlı.")).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("auth ekranı tüm kırılım noktalarında taşmıyor", async ({ page }) => {
  test.setTimeout(180_000);
  await sweepWidths(page, "/admin/kayit");
});
