import Link from "next/link";

export default function LockedPremiumSections() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-semibold text-slate-900">
          Unlock more resume reviews
        </h2>

        <p className="mt-3 text-slate-600">
          You’ve used your available reviews. Choose a review pack to continue.
        </p>

        <div className="mt-6">
          <Link
            href="/pricing"
            className="inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            View review packs
          </Link>
        </div>
      </div>
    </section>
  );
}