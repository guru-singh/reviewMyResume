"use client";

import * as React from "react";
import { ResumeDropzone } from "@/components/ResumeDropzone";
import { Button, Card, CardContent, CardHeader, Textarea } from "@/components/ui";

type MeResponse = {
  user: { id: string; email: string | null } | null;
  profile: { plan: string; subscription_status: string };
  usage: { used: number; limit: number; remaining: number };
};

type Analysis = {
  atsScore: number;
  keywordMatch?: { matched: string[]; missing: string[] };
  improvements: { title: string; details: string[] }[];
  upgrades: {
    summary: string[];
    experienceBullets: { original: string; rewritten: string }[];
    skills: string[];
  };
  quickWins: string[];
};

export default function DashboardPage() {
  const [me, setMe] = React.useState<MeResponse | null>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [jobDescription, setJobDescription] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [analysis, setAnalysis] = React.useState<Analysis | null>(null);

  async function loadMe() {
    const res = await fetch("/api/me", { cache: "no-store" });
    const data = (await res.json()) as MeResponse;
    setMe(data);
  }

  React.useEffect(() => {
    void loadMe();
  }, []);

  async function runAnalysis() {
    setError(null);
    setAnalysis(null);

    if (!file) {
      setError("Please upload a resume (PDF/DOCX)");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("resume", file);
      fd.append("jobDescription", jobDescription);

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to analyze");
      }

      setAnalysis(data.analysis);
      await loadMe();
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function startSubscription(plan: "weekly" | "monthly") {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/razorpay/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to create subscription");

      await loadRazorpayScript();

      // @ts-ignore
      const rzp = new window.Razorpay({
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "Resume Review",
        description: plan === "weekly" ? "Weekly Unlimited" : "Monthly Unlimited",
        handler: () => {
          // Actual activation comes via webhook.
          setError("Payment initiated. Subscription will activate shortly.");
          void loadMe();
        },
        prefill: { email: me?.user?.email ?? undefined },
        theme: { color: "#111111" },
      });

      rzp.open();
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const paidActive =
    me?.profile?.plan === "paid" && me?.profile?.subscription_status === "active";

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-2xl font-semibold">Dashboard</div>
          <div className="text-sm text-neutral-600">
            Upload resume → get ATS score + improvements + rewritten bullets.
          </div>
        </div>
        <div className="text-sm text-neutral-700">
          {paidActive
            ? "Plan: Paid (Unlimited)"
            : `Free usage: ${me?.usage?.used ?? 0}/${me?.usage?.limit ?? 5}`}
        </div>
      </div>

      {!paidActive ? (
        <Card>
          <CardHeader>
            <div className="text-lg font-semibold">Upgrade (Razorpay)</div>
            <div className="text-sm text-neutral-600">
              Unlimited analyses. India-first pricing.
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={() => startSubscription("weekly")}
              variant="secondary"
              isLoading={loading}
            >
              ₹250 / week
            </Button>
            <Button onClick={() => startSubscription("monthly")} isLoading={loading}>
              ₹750 / month
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <div className="text-lg font-semibold">New analysis</div>
          <div className="text-sm text-neutral-600">
            JD is optional, but improves keyword matching.
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ResumeDropzone value={file} onChange={setFile} />
          <Textarea
            label="Job description (optional)"
            rows={6}
            placeholder="Paste the job description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
          <Button onClick={runAnalysis} isLoading={loading}>
            Analyze resume
          </Button>
          {error ? <div className="text-sm text-red-600">{error}</div> : null}
        </CardContent>
      </Card>

      {analysis ? (
        <Report analysis={analysis} />
      ) : (
        <div className="text-sm text-neutral-500">
          Your report will appear here after analysis.
        </div>
      )}
    </div>
  );
}

function Gauge({ value }: { value: number }) {
  // Simple CSS gauge (MVP)
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full">
      <div className="mb-2 flex items-end justify-between">
        <div className="text-sm text-neutral-600">ATS Score</div>
        <div className="text-2xl font-semibold">{pct}</div>
      </div>
      <div className="h-3 w-full rounded-full bg-neutral-200">
        <div
          className="h-3 rounded-full bg-black"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 text-xs text-neutral-500">0 → 100</div>
    </div>
  );
}

function Section(props: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(true);
  return (
    <div className="rounded-2xl border border-neutral-200">
      <button
        className="flex w-full items-center justify-between px-5 py-4 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="text-base font-semibold">{props.title}</div>
        <div className="text-sm text-neutral-600">{open ? "Hide" : "Show"}</div>
      </button>
      {open ? <div className="border-t border-neutral-200 p-5">{props.children}</div> : null}
    </div>
  );
}

function Report({ analysis }: { analysis: Analysis }) {
  return (
    <Card>
      <CardHeader>
        <div className="text-lg font-semibold">Report</div>
        <div className="text-sm text-neutral-600">
          ATS score + actionable improvements.
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Gauge value={analysis.atsScore} />

        {analysis.keywordMatch ? (
          <Section title="Keyword match">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="text-sm font-medium">Matched</div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-700">
                  {analysis.keywordMatch.matched.map((k, i) => (
                    <li key={i}>{k}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-sm font-medium">Missing</div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-700">
                  {analysis.keywordMatch.missing.map((k, i) => (
                    <li key={i}>{k}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Section>
        ) : null}

        <Section title="Quick wins">
          <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-700">
            {analysis.quickWins.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </Section>

        <Section title="Areas of improvement">
          <div className="space-y-4">
            {analysis.improvements.map((imp, i) => (
              <div key={i}>
                <div className="text-sm font-semibold">{imp.title}</div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-700">
                  {imp.details.map((d, j) => (
                    <li key={j}>{d}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Suggested upgrades">
          <div className="space-y-4">
            <div>
              <div className="text-sm font-semibold">Summary</div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-700">
                {analysis.upgrades.summary.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-sm font-semibold">Rewritten bullets</div>
              <div className="mt-2 space-y-3">
                {analysis.upgrades.experienceBullets.map((b, i) => (
                  <div key={i} className="rounded-xl bg-neutral-50 p-4">
                    <div className="text-xs font-medium text-neutral-500">Original</div>
                    <div className="text-sm text-neutral-800">{b.original}</div>
                    <div className="mt-3 text-xs font-medium text-neutral-500">Rewritten</div>
                    <div className="text-sm font-semibold text-neutral-900">{b.rewritten}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold">Skills</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {analysis.upgrades.skills.map((s, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-800"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Section>
      </CardContent>
    </Card>
  );
}

function loadRazorpayScript() {
  return new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("No window"));
    // @ts-ignore
    if (window.Razorpay) return resolve();

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.body.appendChild(script);
  });
}
