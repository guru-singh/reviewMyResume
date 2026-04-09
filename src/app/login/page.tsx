"use client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button, Card, CardContent, CardHeader, Input } from "@/components/ui";
import { getErrorMessage } from "@/lib/getErrorMessage";

const trustPoints = [
  "Google sign-in and passwordless magic links",
  "One dashboard for every score, note, and rewrite",
  "Private resume reviews tied to your own account",
];

const quickStats = [
  { value: "3,200+", label: "resumes reviewed" },
  { value: "+22 pts", label: "average ATS lift" },
  { value: "94%", label: "users who come back" },
];

const benefitCards = [
  {
    title: "Fast to enter",
    desc: "Use Google or a magic link and get back to editing in under a minute.",
  },
  {
    title: "Easy to revisit",
    desc: "Every report stays organized so you can compare iterations instead of starting over.",
  },
  {
    title: "Built for improvement",
    desc: "From ATS score to rewritten bullets, the full review stays in one flow.",
  },
];

function getAppUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "";
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function verifySession() {
      try {
        const res = await fetch("/api/me", { cache: "no-store", credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        if (data.user) {
          router.replace("/dashboard");
        }
      } catch (error) {
        console.error("Failed to hydrate session", error);
      }
    }

    void verifySession();
  }, [router]);

  async function signInWithEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const appUrl = getAppUrl();

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: appUrl ? `${appUrl}/dashboard` : undefined,
        },
      });

      if (error) throw error;
      setMsg("Check your inbox for the secure login link.");
    } catch (error) {
      setMsg(getErrorMessage(error, "Something went wrong"));
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    setLoading(true);
    setMsg(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const appUrl = getAppUrl();

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: appUrl ? `${appUrl}/dashboard` : undefined,
        },
      });

      if (error) throw error;
    } catch (error) {
      setMsg(getErrorMessage(error, "Something went wrong"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eef3f8_0%,#f8f4eb_100%)] text-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
          <section className="relative overflow-hidden rounded-[2rem] bg-[#162238] p-8 text-white shadow-[0_28px_90px_rgba(15,23,42,0.28)] sm:p-10">
            <div className="absolute left-[-4rem] top-[-5rem] h-40 w-40 rounded-full bg-[#ffd166]/30 blur-3xl" />
            <div className="absolute bottom-[-4rem] right-[-2rem] h-48 w-48 rounded-full bg-sky-300/20 blur-3xl" />

            <div className="relative">
              <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-slate-100">
                Secure login
              </div>
              <h1 className="mt-6 max-w-xl text-4xl font-semibold leading-tight sm:text-5xl">
                Step back into your resume workspace in seconds.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-200 sm:text-lg">
                Sign in to continue your ATS reviews, revisit rewrite suggestions, and keep every
                iteration of your resume in one place.
              </p>

              <div className="mt-8 space-y-4">
                {trustPoints.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/8 px-4 py-4"
                  >
                    <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[#ffd166]" />
                    <p className="text-sm leading-6 text-slate-100">{item}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {quickStats.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-white/15 bg-slate-900/40 px-4 py-4"
                  >
                    <div className="text-2xl font-semibold text-white">{item.value}</div>
                    <div className="mt-1 text-sm text-slate-200">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <Card className="rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.1)]">
            <CardHeader className="border-b border-slate-200 px-6 py-6 sm:px-8">
              <div className="space-y-2">
                <div className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">
                  Welcome back
                </div>
                <div className="text-3xl font-semibold text-slate-950">
                  Choose how you want to sign in
                </div>
                <div className="text-sm leading-6 text-slate-600">
                  Your reports, uploads, and ATS history stay connected to this account.
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 px-6 py-6 sm:px-8">
              <Button
                onClick={signInWithGoogle}
                variant="secondary"
                isLoading={loading}
                className="w-full rounded-2xl border border-slate-200 bg-slate-100 py-3 text-slate-900 hover:bg-slate-200"
              >
                Continue with Google
              </Button>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  or email
                </div>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <form onSubmit={signInWithEmail} className="space-y-4">
                <Input
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  required
                  className="rounded-2xl border-slate-300 px-4 py-3"
                />
                <Button type="submit" isLoading={loading} className="w-full rounded-2xl py-3">
                  Send magic link
                </Button>
              </form>

              <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
                {msg ??
                  "Passwordless auth powered by Supabase. We will email you a secure link to continue."}
              </div>

              <div className="text-xs leading-6 text-slate-500">
                By continuing, you agree to use this workspace for your own resume reviews. Need to
                go back first?{" "}
                <Link href="/" className="font-semibold text-slate-900 underline-offset-2 hover:underline">
                  Return home
                </Link>
                .
              </div>
            </CardContent>
          </Card>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {benefitCards.map((card, index) => (
            <article
              key={card.title}
              className={`rounded-[1.8rem] border p-6 shadow-[0_18px_45px_rgba(15,23,42,0.07)] ${
                index === 1 ? "border-sky-100 bg-[#eef6ff]" : "border-slate-200 bg-white"
              }`}
            >
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                {card.title}
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-700">{card.desc}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}