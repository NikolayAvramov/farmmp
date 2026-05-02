import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { dbInsertCrop, dbListCrops } from "@/lib/supabase/server-queries";
import type { CropRow } from "@/lib/crop-types";

export async function GET() {
  try {
    const supabase = createClient(await cookies());
    const crops = await dbListCrops(supabase);
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
    const supabase = createClient(await cookies());
    await dbInsertCrop(supabase, body);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
