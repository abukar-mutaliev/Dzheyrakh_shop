"use server";

import { placeOrder, type CheckoutInput } from "@/lib/orders";

export async function startCheckout(
  input: CheckoutInput,
): Promise<{ confirmationUrl?: string; error?: string }> {
  try {
    const payment = await placeOrder(input);
    return { confirmationUrl: payment.confirmationUrl };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Не удалось начать оплату" };
  }
}
