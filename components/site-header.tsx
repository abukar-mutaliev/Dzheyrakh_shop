import Image from "next/image";
import Link from "next/link";
import { shopConfig } from "@/lib/shop-config";
import { CartLink } from "@/components/cart-link";

export function SiteHeader() {
  return (
    <header
      className="sticky top-0 z-20 border-b border-foreground/10 bg-background/80 backdrop-blur-md"
      style={{ viewTransitionName: "site-header" }}
    >
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-2.5">
        <Link href="/" transitionTypes={["nav-back"]} className="flex shrink-0 items-center gap-2.5 text-primary">
          <Image
            src={shopConfig.brand.logo}
            alt=""
            width={758}
            height={790}
            sizes="52px"
            className="h-14 w-auto shrink-0"
          />
          <span className="whitespace-nowrap font-serif text-xl leading-none">{shopConfig.shop.name}</span>
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-1 text-sm">
          {shopConfig.categories.map((category) => (
            <Link
              key={category.slug}
              href={`/catalog/${category.slug}`}
              transitionTypes={["nav-forward"]}
              className="rounded-full px-3 py-2 transition duration-300 hover:-translate-y-0.5 hover:bg-white/80"
            >
              {category.name}
            </Link>
          ))}
          <Link href="/cart" transitionTypes={["nav-forward"]} className="chip chip-idle">
            <CartLink />
          </Link>
        </nav>
      </div>
    </header>
  );
}
