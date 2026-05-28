import Image from "next/image";
import { notFound } from "next/navigation";
import { getGuideByKey } from "@/lib/agro-calendar";

export default async function CalendarCropDetailPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const guide = getGuideByKey(decodeURIComponent(key));
  if (!guide) return notFound();

  return (
    <div className="space-y-4">
      <header className="border-b border-farm-bark/10 pb-3">
        <p className="font-sans text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-farm-moss">
          Календар култура
        </p>
        <h1 className="font-display mt-1 text-3xl text-farm-forest">{guide.name}</h1>
      </header>

      <Image src={guide.image} alt={guide.name} className="h-48 w-full rounded-2xl object-cover" width={1000} height={360} />

      <section className="grid grid-cols-2 gap-2 rounded-2xl border border-farm-bark/10 bg-farm-cream/65 p-3 text-sm">
        <p><span className="font-semibold">Ранно засаждане:</span> {guide.plantingEarly}</p>
        <p><span className="font-semibold">Основно засаждане:</span> {guide.plantingMain}</p>
        <p><span className="font-semibold">Късно засаждане:</span> {guide.plantingLate}</p>
        <p><span className="font-semibold">Беритба:</span> {guide.harvestWindow}</p>
        <p className="col-span-2"><span className="font-semibold">Схема:</span> {guide.plantingScheme}</p>
      </section>

      <section className="overflow-x-auto rounded-2xl border border-farm-bark/15">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-farm-forest text-farm-cream">
            <tr>
              <th className="px-3 py-2">Етап</th>
              <th className="px-3 py-2">Период</th>
              <th className="px-3 py-2">Цел</th>
              <th className="px-3 py-2">Торене/подхранване</th>
              <th className="px-3 py-2">Честота</th>
              <th className="px-3 py-2">Схема</th>
            </tr>
          </thead>
          <tbody>
            {guide.calendarRows.map((row) => (
              <tr key={`${guide.key}-${row.stage}`} className="odd:bg-farm-parchment/70 even:bg-farm-cream/40">
                <td className="px-3 py-2 font-semibold text-farm-forest">{row.stage}</td>
                <td className="px-3 py-2">{row.period}</td>
                <td className="px-3 py-2">{row.goal}</td>
                <td className="px-3 py-2">{row.nutrition}</td>
                <td className="px-3 py-2">{row.frequency}</td>
                <td className="px-3 py-2">{row.plantingScheme}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
