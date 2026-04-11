import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = "https://plozbfvrbmobfcyeiklm.supabase.co";
const supabaseAnonKey = "sb_publishable_Teyelvbmbg5u6uKyEK2XuA_-jtEqOeE";

export function createSupabaseBrowserClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}