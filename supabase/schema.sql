-- Пълна схема за приложението (Supabase → SQL Editor → Run)
-- Поръчка: crops първо, после таблици с FK към него.
--
-- ВАЖНО: id на културите е bigint (както при таблица от Table Editor в Supabase).
-- tasks.crop_id и inventory_items.crop_id СЪЩО са bigint → FK към crops(id).
-- Ако преди това си създал tasks с uuid crop_id и получи 42804, изпълни веднъж:
--   drop table if exists public.tasks cascade;
-- (само ако няма важни данни в tasks)

-- ========== crops ==========
create table if not exists public.crops (
  id bigserial primary key,
  name text not null,
  variety text not null,
  planting_date date not null,
  field_location text not null,
  status text not null,
  created_at timestamptz not null default now()
);

alter table public.crops add column if not exists created_at timestamptz not null default now();

-- ========== tasks ==========
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  status text not null default 'PENDING',
  due_date date not null,
  notes text,
  crop_id bigint references public.crops (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ========== inventory (склад + продажби) ==========
create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  product_label text not null,
  quantity_available numeric not null default 0,
  unit text not null check (unit in ('KG', 'PCS')),
  crop_id bigint references public.crops (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ========== customers & поръчки ==========
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.sales_orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete restrict,
  ordered_at timestamptz not null default now()
);

create table if not exists public.sales_order_lines (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.sales_orders (id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items (id) on delete restrict,
  quantity numeric not null,
  product_label_snapshot text not null,
  unit_snapshot text not null
);

-- ========== expenses ==========
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  amount text not null,
  spent_at date not null,
  notes text,
  created_at timestamptz not null default now()
);

-- ========== todos (демо /todos) ==========
create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- ========== права ==========
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on table public.crops to anon, authenticated;
grant select, insert, update, delete on table public.tasks to anon, authenticated;
grant select, insert, update, delete on table public.inventory_items to anon, authenticated;
grant select, insert, update, delete on table public.customers to anon, authenticated;
grant select, insert, update, delete on table public.sales_orders to anon, authenticated;
grant select, insert, update, delete on table public.sales_order_lines to anon, authenticated;
grant select, insert, update, delete on table public.expenses to anon, authenticated;
grant select, insert, update, delete on table public.todos to anon, authenticated;

grant all on table public.crops to service_role;
grant all on table public.tasks to service_role;
grant all on table public.inventory_items to service_role;
grant all on table public.customers to service_role;
grant all on table public.sales_orders to service_role;
grant all on table public.sales_order_lines to service_role;
grant all on table public.expenses to service_role;
grant all on table public.todos to service_role;

-- ========== RLS ==========
-- Стари имена от по-ранни скриптове
drop policy if exists "crops_select_anon" on public.crops;
drop policy if exists "crops_insert_anon" on public.crops;
drop policy if exists "crops_update_anon" on public.crops;
drop policy if exists "crops_delete_anon" on public.crops;
drop policy if exists "todos_all_for_api_roles" on public.todos;

alter table public.crops enable row level security;
alter table public.tasks enable row level security;
alter table public.inventory_items enable row level security;
alter table public.customers enable row level security;
alter table public.sales_orders enable row level security;
alter table public.sales_order_lines enable row level security;
alter table public.expenses enable row level security;
alter table public.todos enable row level security;

-- Махни стари политики (идемпотентно)
do $$
declare
  t text;
  tables text[] := array[
    'crops', 'tasks', 'inventory_items', 'customers',
    'sales_orders', 'sales_order_lines', 'expenses', 'todos'
  ];
begin
  FOREACH t IN ARRAY tables
  loop
    execute format('drop policy if exists %I on public.%I', t || '_all_for_api_roles', t);
  end loop;
end $$;

create policy "crops_all_for_api_roles" on public.crops for all to anon, authenticated using (true) with check (true);
create policy "tasks_all_for_api_roles" on public.tasks for all to anon, authenticated using (true) with check (true);
create policy "inventory_items_all_for_api_roles" on public.inventory_items for all to anon, authenticated using (true) with check (true);
create policy "customers_all_for_api_roles" on public.customers for all to anon, authenticated using (true) with check (true);
create policy "sales_orders_all_for_api_roles" on public.sales_orders for all to anon, authenticated using (true) with check (true);
create policy "sales_order_lines_all_for_api_roles" on public.sales_order_lines for all to anon, authenticated using (true) with check (true);
create policy "expenses_all_for_api_roles" on public.expenses for all to anon, authenticated using (true) with check (true);
create policy "todos_all_for_api_roles" on public.todos for all to anon, authenticated using (true) with check (true);
