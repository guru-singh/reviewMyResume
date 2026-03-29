import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

type CookiePair = { name: string; value: string };

type SupabaseServerClientOptions = {
  request?: Request;
};

const parseHeaderCookies = (header: string | null | undefined): CookiePair[] => {
  if (!header) return [];
  return header
    .split(";")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const eq = chunk.indexOf("=");
      if (eq === -1) {
        return { name: decodeURIComponent(chunk), value: "" };
      }
      const name = chunk.slice(0, eq);
      const value = chunk.slice(eq + 1);
      return {
        name: decodeURIComponent(name),
        value: decodeURIComponent(value),
      };
    });
};

export function createSupabaseServerClient(options: SupabaseServerClientOptions = {}) {
  const { request } = options;
  const cookieHeader = request?.headers.get("cookie") ?? null;
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          if (request) {
            return parseHeaderCookies(cookieHeader);
          }
          if (typeof cookieStore.getAll === "function") {
            return cookieStore.getAll();
          }
          return [];
        },
        setAll(cookiesToSet) {
          if (typeof cookieStore.set === "function") {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          }
        },
      },
      global: {
        headers: {
          "X-Client-Info": "resume-review-mvp",
        },
      },
    }
  );
}
