-- Shop schema. Safe to run again on an empty database.
-- Prices are integer kopecks. Categories live in shop.config.js, not in this database.

create sequence if not exists public.order_number_seq;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  price integer not null check (price >= 0),
  category_slug text not null,
  stock integer not null default 0 check (stock >= 0),
  is_active boolean not null default true,
  sku text,
  images text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  access_token text not null unique,
  customer_name text not null,
  phone text not null,
  email text,
  delivery_id text not null,
  delivery_name text not null,
  address text,
  comment text,
  subtotal integer not null check (subtotal >= 0),
  delivery_fee integer not null check (delivery_fee >= 0),
  total integer not null check (total >= 0),
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'paid', 'cancelled', 'fulfilled')),
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  title text not null,
  slug text not null,
  unit_price integer not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total integer not null check (line_total >= 0)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id) on delete cascade,
  provider text not null,
  provider_payment_id text unique,
  status text not null,
  amount integer not null check (amount >= 0),
  confirmation_url text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists products_category_slug_idx on public.products (category_slug);
create index if not exists orders_pending_created_idx on public.orders (created_at)
  where status = 'pending_payment';

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;

grant usage on schema public to anon, authenticated, service_role;
grant select on public.products to anon, authenticated, service_role;
grant all on public.products, public.orders, public.order_items, public.payments to service_role;
revoke all on public.orders, public.order_items, public.payments from anon, authenticated;

drop policy if exists products_read_active on public.products;
create policy products_read_active on public.products
  for select to anon, authenticated
  using (is_active = true);

drop policy if exists products_service_write on public.products;
create policy products_service_write on public.products
  for all to service_role
  using (true)
  with check (true);

create or replace function public.create_shop_order(
  p_customer_name text,
  p_phone text,
  p_email text,
  p_delivery_id text,
  p_delivery_name text,
  p_delivery_fee integer,
  p_address text,
  p_comment text,
  p_items jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order uuid;
  v_number text;
  v_token text;
  v_subtotal integer := 0;
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty integer;
  v_line integer;
  v_seen uuid[] := array[]::uuid[];
begin
  if p_customer_name is null or length(btrim(p_customer_name)) < 2 then
    raise exception 'invalid customer';
  end if;
  if p_phone is null or length(btrim(p_phone)) < 5 then
    raise exception 'invalid phone';
  end if;
  if p_delivery_fee is null or p_delivery_fee < 0 then
    raise exception 'invalid delivery';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 50 then
    raise exception 'cart is empty';
  end if;

  v_order := gen_random_uuid();
  v_token := encode(gen_random_bytes(24), 'hex');
  v_number := 'S-' || lpad(nextval('public.order_number_seq')::text, 6, '0');

  insert into public.orders (
    id, number, access_token, customer_name, phone, email,
    delivery_id, delivery_name, address, comment,
    subtotal, delivery_fee, total, status
  ) values (
    v_order, v_number, v_token, btrim(p_customer_name), btrim(p_phone), nullif(btrim(coalesce(p_email, '')), ''),
    p_delivery_id, p_delivery_name, nullif(btrim(coalesce(p_address, '')), ''), nullif(btrim(coalesce(p_comment, '')), ''),
    0, p_delivery_fee, p_delivery_fee, 'pending_payment'
  );

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'qty')::integer;
    if v_qty is null or v_qty < 1 or v_qty > 99 then
      raise exception 'invalid quantity';
    end if;

    select * into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid
      and is_active
    for update;

    if not found then
      raise exception 'product unavailable';
    end if;
    if v_product.id = any (v_seen) then
      raise exception 'duplicate product';
    end if;
    v_seen := v_seen || v_product.id;
    if v_product.stock < v_qty then
      raise exception 'not enough stock';
    end if;

    v_line := v_product.price * v_qty;
    v_subtotal := v_subtotal + v_line;

    update public.products
    set stock = stock - v_qty, updated_at = now()
    where id = v_product.id;

    insert into public.order_items (order_id, product_id, title, slug, unit_price, quantity, line_total)
    values (v_order, v_product.id, v_product.title, v_product.slug, v_product.price, v_qty, v_line);
  end loop;

  update public.orders
  set subtotal = v_subtotal, total = v_subtotal + p_delivery_fee
  where id = v_order;

  return jsonb_build_object(
    'id', v_order,
    'number', v_number,
    'access_token', v_token,
    'total', v_subtotal + p_delivery_fee
  );
end;
$$;

create or replace function public.release_order_stock(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  select status into v_status
  from public.orders
  where id = p_order_id
  for update;

  if not found or v_status <> 'pending_payment' then
    return;
  end if;

  update public.products as product
  set stock = product.stock + item.quantity, updated_at = now()
  from public.order_items as item
  where item.order_id = p_order_id
    and item.product_id = product.id;

  update public.orders set status = 'cancelled' where id = p_order_id;
  update public.payments
  set status = 'canceled'
  where order_id = p_order_id and status <> 'succeeded';
end;
$$;

create or replace function public.expire_unpaid_orders()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  for v_id in
    select id from public.orders
    where status = 'pending_payment'
      and created_at < now() - interval '30 minutes'
  loop
    perform public.release_order_stock(v_id);
  end loop;
end;
$$;

create or replace function public.mark_order_paid(p_order_id uuid, p_external_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  select status into v_status
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'order not found';
  end if;
  if v_status = 'paid' or v_status = 'fulfilled' then
    return;
  end if;
  if v_status <> 'pending_payment' then
    raise exception 'order is not awaiting payment';
  end if;

  insert into public.payments (order_id, provider, provider_payment_id, status, amount)
  values (p_order_id, 'yookassa', p_external_id, 'succeeded', 0)
  on conflict (order_id) do update
    set status = 'succeeded',
        provider_payment_id = excluded.provider_payment_id;

  update public.orders set status = 'paid' where id = p_order_id;
end;
$$;

revoke all on function public.create_shop_order(text, text, text, text, text, integer, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.release_order_stock(uuid) from public, anon, authenticated;
revoke all on function public.expire_unpaid_orders() from public, anon, authenticated;
revoke all on function public.mark_order_paid(uuid, text) from public, anon, authenticated;

grant execute on function public.create_shop_order(text, text, text, text, text, integer, text, text, jsonb) to service_role;
grant execute on function public.release_order_stock(uuid) to service_role;
grant execute on function public.expire_unpaid_orders() to service_role;
grant execute on function public.mark_order_paid(uuid, text) to service_role;

notify pgrst, 'reload schema';
