"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    if (password.length < 6) {
      setErr("Паролата трябва да е поне 6 символа.");
      return;
    }
    if (password !== password2) {
      setErr("Паролите не съвпадат.");
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: origin ? { emailRedirectTo: `${origin}/auth/callback?next=/` } : undefined,
      });
      if (error) {
        setErr(error.message);
        return;
      }
      if (data.session) {
        router.refresh();
        router.push("/");
        return;
      }
      setInfo(
        "Изпратихме потвърждение на имейла (ако е включено в Supabase). След потвърждение можете да влезете.",
      );
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
          autoComplete="new-password"
          required
          minLength={6}
          className="farm-input min-h-12 px-3 text-base"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-farm-forest">
        Повтори парола
        <input
          type="password"
          autoComplete="new-password"
          required
          className="farm-input min-h-12 px-3 text-base"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
        />
      </label>
      {err && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900" role="alert">
          {err}
        </p>
      )}
      {info && (
        <p className="rounded-lg border border-farm-moss/30 bg-farm-parchment px-3 py-2 text-sm text-farm-forest">
          {info}
        </p>
      )}
      <button type="submit" disabled={busy} className="farm-btn-dark mt-1 min-h-12 rounded-xl text-base font-semibold">
        {busy ? "Регистрация…" : "Създай профил"}
      </button>
      <p className="text-center text-sm text-farm-bark/70">
        Вече имате профил?{" "}
        <Link href="/login" className="font-semibold text-farm-moss underline-offset-2 hover:underline">
          Вход
        </Link>
      </p>
    </form>
  );
}
