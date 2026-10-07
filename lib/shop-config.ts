import { z } from "zod";
import rawConfig from "../shop.config";

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);

const shopSchema = z
  .object({
    shop: z.object({
      name: z.string().min(1),
      tagline: z.string(),
      locale: z.literal("ru"),
      currency: z.literal("RUB"),
    }),
    brand: z.object({
      logo: z.string(),
      colors: z.object({
        primary: hexColor,
        accent: hexColor,
        background: hexColor,
        foreground: hexColor,
      }),
    }),
    contacts: z.object({
      phone: z.string(),
      email: z.string(),
      telegram: z.string(),
      address: z.string(),
    }),
    categories: z
      .array(
        z.object({
          slug: z.string().min(1),
          name: z.string().min(1),
          description: z.string(),
        }),
      )
      .min(1),
    delivery: z
      .array(
        z.object({
          id: z.string().min(1),
          name: z.string().min(1),
          price: z.number().int().nonnegative(),
        }),
      )
      .min(1),
  })
  .superRefine((value, ctx) => {
    const slugs = value.categories.map((category) => category.slug);
    if (new Set(slugs).size !== slugs.length) {
      ctx.addIssue({ code: "custom", message: "Слаги категорий должны быть уникальными", path: ["categories"] });
    }
    const ids = value.delivery.map((method) => method.id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: "custom", message: "Идентификаторы доставки должны быть уникальными", path: ["delivery"] });
    }
  });

export type ShopConfig = z.infer<typeof shopSchema>;
export type ShopCategory = ShopConfig["categories"][number];
export type DeliveryMethod = ShopConfig["delivery"][number];

export const shopConfig: ShopConfig = shopSchema.parse(rawConfig);

export function findCategory(slug: string) {
  return shopConfig.categories.find((category) => category.slug === slug);
}

export function categorySlugs() {
  return new Set(shopConfig.categories.map((category) => category.slug));
}

export function findDelivery(id: string) {
  return shopConfig.delivery.find((method) => method.id === id);
}
