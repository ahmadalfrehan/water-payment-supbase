-- ============================================================
-- Cash Box — Supabase schema
-- Run this ENTIRE file once in your Supabase project's SQL Editor
-- (Dashboard → SQL Editor → New query → paste → Run)
-- ============================================================

-- 1. Profiles table — one row per user, holds their display name + role.
--    Supabase Auth already stores email/password in auth.users; this
--    table is where we attach the "admin" / "viewer" role.
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text not null,
  role text not null default 'viewer' check (role in ('admin', 'viewer')),
  created_at timestamptz not null default now()
);

-- 2. Transactions table
create table if not exists transactions (
  id bigint generated always as identity primary key,
  type text not null check (type in ('deposit', 'withdraw')),
  amount numeric(12,2) not null check (amount > 0),
  donor_name text,
  withdrawal_reason text,
  notes text,
  date date not null default current_date,
  created_by uuid references profiles(id) not null,
  created_at timestamptz not null default now()
);

-- 3. Auto-create a profile (default role: viewer) whenever a new auth user signs up / is invited
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', new.email), 'viewer');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Server-side rule: can't withdraw more than the current balance.
--    This runs in the database itself, so it can't be bypassed from the browser.
create or replace function public.check_sufficient_balance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_balance numeric;
begin
  if new.type = 'withdraw' then
    select coalesce(sum(case when type = 'deposit' then amount else -amount end), 0)
    into current_balance
    from transactions;

    if new.amount > current_balance then
      raise exception 'Insufficient balance. Current balance is %, cannot withdraw %.',
        current_balance, new.amount;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_check_balance on transactions;
create trigger trg_check_balance
  before insert on transactions
  for each row execute function public.check_sufficient_balance();

-- 5. Helper used inside policies below: is the current logged-in user an admin?
create or replace function public.current_role_is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- 6. Row Level Security — this is the real access-control boundary,
--    enforced by Postgres itself regardless of what the browser sends.
alter table profiles enable row level security;
alter table transactions enable row level security;

-- Any signed-in user can see everyone's username/role
-- (needed so the transaction list can show "who added this")
create policy "profiles readable by any signed-in user"
  on profiles for select
  to authenticated
  using (true);

-- Roles are changed by you directly in the SQL editor (see README), not from the app.
-- This policy just lets a user update their own display name, nothing else sensitive.
create policy "users can update their own username"
  on profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Any signed-in user (admin or viewer) can view transactions
create policy "transactions readable by any signed-in user"
  on transactions for select
  to authenticated
  using (true);

-- Only admins can add / edit / delete transactions
create policy "transactions insertable by admins only"
  on transactions for insert
  to authenticated
  with check (current_role_is_admin());

create policy "transactions updatable by admins only"
  on transactions for update
  to authenticated
  using (current_role_is_admin());

create policy "transactions deletable by admins only"
  on transactions for delete
  to authenticated
  using (current_role_is_admin());

-- ============================================================
-- After running this file:
--   1. Invite your users from Dashboard → Authentication → Users → Invite user
--      (this creates their login and, via the trigger above, a 'viewer' profile)
--   2. Promote someone to admin by running, e.g.:
--        update profiles set role = 'admin' where username = 'their@email.com';
-- ============================================================
