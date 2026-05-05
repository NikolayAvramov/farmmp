import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/route-auth";
import { dbAddHarvest } from "@/lib/supabase/server-queries";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      cropId: string;
      productLabel: string;
      quantity: number;
      unit?: string;
    };
    const unit = body.unit === "PCS" ? "PCS" : "KG";
    if (!body?.cropId || !body?.productLabel || typeof body.quantity !== "number") {
      return NextResponse.json({ error: "cropId, productLabel, quantity required" }, { status: 400 });
    }
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    await dbAddHarvest(auth.supabase, {
      cropId: body.cropId,
      productLabel: body.productLabel,
      quantity: body.quantity,
      unit,
      userId: auth.user.id,
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
