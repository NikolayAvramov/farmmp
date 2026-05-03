import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/route-auth";
import { dbDeleteInventoryItem, dbUpdateInventoryItem } from "@/lib/supabase/server-queries";

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = (await request.json()) as {
      productLabel?: string;
      quantityAvailable?: number;
      unit?: string;
      cropId?: string | null;
    };
    const unit = body.unit === "PCS" || body.unit === "KG" ? body.unit : undefined;
    const patch: Parameters<typeof dbUpdateInventoryItem>[2] = {};
    if (typeof body.productLabel === "string") patch.productLabel = body.productLabel.trim();
    if (typeof body.quantityAvailable === "number") patch.quantityAvailable = body.quantityAvailable;
    if (unit !== undefined) patch.unit = unit;
    if (body.cropId === null || typeof body.cropId === "string") patch.cropId = body.cropId;

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Поне едно поле за актуализация" }, { status: 400 });
    }
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    await dbUpdateInventoryItem(auth.supabase, id, patch);
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
    await dbDeleteInventoryItem(auth.supabase, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
