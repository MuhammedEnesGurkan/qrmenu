import { expect, test } from "@playwright/test";

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
  await page.getByLabel("Parola").fill("guvenli-parola-123");
  await page.getByRole("button", { name: "Hesap oluştur" }).click();

  await expect.poll(() => registerMethod).toBe("POST");
  await expect(page).not.toHaveURL(/\?/);
});
