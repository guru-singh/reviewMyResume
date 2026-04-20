import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

function verifyWebhookSignature(rawBody: string, signature: string, secret: string) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  return expected === signature;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret || !signature) {
      return NextResponse.json(
        { ok: false, error: "Missing webhook secret/signature." },
        { status: 400 }
      );
    }

    const valid = verifyWebhookSignature(rawBody, signature, secret);

    if (!valid) {
      return NextResponse.json(
        { ok: false, error: "Invalid webhook signature." },
        { status: 400 }
      );
    }

    const event = JSON.parse(rawBody);

    switch (event.event) {
      case "payment.captured": {
        const payment = event.payload?.payment?.entity;
        console.log("payment.captured", payment?.id);

        // TODO:
        // mark matching purchase paid in DB
        // grant premium access
        break;
      }

      case "payment.failed": {
        const payment = event.payload?.payment?.entity;
        console.log("payment.failed", payment?.id);
        break;
      }

      default:
        console.log("Unhandled Razorpay event:", event.event);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { ok: false, error: "Webhook handling failed." },
      { status: 500 }
    );
  }
}