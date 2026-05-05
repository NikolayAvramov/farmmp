import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/route-auth";
import { dbInsertInventoryQuick } from "@/lib/supabase/server-queries";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      productLabel: string;
      quantityAvailable: number;
      unit: string;
    };
    if (!body?.productLabel?.trim() || typeof body.quantityAvailable !== "number" || !body?.unit) {
      return NextResponse.json({ error: "invalid payload" }, { status: 400 });
    }
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    await dbInsertInventoryQuick(auth.supabase, body, auth.user.id);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
