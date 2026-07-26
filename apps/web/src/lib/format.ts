export function formatMoney(
  amount: number,
  currency: string,
  locale = "tr-TR",
) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/** "3 dk", "1 sa 12 dk" gibi kısa bekleme süresi etiketi üretir. */
export function elapsedLabel(from: string | number | Date, now = Date.now()) {
  const start = new Date(from).getTime();
  if (!Number.isFinite(start)) return "";
  const minutes = Math.max(0, Math.floor((now - start) / 60000));
  if (minutes < 1) return "Az önce";
  if (minutes < 60) return `${minutes} dk`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} sa` : `${hours} sa ${rest} dk`;
}

/**
 * Verilen hex rengin üstünde okunabilir metin rengini döner.
 * Tenant marka rengi ile WCAG kontrastını korumak için kullanılır.
 */
export function readableOn(hex: string): string {
  const normalized = hex.replace("#", "");
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return "#ffffff";
  const channel = (offset: number) => {
    const value = parseInt(full.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928
      ? value / 12.92
      : ((value + 0.055) / 1.055) ** 2.4;
  };
  const luminance =
    0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
  // Beyaz metnin kontrastı 4.5:1 altına düşerse koyu metne geçilir.
  return (1.05) / (luminance + 0.05) >= 4.5 ? "#ffffff" : "#14201a";
}

export function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
