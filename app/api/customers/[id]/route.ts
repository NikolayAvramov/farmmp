import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { dbUpdateCustomer } from "@/lib/supabase/server-queries";

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = (await request.json()) as { name?: string; phone?: string | null };
    const patch: Parameters<typeof dbUpdateCustomer>[2] = {};
    if (typeof body.name === "string") patch.name = body.name;
    if (body.phone === null || typeof body.phone === "string") patch.phone = body.phone;

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Поне едно поле за актуализация" }, { status: 400 });
    }
    const supabase = createClient(await cookies());
    await dbUpdateCustomer(supabase, id, patch);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
