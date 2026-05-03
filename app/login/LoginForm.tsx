"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextRaw = searchParams.get("next");
  const nextPath =
    nextRaw && nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/";
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(urlError ?? null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setErr(error.message);
        return;
      }
      router.refresh();
      router.push(nextPath);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium text-farm-forest">
        Имейл
        <input
          type="email"
          autoComplete="email"
          required
          className="farm-input min-h-12 px-3 text-base"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-farm-forest">
        Парола
        <input
          type="password"
          autoComplete="current-password"
          required
          className="farm-input min-h-12 px-3 text-base"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {err && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900" role="alert">
          {err}
        </p>
      )}
      <button type="submit" disabled={busy} className="farm-btn-dark mt-1 min-h-12 rounded-xl text-base font-semibold">
        {busy ? "Влизане…" : "Вход"}
      </button>
      <p className="text-center text-sm text-farm-bark/70">
        Нямате профил?{" "}
        <Link href="/register" className="font-semibold text-farm-moss underline-offset-2 hover:underline">
          Регистрация
        </Link>
      </p>
    </form>
  );
}
