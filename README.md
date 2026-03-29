# Resume Review MVP (Full-stack)

## Stack
- Next.js (App Router) + Tailwind
- Supabase Auth (Email OTP + Google)
- Supabase Postgres (usage tracking) with RLS
- PDF/DOCX parsing: `pdf-parse`, `mammoth`
- LLM: Gemini (default) or Claude (switch via env)
- Payments: Razorpay Subscriptions + Webhook

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

Copy `.env.local.example` to `.env.local`, fill in your Supabase/Razorpay credentials, and control the LLM flow with:

- `ENABLE_REAL_GEMINI=false` to skip Gemini/Claude and return stub data (ATS-only UI).
- `ENABLE_REAL_GEMINI=true` to allow real AI responses again.

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
