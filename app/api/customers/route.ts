import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/route-auth";
import { dbInsertCustomer, dbListCustomers } from "@/lib/supabase/server-queries";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { supabase } = auth;
    const customers = await dbListCustomers(supabase);
    return NextResponse.json(customers);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name: string; phone: string | null };
    if (!body?.name?.trim()) {
      return NextResponse.json({ error: "name required" }, { status: 400 });
    }
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    await dbInsertCustomer(auth.supabase, {
      name: body.name.trim(),
      phone: body.phone?.trim() || null,
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
