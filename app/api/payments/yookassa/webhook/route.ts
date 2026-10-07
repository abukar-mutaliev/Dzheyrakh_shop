import { applyVerifiedPayment } from "@/lib/orders";
import { fetchSbpPayment, isYookassaIp } from "@/lib/payments/sbp";

function callerIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "";
  return request.headers.get("x-real-ip")?.trim() ?? "";
}

export async function POST(request: Request) {
  const ip = callerIp(request);
  if (ip && !isYookassaIp(ip)) {
    return Response.json({ error: "Источник уведомления не из ЮKassa" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { object?: { id?: string } } | null;
  const paymentId = body?.object?.id;
  if (!paymentId) return Response.json({ error: "Нет платежа" }, { status: 400 });

  try {
    const payment = await fetchSbpPayment(paymentId);
    if (!payment) return Response.json({ error: "Платёж не найден в ЮKassa" }, { status: 400 });
    await applyVerifiedPayment(payment);
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось подтвердить оплату";
    return Response.json({ error: message }, { status: 500 });
  }
}
