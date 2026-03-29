"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, CardHeader } from "@/components/ui";
import { getErrorMessage } from "@/lib/getErrorMessage";

type PlanId = "weekly" | "monthly";

type CreateSubscriptionResponse = {
  keyId: string;
  subscriptionId: string;
  plan: PlanId;
};

const plans = [
  {
    id: "weekly" as const,
    name: "7-day unlimited",
    price: "₹399",
    cadence: "for 7 days",
    badge: "Fastest way to finish a job hunt sprint",
    cta: "Choose 7-day plan",
    highlights: [
      "Unlimited resume analyses for one week",
      "Best for active applications and quick revisions",
      "Good fit if you need intense short-term usage",
    ],
  },
  {
    id: "monthly" as const,
    name: "30-day unlimited",
    price: "₹799",
    cadence: "for 1 month",
    badge: "Best value for steady job searching",
    cta: "Choose monthly plan",
    highlights: [
      "Unlimited resume analyses for a full month",
      "More room for multiple versions and role targeting",
      "Lower effective cost per week than the short plan",
    ],
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = React.useState<PlanId | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function startCheckout(plan: PlanId) {
    setError(null);
    setLoadingPlan(plan);

    try {
      const res = await fetch("/api/razorpay/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = (await res.json()) as CreateSubscriptionResponse & { error?: string };

      if (!res.ok) {
        throw new Error(data.error || "Failed to create subscription");
      }

      await loadRazorpayScript();

      if (!window.Razorpay) {
        throw new Error("Razorpay checkout did not load");
      }

      const razorpay = new window.Razorpay({
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "Resume Review",
        description: plan === "weekly" ? "7-day unlimited plan" : "30-day unlimited plan",
        handler: () => {
          router.push("/dashboard");
          router.refresh();
        },
        theme: { color: "#162238" },
      });

      razorpay.open();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Unable to start payment"));
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f3f6fa_0%,#f7f1e8_100%)] text-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#162238_0%,#1f3558_52%,#0e1828_100%)] px-6 py-8 text-white shadow-[0_24px_70px_rgba(15,23,42,0.2)] sm:px-8">
          <div className="absolute -left-8 top-0 h-36 w-36 rounded-full bg-[#ffd166]/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-44 w-44 rounded-full bg-sky-300/10 blur-3xl" />
          <div className="relative">
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-200">
              Upgrade access
            </div>
            <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight sm:text-4xl">
              Continue reviewing resumes without the 5-analysis free limit.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
              Pick the plan that matches how long you expect to be applying. Both plans unlock
              unlimited resume analyses during the active period.
            </p>
          </div>
        </section>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          {plans.map((plan, index) => (
            <Card
              key={plan.name}
              className={`rounded-[2rem] border shadow-[0_22px_60px_rgba(15,23,42,0.08)] ${
                index === 1
                  ? "border-slate-900 bg-[linear-gradient(180deg,#ffffff_0%,#f8f4ec_100%)]"
                  : "border-slate-200 bg-white"
              }`}
            >
              <CardHeader className="border-b border-slate-200 px-6 py-6 sm:px-8">
                <div className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                  {plan.badge}
                </div>
                <div className="mt-4 text-2xl font-semibold text-slate-950">{plan.name}</div>
                <div className="mt-3 flex items-end gap-2">
                  <div className="text-4xl font-semibold text-slate-950">{plan.price}</div>
                  <div className="pb-1 text-sm text-slate-500">{plan.cadence}</div>
                </div>
              </CardHeader>
              <CardContent className="px-6 py-6 sm:px-8">
                <ul className="space-y-3 text-sm leading-6 text-slate-700">
                  {plan.highlights.map((item) => (
                    <li key={item} className="rounded-2xl bg-slate-50 px-4 py-3">
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    onClick={() => startCheckout(plan.id)}
                    isLoading={loadingPlan === plan.id}
                    className="rounded-2xl px-5 py-3"
                  >
                    {plan.cta}
                  </Button>
                  <div className="text-sm text-slate-500">Secure checkout with Razorpay.</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)] sm:px-8">
          <div className="text-lg font-semibold text-slate-950">Pricing note</div>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Your current numbers are reasonable for an early product. If you want a slightly easier
            entry point, a strong alternative is ₹299 for 7 days and ₹699 for 30 days. That model
            can improve conversion while still keeping the monthly plan clearly better value.
          </p>
          <div className="mt-5">
            <Link href="/dashboard" className="text-sm font-semibold text-slate-700 underline-offset-4 hover:underline">
              Back to dashboard
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function loadRazorpayScript() {
  return new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("No window"));
    if (window.Razorpay) return resolve();

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.body.appendChild(script);
  });
}
