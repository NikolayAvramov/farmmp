import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/route-auth";
import { dbDeleteCropGuide, dbUpdateCropGuide, type CropGuideStep } from "@/lib/supabase/server-queries";

type GuidePatch = {
  cropName?: string;
  category?: "VEGETABLE" | "FRUIT";
  imageUrl?: string | null;
  summary?: string;
  steps?: CropGuideStep[];
};

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = (await request.json()) as GuidePatch;
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    await dbUpdateCropGuide(auth.supabase, id, body);
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
    await dbDeleteCropGuide(auth.supabase, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
