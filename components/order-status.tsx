"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart-provider";

const details = {
  pending_payment: {
    label: "Ждём оплату",
    text: "Если платёж уже подтверждён в банке, статус на этой странице обновится сам.",
    tone: "bg-accent/10 text-accent",
  },
  paid: {
    label: "Оплачен",
    text: "Оплата прошла, заказ принят.",
    tone: "bg-primary/10 text-primary",
  },
  cancelled: {
    label: "Отменён",
    text: "Заказ отменён. Если это неожиданно — напишите нам, разберёмся.",
    tone: "bg-foreground/5 text-foreground/70",
  },
  fulfilled: {
    label: "Выполнен",
    text: "Заказ уже передан. Спасибо, что заглянули на полку.",
    tone: "bg-primary text-background",
  },
} as const;

export function OrderStatus({ status }: { status: keyof typeof details }) {
  const router = useRouter();
  const { clear } = useCart();
  const cleared = useRef(false);
  const detail = details[status];

  useEffect(() => {
    if (cleared.current) return;
    cleared.current = true;
    clear();
  }, [clear]);

  useEffect(() => {
    if (status !== "pending_payment") return;
    const timer = window.setInterval(() => router.refresh(), 5000);
    return () => window.clearInterval(timer);
  }, [router, status]);

  return (
    <div className={`mt-6 rounded-[1.5rem] px-5 py-4 ${detail.tone}`}>
      <p className="font-serif text-2xl">{detail.label}</p>
      <p className="mt-1 text-sm leading-6 opacity-80">{detail.text}</p>
    </div>
  );
}
