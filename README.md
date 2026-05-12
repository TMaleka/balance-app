# Balance App

A daily budgeting app that helps you stay in control of your money through small, consistent decisions — not spreadsheets you forget.

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Supabase (Auth + PostgreSQL + RLS)
- **Hosting:** Vercel (auto-deploys from `main`)
- **Design:** Amex-inspired UI with CSS variables

## Quick Start (Local)

```bash
cd project
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

## Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `database/setup.sql`
3. Copy your project URL and anon key into `.env` (or Vercel env vars)

### Required Tables

| Table | Purpose |
|-------|---------|
| `budgets` | Budget categories and limits per user |
| `expenses` | Logged transactions linked to budgets |
| `monthly_savings` | Monthly savings tracking |
| `monthly_income` | Monthly income tracking |
| `daily_checkins` | Daily check-in streaks (optional — app degrades gracefully without it) |

## For Test Users

1. **Sign up** with any email + password (min 6 chars) + phone number
2. **Onboarding** walks you through 5 screens — pick your intent, set a budget
3. **Home tab** shows your daily status and budget overview
4. **Add expenses** via the floating + button
5. **Daily check-in** appears once per day — tap to acknowledge your spending status
6. **Restore balance** lets you shift budget between categories when overspending

### Known Limitations

- Manual expense entry only (no bank import)
- Push notifications are not implemented
- Loyalty card system requires additional database setup (see `database/loyalty_schema.sql`)

## Project Structure

```
project/
├── src/
│   ├── components/     # All React components
│   ├── assets/         # Logo and static assets
│   ├── config/         # Environment config
│   ├── styles/         # CSS design system
│   ├── utils/          # Error handling, analytics, etc.
│   └── App.tsx         # Main app with routing logic
├── database/           # SQL migrations
│   ├── setup.sql       # ⭐ Run this first
│   ├── daily_checkins.sql
│   ├── monthly_income.sql
│   └── loyalty_schema.sql
└── .env.example        # Environment template
```

## Deployment

Pushes to `main` auto-deploy to Vercel. Ensure these env vars are set in Vercel:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
