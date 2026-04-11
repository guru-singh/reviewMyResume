import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    "https://plozbfvrbmobfcyeiklm.supabase.co",
    "sb_publishable_Teyelvbmbg5u6uKyEK2XuA_-jtEqOeE"
  );
}