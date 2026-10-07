import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { PageTransition } from "@/components/page-transition";
import { ImageSlider } from "@/components/image-slider";
import { shelfNote } from "@/components/product-art";
import { getProductBySlug } from "@/lib/catalog";
import { formatPrice } from "@/lib/money";
import { findCategory, shopConfig } from "@/lib/shop-config";

function stockCopy(stock: number) {
  if (stock < 1) return "Сейчас нет на полке";
  if (stock <= 5) return `Осталось ${stock} — лучше взять сейчас`;
  return `На полке ${stock} шт.`;
}

async function ProductScreen({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { product, error } = await getProductBySlug(slug);
  if (!product) {
    if (error) return <p className="rounded-2xl bg-accent/10 px-4 py-3 text-sm text-accent">{error}</p>;
    notFound();
  }
  const category = findCategory(product.category_slug);

  return (
    <article className="grid items-start gap-8 md:grid-cols-2">
      <div className="panel overflow-hidden md:sticky md:top-24">
        <ImageSlider
          title={product.title}
          category={product.category_slug}
          images={product.images}
          transitionName={`product-${product.slug}`}
          className="h-80 w-full md:h-[28rem]"
        />
      </div>
      <div>
        <Link
          href={category ? `/catalog/${category.slug}` : "/"}
          transitionTypes={["nav-back"]}
          className="text-sm font-medium text-foreground/55 transition-colors duration-300 hover:text-primary"
        >
          {category ? category.name : "В каталог"}
        </Link>
        <h1 className="mt-3 font-serif text-5xl leading-[1.05] tracking-tight">{product.title}</h1>
        <p className="mt-4 text-lg leading-8 text-foreground/75">{product.description}</p>
        <p className="mt-6 font-serif text-4xl text-primary tabular-nums">{formatPrice(product.price)}</p>
        <p className={`mt-2 text-sm ${product.stock <= 5 ? "font-medium text-accent" : "text-foreground/60"}`}>
          {stockCopy(product.stock)}
        </p>
        <div className="mt-6">
          <AddToCartButton product={product} />
        </div>
        <ul className="mt-8 space-y-2 text-sm leading-6 text-foreground/70">
          {shopConfig.delivery.map((method) => (
            <li key={method.id}>
              {method.name}
              {method.price === 0 ? " — бесплатно" : ` — ${formatPrice(method.price)}`}
            </li>
          ))}
          <li>Оплата через СБП, карта на сайте не нужна.</li>
        </ul>
        <aside className="panel mt-6 p-5">
          <p className="eyebrow">Записка с полки</p>
          <p className="mt-3 text-sm leading-6 text-foreground/75">{shelfNote(product.category_slug)}</p>
        </aside>
      </div>
    </article>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { product } = await getProductBySlug(slug);
  return {
    title: product ? `${product.title} — ${shopConfig.shop.name}` : shopConfig.shop.name,
    description: product?.description || shopConfig.shop.tagline,
  };
}

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <PageTransition>
    <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:py-16">
      <Suspense fallback={<p className="text-foreground/60">Открываем банку...</p>}>
        <ProductScreen params={params} />
      </Suspense>
    </main>
    </PageTransition>
  );
}
