# Resume Review MVP (Full-stack)

## Stack
- Next.js (App Router) + Tailwind
- Supabase Auth (Email OTP + Google)
- Supabase Postgres (usage tracking) with RLS
- PDF/DOCX parsing: `pdf-parse`, `mammoth`
- LLM: Gemini (default) or Claude (switch via env)
- Payments: Razorpay Subscriptions + Webhook

## Architecture
- **Frontend**: Next.js App Router + Tailwind (minimal shadcn-style primitives in `src/components/ui.tsx`). Auth-protected dashboard behind middleware.
- **Auth**: Supabase OTP + Google; middleware redirects `/dashboard` -> `/login` when not signed in.
- **Data**: Postgres tables in `src/db/schema.sql` (`profiles`, `analyses`) with RLS. Analyses table stores raw resume text + LLM JSON result for usage tracking.
- **Resume parsing**: `src/lib/parseResume.ts` handles PDF via `pdf-parse` and DOCX via `mammoth` (no `.doc` support).
- **LLM pipeline**: `src/lib/llm.ts` builds structured JSON prompt, calls `LLM_PROVIDER` first, then auto-retries with `LLM_FALLBACK_PROVIDER` if needed. Output shape is validated with Zod.
- **API routes**:
  - `POST /api/analyze`: validate free/paid limit, parse resume, call LLM, persist analysis.
  - `GET /api/me`: returns profile/usage for dashboard.
  - `POST /api/razorpay/create-subscription`: creates subscription using plan IDs.
  - `POST /api/razorpay/webhook`: verifies HMAC signature and updates subscription status with service role key.
- **Payments**: Razorpay Checkout launched client-side from dashboard; webhook activation marks `profiles.subscription_status` to `active`.

## 1) Local setup

1. Create a Supabase project
2. In Supabase SQL editor, run:
   - `src/db/schema.sql`
3. Create Google OAuth provider in Supabase Auth (optional)
4. Create Razorpay subscription plans:
   - Weekly ₹250
   - Monthly ₹750
   Copy plan IDs into env.

## 2) Environment

Copy `.env.example` to `.env.local` and fill values:
- Supabase URL + anon + service role keys
- `NEXT_PUBLIC_APP_URL` (e.g., http://localhost:3000)
- LLM keys: set `LLM_PROVIDER=gemini`, `LLM_FALLBACK_PROVIDER=claude`, and add both API keys for failover
- Razorpay keys + plan IDs + webhook secret

## 3) Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`

## 4) Razorpay webhook

In Razorpay Dashboard → Webhooks:
- URL: `https://YOUR_DOMAIN/api/razorpay/webhook`
- Secret: set same as `RAZORPAY_WEBHOOK_SECRET`
- Events (minimum): `subscription.activated`, `subscription.charged`, `subscription.cancelled`

> Webhook marks subscription status as active.

## Notes / MVP constraints
- Supports PDF/DOCX only (not `.doc`).
- Free plan limit is 5 analyses per user (lifetime in MVP).
- Unlimited unlock requires Razorpay subscription status `active`.
