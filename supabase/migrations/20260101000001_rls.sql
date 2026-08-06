-- ============================================================
-- Row Level Security.
--
-- Todas las tablas de datos del usuario quedan aisladas por
-- auth.uid() = user_id. fx_rates es global y de solo lectura para
-- usuarios autenticados; la escribe el cron con la service role key,
-- que saltea RLS.
-- ============================================================

alter table public.projects    enable row level security;
alter table public.categories  enable row level security;
alter table public.movements   enable row level security;
alter table public.recurrences enable row level security;
alter table public.fx_rates    enable row level security;

-- ------------------------------------------------------------
-- projects
-- ------------------------------------------------------------
create policy "projects_select_own" on public.projects
  for select to authenticated
  using (auth.uid() = user_id);

create policy "projects_insert_own" on public.projects
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "projects_update_own" on public.projects
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "projects_delete_own" on public.projects
  for delete to authenticated
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- categories
-- ------------------------------------------------------------
create policy "categories_select_own" on public.categories
  for select to authenticated
  using (auth.uid() = user_id);

create policy "categories_insert_own" on public.categories
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "categories_update_own" on public.categories
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "categories_delete_own" on public.categories
  for delete to authenticated
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- movements
-- ------------------------------------------------------------
create policy "movements_select_own" on public.movements
  for select to authenticated
  using (auth.uid() = user_id);

create policy "movements_insert_own" on public.movements
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "movements_update_own" on public.movements
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "movements_delete_own" on public.movements
  for delete to authenticated
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- recurrences
-- ------------------------------------------------------------
create policy "recurrences_select_own" on public.recurrences
  for select to authenticated
  using (auth.uid() = user_id);

create policy "recurrences_insert_own" on public.recurrences
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "recurrences_update_own" on public.recurrences
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "recurrences_delete_own" on public.recurrences
  for delete to authenticated
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- fx_rates: lectura para cualquier usuario logueado, escritura solo
-- desde el servidor (service role).
-- ------------------------------------------------------------
create policy "fx_rates_select_authenticated" on public.fx_rates
  for select to authenticated
  using (true);
