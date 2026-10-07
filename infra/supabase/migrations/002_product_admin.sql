-- Lets the shop admin save products with the service-role key.

drop policy if exists products_service_write on public.products;
create policy products_service_write on public.products
  for all to service_role
  using (true)
  with check (true);
