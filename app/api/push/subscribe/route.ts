import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/route-auth";

type PushSubscriptionBody = {
  endpoint: string;
  keys?: { p256dh?: string; auth?: string };
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PushSubscriptionBody;
    if (!body.endpoint || !body.keys?.p256dh || !body.keys.auth) {
      return NextResponse.json({ error: "Invalid subscription payload" }, { status: 400 });
    }
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { error } = await auth.supabase.from("push_subscriptions").upsert(
      {
        user_id: auth.user.id,
        endpoint: body.endpoint,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
      },
      { onConflict: "endpoint" },
    );
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
