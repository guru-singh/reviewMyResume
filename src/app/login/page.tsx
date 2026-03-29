"use client";

import * as React from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button, Card, CardContent, CardHeader, Input } from "@/components/ui";

const highlights = [
  "Secure magic links and reusable Google sign-ins",
  "Resume uploads stay private until you move forward",
  "One dashboard for every review, edit, and note you receive"
];

const reassurance = [
  {
    title: "Fast access",
    desc: "Links arrive in under a minute so you never lose momentum."
  },
  {
    title: "Transparent control",
    desc: "You choose which resumes and job briefs we keep for reference."
  },
  {
    title: "Live support",
    desc: "Need a human? Book a coaching slot from the same dashboard."
  }
];

export default function LoginPage() {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  async function signInWithEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        },
      });
      if (error) throw error;
      setMsg("Check your inbox for the secure link.");
    } catch (err: any) {
      setMsg(err?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    setLoading(true);
    setMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard` },
      });
      if (error) throw error;
    } catch (err: any) {
      setMsg(err?.message ?? "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-[1.1fr,0.9fr] lg:py-20">
        <div className="space-y-10">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-300">
              Resume Review Lab
            </p>
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
              Sign in to continue polishing the story hiring teams want to hear.
            </h1>
            <p className="text-lg text-slate-300">
              A single account gives you access to every ATS score, every editorial note, and every live coaching slot you book with us.
            </p>
          </div>
          <div className="space-y-4">
            {highlights.map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200"
              >
                <span className="text-sky-300">●</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {reassurance.map((card) => (
              <div key={card.title} className="rounded-3xl border border-white/10 bg-slate-900/40 p-5 text-sm">
                <p className="text-sm font-semibold text-white">{card.title}</p>
                <p className="mt-2 text-slate-300">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <Card className="w-full border-white/20 bg-white/5 shadow-2xl shadow-slate-900/60">
          <CardHeader>
            <div className="space-y-1">
              <div className="text-2xl font-semibold">Welcome back</div>
              <div className="text-sm text-slate-300">
                Securely log in before uploading your resume or checking past reviews.
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <Button onClick={signInWithGoogle} variant="secondary" isLoading={loading}>
              Continue with Google
            </Button>
            <div className="text-center text-xs uppercase tracking-[0.4em] text-slate-400">or</div>
            <form onSubmit={signInWithEmail} className="space-y-3">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                required
              />
              <Button type="submit" isLoading={loading}>
                Send magic link
              </Button>
            </form>
            {msg ? <p className="text-sm text-slate-200">{msg}</p> : null}
            <p className="text-xs text-slate-500">
              We rely on Supabase for secure, passwordless auth. Terms and privacy apply.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
