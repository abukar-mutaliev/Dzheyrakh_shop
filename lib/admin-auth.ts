import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const cookieName = "shop_admin";

function token(password: string) {
  return createHmac("sha256", password).update("shop-admin-v1").digest("base64url");
}

export function adminPasswordRequired() {
  return Boolean(process.env.ADMIN_PASSWORD);
}

export async function adminOpen() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return process.env.NODE_ENV !== "production";
  const jar = await cookies();
  const value = jar.get(cookieName)?.value ?? "";
  const expected = token(password);
  if (value.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(value), Buffer.from(expected));
}

export async function openAdmin(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || password !== expected) return false;
  const jar = await cookies();
  jar.set(cookieName, token(expected), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return true;
}

export async function closeAdmin() {
  const jar = await cookies();
  jar.delete(cookieName);
}

export async function requireAdmin() {
  if (!(await adminOpen())) throw new Error("Нужен вход в полку");
}
