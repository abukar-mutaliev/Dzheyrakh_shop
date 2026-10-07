"use client";

import { useActionState, useState } from "react";
import { ProductPhoto } from "@/components/product-photo";
import { loginAdmin, logoutAdmin, saveProduct, setProductActive, type FormState } from "@/app/admin/actions";
import { formatPrice } from "@/lib/money";

export type ShelfItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  category_slug: string;
  images: string[];
  stock: number;
  is_active: boolean;
};

const emptyState: FormState = { error: "" };

function rubles(kopecks: number) {
  const value = kopecks / 100;
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(".", ",");
}

export function AdminLogin() {
  const [state, action, pending] = useActionState(loginAdmin, emptyState);
  return (
    <form action={action} className="panel mx-auto mt-16 max-w-md p-6">
      <p className="eyebrow">Полка</p>
      <h1 className="mt-2 font-serif text-4xl">Вход</h1>
      <label className="label mt-6">
        Пароль
        <input name="password" type="password" required autoComplete="current-password" className="field" />
      </label>
      {state.error ? <p className="mt-4 text-sm text-accent">{state.error}</p> : null}
      <button type="submit" disabled={pending} className="btn btn-primary mt-6">
        {pending ? "Проверяю..." : "Войти"}
      </button>
    </form>
  );
}

