import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { dbUpdateOrder } from "@/lib/supabase/server-queries";

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = (await request.json()) as { customerId?: string; orderedAt?: string };
    const patch: Parameters<typeof dbUpdateOrder>[2] = {};
    if (typeof body.customerId === "string") patch.customerId = body.customerId;
    if (typeof body.orderedAt === "string") patch.orderedAt = body.orderedAt;

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Поне едно поле за актуализация" }, { status: 400 });
    }
    const supabase = createClient(await cookies());
    await dbUpdateOrder(supabase, id, patch);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
