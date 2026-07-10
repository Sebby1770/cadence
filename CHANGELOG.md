# Changelog

All notable changes to **Cadence** are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project aims to follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Cadence also keeps a live, in-app **Activity log** (per workspace) at `/activity`
that records every schedule change, swap, leave decision, and workspace event.

## [1.1.0] — 2026-07-11

### Changed — Visual clean pass ✨
- **Avatars** are now deterministic gradient-initials (Linear/Notion style)
  instead of random stock photos: no more name/photo mismatches, no broken
  tiny avatars, and ~100 fewer network requests on the Schedule view. The same
  person always gets the same gradient everywhere in the app.
- **Page titles** use a solid foreground weight; the two-tone gradient is
  reserved for the dashboard greeting so it stays special.
- **Calendar chips** show time + name only — the schedule grid reads much
  cleaner at a glance.
- **Backdrop restraint**: the aurora/grain ambience is dialled down for a
  calmer, more premium surface.
- **Snappier navigation**: page/header entrances shortened (~0.35s → ~0.2s).
- **Ratings** always render with one decimal (5 → 5.0).

### Performance
- Vendor code (React, Framer Motion, Supabase) is split into separate
  long-cacheable chunks, shrinking the main app bundle substantially.

## [1.0.0] — 2026-07-07

### Added — Multi-tenant workspaces 🏢
- **Any company can plug in.** New `companies` table with per-company data
  isolation: `company_id` added to every tenant table (departments, positions,
  locations, employees, badges, shifts, swaps, leave, notifications, chat,
  recognition), all backfilled to the demo company.
- **Company switcher** in the sidebar — switch between workspaces, create a new
  one, or join an existing one with an invite code.
- **First-run onboarding** offering three ways in: explore the demo, create your
  company, or join with a code.
- **Create-a-company** flow bootstraps a ready-to-use org (departments,
  positions, a location, a sample team, and a few days of shifts) and makes you
  the owner, with a shareable invite code.
- **Join-a-company** by invite code (try `DEMO24` for the demo workspace).
- **Change log / audit trail**: new `audit_log` table + `/activity` page recording
  shift moves, assignments, pick-ups, releases, publishes, swaps, and leave
  decisions — scoped per company and updated in realtime.
- Reference data (employees, locations, positions, departments) is now swapped
  per active company via a runtime registry; pages remount cleanly on switch.

### Changed
- Realtime subscriptions are now filtered by `company_id`, so you only receive
  live updates for your own workspace.
- Store hydrates the active company's reference + operational data on load and
  persists the last-used workspace.

### Fixed
- Eliminated a pathological TypeScript type-instantiation in the realtime
  subscription builder that ballooned `tsc` from ~2s to 5min+ (now ~1.8s).

## [0.4.0] — 2026-07-07

### Added — Real Supabase backend
- Provisioned Supabase Postgres with schema, row-level security, and realtime
  (`supabase/migrations/`), seeded from the mock dataset.
- Env-gated Supabase client + typed data layer (`src/data/remote.ts`): the app
  hydrates from Postgres, writes every action back through the API, and
  subscribes to realtime changes. Falls back to in-memory demo data when no
  credentials are present. A **Live/Demo** pill in the topbar shows which.

## [0.3.0] — 2026-07-07

### Added
- **Drag-and-drop Schedule builder** (manager "Builder" mode, `@dnd-kit`) — drag
  shifts between days to reschedule.
- React-Bits-style visual layer (`src/components/fx/`): animated Aurora backdrop,
  gradient text, CountUp stats, spotlight cards, 3D tilt, and magnetic buttons.

## [0.2.0] — 2026-07-06

### Changed
- Made the scheduling dataset realistic: no double-booking, weekly shift caps,
  per-location department profiles, recalibrated coverage targets. Coverage,
  overtime, and labour figures are now believable across every view.

## [0.1.0] — 2026-07-06

### Added
- Initial Cadence: a premium scheduling & shift-marketplace SPA — 16 routes,
  design-token system with light/dark themes, command palette, role switcher,
  mobile bottom-nav, and a rich deterministic demo dataset.

[1.0.0]: https://github.com/Sebby1770/cadence/releases/tag/v1.0.0
[0.4.0]: https://github.com/Sebby1770/cadence/releases/tag/v0.4.0
[0.3.0]: https://github.com/Sebby1770/cadence/releases/tag/v0.3.0
[0.2.0]: https://github.com/Sebby1770/cadence/releases/tag/v0.2.0
[0.1.0]: https://github.com/Sebby1770/cadence/releases/tag/v0.1.0
