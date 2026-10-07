"use client";

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from "react";

export type CartItem = {
  productId: string;
  slug: string;
  title: string;
  priceKopecks: number;
  qty: number;
  stock: number;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "qty">) => void;
  setQty: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const storageKey = "shop-cart";
const emptyCart: CartItem[] = [];

let items = emptyCart;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function readStoredCart() {
  const saved = window.localStorage.getItem(storageKey);
  if (!saved) return emptyCart;
  try {
    const parsed = JSON.parse(saved) as CartItem[];
    return Array.isArray(parsed) ? parsed : emptyCart;
  } catch {
    window.localStorage.removeItem(storageKey);
    return emptyCart;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return items;
}

function getServerSnapshot() {
  return emptyCart;
}

function writeCart(next: CartItem[]) {
  items = next;
  window.localStorage.setItem(storageKey, JSON.stringify(next));
  emit();
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const cartItems = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    items = readStoredCart();
    emit();
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      items: cartItems,
      addItem(item) {
        const current = getSnapshot();
        const existing = current.find((line) => line.productId === item.productId);
        const next = existing
          ? current.map((line) =>
              line.productId === item.productId
                ? { ...line, qty: Math.min(line.stock, line.qty + 1), stock: item.stock }
                : line,
            )
          : [...current, { ...item, qty: 1 }];
        writeCart(next);
      },
      setQty(productId, qty) {
        const next = getSnapshot().flatMap((line) => {
          if (line.productId !== productId) return [line];
          if (qty < 1) return [];
          return [{ ...line, qty: Math.min(line.stock, qty) }];
        });
        writeCart(next);
      },
      removeItem(productId) {
        writeCart(getSnapshot().filter((line) => line.productId !== productId));
      },
      clear() {
        writeCart([]);
      },
    }),
    [cartItems],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("Корзина доступна внутри CartProvider");
  return value;
}
