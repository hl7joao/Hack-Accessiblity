# Step-Free CTA

**Can I actually use this station right now?**

Chicago publishes live elevator outages. That data never reaches Google Maps, Apple Maps,
or any app you'd normally navigate with. So a wheelchair user plans a trip, arrives at the
station, and finds out there that the elevator is broken.

This project closes that gap.

---

## The problem, in one screenshot

Right now, today, these are the three stations with broken elevators — and what CTA's own
Route Status API says about them:

| Station | Route Status reports | Reality |
|---|---|---|
| **Chicago** (40710) | **"Normal Service"** | Elevator out since **Sep 28** — 6 days, no ETA |
| **Cumberland** (40230) | "Service Change" | Elevator out since 08:37 today |
| **Roosevelt** (41400) | **"Normal Service"** | Elevator out since 10:18 today |

Reproduce it yourself — no API key needed:

```bash
curl -s "https://www.transitchicago.com/api/1.0/alerts.aspx?outputType=JSON&activeonly=true" \
  | jq '.CTAAlerts.Alert[] | select(.Impact=="Elevator Status")'
```

> *"Depending on which elevator is out, it can add anywhere from just a few minutes to a
> half hour to my commute. I've been late to meetings before because of elevator outages."*
> — **Adam Ballard**, policy analyst at Access Living, wheelchair user

## Why nobody has fixed this

It isn't CTA sloppiness. It's broken at three levels:

1. **The GTFS standard cannot name an elevator.** `EntitySelector` has six fields and none
   is `pathway_id`. [google/transit#268](https://github.com/google/transit/issues/268) has
   been open since **April 2021**.
2. **CTA's GTFS-realtime alerts feed is empty.** All 123 entities read "Check for #NN
   alerts." Zero real content. That's the pipe Google and Apple consume.
3. **CTA publishes no `pathways.txt`.** No station interior model, so there's nothing to
   reference even if the standard allowed it.

MBTA is the only US agency that solved this — by **leaving the standard** and inventing
`facilities.txt` with per-elevator IDs. That's the model we're copying.

## What we're building

1. **An elevator registry with stable IDs** for key multi-level stations. CTA names
   elevators only in prose, three different ways: *"the Kimball- and Linden-bound platform
   elevator"*, *"the elevator to/from State Street"*, *"the elevator to/from street at the
   south pedestrian bridge."* We give them identities. **This is the contribution** — the
   missing `pathways.txt`, scoped to where it matters.
2. **A per-station verdict** — ACCESSIBLE / DEGRADED / UNUSABLE — instead of a raw alert feed.
3. **Community photos and reports**, because CTA's outage data is *manually typed by staff*,
   so riders know before the database does.
4. **Haptic arrival alerts** for riders who can't see signage or hear announcements.

## Principles

1. **Nothing about us without us.** Ground features in what disabled riders actually ask
   for. [Access Living](https://www.accessliving.org/) is in Chicago and quoted throughout
   our research.
2. **Keyless core.** Everything accessibility-critical works with no API key. Train Tracker
   is an optional enhancement.
3. **Accessible itself.** An accessibility tool that fails WCAG is a joke. Text-first,
   keyboard-navigable, screen-reader tested, honors `prefers-reduced-motion` and
   `prefers-contrast`.
4. **Never show stale data as fresh.** A stale "elevator working" strands someone. Always
   surface when we last confirmed.

## Start here

| Doc | What's in it |
|---|---|
| [docs/cta-findings.md](docs/cta-findings.md) | **Read first.** What CTA's data can and cannot do, verified live. |
| [docs/api-verification.md](docs/api-verification.md) | Every endpoint and parameter tested end-to-end. |
| [docs/candidates.md](docs/candidates.md) | Ideas we considered and scored, with reasons we rejected some. |
| [docs/decision-framework.md](docs/decision-framework.md) | How we chose, and our automatic disqualifiers. |

## Run the app

A mobile web app (Vite + React + TypeScript) in `src/`. It runs on mock data by default, so
you need no keys to start.

```bash
pnpm install
pnpm dev
```

Open it at phone width. To use live data, copy `.env.example` to `.env` and set
`VITE_USE_MOCKS=false`. CTA endpoints don't allow browser CORS, so `vite.config.ts` proxies
them (`/api/cta/*` for alerts, `/api/traintracker/*` for Train Tracker with the key added
server-side). Production needs the same two routes in a small backend.

| Screen | Path | Code |
|---|---|---|
| Home: destination search, elevator alert banner | `/` | `src/screens/Home.tsx` |
| Route options, step-free first | `/plan?to=` | `src/screens/PlanTrip.tsx` |
| Station guide: entrance to platform | `/trip` | `src/screens/StationGuide.tsx` |
| Platform: next-train countdown, arrival alert | `/trip/platform` | `src/screens/Platform.tsx` |
| On board: stops remaining, "your stop is next" | `/trip/ride` | `src/screens/Ride.tsx` |
| Exit route | `/trip/arrive` | `src/screens/Arrive.tsx` |
| Elevator alerts | `/alerts` | `src/screens/Alerts.tsx` |
| Accessibility preferences | `/settings` | `src/screens/Settings.tsx` |

API clients live in `src/services/`; mock data in `src/data/mock.ts`.

## API keys

**You probably need none.** Everything accessibility-critical is open:

| API | Key? |
|---|---|
| Customer Alerts (elevator outages) | **No** |
| Route Status | **No** — but see the warning below |
| Static GTFS (which stations are ADA) | **No** |
| Train Tracker (arrival predictions) | Yes — [apply here](https://www.transitchicago.com/developers/traintrackerapply/) |

Copy `.env.example` to `.env` if you have a Train Tracker key. `.env` is gitignored.

## ⚠️ Traps that will silently break your code

- **Never use Route Status for accessibility.** Elevator alerts are severity 5 and get
  outranked by everything, so a station with a dead elevator reports "Normal Service."
  Only `alerts.aspx` filtered on `Impact=="Elevator Status"` tells the truth.
- **Never set `accessibility=false`.** It strips elevator alerts entirely (verified: 45→42
  alerts, 3→0 elevator).
- **Single results return an object; multiple return a list.** Same endpoint. Normalize
  every response or you'll crash on single-result queries.
- **There is no historical archive.** Resolved outages vanish permanently. If we want
  reliability stats, we must poll and store starting now.

## What the data cannot do

Stated up front so nobody wastes time:

- ❌ In-station turn-by-turn ("exit via the north elevator") — no `pathways.txt`
- ❌ "Board the car nearest the elevator" — no car-level data; railcars have no GPS
- ❌ Automatic "station fully inaccessible" — requires the hand-built registry
- ❌ Escalator outages — CTA publishes none, despite 176 escalators with worse uptime
- ❌ Repair ETAs — every observed outage says "TBD"
