"use client";

import { useState } from "react";
import { loadRazorpayScript } from "@/lib/loadRazorpay";
import type { ReviewPackage } from "@/config/pricing";

type Props = {
  plan: ReviewPackage;
};

export function BuyPackageCard({ plan }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleBuy() {
    try {
      setLoading(true);

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert("Unable to load payment gateway.");
        return;
      }

      const orderRes = await fetch("/api/payments/razorpay/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: plan.id,
        }),
      });

      const orderData = await orderRes.json();

      if (!orderData?.ok) {
        alert(orderData?.error || "Could not create order.");
        return;
      }

      const razorpay = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "ReviewMyResume",
        description: plan.title,
        order_id: orderData.order.id,
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

          if (verifyData?.ok) {
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
      });

      razorpay.open();
    } catch (error) {
      console.error(error);
      window.location.href = "/payment/failure?reason=checkout_error";
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      {plan.badge ? (
        <span className="inline-flex rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700">
          {plan.badge}
        </span>
      ) : null}

      <h3 className="mt-3 text-2xl font-semibold text-gray-900">
        {plan.title}
      </h3>

      <p className="mt-3 text-sm text-gray-600">{plan.description}</p>

      <div className="mt-5">
        <div className="flex items-end gap-2">
          <span className="text-4xl font-bold text-gray-900">
            {plan.priceLabel}
          </span>
          <span className="pb-1 text-sm text-gray-500">one-time</span>
        </div>
      </div>

      <div className="mt-5 space-y-3 text-sm text-gray-700">
        {plan.features.map((feature, index) => (
          <div key={index}>{feature}</div>
        ))}
      </div>

      <button
        onClick={handleBuy}
        disabled={loading}
        className="mt-6 w-full rounded-xl bg-black px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? "Processing..." : plan.buttonLabel}
      </button>

      <p className="mt-3 text-center text-xs text-gray-500">
        Secure payment via Razorpay
      </p>
    </div>
  );
}