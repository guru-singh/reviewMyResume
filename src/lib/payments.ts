import { createSupabaseServerClient } from "@/lib/supabase/server";

const PREMIUM_FEATURE_KEYS = [
  "premium_resume_review",
  "pro_resume_review",
];

export async function hasPremiumAccess(userId?: string | null) {
  if (!userId) return false;

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("user_entitlements")
    .select("id, status, starts_at, ends_at, feature_key")
    .eq("user_id", userId)
    .in("feature_key", PREMIUM_FEATURE_KEYS)
    .eq("status", "active")
    .limit(1);

  if (error || !data || data.length === 0) return false;

  const entitlement = data[0];
  const now = new Date();

  if (entitlement.starts_at && new Date(entitlement.starts_at) > now) {
    return false;
  }

  if (entitlement.ends_at && new Date(entitlement.ends_at) < now) {
    return false;
  }

  return true;
}