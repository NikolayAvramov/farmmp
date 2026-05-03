"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Начало" },
  { href: "/crops", label: "Култури" },
  { href: "/tasks", label: "Задачи" },
  /** по-късо на мобилен, за да не раздува реда */
  { href: "/inventory", label: "Склад" },
  { href: "/sales", label: "Продажби" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 max-w-[100%] border-t border-farm-bark/25 bg-farm-forest/97 shadow-[0_-6px_20px_-8px_rgba(10,22,18,0.5)] backdrop-blur-md safe-area-pb"
      aria-label="Основна навигация"
    >
      <div className="mx-auto box-border grid w-full max-w-lg grid-cols-5 gap-0.5 px-1 pt-1.5 pb-1 [contain:inline-size]">
        {links.map(({ href, label }) => {
          const active =
            pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-h-11 min-w-0 flex-col items-center justify-center rounded-lg px-0.5 py-1 text-center text-[0.625rem] font-semibold leading-[1.15] tracking-tight transition-all sm:min-h-12 sm:text-[0.7rem] ${
                active
                  ? "bg-farm-wheat text-farm-bark shadow-sm ring-1 ring-farm-wheat-dim/40"
                  : "text-farm-cream/90 active:bg-white/10"
              }`}
            >
              <span className="line-clamp-2 w-full break-words hyphens-auto">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
