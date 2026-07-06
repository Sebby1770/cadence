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
- **Profile** — hours, achievements/badges, streaks, recognition, calendar sync.
- **Analytics** — coverage, hours, labour cost, acceptance rate, peak staffing (Recharts).
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
npm run build    # type-check + production build
npm run preview  # preview the build
```

## 🗂️ Structure

```
src/
  components/
    layout/     App shell, sidebar, topbar, bottom-nav, command palette, nav config
    shared/     Reusable shift building blocks
    ui/         Design-system primitives (Avatar, Button, Card, Modal, …)
  data/         Types, mock dataset, and selector helpers
  hooks/        useNow, useMediaQuery
  lib/          utils, dates, theme
  pages/        One file per route (Dashboard, Schedule, Marketplace, …)
  store/        Zustand store (pick-ups, swaps, leave, chat, clock, toasts)
```

## 🎨 Design system

All colour is driven by HSL CSS variables in `src/index.css` (light + dark), consumed
through Tailwind token classes (`bg-card`, `text-muted-foreground`, `bg-dept-kitchen`, …).
This keeps every screen theme-correct and consistent.

---

<div align="center"><sub>Built as a demonstration of a premium SaaS scheduling experience.</sub></div>
