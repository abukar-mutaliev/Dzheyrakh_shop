import "server-only";
import { getPaymentEnv } from "@/lib/env";
import { kopecksToYookassa } from "@/lib/money";

export type SbpPayment = {
  id: string;
  status: string;
  confirmationUrl: string | null;
  amountValue: string;
  currency: string;
  orderId: string | null;
};

type YookassaPayment = {
  id: string;
  status: string;
  confirmation?: { confirmation_url?: string };
  amount?: { value?: string; currency?: string };
  metadata?: { order_id?: string };
  description?: string;
};

function authHeader() {
  const env = getPaymentEnv();
  return `Basic ${Buffer.from(`${env.YOOKASSA_SHOP_ID}:${env.YOOKASSA_SECRET_KEY}`).toString("base64")}`;
}

function mapPayment(payment: YookassaPayment): SbpPayment {
  return {
    id: payment.id,
    status: payment.status,
    confirmationUrl: payment.confirmation?.confirmation_url ?? null,
    amountValue: payment.amount?.value ?? "",
    currency: payment.amount?.currency ?? "",
    orderId: payment.metadata?.order_id ?? null,
  };
}

export async function createSbpPayment(input: {
  orderId: string;
  totalKopecks: number;
  returnUrl: string;
  description: string;
}) {
  const response = await fetch("https://api.yookassa.ru/v3/payments", {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Idempotence-Key": input.orderId,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: { value: kopecksToYookassa(input.totalKopecks), currency: "RUB" },
      capture: true,
      confirmation: { type: "redirect", return_url: input.returnUrl },
      payment_method_data: { type: "sbp" },
      description: input.description,
      metadata: { order_id: input.orderId },
    }),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as YookassaPayment | null;
  if (!response.ok || !payload?.id || !payload.confirmation?.confirmation_url) {
    throw new Error(payload?.description || "ЮKassa не создала платёж СБП");
  }
  return mapPayment(payload);
}

export async function fetchSbpPayment(paymentId: string) {
  const response = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}`, {
    headers: { Authorization: authHeader() },
    cache: "no-store",
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as YookassaPayment;
  if (!payload.id) return null;
  return mapPayment(payload);
}

const yookassaRanges: Array<[string, number]> = [
  ["185.71.76.0", 27],
  ["185.71.77.0", 27],
  ["77.75.153.0", 25],
  ["77.75.154.128", 25],
  ["77.75.156.11", 32],
  ["77.75.156.35", 32],
];

function ipv4ToInt(ip: string) {
  const parts = ip.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return null;
  }
  return (((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0);
}

function inRange(ip: string, base: string, bits: number) {
  const value = ipv4ToInt(ip);
  const network = ipv4ToInt(base);
  if (value == null || network == null) return false;
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (value & mask) === (network & mask);
}

export function isYookassaIp(ip: string) {
  if (!ip) return false;
  const normalized = ip.trim().toLowerCase();
  if (normalized.startsWith("2a02:5180:")) return true;
  return yookassaRanges.some(([base, bits]) => inRange(normalized, base, bits));
}
