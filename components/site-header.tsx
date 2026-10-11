import Image from "next/image";
import Link from "next/link";
import { CartLink } from "@/components/cart-link";
import { DesignPicker } from "@/components/design-picker";
import { shopConfig } from "@/lib/shop-config";

export function SiteHeader() {
  return (
    <header className="site-header" style={{ viewTransitionName: "site-header" }}>
      <div className="site-header-bar mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-2.5">
        <Link href="/" transitionTypes={["nav-back"]} className="site-brand flex shrink-0 items-center gap-2.5 text-primary">
          <Image
            src={shopConfig.brand.logo}
            alt=""
            width={758}
            height={790}
            sizes="52px"
            className="site-logo h-14 w-auto shrink-0"
          />
          <span className="site-wordmark whitespace-nowrap font-serif text-xl leading-none">{shopConfig.shop.name}</span>
        </Link>
        <nav className="site-nav flex flex-wrap items-center justify-end gap-1 text-sm">
          {shopConfig.categories.map((category) => (
            <Link
              key={category.slug}
              href={`/catalog/${category.slug}`}
              transitionTypes={["nav-forward"]}
              className="nav-link"
            >
              {category.name}
            </Link>
          ))}
          <DesignPicker />
          <Link href="/cart" transitionTypes={["nav-forward"]} className="chip chip-idle">
            <CartLink />
          </Link>
        </nav>
      </div>
    </header>
  );
}
