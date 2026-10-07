"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { closeAdmin, openAdmin, requireAdmin } from "@/lib/admin-auth";
import { cleanImageUrl, listShelf, saveShelfProduct, setShelfActive, storeUpload } from "@/lib/inventory";
import { categorySlugs } from "@/lib/shop-config";

export type FormState = { error: string };

function rublesToKopecks(raw: string) {
  const normalized = raw.replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new Error("Укажите цену в рублях, например 450 или 450,50");
  }
  return Math.round(Number(normalized) * 100);
}

export async function loginAdmin(_previous: FormState, formData: FormData): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  if (!(await openAdmin(password))) return { error: "Неверный пароль" };
  redirect("/admin");
}

export async function logoutAdmin() {
  await closeAdmin();
  redirect("/admin");
}

export async function saveProduct(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  try {
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const category = String(formData.get("category") ?? "");
    const stock = Number(String(formData.get("stock") ?? ""));
    const id = String(formData.get("id") ?? "").trim();
    if (title.length < 2) throw new Error("Название слишком короткое");
    if (!categorySlugs().has(category)) throw new Error("Выберите категорию из списка");
    if (!Number.isInteger(stock) || stock < 0 || stock > 100000) {
      throw new Error("Остаток должен быть целым числом");
    }
    const price = rublesToKopecks(String(formData.get("price") ?? ""));
    const current = id ? (await listShelf()).find((product) => product.id === id) : undefined;
    if (id && !current) throw new Error("Товар не найден");
    const kept = formData
      .getAll("keep_image")
      .map((value) => cleanImageUrl(String(value)))
      .filter(Boolean);
    const links = formData
      .getAll("image_url")
      .map((value) => cleanImageUrl(String(value)))
      .filter(Boolean);
    const files = formData
      .getAll("images")
      .filter((file): file is File => file instanceof File && file.size > 0);
    if (kept.length + links.length + files.length > 12) throw new Error("У товара не больше 12 фото");
    const uploaded: string[] = [];
    for (const file of files) uploaded.push(await storeUpload(file));
    const images = [...new Set([...kept, ...uploaded, ...links])];
    await saveShelfProduct({
      id: id || undefined,
      title,
      description,
      price,
      category_slug: category,
      stock,
      images,
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Не удалось сохранить товар" };
  }
  updateTag("products");
  redirect("/admin");
}

export async function setProductActive(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  await setShelfActive(id, active);
  updateTag("products");
  redirect("/admin");
}
