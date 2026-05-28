import { NextResponse } from "next/server";
import webpush from "web-push";
import { requireAuth } from "@/lib/supabase/route-auth";
import { dbListTasks } from "@/lib/supabase/server-queries";

function setupWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:support@example.com";
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

export async function POST() {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    if (!setupWebPush()) {
      return NextResponse.json({ ok: false, reason: "missing_vapid" });
    }

    const tasks = await dbListTasks(auth.supabase, auth.user.id);
    const todayUtc = parseYmdToUtc(new Date().toISOString().slice(0, 10));
    let overdue = 0;
    let soon = 0;
    for (const t of tasks) {
      if (String(t.status).toUpperCase() === "DONE") continue;
      const due = parseYmdToUtc(t.dueDate);
      if (Number.isNaN(due)) continue;
      const deltaDays = Math.floor((due - todayUtc) / (1000 * 60 * 60 * 24));
      if (deltaDays < 0) overdue += 1;
      else if (deltaDays <= 2) soon += 1;
    }
    if (overdue === 0 && soon === 0) return NextResponse.json({ ok: true, sent: 0 });

    const { data: subs, error } = await auth.supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", auth.user.id);
    if (error) throw new Error(error.message);
    if (!subs?.length) return NextResponse.json({ ok: true, sent: 0 });

    const payload = JSON.stringify({
      title: "Агро задачи за внимание",
      body: `Просрочени: ${overdue}, до 2 дни: ${soon}.`,
      url: "/tasks",
    });

    await Promise.all(
      subs.map((s) =>
        webpush.sendNotification({
          endpoint: s.endpoint,
          keys: { p256dh: s.p256dh, auth: s.auth },
        }, payload).catch(async () => {
          await auth.supabase.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
        }),
      ),
    );

    return NextResponse.json({ ok: true, sent: subs.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function parseYmdToUtc(ymd: string) {
  const [yRaw, mRaw, dRaw] = ymd.split("-");
  const y = Number.parseInt(yRaw ?? "", 10);
  const m = Number.parseInt(mRaw ?? "", 10);
  const d = Number.parseInt(dRaw ?? "", 10);
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) {
    return Number.NaN;
  }
  return Date.UTC(y, m - 1, d);
}
