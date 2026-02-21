"use client";

import * as React from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button, Card, CardContent, CardHeader, Input } from "@/components/ui";

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
      setMsg("Check your email for the login link.");
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
    <div className="mx-auto flex min-h-[80vh] max-w-md items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <div className="text-xl font-semibold">Sign in</div>
          <div className="text-sm text-neutral-600">
            Login to upload your resume and get an ATS report.
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={signInWithGoogle} variant="secondary" isLoading={loading}>
            Continue with Google
          </Button>

          <div className="text-center text-xs text-neutral-500">or</div>

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

          {msg ? <div className="text-sm text-neutral-700">{msg}</div> : null}

          <div className="text-xs text-neutral-500">
            By continuing, you agree to our Terms and Privacy Policy.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
