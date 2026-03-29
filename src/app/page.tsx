import Link from "next/link";

const metrics = [
  { value: "3,200+", label: "resumes reviewed" },
  { value: "+22", label: "average ATS score lift" },
  { value: "11 min", label: "to first actionable report" },
];

const proofPoints = [
  "Pinpoints missing recruiter keywords before your resume gets filtered out.",
  "Turns vague experience bullets into sharper, more measurable impact statements.",
  "Keeps every score, note, and rewrite in one dashboard so iteration feels easy.",
];

const signals = [
  { label: "ATS Match", value: "82", tone: "bg-emerald-400" },
  { label: "Narrative clarity", value: "+31%", tone: "bg-amber-300" },
  { label: "Missing skills", value: "07", tone: "bg-sky-300" },
];

const featureCards = [
  {
    eyebrow: "Diagnose",
    title: "See why your resume is losing interviews.",
    desc: "Get a clean ATS score, formatting red flags, and section-level commentary that reveals what hiring systems and recruiters are actually reacting to.",
  },
  {
    eyebrow: "Rewrite",
    title: "Upgrade weak bullets into stronger proof.",
    desc: "Receive sharper summaries, cleaner experience bullets, and skill suggestions that align your story to the role you are targeting.",
  },
  {
    eyebrow: "Iterate",
    title: "Re-run with confidence after every edit.",
    desc: "Paste a job description, update the resume, and instantly compare whether the next version is clearer, tighter, and more aligned.",
  },
];

const workflow = [
  {
    step: "01",
    title: "Upload your resume",
    desc: "Drop in a PDF or DOCX and optionally add the job description you want to target.",
  },
  {
    step: "02",
    title: "Read the weak spots",
    desc: "Review the ATS score, keyword gaps, structural issues, and quick wins in one pass.",
  },
  {
    step: "03",
    title: "Apply the rewrites",
    desc: "Use the suggested bullet upgrades and summary edits to make your next version stronger.",
  },
];

