import "server-only";
import { z } from "zod";

const supabaseSchema = z.object({
  SUPABASE_URL: z.url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

const paymentSchema = supabaseSchema.extend({
  AUTH_SITE_URL: z.url(),
  YOOKASSA_SHOP_ID: z.string().min(1),
  YOOKASSA_SECRET_KEY: z.string().min(1),
});

function readEnv<T extends z.ZodType>(schema: T): z.infer<T> {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const names = parsed.error.issues
      .map((issue) => issue.path.join("."))
      .filter(Boolean)
      .join(", ");
    throw new Error(
      names ? `Заполните переменные в .env.local: ${names}` : "Заполните переменные в .env.local",
    );
  }
  return parsed.data;
}

export function getSupabaseEnv() {
  return readEnv(supabaseSchema);
}

export function getPaymentEnv() {
  return readEnv(paymentSchema);
}
