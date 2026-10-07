insert into public.products (slug, title, description, price, category_slug, images, stock)
values
  ('1001-tea', 'Чай 1001 ночь', 'Ферментированный лист, 50 г.', 45000, 'tea', '{}', 20),
  ('linden-honey', 'Липовый мёд', 'Мёд этого лета, 250 г.', 89000, 'honey', '{}', 12),
  ('strawberry-jam', 'Клубничное варенье', 'Варенье из клубники, 250 г.', 54000, 'jam', '{/uploads/strawberry-jam.svg}', 10)
on conflict (slug) do nothing;
