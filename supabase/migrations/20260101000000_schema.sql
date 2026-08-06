-- ============================================================
-- Esquema base: enums, tablas y triggers.
-- Las políticas de RLS viven en la migración siguiente.
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Enums
-- ------------------------------------------------------------
create type public.tipo_movimiento as enum ('ingreso', 'egreso');
create type public.moneda as enum ('ARS', 'USD');
create type public.estado_movimiento as enum ('efectuado', 'planificado');
create type public.frecuencia_recurrencia as enum ('mensual', 'anual');

-- ------------------------------------------------------------
-- updated_at automático
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- projects
-- ------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nombre text not null check (length(trim(nombre)) > 0),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  activo boolean not null default true,
  -- Peso relativo para repartir los gastos compartidos. 1 = partes iguales.
  peso_prorrateo numeric(12, 4) not null default 1 check (peso_prorrateo > 0),
  color text not null default '#6366f1' check (color ~* '^#[0-9a-f]{6}$'),
  created_at timestamptz not null default now(),
  unique (user_id, slug)
);

create index projects_user_id_idx on public.projects (user_id);
create index projects_user_activo_idx on public.projects (user_id, activo);

-- ------------------------------------------------------------
-- categories
-- ------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nombre text not null check (length(trim(nombre)) > 0),
  tipo public.tipo_movimiento not null,
  archivada boolean not null default false,
  created_at timestamptz not null default now(),
  -- Una categoría de ingreso y una de egreso pueden llamarse igual.
  unique (user_id, tipo, nombre)
);

create index categories_user_id_idx on public.categories (user_id);

-- ------------------------------------------------------------
-- recurrences
-- Se declara antes que movements porque movements la referencia.
-- ------------------------------------------------------------
create table public.recurrences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  category_id uuid not null references public.categories (id) on delete restrict,
  descripcion text not null check (length(trim(descripcion)) > 0),
  tipo public.tipo_movimiento not null,
  monto_origen numeric(16, 2) not null check (monto_origen >= 0),
  moneda_origen public.moneda not null,
  frecuencia public.frecuencia_recurrencia not null,
  -- 1..31. Si el mes no llega a ese día se usa el último día del mes.
  dia_del_mes smallint not null check (dia_del_mes between 1 and 31),
  fecha_inicio date not null,
  fecha_fin date,
  activa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (fecha_fin is null or fecha_fin >= fecha_inicio)
);

create index recurrences_user_id_idx on public.recurrences (user_id);
create index recurrences_activa_idx on public.recurrences (user_id, activa);

create trigger recurrences_set_updated_at
  before update on public.recurrences
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- movements
--
-- Regla central de la app: monto_ars, monto_usd, tasa_usada y tasa_fecha
-- se congelan en el momento de la carga. NUNCA se recalculan con la
-- cotización actual. Un gasto de abril vale lo que valía en abril.
-- ------------------------------------------------------------
create table public.movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- null = gasto compartido, se prorratea entre los proyectos activos.
  project_id uuid references public.projects (id) on delete set null,
  category_id uuid not null references public.categories (id) on delete restrict,
  fecha date not null,
  descripcion text not null check (length(trim(descripcion)) > 0),
  tipo public.tipo_movimiento not null,

  -- Importe tal como se cargó, en la moneda en la que se escribió.
  monto_origen numeric(16, 2) not null check (monto_origen >= 0),
  moneda_origen public.moneda not null,

  -- Ambos lados congelados, junto con la tasa que los relacionó.
  monto_ars numeric(16, 2) not null check (monto_ars >= 0),
  monto_usd numeric(16, 2) not null check (monto_usd >= 0),
  tasa_usada numeric(16, 4) not null check (tasa_usada > 0),
  -- Fecha de la cotización efectivamente aplicada. Puede ser anterior a
  -- `fecha` cuando cae fin de semana, feriado o carga retroactiva.
  tasa_fecha date not null,

  estado public.estado_movimiento not null default 'efectuado',
  recurrence_id uuid references public.recurrences (id) on delete set null,
  comprobante_path text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index movements_user_fecha_idx on public.movements (user_id, fecha desc);
create index movements_project_idx on public.movements (user_id, project_id);
create index movements_category_idx on public.movements (user_id, category_id);
create index movements_estado_idx on public.movements (user_id, estado);

-- Evita que el cron genere dos veces el mismo movimiento recurrente.
create unique index movements_recurrence_fecha_key
  on public.movements (recurrence_id, fecha)
  where recurrence_id is not null;

create trigger movements_set_updated_at
  before update on public.movements
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- fx_rates
--
-- Tabla global (no por usuario): la cotización del Oficial BNA es la
-- misma para todos. App de un solo usuario, pero conviene modelarla bien.
-- ------------------------------------------------------------
create table public.fx_rates (
  fecha date primary key,
  compra numeric(16, 4) not null check (compra > 0),
  venta numeric(16, 4) not null check (venta > 0),
  fuente text not null default 'BNA',
  fetched_at timestamptz not null default now()
);

create index fx_rates_fecha_desc_idx on public.fx_rates (fecha desc);

-- ------------------------------------------------------------
-- Tasa efectiva para una fecha dada.
--
-- Devuelve la cotización de esa fecha o, si no existe (fin de semana,
-- feriado, carga retroactiva), la última disponible ANTES de esa fecha.
-- Si no hay ninguna anterior, cae a la más antigua conocida para no
-- bloquear la carga de movimientos.
-- ------------------------------------------------------------
-- Devuelve 0 o 1 filas: `setof` deja que el caso "todavía no hay ninguna
-- cotización cargada" llegue como conjunto vacío en vez de una fila nula.
create or replace function public.fx_rate_for_date(p_fecha date)
returns setof public.fx_rates
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.fx_rates
  where fecha <= p_fecha
  order by fecha desc
  limit 1
$$;

-- ------------------------------------------------------------
-- Seed de categorías al crear el usuario.
--
-- Se dispara con el alta en auth.users, así el primer login ya
-- encuentra el set de categorías listo.
-- ------------------------------------------------------------
create or replace function public.seed_default_categories()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.categories (user_id, nombre, tipo)
  values
    (new.id, 'Ventas', 'ingreso'),
    (new.id, 'Suscripciones', 'ingreso'),
    (new.id, 'Otros', 'ingreso'),
    (new.id, 'Infraestructura', 'egreso'),
    (new.id, 'Herramientas', 'egreso'),
    (new.id, 'Datos y APIs', 'egreso'),
    (new.id, 'Marketing', 'egreso'),
    (new.id, 'Impuestos y comisiones', 'egreso'),
    (new.id, 'Servicios profesionales', 'egreso'),
    (new.id, 'Legales y registro', 'egreso'),
    (new.id, 'Otros', 'egreso')
  on conflict (user_id, tipo, nombre) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.seed_default_categories();
