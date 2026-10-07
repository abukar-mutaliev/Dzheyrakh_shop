import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { OrderStatus } from "@/components/order-status";
import { PageTransition } from "@/components/page-transition";
import { formatPrice } from "@/lib/money";
import { getOrderByToken } from "@/lib/orders";
import { shopConfig } from "@/lib/shop-config";

async function OrderScreen({ params }: { params: Promise<{ token: string }> }) {
  await connection();
  const { token } = await params;
  let order = null;
  let error: string | null = null;
  try {
    order = await getOrderByToken(token);
  } catch (caught) {
    error = caught instanceof Error ? caught.message : "Статус заказа недоступен";
  }
  if (error) return <p className="rounded-2xl bg-accent/10 px-4 py-3 text-sm text-accent">{error}</p>;
  if (!order) notFound();

  return (
    <>
      <p className="eyebrow">Заказ {order.number}</p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight">Статус</h1>
      <OrderStatus status={order.status} />
      <ul className="panel mt-8 divide-y divide-foreground/10">
        {order.order_items.map((item, index) => (
          <li key={`${item.title}-${index}`} className="flex justify-between gap-4 p-5 text-sm">
            <span>
              {item.title} × {item.quantity}
            </span>
            <span className="tabular-nums">{formatPrice(item.line_total)}</span>
          </li>
        ))}
        <li className="flex justify-between gap-4 p-5 text-sm">
          <span>{order.delivery_name}</span>
          <span className="tabular-nums">{formatPrice(order.delivery_fee)}</span>
        </li>
      </ul>
      <p className="mt-6 font-serif text-4xl text-primary tabular-nums">{formatPrice(order.total)}</p>
      <div className="mt-8 flex flex-wrap gap-4 text-sm">
        <Link href="/" transitionTypes={["nav-back"]} className="font-semibold text-primary">
          Вернуться на полку
        </Link>
        {shopConfig.contacts.telegram ? (
          <a href={shopConfig.contacts.telegram} className="text-foreground/70 hover:text-primary" target="_blank" rel="noreferrer">
            Написать в Telegram
          </a>
        ) : null}
      </div>
    </>
  );
}

export default function OrderPage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <PageTransition>
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:py-16">
      <Suspense fallback={<p className="text-foreground/60">Ищем заказ...</p>}>
        <OrderScreen params={params} />
      </Suspense>
    </main>
    </PageTransition>
  );
}
