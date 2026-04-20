import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRazorpayInstance } from "@/lib/razorpay";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPackage } from "@/config/packages";

export const runtime = "nodejs";

const BodySchema = z.object({
  packageId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const { packageId } = BodySchema.parse(json);

    const selected = getPackage(packageId);

    if (!selected || !selected.active || selected.isFree) {
      return NextResponse.json(
        { ok: false, error: "Invalid package selected." },
        { status: 400 }
      );
    }

    const razorpay = getRazorpayInstance();
    const receipt = `review_${user.id.slice(0, 8)}_${Date.now()}`;

    const order = await razorpay.orders.create({
      amount: selected.amount,
      currency: selected.currency,
      receipt,
      notes: {
        package_id: selected.id,
        user_id: user.id,
        review_credits: String(selected.reviewCredits),
        expiry_days: String(selected.expiryDays ?? ""),
      },
    });

    const { error: insertError } = await supabase.from("payments").insert({
      user_id: user.id,
      package_id: selected.id,
      amount: selected.amount,
      currency: selected.currency,
      status: "created",
      razorpay_order_id: order.id,
      receipt,
      metadata: {
        package_title: selected.title,
        review_credits: selected.reviewCredits,
        expiry_days: selected.expiryDays,
      },
    });

    if (insertError) {
      return NextResponse.json(
        { ok: false, error: "Could not save payment order." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
      },
      package: selected,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Razorpay order create error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to create order." },
      { status: 500 }
    );
  }
}