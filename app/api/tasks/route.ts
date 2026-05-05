import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/route-auth";
import { dbInsertTask, dbListTasks } from "@/lib/supabase/server-queries";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { supabase, user } = auth;
    const tasks = await dbListTasks(supabase, user.id);
    return NextResponse.json(tasks);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      type: string;
      dueDate: string;
      notes: string | null;
      cropId: string | null;
    };
    if (!body?.type || !body?.dueDate) {
      return NextResponse.json({ error: "type and dueDate required" }, { status: 400 });
    }
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    await dbInsertTask(auth.supabase, body, auth.user.id);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
