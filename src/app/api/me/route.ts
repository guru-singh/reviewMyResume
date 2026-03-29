import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const FREE_LIMIT = 5;

export async function GET(req: Request) {
  const supabase = createSupabaseServerClient({ request: req });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ user: null });

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, subscription_status")
    .eq("id", user.id)
    .maybeSingle();

  const { count } = await supabase
    .from("analyses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const used = count ?? 0;

  const metadata = user.user_metadata ?? {};
  const displayName =
    (typeof metadata.full_name === "string" && metadata.full_name) ||
    (typeof metadata.name === "string" && metadata.name) ||
    user.email ||
    null;
  const avatarUrl =
    (typeof metadata.avatar_url === "string" && metadata.avatar_url) ||
    (typeof metadata.picture === "string" && metadata.picture) ||
    null;

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: displayName,
      avatarUrl,
    },
    profile: profile ?? { plan: "free", subscription_status: "inactive" },
    usage: {
      used,
      limit: FREE_LIMIT,
      remaining: Math.max(0, FREE_LIMIT - used),
    },
  });
}
