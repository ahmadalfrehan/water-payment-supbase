# Cash Box — Supabase Edition (no backend to host)

Same app as before, but instead of a FastAPI server you write and host yourself,
the frontend talks directly to [Supabase](https://supabase.com) — a hosted
Postgres database with a built-in API and login system. Nothing to deploy except
static files.

- **Frontend:** plain HTML/CSS/JS (deploy to GitHub Pages, free)
- **Database + Auth + API:** Supabase (free tier, no card required)
- **Security:** enforced by Postgres Row Level Security — real server-side rules,
  not just hidden UI buttons

## 1. Create your Supabase project

1. Go to [supabase.com](https://supabase.com) → sign up → **New project** (free tier).
2. Wait ~2 minutes for it to provision.
3. Open **SQL Editor** → **New query** → paste the entire contents of
   `database/supabase_schema.sql` → **Run**.
   This creates the `profiles` and `transactions` tables, the balance-check rule,
   and the access-control policies.

   **Already have this project set up from before (no `currency` column yet)?**
   Just run `database/migration_add_currency.sql` instead — it adds currency
   support without touching your existing data.

## 2. Connect the frontend to your project

1. In Supabase: **Project Settings → API**. Copy the **Project URL** and the
   **anon public** key.
2. Open `frontend/js/supabaseClient.js` and paste them in:
   ```js
   const SUPABASE_URL = "https://xxxxxxxx.supabase.co";
   const SUPABASE_ANON_KEY = "eyJ...your-anon-key...";
   ```
   The anon key is meant to be public — it's safe to commit and ship in your
   frontend code. It doesn't grant access by itself; the RLS policies do that.

## 3. Turn off public sign-up (important for a treasury app)

By default Supabase lets anyone sign up. For a cash-box app you almost
certainly want to control who gets an account instead:

1. **Authentication → Providers → Email** → turn off "Allow new users to sign up".
2. Add people yourself: **Authentication → Users → Invite user** → enter their
   email. They'll get an email to set their password. The schema's trigger
   automatically gives them a `viewer` profile.
3. To make someone an admin, run this in the SQL Editor:
   ```sql
   update profiles set role = 'admin' where username = 'their@email.com';
   ```
   (Everyone starts as `viewer` and gets promoted manually — this is intentional,
   so a new account can never grant itself admin/write access.)

## 4. Run it locally to test

```bash
cd frontend
python3 -m http.server 8080
```
Open `http://localhost:8080/login.html` and sign in with an account you invited.

## 5. Deploy for free

**GitHub Pages:**
1. Push this repo to GitHub.
2. Settings → Pages → Deploy from branch → pick the branch and set the folder
   to `/frontend` (or move the contents of `frontend/` to the repo root if
   your plan doesn't support subfolders).
3. You'll get a URL like `https://yourname.github.io/cashbox`.

That's it — no backend to deploy, no server to keep awake, no database to
provision separately. The whole app is static files + Supabase.

## Arabic / English

There's a language toggle button in the top bar (and on the login page) that
switches all UI text between English and Arabic and flips the layout to
right-to-left. The choice is remembered per-browser.

To add more UI text later, add a key to both the `en` and `ar` objects in
`frontend/js/i18n.js`, then reference it with `I18N.t("your_key")` in JS or
`data-i18n="your_key"` on a static HTML element.

## Multiple currencies

The app tracks balances in more than one currency — each deposit/withdrawal
picks a currency, and the dashboard shows a separate balance/deposits/
withdrawals card group per currency actually in use. Currencies are never
summed together, and the "can't withdraw more than the balance" rule checks
the balance *within that currency only* (withdrawing USD isn't limited by
your EGP balance).

To change which currencies are offered:
1. Edit the list in `frontend/js/currencies.js`.
2. Update the matching `check (currency in (...))` constraint in
   `database/supabase_schema.sql` (new projects) — or, for a project that's
   already running, run `database/migration_add_currency.sql` with your codes
   swapped in.

## Editing and deleting transactions

Admins can edit or delete any transaction from the Transactions page. Edit
opens a form pre-filled with that transaction's current amount, currency,
date, donor/reason, and notes — change what you need and save. Both actions
are enforced server-side by the same Row Level Security policies that block
deposits/withdrawals for viewers, so they can't be bypassed from the browser.

## What's enforced where

| Rule | Enforced by |
|---|---|
| Only admins can add/edit/delete transactions | Postgres Row Level Security policies (`database/supabase_schema.sql`) |
| Can't withdraw more than the current balance | A Postgres trigger, runs on every insert, can't be bypassed from the browser |
| Passwords hashed, sessions via JWT | Supabase Auth (handles this for you) |
| Admin buttons hidden from viewers | Frontend JS — convenience only, not the real security boundary |

Because the real rules live in the database, a technically-savvy viewer poking
at the browser's network tab still can't insert or delete a transaction — the
database itself will reject it.

## Limits of the free Supabase tier

- 500 MB database storage (plenty for a transaction log — tens of thousands of rows)
- Free projects pause after 7 days with zero activity; visiting the site wakes
  them back up automatically after a few seconds
- Up to 2 free projects per account

## Files

```
cashbox-supabase/
├── database/
│   └── supabase_schema.sql   # run once in Supabase's SQL Editor
└── frontend/
    ├── login.html
    ├── index.html             # dashboard
    ├── transactions.html      # list, search, filter, export
    ├── css/style.css
    └── js/
        ├── supabaseClient.js  # ← put your URL + anon key here
        ├── api.js             # all Supabase queries live here
        ├── login.js
        ├── dashboard.js
        └── transactions.js
```
