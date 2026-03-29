import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getErrorMessage } from "@/lib/getErrorMessage";

export const runtime = "nodejs";

function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase admin env vars");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function verifyWebhookSignature(rawBody: string, signature: string | null) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error("Missing RAZORPAY_WEBHOOK_SECRET");
  }

  if (!signature) {
    return false;
  }

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody) as {
      event?: string;
      payload?: {
        subscription?: {
          entity?: {
            id?: string;
            status?: string;
            current_end?: number;
          };
        };
      };
    };

    const subscription = event.payload?.subscription?.entity;
    const subscriptionId = subscription?.id;

    if (!subscriptionId) {
      return NextResponse.json({ received: true });
    }

    const supabase = createSupabaseAdminClient();
    const currentPeriodEnd = subscription?.current_end
      ? new Date(subscription.current_end * 1000).toISOString()
      : null;

    if (
      event.event === "subscription.activated" ||
      event.event === "subscription.charged" ||
      event.event === "payment.captured"
    ) {
      const { error } = await supabase
        .from("profiles")
        .update({
          plan: "paid",
          subscription_status: subscription?.status || "active",
          current_period_end: currentPeriodEnd,
        })
        .eq("razorpay_subscription_id", subscriptionId);

      if (error) {
        throw error;
      }
    }

    if (
      event.event === "subscription.cancelled" ||
      event.event === "subscription.completed" ||
      event.event === "subscription.halted"
    ) {
      const { error } = await supabase
        .from("profiles")
        .update({
          plan: "free",
          subscription_status: subscription?.status || "inactive",
          current_period_end: currentPeriodEnd,
        })
        .eq("razorpay_subscription_id", subscriptionId);

      if (error) {
        throw error;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
