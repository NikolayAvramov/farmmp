import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { dbUpdateCrop } from "@/lib/supabase/server-queries";
import type { CropRow } from "@/lib/crop-types";

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = (await request.json()) as Omit<CropRow, "id" | "createdAt">;
    if (!body?.name?.trim() || !body?.variety?.trim()) {
      return NextResponse.json({ error: "name and variety required" }, { status: 400 });
    }
    const supabase = createClient(await cookies());
    await dbUpdateCrop(supabase, id, body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
