# Новый клиент: Ubuntu VPS

Один сервер — один магазин. Перед командами замените `api.example.ru` и `shop.example.ru` на домены клиента. DNS-записи типа `A` для обоих имён должны указывать на IP сервера, иначе Caddy не получит сертификат.

Снаружи открыты только 22, 80 и 443. Postgres наружу не публикуется.

## 1. Пакеты, Docker и файрвол

```sh
sudo apt update
sudo apt install -y ca-certificates curl git openssl
curl -fsSL https://get.docker.com | sudo sh
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

Проверка: `docker compose version`.

## 2. Каталог и домены

Скопируйте на сервер репозиторий магазина, например в `/opt/shop`.

```sh
sudo mkdir -p /opt/shop
sudo chown "$USER":"$USER" /opt/shop
# сюда попадает весь проект: app, shop.config.js, infra
cd /opt/shop
cp infra/supabase/.env.example infra/supabase/.env
```

Откройте `infra/supabase/.env` и поставьте домены клиента до первого запуска:

- `API_DOMAIN` — `api.example.ru`
- `SHOP_DOMAIN` — `shop.example.ru`
- `SITE_URL` — `https://shop.example.ru`
- `API_EXTERNAL_URL` — `https://api.example.ru/auth/v1`
- `ADDITIONAL_REDIRECT_URLS` — `https://shop.example.ru`

Пароль Postgres и JWT пока оставьте как `change-me`: их создаст `npm run deploy`, и только если значения ещё пустые. Публичная регистрация GoTrue выключена. Покупатели оформляют заказ без аккаунта. Auth нужен как часть API: anon и service role подписываются тем же `JWT_SECRET`.

## 3. Обновление, ключи и миграции

Нужен Node.js 22:

```sh
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash -
sudo apt install -y nodejs
cd /opt/shop
npm ci
npm run deploy
```

`npm run deploy` делает три вещи:

- `git fetch` и `git pull --ff-only`, если рабочее дерево чистое и у ветки есть upstream
- создаёт `POSTGRES_PASSWORD`, `JWT_SECRET`, `ANON_KEY` и `SERVICE_ROLE_KEY`, если их ещё нет
- поднимает Docker Compose и применяет SQL, которого ещё нет в `public.schema_migrations`

Схема магазина — `infra/supabase/volumes/db/shop.sql`. Следующие изменения кладите отдельными файлами в `infra/supabase/migrations/`, например `002_stock.sql`. Уже записанный файл повторно не выполняется.

Если домены всё ещё `example.ru`, команда поднимает только базу и не стартует Caddy. После правки доменов запустите её ещё раз.

Проверка:

```sh
cd /opt/shop/infra/supabase
docker compose ps
```

У `shop-db`, `shop-auth`, `shop-rest` и `shop-caddy` статус должен стать `healthy` или `running`.

Проверка API:

```sh
curl -fsS "https://api.example.ru/auth/v1/health"
curl -fsS "https://api.example.ru/rest/v1/products?select=id" \
  -H "apikey: ВСТАВЬТЕ_ANON_KEY" \
  -H "Authorization: Bearer ВСТАВЬТЕ_ANON_KEY"
```

Пустой массив `[]` — нормальный ответ, пока нет товаров.

## 4. Приложение Next.js

`npm run deploy` уже записал в `.env.local` адрес API и ключи Supabase, если домены в `infra/supabase/.env` не примеры. Соответствие такое:

| Переменная приложения | Откуда |
| --- | --- |
| `SUPABASE_URL` | `https://` + `API_DOMAIN` |
| `SUPABASE_ANON_KEY` | `ANON_KEY` |
| `SUPABASE_SERVICE_ROLE_KEY` | `SERVICE_ROLE_KEY` |
| `AUTH_SITE_URL` | `SITE_URL` |

Дальше в том же файле укажите магазин ЮKassa. В `shop.config.js` — название, цвета, контакты, категории и способы доставки. `category_slug` товаров должен совпадать со `slug` категории из этого файла. Цены доставки в конфиге — целые копейки.

```sh
npm run build
```

Юнит systemd `/etc/systemd/system/shop.service`:

```ini
[Unit]
Description=Shop
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/shop
ExecStart=/usr/bin/npm start -- --hostname 0.0.0.0 --port 3000
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```sh
sudo systemctl daemon-reload
sudo systemctl enable --now shop
sudo systemctl status shop
```

Порт 3000 в файрвол не добавляйте. Caddy на `SHOP_DOMAIN` проксирует его с хоста.

Когда юнит `shop` уже включён, следующий `npm run deploy` сам выполнит `npm ci`, сборку и `sudo systemctl restart shop`.

## 5. Аутентификация и СБП

Auth поднимается вместе со стеком. Проверка:

```sh
curl -fsS "https://api.example.ru/auth/v1/health"
```

Ответ `{"status":"ok"}` или похожий JSON без ошибки означает, что GoTrue жив. Ключи для Next.js уже лежат в `.env`: `ANON_KEY` копируется в `SUPABASE_ANON_KEY`, `SERVICE_ROLE_KEY` — в `SUPABASE_SERVICE_ROLE_KEY`. Эти ключи — JWT с ролями `anon` и `service_role`, подписанные `JWT_SECRET`.

Покупательский аккаунт не нужен. Если для этого клиента всё же нужен пользователь в Auth (проверка входа, будущая админка), создайте его служебным ключом. Регистрация снаружи при этом остаётся выключенной:

```sh
cd /opt/shop/infra/supabase
set -a
. ./.env
set +a
curl -fsS "https://$API_DOMAIN/auth/v1/admin/users" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@client.ru","password":"ЗАМЕНИТЕ_НА_ДЛИННЫЙ_ПАРОЛЬ","email_confirm":true}'
```

В ЮKassa укажите webhook `https://shop.example.ru/api/payments/yookassa/webhook` и события платежей. `YOOKASSA_SHOP_ID` и `YOOKASSA_SECRET_KEY` — из того же кабинета. Оплата создаётся методом СБП. `AUTH_SITE_URL` в `.env.local` — адрес витрины, на него ЮKassa возвращает покупателя после оплаты.

После правки `.env.local`:

```sh
npm run build
sudo systemctl restart shop
```

## 6. Товары и пробный заказ

Откройте `https://shop.example.ru/admin`. Там же загружается фото, цена пишется в рублях, категория берётся из `shop.config.js`. На сервере задайте `ADMIN_PASSWORD` в `.env.local`, иначе страница в режиме `npm start` закрыта.

Два примера, чай и мёд, можно загрузить и SQL-файлом. Категории в нём (`tea`, `honey`) должны быть в `shop.config.js`.

```sh
cd /opt/shop/infra/supabase
docker compose exec -T db psql -U postgres -d postgres < seed.example.sql
```

Откройте `https://shop.example.ru`, добавьте товар в корзину, оформите заказ без входа и перейдите к оплате СБП. Ссылка на статус заказа содержит секретный токен. Неоплаченный заказ через 30 минут возвращает остаток на склад. Отмена платежа в ЮKassa делает то же самое по webhook.
