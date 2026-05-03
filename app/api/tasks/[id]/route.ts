import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/route-auth";
import { dbDeleteTask, dbUpdateTask, type TaskPatch } from "@/lib/supabase/server-queries";

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = (await request.json()) as Record<string, unknown>;
    const patch: TaskPatch = {};
    if (typeof body.type === "string") patch.type = body.type;
    if (typeof body.status === "string") patch.status = body.status;
    if (typeof body.dueDate === "string") patch.dueDate = body.dueDate;
    if (body.notes === null || typeof body.notes === "string") patch.notes = body.notes;
    if (body.cropId === null || typeof body.cropId === "string") patch.cropId = body.cropId;

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Поне едно поле за актуализация" }, { status: 400 });
    }
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    await dbUpdateTask(auth.supabase, id, patch);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    await dbDeleteTask(auth.supabase, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
