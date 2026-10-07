import Link from "next/link";
import { formatPrice } from "@/lib/money";
import { shopConfig } from "@/lib/shop-config";

export function SiteFooter() {
  const { contacts, shop } = shopConfig;
  return (
    <footer className="mt-20 border-t border-foreground/10" style={{ viewTransitionName: "site-footer" }}>
      <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="font-serif text-2xl text-primary">{shop.name}</p>
          <p className="mt-2 max-w-xs text-sm leading-6 text-foreground/70">{shop.tagline}</p>
          <p className="mt-3">
            <Link className="text-sm text-foreground/55 hover:text-primary" href="/admin">
              Добавить товар
            </Link>
          </p>
        </div>
        <div className="text-sm leading-6">
          <p className="eyebrow">Как получить</p>
          <ul className="mt-3 space-y-1 text-foreground/75">
            {shopConfig.delivery.map((method) => (
              <li key={method.id}>
                {method.name}
                {method.price === 0 ? " — бесплатно" : ` — ${formatPrice(method.price)}`}
              </li>
            ))}
          </ul>
        </div>
        <div className="text-sm leading-6 sm:text-right">
          <p className="eyebrow sm:text-right">Связаться</p>
          <p className="mt-3">{contacts.address}</p>
          <p>
            <a className="hover:text-primary" href={`tel:${contacts.phone.replace(/[^\d+]/g, "")}`}>
              {contacts.phone}
            </a>
          </p>
          <p>
            <a className="hover:text-primary" href={`mailto:${contacts.email}`}>
              {contacts.email}
            </a>
          </p>
          {contacts.telegram ? (
            <p>
              <a className="hover:text-primary" href={contacts.telegram} target="_blank" rel="noreferrer">
                Telegram
              </a>
            </p>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
