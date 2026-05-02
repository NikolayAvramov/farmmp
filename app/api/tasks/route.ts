import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { dbInsertTask, dbListTasks } from "@/lib/supabase/server-queries";

export async function GET() {
  try {
    const supabase = createClient(await cookies());
    const tasks = await dbListTasks(supabase);
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
    const supabase = createClient(await cookies());
    await dbInsertTask(supabase, body);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
