import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/route-auth";
import { dbDeleteCustomer, dbUpdateCustomer } from "@/lib/supabase/server-queries";

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = (await request.json()) as { name?: string; phone?: string | null };
    const patch: Parameters<typeof dbUpdateCustomer>[2] = {};
    if (typeof body.name === "string") patch.name = body.name;
    if (body.phone === null || typeof body.phone === "string") patch.phone = body.phone;

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Поне едно поле за актуализация" }, { status: 400 });
    }
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    await dbUpdateCustomer(auth.supabase, id, patch);
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
    await dbDeleteCustomer(auth.supabase, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
