"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getErrorMessage } from "@/lib/getErrorMessage";

type MeResponse = {
  user?: {
    id: string;
    email: string | null;
    name?: string | null;
    avatarUrl?: string | null;
  } | null;
};

export function AuthTopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = React.useState<MeResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loggingOut, setLoggingOut] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    let active = true;

    async function loadMe() {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        const data = (await res.json()) as MeResponse;
        if (active) {
          setMe(data);
          setError(null);
        }
      } catch (err: unknown) {
        if (active) {
          setError(getErrorMessage(err, "Unable to load your session"));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadMe();

    return () => {
      active = false;
    };
  }, [pathname]);

  React.useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleLogout() {
    setMenuOpen(false);
    setLoggingOut(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to log out");
      }

      setMe({ user: null });
      router.push("/login");
      router.refresh();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Unable to log out right now"));
    } finally {
      setLoggingOut(false);
    }
  }

  const user = me?.user ?? null;
  const displayName = user?.name || user?.email || "Logged in";
  const avatarUrl = user?.avatarUrl || null;

  return (
    <header className="sticky top-0 z-[9999] border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-slate-900 to-blue-700 text-sm font-bold text-white">
            R
          </div>
          <span className="text-sm font-semibold text-slate-900 hidden sm:inline">
            ResumeLab
          </span>
        </Link>

        {user ? (
          <div className="relative z-[10000]" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-2 shadow-sm hover:bg-slate-50"
            >
              {/* Avatar */}
              {avatarUrl ? (
                <div
                  className="h-8 w-8 rounded-full bg-cover bg-center"
                  style={{ backgroundImage: `url("${avatarUrl}")` }}
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                  {displayName.slice(0, 1).toUpperCase()}
                </div>
              )}

              {/* Name (optional on desktop only) */}
              <span className="hidden sm:block text-sm font-medium text-slate-800">
                {displayName}
              </span>

              {/* Arrow */}

            </button>
            {menuOpen ? (
              <div className="absolute right-0 top-[calc(100%+0.5rem)] z-[10001] min-w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
                <Link
                  href="/dashboard"
                  className="block rounded-xl px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="block w-full rounded-xl px-4 py-3 text-left text-sm text-red-600 transition hover:bg-red-50"
                  disabled={loggingOut}
                >
                  {loggingOut ? "Logging out..." : "Logout"}
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Login / signup
          </Link>
        )}
      </div>

      {error ? (
        <div className="mx-auto max-w-6xl px-4 pb-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}
    </header>
  );
}