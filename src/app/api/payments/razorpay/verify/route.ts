import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getPackage } from "@/config/packages";

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
    if (!secret) throw new Error("Missing RAZORPAY_KEY_SECRET");

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

    const { data: payment, error: paymentError } = await admin
      .from("payments")
      .select("id, user_id, status, package_id")
      .eq("razorpay_order_id", body.razorpay_order_id)
      .maybeSingle();

    if (paymentError || !payment) {
      return NextResponse.json(
        { ok: false, error: "Payment record not found." },
        { status: 404 }
      );
    }

    const pkg = getPackage(payment.package_id);
    if (!pkg || pkg.isFree) {
      return NextResponse.json(
        { ok: false, error: "Invalid package on payment record." },
        { status: 400 }
      );
    }

    if (payment.status !== "paid") {
      const { error: updateError } = await admin
        .from("payments")
        .update({
          status: "paid",
          razorpay_payment_id: body.razorpay_payment_id,
          razorpay_signature: body.razorpay_signature,
          paid_at: new Date().toISOString(),
        })
        .eq("id", payment.id);

      if (updateError) {
        return NextResponse.json(
          { ok: false, error: "Failed to update payment." },
          { status: 500 }
        );
      }

      const expiresAt =
        pkg.expiryDays == null
          ? null
          : new Date(Date.now() + pkg.expiryDays * 24 * 60 * 60 * 1000).toISOString();

      const { error: grantError } = await admin.from("review_credit_grants").insert({
        user_id: payment.user_id,
        source: "purchase",
        package_id: pkg.id,
        total_credits: pkg.reviewCredits,
        used_credits: 0,
        starts_at: new Date().toISOString(),
        expires_at: expiresAt,
        source_payment_id: payment.id,
      });

      if (grantError) {
        return NextResponse.json(
          { ok: false, error: "Failed to grant review credits." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Razorpay verify error:", error);
    return NextResponse.json(
      { ok: false, error: "Payment verification failed." },
      { status: 500 }
    );
  }
}