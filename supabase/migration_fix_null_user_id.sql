-- Пусни това, ако предишна миграция спря на NOT NULL заради NULL user_id.
-- След успешен Run продължи от стъпките след попълването в migration_auth_multitenancy.sql
-- (или пусни целия обновен migration_auth_multitenancy.sql отново — той е идемпотентен към колоните).

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
    raise exception
      'Няма потребител в auth.users. Регистрирай се в приложението, после пусни отново — или изтрий тестовите данни с TRUNCATE (виж коментара в migration_auth_multitenancy.sql).';
  end if;
end $$;

alter table public.crops alter column user_id set not null;
alter table public.tasks alter column user_id set not null;
alter table public.inventory_items alter column user_id set not null;
alter table public.customers alter column user_id set not null;
alter table public.sales_orders alter column user_id set not null;
alter table public.expenses alter column user_id set not null;
alter table public.todos alter column user_id set not null;
