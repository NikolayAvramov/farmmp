import Link from "next/link";

export function StatCard({ href, label, value }) {
  return (
    <Link
      href={href}
      className="farm-card block p-4 transition-transform active:scale-[0.98] active:brightness-[0.99]"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-farm-sage">
        {label}
      </p>
      <p className="font-display mt-1 text-3xl font-semibold tabular-nums text-farm-forest">
        {value}
      </p>
    </Link>
  );
}
