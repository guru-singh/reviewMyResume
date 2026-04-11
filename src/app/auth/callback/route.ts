import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("OAuth callback exchange failed:", error);
      return NextResponse.redirect(new URL("/login?error=oauth_callback_failed", request.url));
    }

    return NextResponse.redirect(new URL(next, request.url));
  } catch (error) {
    console.error("OAuth callback route failed:", error);
    return NextResponse.redirect(new URL("/login?error=oauth_callback_failed", request.url));
  }
}