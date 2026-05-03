import { RegisterForm } from "./RegisterForm";

export default function RegisterPage() {
  return (
    <>
      <header className="mb-2 border-b border-farm-bark/10 pb-4">
        <p className="font-sans text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-farm-moss">Профил</p>
        <h1 className="font-display mt-1 text-2xl font-semibold text-farm-forest">Регистрация</h1>
        <p className="mt-2 text-sm text-farm-bark/70">
          Създайте профил — данните за култури, склад и поръчки се пазят отделно за всеки потребител.
        </p>
      </header>
      <RegisterForm />
    </>
  );
}
