import { z } from "zod";

/**
 * Görsel adresleri iki biçimde gelebilir:
 * - Yüklenen assetler için aynı origin yolu (`/api/public/assets/{id}`)
 * - Elle girilen mutlak `https://` adresleri
 * Diğer şemalar (javascript:, data: vb.) güvenlik nedeniyle atılır.
 */
const imageUrlSchema = z
  .string()
  .nullable()
  .transform((value) => {
    if (!value) return null;
    if (value.startsWith("/") && !value.startsWith("//")) return value;
    return /^https?:\/\//i.test(value) ? value : null;
  });

const productSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  allergenInfo: z.string().nullable(),
  imageUrl: imageUrlSchema,
  price: z.number().nonnegative(),
  currency: z.string().length(3),
  available: z.boolean(),
});

const menuSchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  logoUrl: imageUrlSchema,
  locale: z.string(),
  availableLocales: z.array(z.string()).optional(),
  branding: z
    .object({
      primaryColor: z.string(),
      surfaceColor: z.string(),
      font: z.string(),
      layout: z.string(),
      hidePoweredBy: z.boolean(),
    })
    .optional(),
  categories: z.array(
    z.object({
      name: z.string(),
      products: z.array(productSchema),
    }),
  ),
});

export type PublicMenu = z.infer<typeof menuSchema>;
export type MenuProduct = z.infer<typeof productSchema>;

const demoMenu: PublicMenu = {
  slug: "demo-kafe",
  name: "Demo Kafe",
  description: "Günün iyi anlarına eşlik eden taze lezzetler.",
  logoUrl: null,
  locale: "tr",
  categories: [
    {
      name: "Kahveler",
      products: [
        {
          id: "50000000-0000-0000-0000-000000000001",
          name: "Flat White",
          description: "Çift shot espresso ve kadifemsi süt.",
          allergenInfo: "Süt içerir.",
          imageUrl: null,
          price: 125,
          currency: "TRY",
          available: true,
        },
        {
          id: "50000000-0000-0000-0000-000000000002",
          name: "Filtre Kahve",
          description: "Günün çekirdeğiyle taze demlenir.",
          allergenInfo: null,
          imageUrl: null,
          price: 95,
          currency: "TRY",
          available: true,
        },
      ],
    },
    {
      name: "Tatlılar",
      products: [
        {
          id: "50000000-0000-0000-0000-000000000003",
          name: "San Sebastian",
          description: "Yoğun kıvamlı fırın cheesecake.",
          allergenInfo: "Süt, yumurta ve gluten içerir.",
          imageUrl: null,
          price: 185,
          currency: "TRY",
          available: true,
        },
      ],
    },
  ],
};

export async function getPublicMenu(slug: string,locale?:string): Promise<PublicMenu | null> {
  const baseUrl = process.env.API_URL ?? "http://localhost:8080";
  try {
    const response = await fetch(
      `${baseUrl}/api/public/menus/${encodeURIComponent(slug)}${locale?"?locale="+encodeURIComponent(locale):""}`,
      { next: { revalidate: 30 } },
    );
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Menu API returned ${response.status}`);
    return menuSchema.parse(await response.json());
  } catch (error) {
    if (process.env.NODE_ENV !== "production" && slug === "demo-kafe") {
      return demoMenu;
    }
    console.error("Public menu could not be loaded", error);
    return null;
  }
}

export { formatMoney } from "./format";

export type MenuLayout = "CARDS" | "COMPACT";

export type Branding = {
  primaryColor: string;
  surfaceColor: string;
  font: string;
  layout: MenuLayout;
  hidePoweredBy: boolean;
};

export const DEFAULT_BRANDING: Branding = {
  primaryColor: "#14624b",
  surfaceColor: "#ffffff",
  font: "SYSTEM",
  layout: "CARDS",
  hidePoweredBy: false,
};

const FONT_STACKS: Record<string, string> = {
  SERIF: 'Georgia, "Times New Roman", serif',
  ROUNDED: 'ui-rounded, "SF Pro Rounded", var(--font-sans)',
  SYSTEM: "var(--font-sans)",
};

export function resolveBranding(menu: PublicMenu): Branding {
  const raw = menu.branding;
  if (!raw) return DEFAULT_BRANDING;
  return {
    primaryColor: raw.primaryColor || DEFAULT_BRANDING.primaryColor,
    surfaceColor: raw.surfaceColor || DEFAULT_BRANDING.surfaceColor,
    font: raw.font || DEFAULT_BRANDING.font,
    layout: raw.layout === "COMPACT" ? "COMPACT" : "CARDS",
    hidePoweredBy: Boolean(raw.hidePoweredBy),
  };
}

export function fontStack(font: string) {
  return FONT_STACKS[font] ?? FONT_STACKS.SYSTEM;
}

/** İşletme adından iki harfli, logo yoksa kullanılacak marka baş harfleri. */
export function brandInitials(name: string) {
  const words = name
    .trim()
    .split(/\s+/)
    .filter((word) => /\p{L}/u.test(word));
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toLocaleUpperCase("tr-TR");
  return (words[0][0] + words[1][0]).toLocaleUpperCase("tr-TR");
}

/** Kategori adından kararlı ve URL güvenli bir bölüm kimliği üretir. */
export function categoryAnchor(name: string, index: number) {
  const slug = name
    .toLocaleLowerCase("tr-TR")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `kategori-${index}-${slug || "bolum"}`;
}
