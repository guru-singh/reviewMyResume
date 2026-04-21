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
      .select("id, user_id, status, plan_id")
      .eq("razorpay_order_id", body.razorpay_order_id)
      .maybeSingle();

    if (paymentError || !paymentOrder) {
      return NextResponse.json(
        { ok: false, error: "Payment order record not found." },
        { status: 404 }
      );
    }

    const plan = getPackage(paymentOrder.plan_id);

    if (!plan || plan.isFree) {
      return NextResponse.json(
        { ok: false, error: "Invalid plan on payment order." },
        { status: 400 }
      );
    }

    if (paymentOrder.status !== "paid") {
      const { error: updateError } = await admin
        .from("payment_orders")
        .update({
          status: "paid",
          razorpay_payment_id: body.razorpay_payment_id,
          razorpay_signature: body.razorpay_signature,
          paid_at: new Date().toISOString(),
        })
        .eq("id", paymentOrder.id);

      if (updateError) {
        console.error("Failed to update payment order:", updateError);

        return NextResponse.json(
          { ok: false, error: "Failed to update payment order." },
          { status: 500 }
        );
      }

      // Credit grant logic can be added here later after your credit tables are finalized.
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