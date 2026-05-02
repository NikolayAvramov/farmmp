import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { dbListCropOptions } from "@/lib/supabase/server-queries";

export async function GET() {
  try {
    const supabase = createClient(await cookies());
    const options = await dbListCropOptions(supabase);
    return NextResponse.json(options);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
