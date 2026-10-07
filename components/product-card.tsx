import Link from "next/link";
import { ImageSlider } from "@/components/image-slider";
import { formatPrice } from "@/lib/money";
import type { Product } from "@/lib/catalog";

export function ProductCard({ product }: { product: Product }) {
  return (
    <li className="panel lift group overflow-hidden">
      <ImageSlider
        title={product.title}
        category={product.category_slug}
        images={product.images}
        href={`/product/${product.slug}`}
        transitionName={`product-${product.slug}`}
        className="h-52 w-full"
      />
      <Link href={`/product/${product.slug}`} transitionTypes={["nav-forward"]} className="block">
        <div className="space-y-2 p-5">
          <h2 className="font-serif text-2xl transition-colors duration-300 group-hover:text-primary">{product.title}</h2>
          <p className="line-clamp-2 text-sm leading-6 text-foreground/70">{product.description}</p>
          <div className="flex items-baseline justify-between gap-3 pt-2">
            <p className="text-lg font-semibold text-primary tabular-nums">{formatPrice(product.price)}</p>
            {product.stock > 0 && product.stock <= 5 ? (
              <p className="text-xs font-semibold text-accent">Осталось {product.stock}</p>
            ) : null}
          </div>
        </div>
      </Link>
    </li>
  );
}