const testimonials = [
  {
    quote:
      "The page didn’t just score my resume. It showed me exactly which bullets sounded generic and how to fix them before I applied again.",
    name: "Priya",
    role: "Product Program Manager",
  },
  {
    quote:
      "What helped most was the clarity. I could finally see the missing keywords, the fluff, and the stronger framing all in one report.",
    name: "Raghav",
    role: "Platform Architect",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f6f1e8_0%,#f2f5f8_48%,#ffffff_100%)] text-slate-950">
      <section className="relative isolate">
        <div className="absolute inset-x-0 top-0 -z-10 h-[42rem] bg-[#142136]" />
        <div className="absolute left-[-8rem] top-[-4rem] -z-10 h-72 w-72 rounded-full bg-[#ffcf70]/35 blur-3xl" />
        <div className="absolute right-[-6rem] top-[2rem] -z-10 h-80 w-80 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-[linear-gradient(180deg,rgba(20,33,54,0)_0%,rgba(246,241,232,1)_100%)]" />
        <div className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6 lg:px-8 lg:pb-24">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-slate-100 backdrop-blur">
                Resume Review Lab
              </div>
              <div className="max-w-2xl space-y-5">
                <h1 className="text-5xl font-semibold leading-[0.95] text-slate-50 sm:text-6xl lg:text-7xl">
                  Make your resume feel unmistakably hireable.
                </h1>
                <p className="max-w-xl text-lg leading-8 text-slate-100 sm:text-xl">
                  Upload your resume, map it against a target role, and get an ATS score plus
                  sharper rewrites that help your best work read like it matters.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-full bg-[#ffd166] px-6 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-[#ffca4d]"
                >
                  Open dashboard
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
                >
                  Login / signup
                </Link>
              </div>

              <div className="grid max-w-3xl gap-3 sm:grid-cols-3">
                {metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-3xl border border-white/30 bg-slate-900/60 px-5 py-4 shadow-[0_18px_40px_rgba(15,23,42,0.28)] backdrop-blur"
                  >
                    <div className="text-3xl font-semibold text-white">{metric.value}</div>
                    <div className="mt-1 text-sm text-slate-100">{metric.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-6 top-10 hidden h-28 w-28 rounded-full bg-[#ffd166]/50 blur-3xl lg:block" />
              <div className="absolute -bottom-10 right-0 hidden h-36 w-36 rounded-full bg-sky-200/70 blur-3xl lg:block" />
              <div className="relative rounded-[2rem] border border-slate-200/80 bg-white p-5 shadow-[0_28px_90px_rgba(17,24,39,0.18)]">
                <div className="rounded-[1.6rem] bg-[#132238] p-6 text-white">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-200">
                        Live preview
                      </p>
                      <h2 className="mt-3 text-2xl font-semibold">A report you can act on instantly</h2>
                    </div>
                    <div className="rounded-full bg-white/15 px-3 py-1 text-xs text-slate-100">
                      PDF + DOCX
                    </div>
                  </div>

                  <div className="mt-8 rounded-[1.4rem] bg-white/10 p-5">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-sm text-slate-100">ATS score</p>
                        <p className="mt-2 text-6xl font-semibold text-[#ffd166]">82</p>
                      </div>
                      <div className="rounded-2xl bg-emerald-300 px-3 py-2 text-sm font-semibold text-emerald-950">
                        Strong upward trend
                      </div>
                    </div>

                    <div className="mt-6 h-3 rounded-full bg-white/10">
                      <div className="h-3 w-[82%] rounded-full bg-[linear-gradient(90deg,#ffd166_0%,#f5a65b_55%,#ef476f_100%)]" />
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      {signals.map((signal) => (
                        <div key={signal.label} className="rounded-2xl bg-white/10 p-4">
                          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-100">
                            <span className={`h-2.5 w-2.5 rounded-full ${signal.tone}`} />
                            {signal.label}
                          </div>
                          <div className="mt-3 text-3xl font-semibold text-white">{signal.value}</div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 rounded-2xl bg-white px-4 py-4 text-slate-900">
                      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Recommended next move
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        Tighten your summary, add ownership verbs to experience bullets, and mirror
                        the role’s cloud platform keywords in the skills section.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 px-1 pt-4 sm:grid-cols-3">
                  {proofPoints.map((point) => (
                    <div key={point} className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                      {point}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] bg-[#fff7ea] p-8 shadow-[0_20px_60px_rgba(255,209,102,0.18)]">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-700">
              What makes it useful
            </p>
            <h2 className="mt-4 max-w-md text-3xl font-semibold leading-tight text-slate-950">
              Less guesswork, more clear next edits.
            </h2>
            <p className="mt-4 max-w-md text-base leading-7 text-slate-700">
              Instead of generic resume advice, the app responds to your actual document and points
              toward the sections most likely to improve interview conversion.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {featureCards.map((card) => (
              <article
                key={card.title}
                className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">
                  {card.eyebrow}
                </p>
                <h3 className="mt-4 text-xl font-semibold leading-7 text-slate-950">{card.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{card.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-[2.5rem] bg-[#132238] px-6 py-8 text-white shadow-[0_28px_90px_rgba(19,34,56,0.28)] sm:px-8 lg:px-10">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-200">
                How it works
              </p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight">
                A focused workflow for faster resume upgrades.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-200">
              Built for people applying often, refining fast, and trying to make every version of
              their resume more specific than the last.
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {workflow.map((item) => (
              <div key={item.step} className="rounded-[1.8rem] border border-white/15 bg-white/10 p-5">
                <div className="text-sm font-semibold text-[#ffd166]">{item.step}</div>
                <h3 className="mt-5 text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-100">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          {testimonials.map((item, index) => (
            <article
              key={item.name}
              className={`rounded-[2rem] p-8 shadow-[0_18px_50px_rgba(15,23,42,0.08)] ${
                index === 0 ? "bg-white" : "bg-[#eef6ff]"
              }`}
            >
              <p className="text-base leading-8 text-slate-700">“{item.quote}”</p>
              <div className="mt-6">
                <div className="text-lg font-semibold text-slate-950">{item.name}</div>
                <div className="text-sm text-slate-600">{item.role}</div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <div className="rounded-[2.5rem] border border-slate-200 bg-white px-6 py-10 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:px-8 lg:flex lg:items-center lg:justify-between lg:gap-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
              Ready to improve it?
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-slate-950">
              Start with the resume you already have and make the next version stronger.
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              PDF and DOCX uploads are supported. Paid plans unlock unlimited analyses through
              Razorpay when you want to iterate more aggressively.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 lg:mt-0">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Try the dashboard
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
