
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Console } from "console";


export async function GET2(request: NextRequest) {
  console.log("🔥 CALLBACK HIT 🔥");
  console.log("Callback URL:", request.url);

  return NextResponse.json({ ok: true });
}
export async function GET(request: NextRequest) {
    console.log('==================SUBABASE CLIENT CREATED==================*************');

      console.log("Callback URL:", request.url);
    console.log('==================SUBABASE CLIENT CREATED==================*************');

  const requestUrl = new URL(request.url);
  console.log("OAuth callback request.url:", request.url);
  console.log("OAuth callback origin:", request.nextUrl.origin);
  console.log("OAuth callback next:", requestUrl.searchParams.get("next") );
    console.log('==================SUBABASE CLIENT CREATED==================*************');

  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const supabase = await createSupabaseServerClient();
    console.log('==================SUBABASE CLIENT CREATED==================');
    console.log(code)
    console.log('==================SUBABASE CLIENT CREATED==================');

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