-- Пълна схема за приложението (Supabase → SQL Editor → Run)
-- Изисква настроен Email auth; всеки потребител вижда само своите редове (RLS + user_id).
-- Поръчка: crops първо, после таблици с FK към него.
--
-- ВАЖНО: id на културите е bigint (както при таблица от Table Editor в Supabase).
-- tasks.crop_id и inventory_items.crop_id СЪЩО са bigint → FK към crops(id).

-- ========== crops ==========
create table if not exists public.crops (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name text not null,
  variety text not null,
  planting_date date not null,
  field_location text not null,
  status text not null,
  created_at timestamptz not null default now()
);

alter table public.crops add column if not exists created_at timestamptz not null default now();
alter table public.crops add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.crops alter column user_id set default auth.uid();

-- ========== tasks ==========
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  type text not null,
  status text not null default 'PENDING',
  due_date date not null,
  notes text,
  crop_id bigint references public.crops (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.tasks add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.tasks alter column user_id set default auth.uid();

-- ========== inventory (склад + продажби) ==========
create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  product_label text not null,
  quantity_available numeric not null default 0,
  unit text not null check (unit in ('KG', 'PCS')),
  crop_id bigint references public.crops (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.inventory_items add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.inventory_items alter column user_id set default auth.uid();

-- ========== customers & поръчки ==========
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name text not null,
  phone text,
  created_at timestamptz not null default now()
);

alter table public.customers add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.customers alter column user_id set default auth.uid();

create table if not exists public.sales_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  customer_id uuid not null references public.customers (id) on delete restrict,
  ordered_at timestamptz not null default now()
);

alter table public.sales_orders add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.sales_orders alter column user_id set default auth.uid();

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
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  type text not null,
  amount text not null,
  spent_at date not null,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.expenses add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.expenses alter column user_id set default auth.uid();

-- ========== todos (демо /todos) ==========
create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.todos add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.todos alter column user_id set default auth.uid();

-- ========== crop guides (професионален календар по шаблони) ==========
create table if not exists public.crop_guides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  crop_name text not null,
  category text not null check (category in ('VEGETABLE', 'FRUIT')),
  image_url text,
  summary text not null,
  steps jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.crop_guides add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.crop_guides alter column user_id set default auth.uid();

-- ========== push subscriptions (PWA push) ==========
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.push_subscriptions alter column user_id set default auth.uid();

-- ========== тригери: crop_id в рамките на същия потребител ==========
create or replace function public.enforce_same_user_crop_task()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.crop_id is not null then
    if not exists (
      select 1 from public.crops c
      where c.id = new.crop_id and c.user_id = new.user_id
    ) then
      raise exception 'Културата не е от вашия профил';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists tr_tasks_crop_same_user on public.tasks;
create trigger tr_tasks_crop_same_user
  before insert or update on public.tasks
  for each row execute function public.enforce_same_user_crop_task();

create or replace function public.enforce_same_user_crop_inventory()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.crop_id is not null then
    if not exists (
      select 1 from public.crops c
      where c.id = new.crop_id and c.user_id = new.user_id
    ) then
      raise exception 'Културата не е от вашия профил';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists tr_inventory_crop_same_user on public.inventory_items;
create trigger tr_inventory_crop_same_user
  before insert or update on public.inventory_items
  for each row execute function public.enforce_same_user_crop_inventory();

create index if not exists crops_user_id_idx on public.crops (user_id);
create index if not exists tasks_user_id_idx on public.tasks (user_id);
create index if not exists inventory_items_user_id_idx on public.inventory_items (user_id);
create index if not exists customers_user_id_idx on public.customers (user_id);
create index if not exists sales_orders_user_id_idx on public.sales_orders (user_id);
create index if not exists expenses_user_id_idx on public.expenses (user_id);
create index if not exists todos_user_id_idx on public.todos (user_id);
create index if not exists crop_guides_user_id_idx on public.crop_guides (user_id);
create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions (user_id);

-- ========== права ==========
grant usage on schema public to authenticated;

revoke all on table public.crops from anon;
revoke all on table public.tasks from anon;
revoke all on table public.inventory_items from anon;
revoke all on table public.customers from anon;
revoke all on table public.sales_orders from anon;
revoke all on table public.sales_order_lines from anon;
revoke all on table public.expenses from anon;
revoke all on table public.todos from anon;
revoke all on table public.crop_guides from anon;
revoke all on table public.push_subscriptions from anon;

grant select, insert, update, delete on table public.crops to authenticated;
grant select, insert, update, delete on table public.tasks to authenticated;
grant select, insert, update, delete on table public.inventory_items to authenticated;
grant select, insert, update, delete on table public.customers to authenticated;
grant select, insert, update, delete on table public.sales_orders to authenticated;
grant select, insert, update, delete on table public.sales_order_lines to authenticated;
grant select, insert, update, delete on table public.expenses to authenticated;
grant select, insert, update, delete on table public.todos to authenticated;
grant select, insert, update, delete on table public.crop_guides to authenticated;
grant select, insert, update, delete on table public.push_subscriptions to authenticated;

grant usage, select on all sequences in schema public to authenticated;

grant all on table public.crops to service_role;
grant all on table public.tasks to service_role;
grant all on table public.inventory_items to service_role;
grant all on table public.customers to service_role;
grant all on table public.sales_orders to service_role;
grant all on table public.sales_order_lines to service_role;
grant all on table public.expenses to service_role;
grant all on table public.todos to service_role;
grant all on table public.crop_guides to service_role;
grant all on table public.push_subscriptions to service_role;

-- ========== RLS ==========
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
alter table public.crop_guides enable row level security;
alter table public.push_subscriptions enable row level security;

do $$
declare
  t text;
  tables text[] := array[
    'crops', 'tasks', 'inventory_items', 'customers',
    'sales_orders', 'sales_order_lines', 'expenses', 'todos', 'crop_guides', 'push_subscriptions'
  ];
begin
  foreach t in array tables
  loop
    execute format('drop policy if exists %I on public.%I', t || '_all_for_api_roles', t);
    execute format('drop policy if exists %I on public.%I', t || '_own', t);
  end loop;
end $$;

create policy "crops_own" on public.crops for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "tasks_own" on public.tasks for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "inventory_items_own" on public.inventory_items for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "customers_own" on public.customers for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Поръчка: customer_id трябва да е клиент на същия акаунт.
create policy "sales_orders_own" on public.sales_orders for all to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.customers c
      where c.id = customer_id and c.user_id = auth.uid()
    )
  );

-- Ред: поръчката и складът са на същия акаунт.
create policy "sales_order_lines_own" on public.sales_order_lines for all to authenticated
  using (
    exists (
      select 1 from public.sales_orders o
      where o.id = sales_order_lines.order_id and o.user_id = auth.uid()
    )
    and exists (
      select 1 from public.inventory_items i
      where i.id = sales_order_lines.inventory_item_id and i.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.sales_orders o
      where o.id = sales_order_lines.order_id and o.user_id = auth.uid()
    )
    and exists (
      select 1 from public.inventory_items i
      where i.id = inventory_item_id and i.user_id = auth.uid()
    )
  );

create policy "expenses_own" on public.expenses for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "todos_own" on public.todos for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "crop_guides_own" on public.crop_guides for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "push_subscriptions_own" on public.push_subscriptions for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
