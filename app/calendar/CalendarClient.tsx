"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { getCalendarCatalog, parseMonthsFromWindow } from "@/lib/agro-calendar";

const MONTHS_BG = [
  "Януари",
  "Февруари",
  "Март",
  "Април",
  "Май",
  "Юни",
  "Юли",
  "Август",
  "Септември",
  "Октомври",
  "Ноември",
  "Декември",
];

export function CalendarClient() {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedCategory, setSelectedCategory] = useState<"ALL" | "VEGETABLE" | "FRUIT">("ALL");
  const [query, setQuery] = useState("");
  const [selectedGuideKey, setSelectedGuideKey] = useState("");
  const catalog = getCalendarCatalog();

  const selectedGuide = useMemo(
    () => catalog.find((g) => g.key === selectedGuideKey) ?? catalog[0],
    [catalog, selectedGuideKey],
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog.filter((g) => {
      if (selectedCategory !== "ALL" && g.category !== selectedCategory) return false;
      const inMonth = [
        ...parseMonthsFromWindow(g.plantingEarly),
        ...parseMonthsFromWindow(g.plantingMain),
        ...parseMonthsFromWindow(g.plantingLate),
      ].includes(selectedMonth);
      if (!inMonth) return false;
      if (!q) return true;
      return g.name.toLowerCase().includes(q);
    });
  }, [catalog, query, selectedCategory, selectedMonth]);

  return (
    <div className="space-y-6">
      <section className="farm-card space-y-3 p-4">
        <label className="block text-sm font-semibold text-farm-bark/85">
          Бърз преглед на култура
          <select
            className="farm-input mt-1.5 w-full min-h-11 px-3 text-base"
            value={selectedGuide?.key ?? ""}
            onChange={(e) => setSelectedGuideKey(e.target.value)}
          >
            {catalog.map((g) => (
              <option key={g.key} value={g.key}>
                {g.name}
              </option>
            ))}
          </select>
        </label>
        {selectedGuide ? (
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-farm-bark/10 bg-farm-cream/60 p-3 text-sm">
            <p><span className="font-semibold">Ранно:</span> {selectedGuide.plantingEarly}</p>
            <p><span className="font-semibold">Основно:</span> {selectedGuide.plantingMain}</p>
            <p><span className="font-semibold">Късно:</span> {selectedGuide.plantingLate}</p>
            <p><span className="font-semibold">Беритба:</span> {selectedGuide.harvestWindow}</p>
            <p className="col-span-2"><span className="font-semibold">Схема:</span> {selectedGuide.plantingScheme}</p>
          </div>
        ) : null}
      </section>

      <section className="farm-card space-y-3 p-4">
        <p className="font-display text-xl text-farm-forest">Подходящо време за засаждане</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <label className="text-sm font-semibold text-farm-bark/85">
            Месец
            <select
              className="farm-input mt-1.5 w-full min-h-11 px-3 text-base"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {MONTHS_BG.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-farm-bark/85">
            Категория
            <select
              className="farm-input mt-1.5 w-full min-h-11 px-3 text-base"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as "ALL" | "VEGETABLE" | "FRUIT")}
            >
              <option value="ALL">Всички</option>
              <option value="VEGETABLE">Зеленчуци</option>
              <option value="FRUIT">Плодове</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-farm-bark/85">
            Търсене
            <input
              className="farm-input mt-1.5 w-full min-h-11 px-3 text-base"
              placeholder="Напр. домати"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>
        <p className="text-sm text-farm-bark/75">
          За {MONTHS_BG[selectedMonth - 1]}: <span className="font-semibold">{filtered.length}</span> подходящи култури.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl text-farm-forest">Култури за този месец</h2>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filtered.map((g) => (
            <li key={g.key} className="farm-card overflow-hidden">
              <Image src={g.image} alt={g.name} className="h-28 w-full object-cover" width={900} height={220} />
              <div className="space-y-2 p-3">
                <p className="font-display text-lg text-farm-forest">{g.name}</p>
                <p className="text-sm text-farm-bark/75">{g.summary}</p>
                <p className="text-xs text-farm-bark/70">
                  Ранно: {g.plantingEarly} · Основно: {g.plantingMain} · Късно: {g.plantingLate}
                </p>
                <Link href={`/calendar/${encodeURIComponent(g.key)}`} className="farm-btn-dark inline-flex min-h-10 items-center rounded-lg px-3 text-sm">
                  Детайли
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>

    </div>
  );
}
