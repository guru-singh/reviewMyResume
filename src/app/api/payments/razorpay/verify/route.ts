import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getPackage } from "@/config/pricing";

export const runtime = "nodejs";

const BodySchema = z.object({
  razorpay_payment_id: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const body = BodySchema.parse(json);

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      throw new Error("Missing RAZORPAY_KEY_SECRET");
    }

    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== body.razorpay_signature) {
      return NextResponse.json(
        { ok: false, error: "Invalid payment signature." },
        { status: 400 }
      );
    }

    const admin = createSupabaseAdminClient();

    const { data: paymentOrder, error: paymentError } = await admin
      .from("payment_orders")
      .select("id, user_id, status, plan_id, tokens_purchased")
      .eq("razorpay_order_id", body.razorpay_order_id)
      .maybeSingle();

    if (paymentError || !paymentOrder) {
      return NextResponse.json(
        { ok: false, error: "Payment order record not found." },
        { status: 404 }
      );
    }

    if (!paymentOrder.user_id) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Payment order is not linked to a user. Fix order creation to save user_id.",
        },
        { status: 400 }
      );
    }

    const plan = getPackage(paymentOrder.plan_id);

    if (!plan || plan.isFree) {
      return NextResponse.json(
        { ok: false, error: "Invalid plan on payment order." },
        { status: 400 }
      );
    }

    if (paymentOrder.status === "paid") {
      return NextResponse.json({ ok: true, alreadyProcessed: true });
    }

    const tokensToAdd =
      typeof paymentOrder.tokens_purchased === "number" &&
      paymentOrder.tokens_purchased > 0
        ? paymentOrder.tokens_purchased
        : plan.reviewCredits;

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id, tokens_left")
      .eq("id", paymentOrder.user_id)
      .maybeSingle();

    if (profileError || !profile) {
      console.error("Profile lookup failed:", profileError);

      return NextResponse.json(
        { ok: false, error: "Profile not found for payment user." },
        { status: 500 }
      );
    }

    const currentTokens =
      typeof profile.tokens_left === "number" ? profile.tokens_left : 0;
    const newBalance = currentTokens + tokensToAdd;
    const nowIso = new Date().toISOString();

    const { error: updatePaymentError } = await admin
      .from("payment_orders")
      .update({
        status: "paid",
        razorpay_payment_id: body.razorpay_payment_id,
        razorpay_signature: body.razorpay_signature,
        paid_at: nowIso,
        updated_at: nowIso,
      })
      .eq("id", paymentOrder.id);

    if (updatePaymentError) {
      console.error("Failed to update payment order:", updatePaymentError);

      return NextResponse.json(
        { ok: false, error: "Failed to update payment order." },
        { status: 500 }
      );
    }

    const { error: updateProfileError } = await admin
      .from("profiles")
      .update({
        tokens_left: newBalance,
        updated_at: nowIso,
      })
      .eq("id", paymentOrder.user_id);

    if (updateProfileError) {
      console.error("Failed to update profile tokens:", updateProfileError);

      return NextResponse.json(
        { ok: false, error: "Failed to update profile tokens." },
        { status: 500 }
      );
    }

    const { error: tokenTxnError } = await admin
      .from("token_transactions")
      .insert({
        user_id: paymentOrder.user_id,
        delta: tokensToAdd,
        balance_after: newBalance,
        source_type: "payment",
        source_id: paymentOrder.id,
        note: `Razorpay payment success for ${plan.title}`,
      });

    if (tokenTxnError) {
      console.error("Failed to insert token transaction:", tokenTxnError);

      return NextResponse.json(
        { ok: false, error: "Payment marked paid, but token ledger insert failed." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      tokensAdded: tokensToAdd,
      tokensLeft: newBalance,
    });
  } catch (error) {
    console.error("Razorpay verify error:", error);

    return NextResponse.json(
      { ok: false, error: "Payment verification failed." },
      { status: 500 }
    );
  }
}