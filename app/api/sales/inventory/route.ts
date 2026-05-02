import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { dbListInventoryForSales } from "@/lib/supabase/server-queries";

/** Склад за екрана „Продажби“ (същите редове като /api/inventory, без crop_id в отговора). */
export async function GET() {
  try {
    const supabase = createClient(await cookies());
    const items = await dbListInventoryForSales(supabase);
    return NextResponse.json(items);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
