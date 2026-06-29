# Barakah — Household Money Manager

A full-stack money manager for families/households. Everything is scoped to a shared
**household**: accounts, categories, budgets, transactions, and recurring rules are all
shared between members.

Built with **Next.js 16 (App Router) + TypeScript**, **Tailwind v4 + shadcn/ui**,
**Prisma + MySQL/MariaDB**, **Auth.js (NextAuth v5)** credentials auth, and **Recharts**.

> All money is stored as **integer cents** and only divided by 100 for display
> (see [`src/lib/money.ts`](src/lib/money.ts)).

---

## Features

- **Auth & onboarding** — email/password (bcrypt). First signup creates a household, an
  `OWNER` membership, and seeds default categories.
- **Dashboard** — greeting, total balance / income / spent metric cards, recent
  transactions, and live budget status bars.
- **Transactions** — searchable, filterable (category / account / month), grouped by date,
  with an add/edit modal supporting **expense / income / transfer**. Transfers are stored
  as a paired two-row ledger. Auto-generated rows show a **Recurring** tag.
- **Accounts** — cash / bank / savings / credit card, with live balances kept in sync.
- **Budgets** — monthly limit per category; **spent is always calculated live** from
  transactions (green &lt; 80% · amber 80–100% · red &gt; 100%).
- **Reports** — spending-by-category donut and income-vs-expense bars (Recharts), with a
  month selector.
- **Settings** — household name + base currency, members & roles, invite by email, profile.
- **Recurring rules** — templates that materialize into real transactions when due, via a
  function you can call manually, from the UI ("Run due now"), an API route, or a script.

---

## Prerequisites

- **Node.js 18+** (built and tested on Node 22)
- **MySQL or MariaDB** running locally on `localhost:3306`.
  This project was set up against **XAMPP's MariaDB** at `C:\xampp`.

### Start your local database (XAMPP)

Open the **XAMPP Control Panel** (`C:\xampp\xampp-control.exe`) and click **Start** next
to **MySQL**, or run `C:\xampp\mysql_start.bat`. Confirm port **3306** is listening.

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

A `.env` is already included. Open it and check **`DATABASE_URL`**:

```
DATABASE_URL="mysql://root:@localhost:3306/barakah_dev"
AUTH_SECRET="...generated..."
```

> XAMPP's default MySQL user is **`root`** with an **empty password**.
> **If you set a root password**, put it between `root:` and `@`, e.g.
> `mysql://root:YOUR_PASSWORD@localhost:3306/barakah_dev`.
> Fill this in **before** running migrations.

### 3. Create the database

With MySQL running:

```powershell
& "C:\xampp\mysql\bin\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS barakah_dev;"
```

(Or run `CREATE DATABASE barakah_dev;` from any MySQL client / phpMyAdmin.)

### 4. Run migrations + seed

```bash
npx prisma migrate dev
npx prisma db seed
```

The seed creates a demo household **"Barakah Family"** with accounts, categories, budgets,
a handful of transactions (including a transfer), and recurring rules.

### 5. Start the app

```bash
npm run dev
```

Open **http://localhost:3000**.

---

## Demo login

```
Email:    demo@barakah.app
Password: demo1234
```

(A second member, `sara@barakah.app` / `demo1234`, also exists in the seed.)

---

## Recurring transactions

Recurring rules generate real transactions when their `nextRun` date is due. Run them:

- **From the UI** — Recurring page → **Run due now**.
- **Via the API route** — `GET /api/cron/recurring` (returns JSON; wire to a scheduler
  later). Set `CRON_SECRET` in `.env` to require `?secret=...` or a bearer token.
- **Via script** — `npm run recurring`.

The core logic lives in [`src/lib/recurring.ts`](src/lib/recurring.ts)
(`materializeDueRules`).

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:seed` | Re-seed the demo data (wipes existing data) |
| `npm run db:studio` | Open Prisma Studio |
| `npm run recurring` | Materialize due recurring rules |

---

## Notes & decisions

- **MariaDB via XAMPP** is used in place of PostgreSQL (Prisma `mysql` provider). The
  schema is portable.
- **`bcryptjs`** (pure JS) is used instead of `bcrypt` to avoid native build issues on
  Windows. **JWT** sessions are used (required by the Credentials provider).
- **Prisma 6** is pinned (Prisma 7's new generator/driver-adapter model is avoided for a
  zero-config local setup).
- **Transfers** are a paired two-row ledger (signed `amountCents`): one row debits the
  source account, one credits the destination.
- **Account balances** are stored and kept in sync transactionally on every create / edit /
  delete. **Budget "spent" is never stored** — it's computed live from transactions.
- **Invite by email** is local-only (no email is sent): existing users are added to the
  household immediately; others join automatically when they sign up with that email.
- Roles: **OWNER** (full control incl. members/household), **MEMBER** (can edit data),
  **VIEWER** (read-only).
