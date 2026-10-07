import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSbpPayment } from "@/lib/payments/sbp";
import { getPaymentEnv } from "@/lib/env";
import { findDelivery } from "@/lib/shop-config";
import { kopecksToYookassa } from "@/lib/money";

export type OrderItemInput = {
  productId: string;
  qty: number;
};

export type CheckoutInput = {
  items: OrderItemInput[];
  name: string;
  phone: string;
  email: string;
  deliveryId: string;
  address: string;
  comment: string;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const orderErrors: Record<string, string> = {
  "invalid customer": "Укажите имя",
  "invalid phone": "Укажите телефон",
  "invalid delivery": "Выберите доставку",
  "cart is empty": "Корзина пуста",
  "invalid quantity": "Некорректное количество",
  "product unavailable": "Товар недоступен",
  "duplicate product": "Товар повторяется в корзине",
  "not enough stock": "Не хватает товара на складе",
};

function orderError(message: string | undefined) {
  if (!message) return "Не удалось создать заказ";
  for (const [needle, text] of Object.entries(orderErrors)) {
    if (message.includes(needle)) return text;
  }
  return message;
}

export function parseCartItems(input: unknown): OrderItemInput[] {
  if (!Array.isArray(input) || input.length === 0 || input.length > 50) {
    throw new Error("Корзина пуста");
  }
  const seen = new Set<string>();
  return input.map((item) => {
    const productId = typeof item?.productId === "string" ? item.productId : "";
    const qty = typeof item?.qty === "number" ? item.qty : Number(item?.qty);
    if (!uuidPattern.test(productId) || !Number.isInteger(qty) || qty < 1 || qty > 99) {
      throw new Error("В корзине некорректная позиция");
    }
    if (seen.has(productId)) throw new Error("Товар повторяется в корзине");
    seen.add(productId);
    return { productId, qty };
  });
}

export async function placeOrder(input: CheckoutInput) {
  const name = input.name.trim();
  const phone = input.phone.trim();
  const email = input.email.trim();
  const address = input.address.trim();
  const delivery = findDelivery(input.deliveryId);
  if (name.length < 2) throw new Error("Укажите имя");
  if (phone.length < 5) throw new Error("Укажите телефон");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Проверьте эл. почту");
  if (!delivery) throw new Error("Выберите доставку");
  if (delivery.price > 0 && address.length < 5) throw new Error("Укажите адрес доставки");

  const items = parseCartItems(input.items);
  const admin = createAdminClient();
  await admin.rpc("expire_unpaid_orders");

  const created = await admin.rpc("create_shop_order", {
    p_customer_name: name,
    p_phone: phone,
    p_email: email,
    p_delivery_id: delivery.id,
    p_delivery_name: delivery.name,
    p_delivery_fee: delivery.price,
    p_address: address,
    p_comment: input.comment.trim(),
    p_items: items.map((item) => ({ product_id: item.productId, qty: item.qty })),
  });
  if (created.error || !created.data) {
    throw new Error(orderError(created.error?.message));
  }

  const order = created.data as { id: string; number: string; access_token: string; total: number };
  const site = getPaymentEnv().AUTH_SITE_URL.replace(/\/$/, "");

  try {
    const payment = await createSbpPayment({
      orderId: order.id,
      totalKopecks: order.total,
      returnUrl: `${site}/order/${order.access_token}`,
      description: `Заказ ${order.number}`,
    });
    const saved = await admin.from("payments").upsert(
      {
        order_id: order.id,
        provider: "yookassa",
        provider_payment_id: payment.id,
        status: payment.status,
        amount: order.total,
        confirmation_url: payment.confirmationUrl,
        payload: { id: payment.id, status: payment.status },
      },
      { onConflict: "order_id" },
    );
    if (saved.error) throw new Error(saved.error.message);
    if (!payment.confirmationUrl) throw new Error("ЮKassa не вернула ссылку СБП");
    return { orderId: order.id, accessToken: order.access_token, confirmationUrl: payment.confirmationUrl };
  } catch (error) {
    await admin.rpc("release_order_stock", { p_order_id: order.id });
    throw error instanceof Error ? error : new Error("Не удалось открыть оплату СБП");
  }
}

export async function applyVerifiedPayment(payment: {
  id: string;
  status: string;
  amountValue: string;
  currency: string;
  orderId: string | null;
}) {
  if (!payment.orderId) return;
  const admin = createAdminClient();
  const orderResult = await admin
    .from("orders")
    .select("id, status, total")
    .eq("id", payment.orderId)
    .maybeSingle();
  const order = orderResult.data;
  if (!order) return;

  if (payment.status === "canceled") {
    await admin.rpc("release_order_stock", { p_order_id: order.id });
    await admin
      .from("payments")
      .update({ status: "canceled", provider_payment_id: payment.id })
      .eq("order_id", order.id);
    return;
  }

  if (payment.status !== "succeeded") return;
  if (payment.currency !== "RUB" || payment.amountValue !== kopecksToYookassa(order.total)) {
    throw new Error("Сумма платежа не совпала с заказом");
  }
  const marked = await admin.rpc("mark_order_paid", {
    p_order_id: order.id,
    p_external_id: payment.id,
  });
  if (marked.error) throw new Error(marked.error.message);
}

export type PublicOrder = {
  number: string;
  status: "pending_payment" | "paid" | "cancelled" | "fulfilled";
  subtotal: number;
  delivery_fee: number;
  delivery_name: string;
  total: number;
  order_items: { title: string; quantity: number; line_total: number }[];
};

export async function getOrderByToken(token: string): Promise<PublicOrder | null> {
  if (!/^[0-9a-f]{48}$/i.test(token)) return null;
  const admin = createAdminClient();
  const result = await admin
    .from("orders")
    .select("number, status, subtotal, delivery_fee, delivery_name, total, order_items(title, quantity, line_total)")
    .eq("access_token", token)
    .maybeSingle();
  if (result.error || !result.data) return null;
  return result.data as PublicOrder;
}
