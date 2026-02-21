import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14">
      <div className="rounded-3xl border border-neutral-200 bg-white p-10 shadow-sm">
        <div className="text-4xl font-semibold tracking-tight">
          Resume Review MVP
        </div>
        <div className="mt-3 max-w-2xl text-neutral-700">
          Upload a PDF/DOCX resume, optionally paste a job description, and get an ATS
          score + improvements + rewritten bullets.
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-xl bg-black px-5 py-3 text-sm font-medium text-white hover:bg-black/90"
          >
            Go to dashboard
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl bg-neutral-100 px-5 py-3 text-sm font-medium text-neutral-900 hover:bg-neutral-200"
          >
            Login / Signup
          </Link>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <Feature title="ATS score" desc="0–100 score with clear improvements." />
          <Feature title="Keyword match" desc="If JD is provided, show matched/missing." />
          <Feature title="India-first payments" desc="Razorpay subscription unlocks unlimited." />
        </div>
      </div>

      <div className="mt-6 text-xs text-neutral-500">
        MVP note: DOC files aren’t supported yet (PDF/DOCX only).
      </div>
    </div>
  );
}

function Feature(props: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 p-5">
      <div className="text-sm font-semibold">{props.title}</div>
      <div className="mt-1 text-sm text-neutral-600">{props.desc}</div>
    </div>
  );
}
