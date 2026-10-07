"use client";

import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { useCart } from "@/components/cart-provider";
import { formatPrice } from "@/lib/money";

export function CartView() {
  const { items, setQty, removeItem } = useCart();
  const total = items.reduce((sum, item) => sum + item.priceKopecks * item.qty, 0);

  if (items.length === 0) {
    return (
      <EmptyState
        title="На полке пока пусто"
        text="Чай, мёд и варенье ждут в каталоге. Соберите заказ и оформите его за пару минут."
        href="/"
        action="Открыть каталог"
      />
    );
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.8fr)]">
      <ul className="panel divide-y divide-foreground/10">
        {items.map((item) => (
          <li key={item.productId} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link href={`/product/${item.slug}`} transitionTypes={["nav-forward"]} className="font-semibold transition-colors duration-300 hover:text-primary">
                {item.title}
              </Link>
              <p className="mt-1 text-sm text-foreground/60 tabular-nums">{formatPrice(item.priceKopecks)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="inline-flex items-center rounded-full border border-foreground/10 bg-white">
                <button
                  type="button"
                  className="qty-btn h-10 w-10 rounded-full text-lg leading-none disabled:opacity-30"
                  aria-label={`Уменьшить количество: ${item.title}`}
                  disabled={item.qty <= 1}
                  onClick={() => setQty(item.productId, item.qty - 1)}
                >
                  −
                </button>
                <span key={item.qty} className="qty-pop w-6 text-center text-sm tabular-nums">
                  {item.qty}
                </span>
                <button
                  type="button"
                  className="qty-btn h-10 w-10 rounded-full text-lg leading-none disabled:opacity-30"
                  aria-label={`Увеличить количество: ${item.title}`}
                  disabled={item.qty >= item.stock}
                  onClick={() => setQty(item.productId, item.qty + 1)}
                >
                  +
                </button>
              </div>
              <p className="min-w-24 text-right font-semibold tabular-nums">{formatPrice(item.priceKopecks * item.qty)}</p>
              <button type="button" className="text-sm text-foreground/50 hover:text-accent" onClick={() => removeItem(item.productId)}>
                Удалить
              </button>
            </div>
          </li>
        ))}
      </ul>
      <aside className="panel h-fit p-6 lg:sticky lg:top-24">
        <p className="eyebrow">К оплате</p>
        <p key={total} className="qty-pop mt-3 font-serif text-4xl text-primary tabular-nums">
          {formatPrice(total)}
        </p>
        <p className="mt-2 text-sm leading-6 text-foreground/65">Доставку выберете на следующем шаге: самовывоз или курьер.</p>
        <Link href="/checkout" transitionTypes={["nav-forward"]} className="btn btn-primary mt-6 w-full">
          Оформить заказ
        </Link>
      </aside>
    </div>
  );
}
