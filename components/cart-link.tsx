"use client";

import { useCart } from "@/components/cart-provider";

export function CartLink() {
  const { items } = useCart();
  const count = items.reduce((sum, item) => sum + item.qty, 0);
  return (
    <span className="inline-flex items-center gap-2">
      Корзина
      {count > 0 ? (
        <span
          key={count}
          className="cart-pop inline-flex min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] leading-5 text-white"
        >
          {count}
        </span>
      ) : null}
    </span>
  );
}
