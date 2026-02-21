import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const BodySchema = z.object({
  plan: z.enum(["weekly", "monthly"]),
});

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = BodySchema.parse(await req.json());

    const planId =
      body.plan === "weekly"
        ? process.env.RAZORPAY_PLAN_WEEKLY_ID
        : process.env.RAZORPAY_PLAN_MONTHLY_ID;

    if (!planId) {
      return NextResponse.json(
        { error: "Missing Razorpay plan id env" },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: 0, // 0 = unlimited cycles
      notes: {
        supabase_user_id: user.id,
        email: user.email ?? "",
      },
    });

    // Store subscription id early for tracking (status becomes active on webhook)
    await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        plan: "paid",
        subscription_status: "created",
        razorpay_subscription_id: subscription.id,
      });

    return NextResponse.json({
      keyId: process.env.RAZORPAY_KEY_ID,
      subscriptionId: subscription.id,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
