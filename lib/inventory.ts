import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createAdminClient } from "@/lib/supabase/admin";

export type ShelfProduct = {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  category_slug: string;
  images: string[];
  stock: number;
  is_active: boolean;
};

const filePath = path.join(process.cwd(), "data", "products.json");

const samples: ShelfProduct[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    slug: "1001-tea",
    title: "Чай 1001 ночь",
    description: "Ферментированный лист, 50 г.",
    price: 45000,
    category_slug: "tea",
    images: [],
    stock: 20,
    is_active: true,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    slug: "linden-honey",
    title: "Липовый мёд",
    description: "Мёд этого лета, 250 г.",
    price: 89000,
    category_slug: "honey",
    images: [],
    stock: 12,
    is_active: true,
  },
];

export function databaseConfigured() {
  const url = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !service) return false;
  try {
    new URL(url);
  } catch {
    return false;
  }
  return !url.includes("example.ru") && !url.includes("example.com");
}

export function imageList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function asProduct(value: unknown): ShelfProduct | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (typeof row.id !== "string" || typeof row.slug !== "string" || typeof row.title !== "string") return null;
  const price = Number(row.price);
  const stock = Number(row.stock);
  if (!Number.isFinite(price) || !Number.isFinite(stock)) return null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: typeof row.description === "string" ? row.description : "",
    price,
    category_slug: typeof row.category_slug === "string" ? row.category_slug : "",
    images: imageList(row.images),
    stock,
    is_active: row.is_active !== false,
  };
}

function readFileProducts(): ShelfProduct[] | null {
  if (!fs.existsSync(filePath)) return null;
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")) as unknown;
  if (!Array.isArray(parsed)) return [];
  return parsed.flatMap((item) => {
    const product = asProduct(item);
    return product ? [product] : [];
  });
}

function writeFileProducts(products: ShelfProduct[]) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(products, null, 2)}\n`);
}

export function localShelf(): { products: ShelfProduct[]; demo: boolean } {
  const stored = readFileProducts();
  if (!stored) return { products: samples, demo: true };
  return { products: stored, demo: false };
}

export async function listShelf(): Promise<ShelfProduct[]> {
  if (!databaseConfigured()) return localShelf().products;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("products")
    .select("id,slug,title,description,price,category_slug,images,stock,is_active")
    .order("title", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).flatMap((item) => {
    const product = asProduct(item);
    return product ? [product] : [];
  });
}

const letters: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

export function slugify(title: string) {
  const slug = title
    .trim()
    .toLowerCase()
    .split("")
    .map((char) => letters[char] ?? char)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "tovar";
}

function uniqueSlug(title: string, products: ShelfProduct[], currentId?: string) {
  const base = slugify(title);
  const taken = new Set(products.filter((product) => product.id !== currentId).map((product) => product.slug));
  if (!taken.has(base)) return base;
  for (let index = 2; index < 100; index += 1) {
    const next = `${base}-${index}`;
    if (!taken.has(next)) return next;
  }
  return `${base}-${randomBytes(3).toString("hex")}`;
}

export async function storeUpload(file: File) {
  const extensions = new Map([
    ["image/jpeg", "jpg"],
    ["image/png", "png"],
    ["image/webp", "webp"],
    ["image/gif", "gif"],
  ]);
  const extension = extensions.get(file.type);
  if (!extension) throw new Error("Нужна картинка JPEG, PNG, WebP или GIF");
  if (file.size > 4 * 1024 * 1024) throw new Error("Картинка больше 4 МБ");
  const name = `${randomBytes(8).toString("hex")}.${extension}`;
  const directory = path.join(process.cwd(), "public", "uploads");
  await fs.promises.mkdir(directory, { recursive: true });
  await fs.promises.writeFile(path.join(directory, name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${name}`;
}

export function cleanImageUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("/uploads/")) {
    if (trimmed.includes("..") || trimmed.includes("\\")) throw new Error("Некорректная ссылка на картинку");
    return trimmed;
  }
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("Ссылка на картинку должна начинаться с https://");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Ссылка на картинку должна начинаться с https://");
  }
  return url.toString();
}

type ProductDraft = {
  id?: string;
  title: string;
  description: string;
  price: number;
  category_slug: string;
  stock: number;
  images: string[];
};

export async function saveShelfProduct(draft: ProductDraft) {
  const products = await listShelf();
  const current = draft.id ? products.find((product) => product.id === draft.id) : undefined;
  if (draft.id && !current) throw new Error("Товар не найден");
  const next: ShelfProduct = {
    id: current?.id ?? randomUUID(),
    slug: current?.slug ?? uniqueSlug(draft.title, products),
    title: draft.title,
    description: draft.description,
    price: draft.price,
    category_slug: draft.category_slug,
    images: draft.images.slice(0, 12),
    stock: draft.stock,
    is_active: current?.is_active ?? true,
  };
  if (databaseConfigured()) {
    const admin = createAdminClient();
    const row = {
      slug: next.slug,
      title: next.title,
      description: next.description,
      price: next.price,
      category_slug: next.category_slug,
      images: next.images,
      stock: next.stock,
      is_active: next.is_active,
      updated_at: new Date().toISOString(),
    };
    const query = current
      ? admin.from("products").update(row).eq("id", next.id)
      : admin.from("products").insert({ ...row, id: next.id });
    const { error } = await query;
    if (error) throw new Error(error.message);
    return;
  }
  const base = readFileProducts() ?? samples;
  const without = base.filter((product) => product.id !== next.id);
  writeFileProducts([...without, next]);
}

export async function setShelfActive(id: string, active: boolean) {
  const products = await listShelf();
  const current = products.find((product) => product.id === id);
  if (!current) throw new Error("Товар не найден");
  if (databaseConfigured()) {
    const admin = createAdminClient();
    const { error } = await admin
      .from("products")
      .update({ is_active: active, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return;
  }
  const base = readFileProducts() ?? samples;
  writeFileProducts(base.map((product) => (product.id === id ? { ...product, is_active: active } : product)));
}
