# Джейрахская полка

Витрина небольшого магазина: чай, мёд и варенье. Покупатель смотрит каталог, собирает корзину и оформляет заказ без регистрации. Оплата идёт через СБП (ЮKassa). Товары, остатки и заказы хранятся в self-hosted Supabase на том же VPS, что и сайт.

Название, слоган, цвета, контакты, категории и способы доставки задаются в `shop.config.js`. Цены доставки там — целые копейки. `category_slug` товара должен совпадать со `slug` категории из этого файла.

## Стек

- Next.js 16, React 19, TypeScript, Tailwind CSS 4
- PostgreSQL, GoTrue и PostgREST в Docker (`infra/supabase`)
- Caddy на 80/443, приложение на порту 3000
- ЮKassa, webhook `/api/payments/yookassa/webhook`

## Страницы

| Путь | Что делает |
| --- | --- |
| `/` | Главная |
| `/catalog/[category]` | Категория |
| `/product/[slug]` | Карточка товара |
| `/cart` | Корзина |
| `/checkout` | Оформление без аккаунта |
| `/order/[token]` | Статус заказа по секретной ссылке |
| `/admin` | Товары, фото и цены |

Неоплаченный заказ через 30 минут возвращает остаток на склад. Отмена платежа в ЮKassa делает то же самое по webhook.

## Локальный запуск

Нужен Node.js 22.

```sh
npm ci
cp .env.local.example .env.local
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000). Пока `ADMIN_PASSWORD` пустой, `/admin` открыт только в `npm run dev`. В production без пароля страница закрыта.

Имена в `.env.local` остаются на сервере, префикс `NEXT_PUBLIC_` не добавляйте.

| Переменная | Зачем |
| --- | --- |
| `SUPABASE_URL` | Адрес API, например `https://api.example.ru` |
| `SUPABASE_ANON_KEY` | Ключ роли `anon` |
| `SUPABASE_SERVICE_ROLE_KEY` | Служебный ключ, только на сервере |
| `AUTH_SITE_URL` | Адрес витрины, на него ЮKassa возвращает покупателя |
| `YOOKASSA_SHOP_ID` | Идентификатор магазина ЮKassa |
| `YOOKASSA_SECRET_KEY` | Секрет ЮKassa |
| `ADMIN_PASSWORD` | Пароль `/admin` |

Каталог и заказы без этих переменных не откроются: приложение читает их при первом обращении к Supabase.

## Сервер

Один VPS — один магазин. Пошаговая установка Ubuntu, Docker, доменов, ключей и systemd: [docs/vps-new-client.md](docs/vps-new-client.md).

```sh
npm run deploy
```

Команда подтягивает `git pull --ff-only`, если дерево чистое, создаёт пароль Postgres и JWT, если их ещё нет, поднимает Compose и применяет новые SQL-файлы из `infra/supabase/migrations/`. Когда юнит `shop` уже включён, следующий запуск ещё делает `npm ci`, сборку и перезапуск сервиса.

Схема магазина — `infra/supabase/volumes/db/shop.sql`. Пример двух товаров: `infra/supabase/seed.example.sql`.
