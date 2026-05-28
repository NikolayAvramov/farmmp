import Link from "next/link";

const steps = [
  "Добави култури със стартова дата.",
  "Провери автоматично генерираните задачи.",
  "Отвори Календар и филтрирай по месец/култура.",
  "Активирай известия за важни дейности.",
];

export default function OnboardingPage() {
  return (
    <div className="space-y-5">
      <header className="border-b border-farm-bark/10 pb-3">
        <p className="font-sans text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-farm-moss">
          Полски дневник
        </p>
        <h1 className="font-display mt-1 text-3xl text-farm-forest">Добре дошъл</h1>
      </header>
      <section className="farm-card space-y-3 p-4">
        <p className="text-sm text-farm-bark/80">4 стъпки за професионален старт:</p>
        <ol className="space-y-2">
          {steps.map((s, idx) => (
            <li key={s} className="rounded-lg bg-farm-parchment/60 px-3 py-2 text-sm text-farm-bark">
              <span className="font-semibold text-farm-forest">{idx + 1}.</span> {s}
            </li>
          ))}
        </ol>
      </section>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Link href="/crops" className="farm-btn-primary flex min-h-12 items-center justify-center rounded-xl">
          Добави култура
        </Link>
        <Link href="/calendar" className="farm-btn-dark flex min-h-12 items-center justify-center rounded-xl">
          Отвори календар
        </Link>
      </div>
    </div>
  );
}
