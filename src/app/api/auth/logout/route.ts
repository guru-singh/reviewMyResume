import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const COOKIE_NAMES = ["sb-access-token", "sb-refresh-token", "sb-ssr"];

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient({ request: req });
  const { error } = await supabase.auth.signOut();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  COOKIE_NAMES.forEach((cookie) => response.cookies.delete(cookie));
  return response;
}
