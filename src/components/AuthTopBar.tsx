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
    <div className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
            Account
          </div>
          <div className="text-sm text-slate-700">
            {loading ? "Checking login status..." : user ? `Logged in as ${displayName}` : "You are browsing as a guest"}
          </div>
        </div>

        {user ? (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-2 py-2 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              {avatarUrl ? (
                <div
                  className="h-10 w-10 rounded-full border border-slate-200 bg-slate-200 bg-cover bg-center"
                  style={{ backgroundImage: `url("${avatarUrl}")` }}
                  aria-hidden="true"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                  {displayName.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="hidden text-left sm:block">
                <div className="text-sm font-semibold text-slate-900">{displayName}</div>
                <div className="text-xs text-slate-500">Profile menu</div>
              </div>
              <div className="pr-2 text-xs text-slate-500">▼</div>
            </button>

            {menuOpen ? (
              <div className="absolute right-0 top-[calc(100%+0.5rem)] z-20 min-w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
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
        <div className="mx-auto max-w-6xl px-4 pb-3 text-sm text-red-600">{error}</div>
      ) : null}
    </div>
  );
}
