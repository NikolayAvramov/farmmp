"use client";

import Link from "next/link";
import { useState } from "react";

export function OnboardingPrompt() {
  const [show, setShow] = useState(() => {
    if (typeof window === "undefined") return false;
    return !window.localStorage.getItem("onboarding-seen-v1");
  });

  if (!show) return null;
  return (
    <section className="mb-4 rounded-2xl border border-farm-moss/25 bg-farm-moss/10 p-3">
      <p className="text-sm text-farm-bark/85">
        За най-добър старт отвори onboarding и активирай календар/известия.
      </p>
      <div className="mt-2 flex gap-2">
        <Link href="/onboarding" className="farm-btn-dark rounded-lg px-3 py-2 text-xs">
          Старт
        </Link>
        <button
          type="button"
          className="rounded-lg border border-farm-bark/25 px-3 py-2 text-xs font-semibold text-farm-bark"
          onClick={() => {
            window.localStorage.setItem("onboarding-seen-v1", "1");
            setShow(false);
          }}
        >
          Скрий
        </button>
      </div>
    </section>
  );
}
