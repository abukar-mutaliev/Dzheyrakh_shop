"use client";

import { useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/catalog";
import { useCart } from "@/components/cart-provider";

export function AddToCartButton({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const unavailable = product.stock < 1;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={unavailable}
        onClick={() => {
          addItem({
            productId: product.id,
            slug: product.slug,
            title: product.title,
            priceKopecks: product.price,
            stock: product.stock,
          });
          setAdded(true);
        }}
        className="btn btn-primary"
      >
        {unavailable ? "Нет в наличии" : added ? "Добавить ещё" : "В корзину"}
      </button>
      {added ? (
        <Link href="/cart" transitionTypes={["nav-forward"]} className="rise-in text-sm font-semibold text-primary underline-offset-4 hover:underline">
          Перейти в корзину
        </Link>
      ) : null}
    </div>
  );
}
