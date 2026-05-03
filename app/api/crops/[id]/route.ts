import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/route-auth";
import { dbDeleteCrop, dbUpdateCrop } from "@/lib/supabase/server-queries";
import type { CropRow } from "@/lib/crop-types";

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = (await request.json()) as Omit<CropRow, "id" | "createdAt">;
    if (!body?.name?.trim() || !body?.variety?.trim()) {
      return NextResponse.json({ error: "name and variety required" }, { status: 400 });
    }
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    await dbUpdateCrop(auth.supabase, id, body);
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
    await dbDeleteCrop(auth.supabase, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
