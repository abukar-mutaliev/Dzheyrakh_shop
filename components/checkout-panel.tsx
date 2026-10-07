"use client";

import { useState } from "react";
import Link from "next/link";
import { startCheckout } from "@/app/checkout/actions";
import { EmptyState } from "@/components/empty-state";
import { useCart } from "@/components/cart-provider";
import { formatPrice } from "@/lib/money";

type DeliveryOption = {
  id: string;
  name: string;
  price: number;
};

export function CheckoutPanel({
  delivery,
  pickupAddress,
}: {
  delivery: DeliveryOption[];
  pickupAddress: string;
}) {
  const { items, clear } = useCart();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [deliveryId, setDeliveryId] = useState(delivery[0]?.id ?? "");
  const selected = delivery.find((method) => method.id === deliveryId) ?? delivery[0];
  const goods = items.reduce((sum, item) => sum + item.priceKopecks * item.qty, 0);
  const needsAddress = (selected?.price ?? 0) > 0;
  const total = goods + (selected?.price ?? 0);

  if (items.length === 0) {
    return (
      <EmptyState
        title="Корзина пуста"
        text="Сначала положите что-нибудь с полки — тогда здесь появится заказ."
        href="/"
        action="В каталог"
      />
    );
  }

  return (
    <form
      className="grid items-start gap-6 md:grid-cols-2"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setPending(true);
        setError(null);
        const result = await startCheckout({
          items: items.map((item) => ({ productId: item.productId, qty: item.qty })),
          name: String(form.get("name") ?? ""),
          phone: String(form.get("phone") ?? ""),
          email: String(form.get("email") ?? ""),
          deliveryId,
          address: String(form.get("address") ?? ""),
          comment: String(form.get("comment") ?? ""),
        });
        if (result.error || !result.confirmationUrl) {
          setPending(false);
          setError(result.error || "Не удалось начать оплату");
          return;
        }
        clear();
        window.location.href = result.confirmationUrl;
      }}
    >
      <section className="panel space-y-4 p-6">
        <h2 className="font-serif text-2xl">Куда и кому</h2>
        <label className="label">
          Имя
          <input name="name" required minLength={2} autoComplete="name" className="field" />
        </label>
        <label className="label">
          Телефон
          <input
            name="phone"
            type="tel"
            required
            minLength={5}
            autoComplete="tel"
            placeholder="+7 900 000-00-00"
            className="field"
          />
        </label>
        <label className="label">
          Эл. почта
          <input name="email" type="email" autoComplete="email" placeholder="Необязательно" className="field" />
        </label>
        <fieldset className="space-y-2">
          <legend className="label">Как получить</legend>
          <div className="mt-2 space-y-2">
            {delivery.map((method) => {
              const active = deliveryId === method.id;
              return (
                <label
                  key={method.id}
                  className={`choice flex cursor-pointer items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${
                    active ? "border-primary bg-primary/5" : "border-foreground/10 bg-white"
                  }`}
                >
                  <span className="font-medium">
                    <input
                      type="radio"
                      name="delivery"
                      className="mr-2 accent-primary"
                      checked={active}
                      onChange={() => setDeliveryId(method.id)}
                    />
                    {method.name}
                  </span>
                  <span className="tabular-nums text-foreground/70">
                    {method.price === 0 ? "Бесплатно" : formatPrice(method.price)}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
        {needsAddress ? (
          <label className="label">
            Адрес
            <input
              name="address"
              required
              minLength={5}
              autoComplete="street-address"
              placeholder="Город, улица, дом, квартира"
              className="field"
            />
          </label>
        ) : (
          <p className="rounded-2xl bg-primary/5 px-4 py-3 text-sm leading-6 text-foreground/75">
            Самовывоз: {pickupAddress}. Адрес указывать не нужно.
            <input type="hidden" name="address" value="" />
          </p>
        )}
        <label className="label">
          Комментарий
          <textarea name="comment" className="field" rows={3} placeholder="Например, домофон или удобное время" />
        </label>
      </section>
      <section className="panel h-fit space-y-4 p-6 md:sticky md:top-24">
        <h2 className="font-serif text-2xl">К оплате</h2>
        <ul className="space-y-3 text-sm">
          {items.map((item) => (
            <li key={item.productId} className="flex justify-between gap-4 border-b border-dashed border-foreground/10 pb-3">
              <span>
                {item.title} × {item.qty}
              </span>
              <span className="tabular-nums">{formatPrice(item.priceKopecks * item.qty)}</span>
            </li>
          ))}
          <li className="flex justify-between gap-4">
            <span>{selected?.name}</span>
            <span className="tabular-nums">{selected?.price ? formatPrice(selected.price) : "Бесплатно"}</span>
          </li>
        </ul>
        <div className="flex items-end justify-between border-t border-foreground/10 pt-4">
          <span className="text-sm text-foreground/60">Итого</span>
          <p key={total} className="qty-pop font-serif text-4xl text-primary tabular-nums">
            {formatPrice(total)}
          </p>
        </div>
        {error ? (
          <p className="rounded-2xl bg-accent/10 px-4 py-3 text-sm text-accent" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" disabled={pending} className="btn btn-accent w-full">
          {pending ? "Открываем оплату..." : "Оплатить через СБП"}
        </button>
        <p className="text-center text-xs leading-5 text-foreground/55">
          Откроется страница ЮKassa. Можно вернуться к заказу, если передумаете.{" "}
          <Link href="/cart" transitionTypes={["nav-back"]} className="underline-offset-2 transition-colors duration-300 hover:underline">
            В корзину
          </Link>
        </p>
      </section>
    </form>
  );
}
