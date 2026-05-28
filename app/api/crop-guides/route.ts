import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/route-auth";
import { dbInsertCropGuide, dbListCropGuides, type CropGuideStep } from "@/lib/supabase/server-queries";

type GuideBody = {
  cropName: string;
  category: "VEGETABLE" | "FRUIT";
  imageUrl: string | null;
  summary: string;
  steps: CropGuideStep[];
};

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const rows = await dbListCropGuides(auth.supabase, auth.user.id);
    return NextResponse.json(rows);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GuideBody;
    if (!body.cropName?.trim() || !body.summary?.trim()) {
      return NextResponse.json({ error: "cropName and summary required" }, { status: 400 });
    }
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    await dbInsertCropGuide(auth.supabase, auth.user.id, {
      cropName: body.cropName.trim(),
      category: body.category,
      imageUrl: body.imageUrl?.trim() || null,
      summary: body.summary.trim(),
      steps: Array.isArray(body.steps) ? body.steps : [],
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
