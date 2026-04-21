"use client";

import { useState } from "react";
import Link from "next/link";
import { getPaidPackages, type ReviewPackage } from "@/config/pricing";
import { loadRazorpayScript } from "@/lib/loadRazorpay";

const packages = getPaidPackages();

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f3f6fa_0%,#f7f1e8_100%)] px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900">Choose a package</h1>
          <p className="mt-3 text-slate-600">
            Your first 5 resume reviews are free. After that, choose a review pack.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {packages.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="/dashboard" className="text-sm text-slate-600 underline">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

function PackageCard({ pkg }: { pkg: ReviewPackage }) {
  const [loading, setLoading] = useState(false);

  async function handlePayment() {
    try {
      setLoading(true);

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert("Payment SDK failed to load");
        return;
      }

      const res = await fetch("/api/payments/razorpay/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: pkg.id,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        alert(data?.error || "Failed to create payment");
        return;
      }

      const rzp = new window.Razorpay({
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: "ReviewMyResume",
        description: pkg.title,
        order_id: data.orderId,
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          const verify = await fetch("/api/payments/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });

          const v = await verify.json();

          if (verify.ok && v.ok) {
            window.location.href = "/payment/success";
          } else {
            window.location.href = "/payment/failure";
          }
        },
        modal: {
          ondismiss: function () {
            window.location.href = "/pricing";
          },
        },
        theme: {
          color: "#111827",
        },
      });

      rzp.open();
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
      {pkg.badge ? (
        <div className="mb-4">
          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
            {pkg.badge}
          </span>
        </div>
      ) : null}

      <h2 className="text-2xl font-semibold text-slate-900">{pkg.title}</h2>

      <p className="mt-2 text-sm text-slate-600">{pkg.description}</p>

      <div className="mt-6 text-5xl font-bold text-slate-900">{pkg.priceLabel}</div>

      <div className="mt-6 space-y-3 text-left text-sm text-slate-700">
        {pkg.features.map((feature, index) => (
          <div key={index}>✓ {feature}</div>
        ))}
      </div>

      <button
        onClick={handlePayment}
        disabled={loading}
        className="mt-8 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
      >
        {loading ? "Processing..." : pkg.buttonLabel}
      </button>

      <p className="mt-4 text-center text-xs text-slate-500">
        Secure checkout via Razorpay
      </p>
    </div>
  );
}