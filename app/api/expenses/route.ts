import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { dbInsertExpense, dbListExpenses } from "@/lib/supabase/server-queries";

export async function GET() {
  try {
    const supabase = createClient(await cookies());
    const rows = await dbListExpenses(supabase);
    return NextResponse.json(rows);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      type: string;
      amount: string;
      spentAt: string;
      notes: string | null;
    };
    if (!body?.type?.trim() || !body?.amount?.trim() || !body?.spentAt) {
      return NextResponse.json({ error: "type, amount, spentAt required" }, { status: 400 });
    }
    const supabase = createClient(await cookies());
    await dbInsertExpense(supabase, body);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
