import Link from "next/link";
import { cookies } from "next/headers";
import { HomeOnboardingSlot } from "@/components/HomeOnboardingSlot";
import { StatCard } from "@/components/StatCard";
import { createClient } from "@/utils/supabase/server";
import {
  dbListCrops,
  dbListCustomers,
  dbListInventory,
  dbListTasks,
} from "@/lib/supabase/server-queries";

/** Съвпада с екрана „Задачи“: само DONE е завършена; останалите се броят като чакащи. */
function isTaskOpen(status: string | undefined): boolean {
  const s = String(status ?? "")
    .trim()
    .toUpperCase();
  return s !== "DONE";
}

export default async function Home() {
  let cropCount = 0;
  let pendingTasks = 0;
  let inventoryLines = 0;
  let customerCount = 0;

  try {
    const supabase = createClient(await cookies());
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("no session");
    }
    const uid = user.id;
    const [cropsR, tasksR, invR, custR] = await Promise.allSettled([
      dbListCrops(supabase, uid),
      dbListTasks(supabase, uid),
      dbListInventory(supabase, uid),
      dbListCustomers(supabase, uid),
    ]);
    cropCount = cropsR.status === "fulfilled" ? cropsR.value.length : 0;
    pendingTasks =
      tasksR.status === "fulfilled" ? tasksR.value.filter((t) => isTaskOpen(t.status)).length : 0;
    inventoryLines = invR.status === "fulfilled" ? invR.value.length : 0;
    customerCount = custR.status === "fulfilled" ? custR.value.length : 0;
  } catch {
    cropCount = 0;
    pendingTasks = 0;
    inventoryLines = 0;
    customerCount = 0;
  }

  return (
    <>
      <HomeOnboardingSlot />
      <header className="mb-5 flex items-start justify-between gap-3 border-b border-farm-bark/10 pb-4">
        <div className="min-w-0">
          <p className="font-sans text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-farm-moss">
            Полски дневник
          </p>
          <div className="flex items-center justify-between gap-3">
            <h1 className="font-display mt-1 text-[1.65rem] font-semibold leading-tight tracking-tight text-farm-forest md:text-3xl">
              Табло
            </h1>
            <Link
              href="/expenses"
              className="inline-flex min-h-12 shrink-0 items-center rounded-xl border border-farm-bark/20 bg-farm-parchment px-4 text-sm font-semibold text-farm-bark shadow-sm transition-colors active:bg-farm-cream"
            >
              Разходи
            </Link>
          </div>
        </div>
      </header>

      <p className="mb-6 text-[0.95rem] leading-relaxed text-farm-bark/75">
        Обзор на стопанството — култури, задачи, склад и продажби на едно място.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <StatCard href="/crops" label="Култури" value={cropCount} />
        <StatCard href="/tasks" label="Чакащи задачи" value={pendingTasks} />
        <StatCard href="/inventory" label="Артикули" value={inventoryLines} />
        <StatCard href="/sales" label="Клиенти" value={customerCount} />
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <Link
          href="/diagnose"
          className="flex min-h-14 items-center justify-center rounded-2xl border-2 border-farm-terracotta/50 bg-farm-terracotta/15 text-lg font-semibold text-farm-bark shadow-sm transition-colors active:bg-farm-terracotta/25"
        >
          AI диагностика по снимка
        </Link>
        <Link
          href="/calendar"
          className="flex min-h-14 items-center justify-center rounded-2xl border-2 border-farm-forest/75 bg-farm-forest text-lg font-semibold text-farm-cream shadow-sm transition-colors active:bg-farm-forest/90"
        >
          Агро календар
        </Link>
        <Link
          href="/crops"
          className="farm-btn-primary flex min-h-14 items-center justify-center rounded-2xl text-lg"
        >
          Управление на култури
        </Link>
        <Link
          href="/tasks"
          className="flex min-h-14 items-center justify-center rounded-2xl border-2 border-farm-moss/80 bg-farm-parchment/80 text-lg font-semibold text-farm-forest shadow-sm transition-colors active:bg-farm-cream"
        >
          Задачи за деня
        </Link>
      </div>
    </>
  );
}
