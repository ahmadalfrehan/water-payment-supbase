-- ============================================================
-- Migration: add multi-currency support
-- Run this in the SQL Editor of a project that already has the
-- original schema (from supabase_schema.sql) applied.
--
-- If you're setting up a BRAND NEW project instead, just run the
-- updated supabase_schema.sql — it already includes this.
-- ============================================================

-- 1. Add the currency column.
--    Edit the list of allowed codes here to match frontend/js/currencies.js.
alter table transactions
  add column if not exists currency text not null default 'USD'
  check (currency in ('USD', 'SYP'));

-- 2. Replace the balance-check trigger so it compares balances
--    WITHIN the same currency only (withdrawing USD shouldn't be
--    limited by your EGP balance, and vice versa).
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
    from transactions
    where currency = new.currency;

    if new.amount > current_balance then
      raise exception 'Insufficient % balance. Current balance is %, cannot withdraw %.',
        new.currency, current_balance, new.amount;
    end if;
  end if;
  return new;
end;
$$;

-- Trigger already exists and points at this function, so no need to recreate it.
