import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env } from "process";

type CookieToSet = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/dashboard";

 // const response = NextResponse.redirect(new URL(next, url.origin));
//   "https://reviewmyresume-48414740448.asia-south1.run.app/dashboard"
 const response = NextResponse.redirect("https://reviewmyresume-48414740448.asia-southeast1.run.app/dashboard");

//  //const response = NextResponse.redirect(env.NEXT_PUBLIC_BASE_URL?.toString);
//  const response = NextResponse.redirect(new URL(next, process.env.NEXT_PUBLIC_BASE_URL+'/dashboard'));


  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options as any);
          });
        },
      },
    }
  );

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("OAuth exchange error:", error);
      return NextResponse.redirect(
        new URL("/login?error=oauth_callback", url.origin)
      );
    }
  }

  return response;
}