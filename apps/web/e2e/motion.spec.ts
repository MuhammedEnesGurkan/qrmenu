import { expect, test } from "@playwright/test";
import { mockAdminSession, mockTableSession } from "./helpers";

/**
 * Hareket sisteminin davranışsal sözleşmesi.
 *
 * Burada "animasyon güzel görünüyor mu" test edilmez — o göze bakar. Test
 * edilen şey animasyonun *bozmaması* gereken şeyler: kabuk yerinde kalmalı,
 * kapanan panel DOM'dan gerçekten çıkmalı, hareket azaltma ayarı dinlenmeli.
 * Bunlar bozulduğunda kullanıcı ya takılan bir arayüz ya da hiç kapanmayan
 * bir modal görür.
 */

test.describe("hareket sistemi", () => {
  test.beforeEach(async ({ page }) => {
    await mockAdminSession(page);
  });

  test("rota değişiminde yönetim kabuğu yeniden mount edilmez", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/admin");

    const sidebar = page
      .getByRole("navigation", { name: "Yönetim menüsü" })
      .first();
    await expect(sidebar).toBeVisible();

    // Kabuk üzerine iz bırak; gezinme sonrası hâlâ duruyorsa aynı DOM düğümü.
    await sidebar.evaluate((node) => {
      node.setAttribute("data-shell-probe", "1");
    });

    await sidebar.getByRole("link", { name: "Siparişler" }).click();
    await expect(page).toHaveURL(/\/admin\/siparisler$/);
    await expect(
      page.getByRole("heading", { name: "Sipariş ve garson akışı" }),
    ).toBeVisible();

    // İz duruyorsa sidebar remount olmadı: sayfa geçişi yalnız içerikte.
    await expect(sidebar).toHaveAttribute("data-shell-probe", "1");
  });

  test("giriş ekranı yönetim kabuğunun dışındadır", async ({ page }) => {
    await page.goto("/admin/giris");
    await expect(
      page.getByRole("heading", { name: "Yönetim paneline gir" }),
    ).toBeVisible();
    // Kabuk render edilseydi menü ya da alt navigasyon görünürdü.
    await expect(
      page.getByRole("navigation", { name: "Yönetim menüsü" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("navigation", { name: "Ana navigasyon" }),
    ).toHaveCount(0);
  });

  test("kapanan çekmece çıkış animasyonu bitince DOM'dan kalkar", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/admin");

    await page.getByRole("button", { name: "Daha fazla" }).click();
    await expect(page.getByText("Tüm bölümler")).toBeVisible();

    await page.getByRole("button", { name: "Kapat" }).click();
    // Anında kaybolmaz ama takılıp kalmaz da: animasyon bitince temizlenir.
    await expect(page.getByText("Tüm bölümler")).toHaveCount(0, {
      timeout: 2000,
    });

    // Scroll kilidi geri verilmiş olmalı, aksi halde sayfa donar.
    await expect
      .poll(() => page.evaluate(() => document.body.style.overflow))
      .not.toBe("hidden");
  });
});

test.describe("hareket azaltma", () => {
  test("prefers-reduced-motion açıkken panel kaymaz", async ({ page }) => {
    // Sayfa yüklenmeden önce ayarlanır: MotionConfig medya sorgusunu
    // render sırasında okur.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await mockTableSession(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/siparis");

    await page.getByRole("button", { name: "Flat White adedini artır" }).click();
    await page.getByRole("button", { name: /Sepeti gör/ }).click();

    const panel = page.getByRole("dialog");
    await expect(panel).toBeVisible();

    /*
     * Hareket azaltıldığında yaprak aşağıdan kaymaz, yalnız erir. Yerleşim
     * tamamlandığında transform kimlik matrisi (ya da none) olmalı.
     */
    await expect
      .poll(async () =>
        panel.evaluate((node) => getComputedStyle(node).transform),
      )
      .toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);

    // Kapanış hâlâ çalışıyor olmalı.
    await page.keyboard.press("Escape");
    await expect(panel).toHaveCount(0, { timeout: 2000 });
  });
});
