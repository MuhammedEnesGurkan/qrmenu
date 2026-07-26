import { describe, expect, it } from "vitest";
import { elapsedLabel, readableOn } from "./format";
import { brandInitials, categoryAnchor } from "./menu";
import { ORDER_STATES, describe as describeState } from "./labels";

describe("readableOn", () => {
  it("koyu marka renginde beyaz metin seçer", () => {
    expect(readableOn("#14624b")).toBe("#ffffff");
  });

  it("açık marka renginde koyu metin seçer", () => {
    expect(readableOn("#ffe08a")).toBe("#14201a");
  });

  it("geçersiz değerde güvenli varsayılana döner", () => {
    expect(readableOn("nope")).toBe("#ffffff");
  });
});

describe("elapsedLabel", () => {
  const now = Date.UTC(2026, 6, 25, 12, 0, 0);

  it("bir dakikadan kısa süreyi 'Az önce' yazar", () => {
    expect(elapsedLabel(now - 20_000, now)).toBe("Az önce");
  });

  it("dakikayı gösterir", () => {
    expect(elapsedLabel(now - 7 * 60_000, now)).toBe("7 dk");
  });

  it("bir saati aşan süreyi saat ve dakika olarak böler", () => {
    expect(elapsedLabel(now - 72 * 60_000, now)).toBe("1 sa 12 dk");
  });
});

describe("brandInitials", () => {
  it("iki kelimeden baş harfleri alır", () => {
    expect(brandInitials("Demo Kafe")).toBe("DK");
  });

  it("tek kelimede ilk iki harfi Türkçe kurallarıyla büyütür", () => {
    expect(brandInitials("ışıl")).toBe("IŞ");
  });

  it("boş isimde çökmez", () => {
    expect(brandInitials("   ")).toBe("?");
  });
});

describe("categoryAnchor", () => {
  it("Türkçe karakterleri URL güvenli hale getirir", () => {
    expect(categoryAnchor("Sıcak İçecekler", 2)).toBe("kategori-2-sicak-icecekler");
  });

  it("harf içermeyen adlar için yedek kimlik üretir", () => {
    expect(categoryAnchor("###", 0)).toBe("kategori-0-bolum");
  });
});

describe("durum etiketleri", () => {
  it("backend enumunu Türkçe etikete çevirir", () => {
    expect(describeState(ORDER_STATES, "READY_FOR_PICKUP").label).toBe(
      "Teslime hazır",
    );
  });

  it("bilinmeyen durumu ham göstermek yerine güvenli biçimde döner", () => {
    expect(describeState(ORDER_STATES, null).label).toBe("Bilinmiyor");
  });
});
