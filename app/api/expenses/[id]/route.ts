import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/route-auth";
import { dbDeleteExpense, dbUpdateExpense } from "@/lib/supabase/server-queries";

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
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    await dbUpdateExpense(auth.supabase, id, patch);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    await dbDeleteExpense(auth.supabase, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
