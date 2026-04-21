import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getPackage } from "@/config/pricing";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { planId } = body;

    console.log("[razorpay/order] incoming planId:", planId);

    const plan = getPackage(planId);

    if (!plan) {
      return NextResponse.json(
        { error: `Invalid planId: ${planId}` },
        { status: 400 }
      );
    }

    if (plan.isFree) {
      return NextResponse.json(
        { error: "Free plan does not require payment." },
        { status: 400 }
      );
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { error: "Missing Razorpay environment variables" },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const amount = plan.amount;
    const currency = plan.currency || "INR";
    const receipt = `rr_${Date.now()}`;

    console.log("[razorpay/order] creating razorpay order", {
      amount,
      currency,
      receipt,
      planId: plan.id,
    });

    const razorpayOrder = await razorpay.orders.create({
      amount,
      currency,
      receipt,
      notes: {
        planId: plan.id,
        planTitle: plan.title,
        reviewCredits: String(plan.reviewCredits),
        expiryDays:
          plan.expiryDays === null ? "none" : String(plan.expiryDays),
      },
    });

    console.log("[razorpay/order] razorpay order created:", razorpayOrder.id);

    const admin = createSupabaseAdminClient();

    const payload = {
      user_id: null,
      razorpay_order_id: razorpayOrder.id,
      receipt: razorpayOrder.receipt,
      plan_id: plan.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      status: razorpayOrder.status,
    };

    console.log("[razorpay/order] saving to db:", payload);

    const { data, error } = await admin
      .from("payment_orders")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("[razorpay/order] supabase insert failed:", error);

      return NextResponse.json(
        {
          error: "DB insert failed",
          details: error.message,
          code: error.code,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
      planId: plan.id,
      savedOrder: data,
    });
  } catch (error: any) {
    console.error("[razorpay/order] fatal error:", error);

    return NextResponse.json(
      {
        error: "Could not create payment order",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}