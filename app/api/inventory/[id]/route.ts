import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { dbUpdateInventoryItem } from "@/lib/supabase/server-queries";

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
    const supabase = createClient(await cookies());
    await dbUpdateInventoryItem(supabase, id, patch);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
