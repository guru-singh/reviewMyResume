import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getErrorMessage } from "@/lib/getErrorMessage";

export const runtime = "nodejs";

const BodySchema = z.object({
  plan: z.enum(["weekly", "monthly"]),
});

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServerClient({ request: req });
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = BodySchema.parse(await req.json());

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const planId =
      body.plan === "weekly"
        ? process.env.RAZORPAY_PLAN_WEEKLY_ID
        : process.env.RAZORPAY_PLAN_MONTHLY_ID;

    if (!keyId || !keySecret) {
      return NextResponse.json({ error: "Missing Razorpay key env vars" }, { status: 500 });
    }

    if (!planId) {
      return NextResponse.json({ error: "Missing Razorpay plan id env" }, { status: 500 });
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: 1,
      notes: {
        supabase_user_id: user.id,
        email: user.email ?? "",
        selected_plan: body.plan,
      },
    });

    const { error: upsertErr } = await supabase.from("profiles").upsert({
      id: user.id,
      plan: "free",
      subscription_status: "created",
      razorpay_subscription_id: subscription.id,
    });

    if (upsertErr) {
      return NextResponse.json({ error: upsertErr.message }, { status: 500 });
    }

    return NextResponse.json({
      keyId,
      subscriptionId: subscription.id,
      plan: body.plan,
    });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
