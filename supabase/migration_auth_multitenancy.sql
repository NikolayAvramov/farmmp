-- Миграция: multi-user (всеки ред е обвързан с auth.users)
-- Изпълнете в Supabase SQL Editor след като имате активиран Email auth.
--
-- ВАЖНО: Ако вече имате данни без user_id, или ги изтрийте, или присвоете ръчно user_id
-- преди NOT NULL (напр. за един тестов акаунт).
--
-- Поръчка на изпълнение: целият скрипт наведнъж.

-- ========== колони user_id ==========
alter table public.crops add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.tasks add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.inventory_items add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.customers add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.sales_orders add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.expenses add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.todos add column if not exists user_id uuid references auth.users (id) on delete cascade;

-- Ако трябва да махнете стари тестови данни без собственик:
-- truncate table public.sales_order_lines, public.sales_orders, public.customers, public.inventory_items, public.tasks, public.expenses, public.todos, public.crops cascade;

alter table public.crops alter column user_id set default auth.uid();
alter table public.tasks alter column user_id set default auth.uid();
alter table public.inventory_items alter column user_id set default auth.uid();
alter table public.customers alter column user_id set default auth.uid();
alter table public.sales_orders alter column user_id set default auth.uid();
alter table public.expenses alter column user_id set default auth.uid();
alter table public.todos alter column user_id set default auth.uid();

-- Стари редове без собственик: попълване или изчистване (иначе NOT NULL гърми).
do $$
declare
  owner_id uuid;
begin
  select id into owner_id from auth.users order by created_at asc limit 1;

  if owner_id is not null then
    update public.crops set user_id = owner_id where user_id is null;
    update public.tasks set user_id = owner_id where user_id is null;
    update public.inventory_items set user_id = owner_id where user_id is null;
    update public.customers set user_id = owner_id where user_id is null;
    update public.sales_orders set user_id = owner_id where user_id is null;
    update public.expenses set user_id = owner_id where user_id is null;
    update public.todos set user_id = owner_id where user_id is null;
  else
    truncate table public.sales_order_lines, public.sales_orders, public.customers,
      public.inventory_items, public.tasks, public.expenses, public.todos, public.crops
      restart identity cascade;
  end if;
end $$;

-- След като всеки ред има user_id:
alter table public.crops alter column user_id set not null;
alter table public.tasks alter column user_id set not null;
alter table public.inventory_items alter column user_id set not null;
alter table public.customers alter column user_id set not null;
alter table public.sales_orders alter column user_id set not null;
alter table public.expenses alter column user_id set not null;
alter table public.todos alter column user_id set not null;

create index if not exists crops_user_id_idx on public.crops (user_id);
create index if not exists tasks_user_id_idx on public.tasks (user_id);
create index if not exists inventory_items_user_id_idx on public.inventory_items (user_id);
create index if not exists customers_user_id_idx on public.customers (user_id);
create index if not exists sales_orders_user_id_idx on public.sales_orders (user_id);
create index if not exists expenses_user_id_idx on public.expenses (user_id);
create index if not exists todos_user_id_idx on public.todos (user_id);

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

-- ========== права: само влезли потребители ==========
revoke all on table public.crops from anon;
revoke all on table public.tasks from anon;
revoke all on table public.inventory_items from anon;
revoke all on table public.customers from anon;
revoke all on table public.sales_orders from anon;
revoke all on table public.sales_order_lines from anon;
revoke all on table public.expenses from anon;
revoke all on table public.todos from anon;

grant select, insert, update, delete on table public.crops to authenticated;
grant select, insert, update, delete on table public.tasks to authenticated;
grant select, insert, update, delete on table public.inventory_items to authenticated;
grant select, insert, update, delete on table public.customers to authenticated;
grant select, insert, update, delete on table public.sales_orders to authenticated;
grant select, insert, update, delete on table public.sales_order_lines to authenticated;
grant select, insert, update, delete on table public.expenses to authenticated;
grant select, insert, update, delete on table public.todos to authenticated;

grant usage, select on all sequences in schema public to authenticated;

-- ========== RLS политики ==========
do $$
declare
  t text;
  tables text[] := array[
    'crops', 'tasks', 'inventory_items', 'customers',
    'sales_orders', 'sales_order_lines', 'expenses', 'todos'
  ];
begin
  foreach t in array tables
  loop
    execute format('drop policy if exists %I on public.%I', t || '_all_for_api_roles', t);
    execute format('drop policy if exists %I on public.%I', t || '_own', t);
  end loop;
end $$;

drop policy if exists "crops_all_for_api_roles" on public.crops;
drop policy if exists "tasks_all_for_api_roles" on public.tasks;
drop policy if exists "inventory_items_all_for_api_roles" on public.inventory_items;
drop policy if exists "customers_all_for_api_roles" on public.customers;
drop policy if exists "sales_orders_all_for_api_roles" on public.sales_orders;
drop policy if exists "sales_order_lines_all_for_api_roles" on public.sales_order_lines;
drop policy if exists "expenses_all_for_api_roles" on public.expenses;
drop policy if exists "todos_all_for_api_roles" on public.todos;

create policy "crops_own" on public.crops for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "tasks_own" on public.tasks for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "inventory_items_own" on public.inventory_items for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "customers_own" on public.customers for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "sales_orders_own" on public.sales_orders for all to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.customers c
      where c.id = customer_id and c.user_id = auth.uid()
    )
  );

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
