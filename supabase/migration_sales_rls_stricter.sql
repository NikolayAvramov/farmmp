-- Пач за вече приложена multi-user миграция: по-строги RLS за поръчки.
-- Клиентът и складът в поръчка трябва да са на същия акаунт като поръчката.
-- Изпълни веднъж в SQL Editor.

drop policy if exists "sales_orders_own" on public.sales_orders;
drop policy if exists "sales_order_lines_own" on public.sales_order_lines;

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
