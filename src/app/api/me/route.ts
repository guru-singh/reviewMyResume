import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ user: null });

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("plan, subscription_status, tokens_left")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[api/me] profile fetch error:", profileError);

    return NextResponse.json(
      { error: "Failed to load profile." },
      { status: 500 }
    );
  }

  const tokensLeft =
    typeof profile?.tokens_left === "number" ? profile.tokens_left : 0;

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
    profile: profile ?? {
      plan: "free",
      subscription_status: "inactive",
      tokens_left: 0,
    },
    usage: {
      used: null,
      limit: null,
      remaining: tokensLeft,
    },
    tokensLeft,
  });
}