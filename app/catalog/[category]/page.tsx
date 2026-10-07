import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EmptyState } from "@/components/empty-state";
import { PageTransition } from "@/components/page-transition";
import { ProductCard } from "@/components/product-card";
import { getProducts } from "@/lib/catalog";
import { findCategory, shopConfig } from "@/lib/shop-config";

async function CategoryCatalog({ params }: { params: Promise<{ category: string }> }) {
  const { category: slug } = await params;
  const category = findCategory(slug);
  if (!category) notFound();
  const { products, error, demo } = await getProducts();
  const visible = products.filter((product) => product.category_slug === category.slug);

  return (
    <>
      <Link href="/" transitionTypes={["nav-back"]} className="text-sm font-medium text-foreground/55 transition-colors duration-300 hover:text-primary">
        На главную
      </Link>
      <p className="eyebrow mt-6">{shopConfig.shop.name}</p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight">{category.name}</h1>
      <p className="mt-3 max-w-2xl text-lg leading-8 text-foreground/70">{category.description}</p>
      {error && !demo ? <p className="mt-6 rounded-2xl bg-accent/10 px-4 py-3 text-sm text-accent">{error}</p> : null}
      {!error && visible.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="В этой категории пусто"
            text="Загляните в другие разделы — на полке ещё есть что взять."
            href="/"
            action="На главную"
          />
        </div>
      ) : null}
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </ul>
    </>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const found = findCategory(category);
  return {
    title: found ? `${found.name} — ${shopConfig.shop.name}` : shopConfig.shop.name,
    description: found?.description || shopConfig.shop.tagline,
  };
}

export default function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  return (
    <PageTransition>
    <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:py-16">
      <Suspense fallback={<p className="text-foreground/60">Собираем полку...</p>}>
        <CategoryCatalog params={params} />
      </Suspense>
    </main>
    </PageTransition>
  );
}
