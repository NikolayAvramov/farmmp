import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";

export default async function TodosPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: todos } = await supabase.from("todos").select().order("created_at", { ascending: false });

  return (
    <>
      <header className="mb-5 flex items-center justify-between border-b border-farm-bark/10 pb-4">
        <h1 className="font-display text-xl font-semibold text-farm-forest">Todos (Supabase)</h1>
        <Link href="/" className="text-sm font-semibold text-farm-moss underline-offset-2 hover:underline">
          Начало
        </Link>
      </header>
      <ul className="space-y-2">
        {todos?.map((todo: { id: string; name?: string | null }) => (
          <li key={todo.id} className="farm-card px-4 py-3 text-farm-forest">
            {todo.name ?? "(без име)"}
          </li>
        ))}
      </ul>
      {(!todos || todos.length === 0) && (
        <p className="mt-4 text-sm text-farm-bark/60">
          Няма редове в таблица <code className="text-farm-moss">todos</code> или липсва достъп.
        </p>
      )}
    </>
  );
}
