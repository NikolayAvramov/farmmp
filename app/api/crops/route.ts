import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/route-auth";
import { dbInsertCrop, dbListCrops } from "@/lib/supabase/server-queries";
import type { CropRow } from "@/lib/crop-types";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { supabase, user } = auth;
    const crops = await dbListCrops(supabase, user.id);
    return NextResponse.json(crops);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Omit<CropRow, "id" | "createdAt">;
    if (!body?.name?.trim() || !body?.variety?.trim()) {
      return NextResponse.json({ error: "name and variety required" }, { status: 400 });
    }
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { supabase, user } = auth;
    await dbInsertCrop(supabase, body, user.id);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
