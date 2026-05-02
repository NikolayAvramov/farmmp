import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { dbUpdateExpense } from "@/lib/supabase/server-queries";

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = (await request.json()) as {
      type?: string;
      amount?: string;
      spentAt?: string;
      notes?: string | null;
    };
    const patch: Parameters<typeof dbUpdateExpense>[2] = {};
    if (typeof body.type === "string") patch.type = body.type;
    if (typeof body.amount === "string") patch.amount = body.amount;
    if (typeof body.spentAt === "string") patch.spentAt = body.spentAt;
    if (body.notes === null || typeof body.notes === "string") patch.notes = body.notes;

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Поне едно поле за актуализация" }, { status: 400 });
    }
    const supabase = createClient(await cookies());
    await dbUpdateExpense(supabase, id, patch);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
