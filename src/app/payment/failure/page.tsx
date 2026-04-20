import Link from "next/link";

type SearchParams = Promise<{
  reason?: string;
}>;

function getMessage(reason?: string) {
  switch (reason) {
    case "cancelled":
      return "You closed the payment window before completing the payment.";
    case "verification_failed":
      return "Payment was attempted, but verification did not complete successfully.";
    case "checkout_error":
      return "Something went wrong while opening checkout.";
    default:
      return "Your payment could not be completed.";
  }
}

export default async function PaymentFailurePage(props: {
  searchParams: SearchParams;
}) {
  const searchParams = await props.searchParams;
  const message = getMessage(searchParams.reason);

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-2xl text-white">
          !
        </div>

        <h1 className="text-3xl font-bold text-gray-900">
          Payment not completed
        </h1>

        <p className="mt-3 text-gray-700">{message}</p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white"
          >
            Try Again
          </Link>

          <Link
            href="/contact"
            className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-900"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </main>
  );
}