"use client";

import { useState } from "react";
import { loadRazorpayScript } from "@/lib/loadRazorpay";
import type { ReviewPackage } from "@/config/pricing";

type Props = {
  plan: ReviewPackage;
};

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function PricingCard({ plan }: Props) {
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    try {
      setLoading(true);

      console.log("PricingCard plan prop:", plan);

      if (!plan || !plan.id) {
        alert("Plan is missing in PricingCard.");
        return;
      }

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert("Razorpay SDK failed to load.");
        return;
      }

      const orderRes = await fetch("/api/payments/razorpay/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: plan.id,
        }),
      });

      const orderData = await orderRes.json();

      console.log("order response:", orderData);

      if (!orderRes.ok || !orderData?.ok) {
        alert(orderData?.error || "Could not create payment order.");
        return;
      }

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "ReviewMyResume",
        description: plan.title,
        order_id: orderData.orderId,
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          const verifyRes = await fetch("/api/payments/razorpay/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(response),
          });

          const verifyData = await verifyRes.json();

          if (verifyRes.ok && verifyData?.ok) {
            window.location.href = "/payment/success";
          } else {
            window.location.href =
              "/payment/failure?reason=verification_failed";
          }
        },
        modal: {
          ondismiss: function () {
            window.location.href = "/payment/failure?reason=cancelled";
          },
        },
        theme: {
          color: "#111827",
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error(error);
      window.location.href = "/payment/failure?reason=checkout_error";
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        {plan.badge ? (
          <p className="text-sm font-medium text-gray-500">{plan.badge}</p>
        ) : null}

        <h3 className="mt-1 text-2xl font-semibold text-gray-900">
          {plan.title}
        </h3>

        <p className="mt-2 text-sm text-gray-600">{plan.description}</p>
      </div>

      <div className="mb-6">
        <div className="flex items-end gap-2">
          <span className="text-4xl font-bold text-gray-900">
            {plan.priceLabel}
          </span>
          {!plan.isFree ? (
            <span className="pb-1 text-sm text-gray-500">one-time</span>
          ) : null}
        </div>
      </div>

      <ul className="mb-6 space-y-3 text-sm text-gray-700">
        {plan.features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>

      <button
        onClick={handlePay}
        disabled={loading || plan.isFree}
        className="w-full rounded-xl bg-black px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Processing..." : plan.buttonLabel}
      </button>

      <p className="mt-3 text-center text-xs text-gray-500">
        Secure checkout via Razorpay
      </p>
    </div>
  );
}