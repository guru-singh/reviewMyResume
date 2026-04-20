import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function ensureFreeGrant(userId: string) {
  const admin = createSupabaseAdminClient();

  const { data: existing, error: existingError } = await admin
    .from("review_credit_grants")
    .select("id")
    .eq("user_id", userId)
    .eq("package_id", "free")
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return;

  const { error: insertError } = await admin.from("review_credit_grants").insert({
    user_id: userId,
    source: "free",
    package_id: "free",
    total_credits: 5,
    used_credits: 0,
    starts_at: new Date().toISOString(),
    expires_at: null,
  });

  if (insertError) throw insertError;
}

export async function getAvailableReviewCredits(userId: string) {
  const supabase = await createSupabaseServerClient();

  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("review_credit_grants")
    .select("id, package_id, total_credits, used_credits, remaining_credits, starts_at, expires_at, created_at")
    .eq("user_id", userId)
    .gt("remaining_credits", 0)
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .order("expires_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (error) throw error;

  return data ?? [];
}

export async function getReviewUsageSummary(userId: string) {
  const grants = await getAvailableReviewCredits(userId);

  const totalRemaining = grants.reduce((sum, g) => sum + (g.remaining_credits ?? 0), 0);

  return {
    totalRemaining,
    grants,
    canAnalyze: totalRemaining > 0,
  };
}

export async function consumeOneReviewCredit(userId: string) {
  const admin = createSupabaseAdminClient();
  const nowIso = new Date().toISOString();

  const { data: grants, error } = await admin
    .from("review_credit_grants")
    .select("id, used_credits, total_credits, remaining_credits, expires_at, created_at")
    .eq("user_id", userId)
    .gt("remaining_credits", 0)
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .order("expires_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true })
    .limit(1);

  if (error) throw error;

  const grant = grants?.[0];
  if (!grant) {
    return { ok: false, error: "No review credits available." };
  }

  const { error: updateError } = await admin
    .from("review_credit_grants")
    .update({
      used_credits: grant.used_credits + 1,
    })
    .eq("id", grant.id)
    .eq("used_credits", grant.used_credits);

  if (updateError) throw updateError;

  return { ok: true, grantId: grant.id };
}