export function AdminPanel({
  products,
  categories,
  locked,
  local,
  loadError,
}: {
  products: ShelfItem[];
  categories: { slug: string; name: string }[];
  locked: boolean;
  local: boolean;
  loadError: string;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [kept, setKept] = useState<string[]>([]);
  const [files, setFiles] = useState<{ file: File; url: string }[]>([]);
  const [links, setLinks] = useState<string[]>([]);
  const [linkDraft, setLinkDraft] = useState("");
  const [linkError, setLinkError] = useState("");
  const [state, action, pending] = useActionState(saveProduct, emptyState);
  const current = products.find((product) => product.id === editing);
  const categoryName = (slug: string) => categories.find((category) => category.slug === slug)?.name ?? slug;
  const photoCount = kept.length + files.length + links.length;

  function openEditor(id: string | null) {
    const product = products.find((item) => item.id === id);
    for (const item of files) URL.revokeObjectURL(item.url);
    setEditing(id);
    setKept(product?.images ?? []);
    setFiles([]);
    setLinks([]);
    setLinkDraft("");
    setLinkError("");
  }

  function addLink() {
    const value = linkDraft.trim();
    if (!value) return;
    if (!value.startsWith("https://") && !value.startsWith("http://") && !value.startsWith("/uploads/")) {
      setLinkError("Ссылка должна начинаться с https://");
      return;
    }
    if (photoCount >= 12) {
      setLinkError("У товара не больше 12 фото");
      return;
    }
    if (kept.includes(value) || links.includes(value)) return;
    setLinkError("");
    setLinks((items) => [...items, value]);
    setLinkDraft("");
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <form
        key={current?.id ?? "new"}
        className="panel p-6"
        action={(formData) => {
          for (const item of files) formData.append("images", item.file);
          action(formData);
        }}
      >
        <p className="eyebrow">{current ? "Правка" : "Новый товар"}</p>
        <h1 className="mt-2 font-serif text-4xl">{current ? current.title : "Добавить на полку"}</h1>
        <p className="mt-3 text-sm leading-6 text-foreground/70">
          {local
            ? "База ещё не подключена: товар и фото сохранятся на этом компьютере и сразу появятся в каталоге."
            : "Товар запишется в базу магазина."}
        </p>
        <input type="hidden" name="id" value={current?.id ?? ""} />
        {kept.map((src) => (
          <input key={src} type="hidden" name="keep_image" value={src} />
        ))}
        {links.map((src) => (
          <input key={src} type="hidden" name="image_url" value={src} />
        ))}
        <label className="label mt-6">
          Название
          <input name="title" required defaultValue={current?.title ?? ""} className="field" placeholder="Гречишный мёд" />
        </label>
        <label className="label mt-4">
          Описание
          <textarea
            name="description"
            rows={3}
            defaultValue={current?.description ?? ""}
            className="field"
            placeholder="Тёмный мёд, 250 г."
          />
        </label>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="label">
            Цена, ₽
            <input
              name="price"
              required
              inputMode="decimal"
              defaultValue={current ? rubles(current.price) : ""}
              className="field"
              placeholder="450"
            />
          </label>
          <label className="label">
            Остаток
            <input
              name="stock"
              required
              type="number"
              min={0}
              step={1}
              defaultValue={current?.stock ?? 1}
              className="field"
            />
          </label>
        </div>
        <label className="label mt-4">
          Категория
          <select name="category" required defaultValue={current?.category_slug ?? categories[0]?.slug} className="field">
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <div className="label mt-4">
          Фото
          <p className="mt-1 text-sm font-normal text-foreground/60">До 12 штук. Можно выбрать сразу несколько файлов.</p>
          {photoCount > 0 ? (
            <ul className="mt-3 grid grid-cols-3 gap-2">
              {kept.map((src) => (
                <li key={src} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-24 w-full rounded-2xl object-cover" />
                  <button
                    type="button"
                    className="absolute top-1 right-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-primary"
                    onClick={() => setKept((items) => items.filter((item) => item !== src))}
                  >
                    Удалить
                  </button>
                </li>
              ))}
              {links.map((src) => (
                <li key={src} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-24 w-full rounded-2xl object-cover" />
                  <button
                    type="button"
                    className="absolute top-1 right-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-primary"
                    onClick={() => setLinks((items) => items.filter((item) => item !== src))}
                  >
                    Удалить
                  </button>
                </li>
              ))}
              {files.map((item) => (
                <li key={item.url} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt="" className="h-24 w-full rounded-2xl object-cover" />
                  <button
                    type="button"
                    className="absolute top-1 right-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-primary"
                    onClick={() => {
                      URL.revokeObjectURL(item.url);
                      setFiles((items) => items.filter((entry) => entry.url !== item.url));
                    }}
                  >
                    Удалить
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm font-normal text-foreground/60">Пока без фото — в каталоге будет рисунок.</p>
          )}
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="field"
            onChange={(event) => {
              const selected = [...(event.target.files ?? [])];
              event.target.value = "";
              setFiles((items) => {
                const room = 12 - kept.length - links.length - items.length;
                const next = selected.slice(0, Math.max(room, 0)).map((file) => ({
                  file,
                  url: URL.createObjectURL(file),
                }));
                return [...items, ...next];
              });
            }}
          />
          <div className="mt-3 flex gap-2">
            <input
              value={linkDraft}
              onChange={(event) => setLinkDraft(event.target.value)}
              className="field mt-0"
              placeholder="https://"
            />
            <button type="button" className="btn btn-quiet shrink-0" onClick={addLink}>
              Добавить ссылку
            </button>
          </div>
          {linkError ? <p className="mt-2 text-sm font-normal text-accent">{linkError}</p> : null}
        </div>
        {state.error ? <p className="mt-4 text-sm text-accent">{state.error}</p> : null}
        {loadError ? <p className="mt-4 text-sm text-accent">{loadError}</p> : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="submit" disabled={pending} className="btn btn-primary">
            {pending ? "Сохраняю..." : current ? "Сохранить" : "Добавить товар"}
          </button>
          {current ? (
            <button
              type="button"
              className="btn btn-quiet"
              onClick={() => openEditor(null)}
            >
              Отмена
            </button>
          ) : null}
        </div>
      </form>

      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-3xl">На полке</h2>
          {locked ? (
            <form action={logoutAdmin}>
              <button type="submit" className="text-sm text-foreground/55 hover:text-primary">
                Выйти
              </button>
            </form>
          ) : null}
        </div>
        <ul className="mt-4 space-y-3">
          {products.map((product) => (
            <li key={product.id} className="panel flex gap-4 p-3">
              <div className="w-24 shrink-0 overflow-hidden rounded-2xl">
                <ProductPhoto
                  title={product.title}
                  category={product.category_slug}
                  images={product.images}
                  className="h-24 w-full"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{product.title}</p>
                <p className="mt-1 text-sm text-foreground/60">
                  {categoryName(product.category_slug)} · {formatPrice(product.price)} · {product.stock} шт.
                  {product.is_active ? "" : " · скрыт"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn btn-quiet"
                    onClick={() => openEditor(product.id)}
                  >
                    Изменить
                  </button>
                  <form action={setProductActive}>
                    <input type="hidden" name="id" value={product.id} />
                    <input type="hidden" name="active" value={product.is_active ? "false" : "true"} />
                    <button type="submit" className="btn btn-quiet">
                      {product.is_active ? "Скрыть" : "Вернуть"}
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
