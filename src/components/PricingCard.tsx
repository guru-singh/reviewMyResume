"use client";

import { useState } from "react";
import { loadRazorpayScript } from "@/lib/loadRazorpay";

export function PricingCard() {
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    try {
      setLoading(true);

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
          plan: "premium_resume_review",
        }),
      });

      const orderData = await orderRes.json();

      if (!orderData?.ok) {
        alert(orderData?.error || "Could not create payment order.");
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "ReviewMyResume",
        description: orderData.product.description,
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
            window.location.href = "/payment/failure?reason=verification_failed";
          }
        },
        modal: {
          ondismiss: function () {
            window.location.href = "/payment/failure?reason=cancelled";
          },
        },
        prefill: {
          name: "",
          email: "",
          contact: "",
        },
        notes: {
          source: "pricing_card",
          product: "premium_resume_review",
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
        <p className="text-sm font-medium text-gray-500">Premium</p>
        <h3 className="mt-1 text-2xl font-semibold text-gray-900">
          Unlock Full Resume Review
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          Get complete analysis, stronger rewrite suggestions, ATS-focused fixes,
          and premium feedback sections.
        </p>
      </div>

      <div className="mb-6">
        <div className="flex items-end gap-2">
          <span className="text-4xl font-bold text-gray-900">₹499</span>
          <span className="pb-1 text-sm text-gray-500">one-time</span>
        </div>
      </div>

      <ul className="mb-6 space-y-3 text-sm text-gray-700">
        <li>Full ATS-style report</li>
        <li>Premium keyword improvements</li>
        <li>Better bullet rewrite suggestions</li>
        <li>Cleaner role targeting feedback</li>
      </ul>

      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full rounded-xl bg-black px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Processing..." : "Pay ₹499 and Unlock"}
      </button>

      <p className="mt-3 text-center text-xs text-gray-500">
        Secure checkout via Razorpay
      </p>
    </div>
  );
}