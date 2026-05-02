/** Унифицирани съобщения за липсваща таблица / RLS. */
export function formatSupabaseTableError(
  error: { message: string; code?: string },
  table: string,
  scriptHint: string,
): string {
  const msg = error.message ?? "";
  const code = error.code ?? "";
  if (
    code === "PGRST205" ||
    new RegExp(`could not find the table.*${table}`, "i").test(msg) ||
    new RegExp(`relation ["']?public\\.${table}["']? does not exist`, "i").test(msg)
  ) {
    return `Липсва таблица public.${table}. В Supabase SQL Editor изпълни ${scriptHint}.`;
  }
  if (/row-level security/i.test(msg) || code === "42501") {
    return `RLS блокира операцията (${table}). Изпълни отново ${scriptHint} (GRANT + политики).`;
  }
  return msg;
}
