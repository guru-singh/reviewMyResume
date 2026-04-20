import { PricingCard } from "@/components/PricingCard";

export function LockedPremiumSections() {
  return (
    <section className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Premium analysis locked
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Unlock the full report to see advanced ATS fixes, stronger bullet
          rewrites, and targeted improvements.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <div className="h-24 rounded-xl bg-white/70 blur-[1px]" />
          <div className="h-24 rounded-xl bg-white/70 blur-[1px]" />
          <div className="h-24 rounded-xl bg-white/70 blur-[1px]" />
        </div>

        <PricingCard />
      </div>
    </section>
  );
}