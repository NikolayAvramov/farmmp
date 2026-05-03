import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

export type AuthedRouteContext = {
  supabase: ReturnType<typeof createClient>;
  user: User;
};

/**
 * За API Route Handlers: изисква валидна сесия (cookie).
 * При липса връща JSON 401.
 */
export async function requireAuth(): Promise<AuthedRouteContext | NextResponse> {
  const supabase = createClient(await cookies());
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "Не сте влезли в профила" }, { status: 401 });
  }
  return { supabase, user };
}
