-- ============================================================
-- Migration: rename an existing currency code
-- Use this if your project already has real transactions using 'EGP'
-- and you want to switch to 'SYP' (Syrian Pound) instead.
--
-- If you haven't gone live yet / have no EGP transactions, you can
-- skip this and just run database/migration_add_currency.sql (or the
-- full supabase_schema.sql for a brand new project) — both already use
-- SYP by default.
-- ============================================================

-- 1. Drop the old constraint that only allowed 'USD' and 'EGP'.
--    (This is the default name Postgres gives an inline check constraint;
--    if this errors with "constraint does not exist", check the real name
--    via: select conname from pg_constraint where conrelid = 'transactions'::regclass;)
alter table transactions drop constraint if exists transactions_currency_check;

-- 2. Relabel existing rows: every transaction currently marked EGP becomes SYP.
--    Skip this line if you'd rather keep old EGP rows as history and just
--    stop offering EGP for new transactions.
update transactions set currency = 'SYP' where currency = 'EGP';

-- 3. Add the new constraint restricting future rows to USD/SYP.
alter table transactions
  add constraint transactions_currency_check check (currency in ('USD', 'SYP'));

-- Note: the balance-check trigger doesn't need any changes — it reads
-- new.currency dynamically, so it automatically works with whatever
-- codes are now allowed.
