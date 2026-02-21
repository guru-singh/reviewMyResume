import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function verifySignature(rawBody: string, signature: string | null, secret: string) {
  if (!signature) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function POST(req: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Missing RAZORPAY_WEBHOOK_SECRET" }, { status: 500 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const eventType: string = event?.event;

  // Use service role to update regardless of RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Razorpay sends subscription entity in payload
  const sub = event?.payload?.subscription?.entity;

  if (!sub?.id) return NextResponse.json({ ok: true });

  const status = sub?.status; // created, authenticated, active, halted, cancelled, completed, etc.
  const notes = sub?.notes || {};
  const userId = notes?.supabase_user_id;

  if (!userId) {
    // Fallback: look up profile by subscription id
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("razorpay_subscription_id", sub.id)
      .maybeSingle();

    if (!profile?.id) return NextResponse.json({ ok: true });

    await supabase
      .from("profiles")
      .update({
        plan: "paid",
        subscription_status: status,
        razorpay_subscription_id: sub.id,
      })
      .eq("id", profile.id);

    return NextResponse.json({ ok: true });
  }

  await supabase
    .from("profiles")
    .upsert({
      id: userId,
      plan: "paid",
      subscription_status: status,
      razorpay_subscription_id: sub.id,
    });

  return NextResponse.json({ ok: true, eventType });
}
