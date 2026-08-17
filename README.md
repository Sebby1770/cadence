<div align="center">

# ⏱️ Cadence

### Employee Scheduling & Shift Marketplace — a premium, modern workforce platform

Minimal like Linear. Calm like Notion. Polished like Apple.

</div>

---

Cadence is a beautiful, fast, fully responsive scheduling platform that makes shift
management effortless for employees, managers, and admins. It runs entirely in the
browser on a rich, internally-consistent demo dataset — no backend required.

## ✨ Highlights

- **Dashboard** — time-aware greeting, next shift, weekly hours ring, open-shift &
  earnings cards, week strip, live "on shift now", announcements, and an AI nudge.
- **Schedule** — Day / Week / Month calendar with department & location filters,
  shift detail modals, publish & copy-week actions.
- **Shift Marketplace** — browse open shifts with pay estimates, distance and skill
  matching; pick up in one tap.
- **Shift Swaps** — offer to everyone, to selected coworkers, or swap 1:1; approve flows.
- **Who's Working** — daily staffing board split by Morning / Afternoon / Evening / Night.
- **Team Directory** — searchable profiles with skills, certs, badges, and availability.
- **Locations** — a live staffing heat-map on a stylized city map with coverage & labour.
- **Messages** — direct, group, store, department, and shift chats.
- **Availability** — weekly windows, preferred/min/max hours, unavailable dates, vacation mode.
- **Leave** — request annual/sick/personal/study leave with balances and manager approvals.
- **Time Clock** — live timer, breaks, GPS/QR/photo verification, and clock history.
- **Notifications** — grouped, filterable, with push/email/SMS preferences.
- **Profile** — hours, achievements/badges, streaks, recognition, and a **real
  `.ics` download** of upcoming published/confirmed shifts (Google / Apple /
  Outlook connect is still a demo toast).
- **Analytics** — coverage, hours, labour cost, acceptance rate, peak staffing
  (Recharts), plus **staffing insights**: double-books, overtime vs weekly max,
  coverage gaps, and hours fairness (stdev) with worst-5 tables.
- **Admin** — users, workplaces, departments, positions, pay rates, settings, audit log.
- **Ask Cadence AI** — a working assistant: "Who can cover Friday night?", "When am I working next?"

Plus: ⌘K command palette, light/dark themes, mobile bottom-nav with a native feel,
role switcher (Employee / Manager / Admin), and smooth spring animations throughout.

## 🧱 Tech stack

| Concern | Choice |
| --- | --- |
| Framework | React 18 + TypeScript (strict) |
| Build | Vite 5 |
| Styling | Tailwind CSS with a CSS-variable design-token system |
| Animation | Framer Motion |
| Icons | lucide-react |
| Charts | Recharts |
| Dates | date-fns |
| State | Zustand (with light persistence) |

## 🚀 Getting started

```bash
npm install
npm run dev      # http://localhost:5183
npm test         # vitest (staffing engine)
npm run build    # type-check + production build
npm run preview  # preview the build
```

GitHub Actions (`.github/workflows/ci.yml`) runs `npm ci`, `npm test`, and
`npx tsc -b --noEmit` on Node 20.

By default Cadence runs on rich in-memory demo data — no backend required.

## 🗄️ Supabase backend (persistent, multi-user)

Cadence can run against a real **Supabase** Postgres backend so data persists
and is shared live across users. It's driven entirely by two env vars:

```bash
cp .env.example .env
# then set:
VITE_SUPABASE_URL=https://YOUR-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

When those are present the app hydrates from Supabase, writes every action
back through the API, and subscribes to **realtime** changes so multiple
sessions stay in sync. When they're absent it falls back to the demo data —
the topbar shows a **Live** / **Demo** pill so you always know which.

Provision from scratch:

```bash
# schema + policies + realtime
supabase link --project-ref YOUR-ref
supabase db push                 # applies supabase/migrations/*
# seed the roster + shifts from the mock dataset
VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... npx vite-node scripts/seed-apply.ts
```

Schema lives in [`supabase/migrations/`](supabase/migrations); the seed is
generated from the exact mock data (`scripts/gen-seed.ts` → `supabase/seed.sql`).
Reference tables (departments, positions, locations, employees, badges) are
read-only; operational tables (shifts, swaps, leave, notifications, chat,
recognition) are readable/writable and realtime-enabled. Row-level security is
on for every table.

## 🗂️ Structure

```
src/
  components/
    layout/     App shell, sidebar, topbar, bottom-nav, command palette, nav config
    shared/     Reusable shift building blocks
    ui/         Design-system primitives (Avatar, Button, Card, Modal, …)
  data/         Types, mock dataset, and selector helpers
  hooks/        useNow, useMediaQuery
  lib/          utils, dates, theme, staffing engine (overlap, OT, ICS)
  pages/        One file per route (Dashboard, Schedule, Marketplace, …)
  store/        Zustand store (pick-ups, swaps, leave, chat, clock, toasts)
```

Dead stub pages (`src/pages/* 2.tsx`) were removed in 1.2.0 — they were never
imported from `App.tsx`.

## 🎨 Design system

All colour is driven by HSL CSS variables in `src/index.css` (light + dark), consumed
through Tailwind token classes (`bg-card`, `text-muted-foreground`, `bg-dept-kitchen`, …).
This keeps every screen theme-correct and consistent.

---

<div align="center"><sub>Built as a demonstration of a premium SaaS scheduling experience.</sub></div>
