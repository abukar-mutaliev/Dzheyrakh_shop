import { Suspense } from "react";
import { connection } from "next/server";
import { CheckoutPanel } from "@/components/checkout-panel";
import { FlowSteps } from "@/components/flow-steps";
import { PageTransition } from "@/components/page-transition";
import { shopConfig } from "@/lib/shop-config";

async function CheckoutScreen() {
  await connection();
  return <CheckoutPanel delivery={shopConfig.delivery} pickupAddress={shopConfig.contacts.address} />;
}

export default function CheckoutPage() {
  return (
    <PageTransition>
    <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:py-16">
      <FlowSteps current={1} />
      <h1 className="mt-6 font-serif text-5xl tracking-tight">Оформление</h1>
      <p className="mt-3 max-w-xl text-foreground/70">Имя и телефон, чтобы отдать заказ. Почта — по желанию.</p>
      <div className="mt-8">
        <Suspense fallback={<p className="text-foreground/60">Готовим заказ...</p>}>
          <CheckoutScreen />
        </Suspense>
      </div>
    </main>
    </PageTransition>
  );
}
