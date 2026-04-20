"use client";

import { useState } from "react";
import { loadRazorpayScript } from "@/lib/loadRazorpay";

export function BuyPremiumButton() {
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
        headers: { "Content-Type": "application/json" },
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
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });

          const verifyData = await verifyRes.json();

          if (verifyData?.ok) {
            window.location.href = "/payment/success";
          } else {
            alert("Payment verification failed.");
          }
        },
        modal: {
          ondismiss: function () {
            console.log("Checkout closed");
          },
        },
        theme: {
          color: "#111827",
        },
        prefill: {
          name: "",
          email: "",
          contact: "",
        },
        notes: {
          app: "reviewmyresume",
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error(error);
      alert("Something went wrong while opening payment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
    >
      {loading ? "Processing..." : "Buy Premium for ₹499"}
    </button>
  );
}