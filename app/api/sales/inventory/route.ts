import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/route-auth";
import { dbListInventoryForSales } from "@/lib/supabase/server-queries";

/** Склад за екрана „Продажби“ (същите редове като /api/inventory, без crop_id в отговора). */
export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { supabase } = auth;
    const items = await dbListInventoryForSales(supabase);
    return NextResponse.json(items);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
