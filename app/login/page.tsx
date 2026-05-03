import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <>
      <header className="mb-2 border-b border-farm-bark/10 pb-4">
        <p className="font-sans text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-farm-moss">Профил</p>
        <h1 className="font-display mt-1 text-2xl font-semibold text-farm-forest">Вход</h1>
        <p className="mt-2 text-sm text-farm-bark/70">Влезте, за да виждате само вашите данни в приложението.</p>
      </header>
      <Suspense fallback={<p className="text-sm text-farm-bark/60">Зареждане…</p>}>
        <LoginForm />
      </Suspense>
    </>
  );
}
