import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { dbListOrders, dbPlaceOrder } from "@/lib/supabase/server-queries";

export async function GET() {
  try {
    const supabase = createClient(await cookies());
    const orders = await dbListOrders(supabase);
    return NextResponse.json(orders);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      customerId: string;
      inventoryItemId: string;
      quantity: number;
    };
    if (!body?.customerId || !body?.inventoryItemId || typeof body.quantity !== "number") {
      return NextResponse.json({ error: "customerId, inventoryItemId, quantity required" }, { status: 400 });
    }
    const supabase = createClient(await cookies());
    await dbPlaceOrder(supabase, body);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    const status = message.startsWith("Недостатъчна") || message.includes("Няма такъв") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
