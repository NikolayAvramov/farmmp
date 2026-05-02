import { CropsClient } from "./CropsClient";

export default function CropsPage() {
  return (
    <>
      <header className="mb-5 flex items-start justify-between gap-3 border-b border-farm-bark/10 pb-4">
        <div className="min-w-0">
          <p className="font-sans text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-farm-moss">
            Полски дневник
          </p>
          <h1 className="font-display mt-1 text-[1.65rem] font-semibold leading-tight tracking-tight text-farm-forest md:text-3xl">
            Култури
          </h1>
        </div>
      </header>
      <CropsClient />
    </>
  );
}
