import { z } from "zod";

const productSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  allergenInfo: z.string().nullable(),
  imageUrl: z.string().url().nullable(),
  price: z.number().nonnegative(),
  currency: z.string().length(3),
  available: z.boolean(),
});

const menuSchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  logoUrl: z.string().url().nullable(),
  locale: z.string(),
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

export async function getPublicMenu(slug: string): Promise<PublicMenu | null> {
  const baseUrl = process.env.API_URL ?? "http://localhost:8080";
  try {
    const response = await fetch(
      `${baseUrl}/api/public/menus/${encodeURIComponent(slug)}`,
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

