import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/route-auth";
import { dbDeleteOrder, dbUpdateOrder } from "@/lib/supabase/server-queries";

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = (await request.json()) as { customerId?: string; orderedAt?: string };
    const patch: Parameters<typeof dbUpdateOrder>[2] = {};
    if (typeof body.customerId === "string") patch.customerId = body.customerId;
    if (typeof body.orderedAt === "string") patch.orderedAt = body.orderedAt;

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Поне едно поле за актуализация" }, { status: 400 });
    }
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    await dbUpdateOrder(auth.supabase, id, patch);
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
    await dbDeleteOrder(auth.supabase, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
