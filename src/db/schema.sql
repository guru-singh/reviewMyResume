-- Enable extensions you might need
-- create extension if not exists "pgcrypto";

-- 1) Profiles (1 row per auth user)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),

  plan text not null default 'free' check (plan in ('free','paid')),
  subscription_status text not null default 'inactive',
  razorpay_subscription_id text,

  -- Optional future fields
  current_period_end timestamptz,
  free_limit int not null default 5
);

-- 2) Analyses (each resume evaluation)
create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),

  filename text,
  resume_text text not null,
  job_description text,
  ats_score int not null,
  result jsonb not null
);

create index if not exists analyses_user_id_created_at_idx
  on public.analyses(user_id, created_at desc);

-- 3) RLS
alter table public.profiles enable row level security;
alter table public.analyses enable row level security;

-- Profiles: users can read/update their own
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_upsert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Analyses: users can read/insert their own
create policy "analyses_select_own"
  on public.analyses for select
  using (auth.uid() = user_id);

create policy "analyses_insert_own"
  on public.analyses for insert
  with check (auth.uid() = user_id);

-- Optional: block updates/deletes for MVP
-- revoke update/delete

-- 4) Trigger: auto-create profile row on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
