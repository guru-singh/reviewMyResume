import Link from "next/link";

export default function PaymentSuccessPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-2xl text-white">
          ✓
        </div>

        <h1 className="text-3xl font-bold text-gray-900">
          Payment successful
        </h1>

        <p className="mt-3 text-gray-700">
          Your premium access is now unlocked. You can continue to your full
          resume analysis.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white"
          >
            Go to Dashboard
          </Link>

          <Link
            href="/"
            className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-900"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}