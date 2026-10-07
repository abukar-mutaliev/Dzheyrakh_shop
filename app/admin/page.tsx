import { Suspense } from "react";
import { connection } from "next/server";
import { AdminLogin, AdminPanel } from "@/components/admin-panel";
import { adminOpen, adminPasswordRequired } from "@/lib/admin-auth";
import { databaseConfigured, listShelf } from "@/lib/inventory";
import { shopConfig } from "@/lib/shop-config";

export const metadata = {
  title: `Товары — ${shopConfig.shop.name}`,
};

export default function AdminPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <Suspense fallback={<p className="text-foreground/60">Открываю полку...</p>}>
        <AdminScreen />
      </Suspense>
    </main>
  );
}

async function AdminScreen() {
  await connection();
  if (!(await adminOpen())) {
    return process.env.NODE_ENV === "production" && !process.env.ADMIN_PASSWORD ? (
      <p className="panel mx-auto mt-16 max-w-md p-6 text-sm leading-6">
        Задайте ADMIN_PASSWORD в .env.local и перезапустите магазин.
      </p>
    ) : (
      <AdminLogin />
    );
  }

  let products: Awaited<ReturnType<typeof listShelf>> = [];
  let loadError = "";
  try {
    products = await listShelf();
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Не удалось прочитать товары";
  }

  return (
    <AdminPanel
      products={products}
      categories={shopConfig.categories.map((category) => ({ slug: category.slug, name: category.name }))}
      locked={adminPasswordRequired()}
      local={!databaseConfigured()}
      loadError={loadError}
    />
  );
}
