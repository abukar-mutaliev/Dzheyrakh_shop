import Image from "next/image";
import Link from "next/link";
import { Suspense, ViewTransition } from "react";
import { PageTransition } from "@/components/page-transition";
import { ProductArt } from "@/components/product-art";
import { ProductPhoto } from "@/components/product-photo";
import { getProducts } from "@/lib/catalog";
import { shopConfig } from "@/lib/shop-config";

const steps = [
  ["Выбираете", "На полке только чай, мёд и варенье — без длинного каталога."],
  ["Указываете получение", "Самовывоз или курьер. Адрес нужен только если заказ везут."],
  ["Платите через СБП", "Оплата открывается в ЮKassa. Карту на сайте вводить не нужно."],
];

async function CategoryTiles({
  categories,
}: {
  categories: { slug: string; name: string }[];
}) {
  const { products } = await getProducts();
  return (
    <div className="grid grid-cols-1 gap-3 min-[520px]:grid-cols-3 sm:gap-4 lg:grid-cols-1">
      {categories.map((category, index) => {
        const cover = products.find((product) => product.category_slug === category.slug && product.images.length > 0);
        return (
          <div key={category.slug} className="rise-in" style={{ animationDelay: `${index * 90}ms` }}>
          <Link
            href={`/catalog/${category.slug}`}
            transitionTypes={["nav-forward"]}
            className="panel lift group relative block h-full overflow-hidden"
          >
            {cover ? (
              <ViewTransition name={`product-${cover.slug}`} share="morph" enter="frame" exit="frame" default="none">
                <ProductPhoto
                  title={cover.title}
                  category={category.slug}
                  images={cover.images}
                  className="h-56 w-full sm:h-64 lg:h-44"
                />
              </ViewTransition>
            ) : (
              <ProductArt category={category.slug} className="h-56 sm:h-64 lg:h-44" />
            )}
            <span className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-primary">
              {category.name}
            </span>
          </Link>
          </div>
        );
      })}
    </div>
  );
}

export default function Home() {
  const { shop, contacts, categories } = shopConfig;
  return (
    <PageTransition>
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
      <section className="grid items-start gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
        <div className="rise-in">
          <Image
            src={shopConfig.brand.logo}
            alt=""
            width={758}
            height={790}
            sizes="(min-width: 640px) 220px, 168px"
            preload
            className="float-soft h-36 w-auto sm:h-44"
          />
          <p className="eyebrow mt-6">Чай, мёд и варенье</p>
          <h1 className="mt-3 max-w-xl font-serif text-5xl leading-[1.05] text-balance sm:text-6xl">{shop.name}</h1>
          <p className="mt-4 max-w-xl text-lg leading-8 text-foreground/75">{shop.tagline}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/catalog/${categories[0].slug}`} transitionTypes={["nav-forward"]} className="btn btn-primary">
              Смотреть {categories[0].name.toLowerCase()}
            </Link>
            {contacts.telegram ? (
              <a href={contacts.telegram} className="btn btn-quiet" target="_blank" rel="noreferrer">
                Написать в Telegram
              </a>
            ) : null}
          </div>
        </div>
        <Suspense
          fallback={
            <div className="grid grid-cols-1 gap-3 min-[520px]:grid-cols-3 sm:gap-4 lg:grid-cols-1">
              {categories.map((category) => (
                <div key={category.slug} className="panel h-56 sm:h-64 lg:h-44" />
              ))}
            </div>
          }
        >
          <CategoryTiles categories={categories} />
        </Suspense>
      </section>

      <section className="mt-16 grid gap-4 sm:grid-cols-3">
        {steps.map(([title, text], index) => (
          <div key={title} className="rise-in" style={{ animationDelay: `${180 + index * 90}ms` }}>
            <article className="panel lift h-full p-5">
              <p className="text-xs font-semibold tracking-[0.16em] text-accent">0{index + 1}</p>
              <h2 className="mt-3 font-serif text-2xl">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-foreground/70">{text}</p>
            </article>
          </div>
        ))}
      </section>

      <section className="panel rise-in mt-8 flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between" style={{ animationDelay: "460ms" }}>
        <div>
          <p className="eyebrow">Где мы</p>
          <p className="mt-2 text-sm leading-6 text-foreground/75">{contacts.address}</p>
        </div>
        <a className="text-lg font-semibold text-primary" href={`tel:${contacts.phone.replace(/[^\d+]/g, "")}`}>
          {contacts.phone}
        </a>
      </section>
    </main>
    </PageTransition>
  );
}
