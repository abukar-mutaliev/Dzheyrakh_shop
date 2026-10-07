import { connection } from "next/server";
import { Suspense } from "react";
import { CartView } from "@/components/cart-view";
import { FlowSteps } from "@/components/flow-steps";
import { PageTransition } from "@/components/page-transition";

async function CartScreen() {
  await connection();
  return <CartView />;
}

export default function CartPage() {
  return (
    <PageTransition>
    <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:py-16">
      <FlowSteps current={0} />
      <h1 className="mt-6 font-serif text-5xl tracking-tight">Корзина</h1>
      <p className="mt-3 max-w-xl text-foreground/70">Проверьте состав. Дальше — как получить заказ и оплата через СБП.</p>
      <div className="mt-8">
        <Suspense fallback={<p className="text-foreground/60">Собираем корзину...</p>}>
          <CartScreen />
        </Suspense>
      </div>
    </main>
    </PageTransition>
  );
}
