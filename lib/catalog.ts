import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { imageList, localShelf } from "@/lib/inventory";
import { categorySlugs } from "@/lib/shop-config";

export type Product = {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  category_slug: string;
  images: string[];
  stock: number;
};

type CatalogResult = {
  products: Product[];
  error: string | null;
  demo: boolean;
};

const demoNotice = "Локальные примеры товаров. База ещё не подключена.";

function catalogEnv() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    return { url: new URL(url).origin, key };
  } catch {
    return null;
  }
}

async function loadProducts(url: string, key: string): Promise<CatalogResult> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");

  try {
    const response = await fetch(
      `${url}/rest/v1/products?select=id,slug,title,description,price,category_slug,images,stock&is_active=eq.true&order=title.asc`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          Accept: "application/json",
        },
      },
    );
    if (!response.ok) {
      return { products: [], error: "Каталог временно недоступен", demo: false };
    }
    const rows = (await response.json()) as Product[];
    const allowed = categorySlugs();
    return {
      products: rows
        .map((product) => ({ ...product, images: imageList(product.images) }))
        .filter((product) => allowed.has(product.category_slug)),
      error: null,
      demo: false,
    };
  } catch {
    return { products: [], error: "Каталог временно недоступен", demo: false };
  }
}

async function loadLocal(): Promise<CatalogResult> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");

  const shelf = localShelf();
  const allowed = categorySlugs();
  return {
    products: shelf.products
      .filter((product) => product.is_active && allowed.has(product.category_slug))
      .map((product) => ({
        id: product.id,
        slug: product.slug,
        title: product.title,
        description: product.description,
        price: product.price,
        category_slug: product.category_slug,
        images: product.images,
        stock: product.stock,
      })),
    error: shelf.demo ? demoNotice : null,
    demo: shelf.demo,
  };
}

export async function getProducts(): Promise<CatalogResult> {
  const env = catalogEnv();
  if (!env) return loadLocal();
  return loadProducts(env.url, env.key);
}

export async function getProductBySlug(slug: string) {
  const { products, error } = await getProducts();
  return { product: products.find((item) => item.slug === slug) ?? null, error };
}
