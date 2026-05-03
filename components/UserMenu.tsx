"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export function UserMenu({ email }: { email: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.refresh();
      router.push("/login");
    } finally {
      setBusy(false);
    }
  }

  if (!email) return null;

  return (
    <div className="flex min-w-0 max-w-full flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
      <span className="truncate text-[0.7rem] text-farm-bark/60 sm:text-xs" title={email}>
        {email}
      </span>
      <button
        type="button"
        onClick={() => void logout()}
        disabled={busy}
        className="shrink-0 rounded-lg border border-farm-bark/20 bg-farm-parchment px-2.5 py-1 text-xs font-semibold text-farm-forest transition-colors active:bg-farm-cream disabled:opacity-50"
      >
        {busy ? "…" : "Изход"}
      </button>
    </div>
  );
}
