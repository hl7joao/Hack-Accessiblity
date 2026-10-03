# CTA data: what's actually there

Verified against live endpoints 2026-10-03, not just read from docs.

## The gap, stated precisely

CTA publishes elevator outages in a timely, auth-free API. That data **dead-ends on
CTA's own website.** It does not reach Google/Apple/Transit, because:

1. CTA's GTFS-realtime alerts feed is **100% placeholder** — 123 entities, every one
   reading "Check for #NN alerts", zero elevator mentions.
2. There is **no adopted GTFS-realtime standard for elevator status.** Elevators are
   pathways with `pathway_id`; service alerts can't reference those.
   GTFS-PathwayUpdates remains an unadopted proposal.

So a rider planning a trip in their normal map app gets **no signal at all** and
discovers the outage on arrival. Google Maps' wheelchair filter uses *static*
`wheelchair_boarding`, so it shows a station as accessible while its only elevator
is broken.

Contrast: NYC's MTA publishes a dedicated elevator API and third parties built
real-time outage maps on it. Chicago has the data and nothing built on it.

## What works, keyless, today

```bash
curl "https://www.transitchicago.com/api/1.0/alerts.aspx?outputType=JSON&activeonly=true" \
 | jq '.CTAAlerts.Alert[] | select(.Impact=="Elevator Status")'
```

- **No API key required.** No documented rate limit.
- `accessibility=true` filter param exists (default true).
- Alerts are near-real-time: one observed 34 minutes old.
- `ServiceType:"T"` + `ServiceId` = GTFS parent station ID (4xxxx). Clean join key.
- Planned vs unplanned via `TBD` (1 = open-ended), `SeverityCSS`, `SeverityScore`
  (elevator alerts score 5).

Static GTFS (68.7MB, no auth): 143 parent stations, **108 accessible, 35 not.**

## Two traps that would silently break the product

1. **Elevator outages do NOT affect station status.** Verified: Chicago (40710) had
   an elevator out since Sept 28 and `RouteStatus` read **"Normal Service."** Severity 5
   is outranked by everything else. Any app using Route Status as its accessibility
   signal shows a broken station as fine. Must query `alerts.aspx` and filter
   `Impact=="Elevator Status"`.
2. **No historical archive.** `recentdays=90` returns only still-active alerts;
   resolved outages vanish. Cannot compute duration/MTTR retrospectively.
   **Start polling on day one** or there's no history by demo time.

## What the data CANNOT do — reject these up front

| Idea | Why impossible |
|---|---|
| In-station turn-by-turn step-free nav | **No `pathways.txt`/`levels.txt`.** Confirmed by listing the 68MB feed: 11 files, neither present. |
| "Board the 3rd car, nearest the elevator" | No car-level data. Railcars have no GPS; `flags` is "not presently in use." |
| "Is the ramp on THIS bus working?" | No per-vehicle equipment field. |
| Which end of platform the elevator is on | `stpDe` is direction, not position. |
| Auto "station fully inaccessible" | Alerts name the elevator **only in prose**. No inventory, no path model. |
| Historical reliability from the API | No archive. Must self-collect. |
| Filter trips by wheelchair access | All 96,025 trips = `1`. Zero signal. |
| Crowding from GTFS-rt | `occupancy_status` absent from all 775 vehicles. |

## The hard part — and the actual contribution

Alerts identify the station cleanly but name the elevator **only in English**:
"the Kimball- and Linden-bound platform elevator", "the elevator to/from State Street".
No elevator ID, no pathway reference. You cannot tell whether a station has a working
alternative path.

So the valuable work is **semantic**: turning that prose into
"**this station is now unusable for you**". That requires a hand-built elevator
inventory for key multi-elevator stations — which is effectively the missing
`pathways.txt`. That hand-built layer IS the contribution.

## Grounding (real quotes, real people)

- **Adam Ballard**, wheelchair user, Access Living policy analyst: *"Depending on which
  elevator is out, it can add anywhere from just a few minutes to a half hour to my
  commute."*
- **Red Line Project**, Dec 2024: *"Commuters discover outages only upon arriving at
  stations... many riders remain unaware until faced with non-functional equipment."*
- CBS Chicago: **1,852 elevator incidents in one year**; Chicago/Brown alone had 52.
- CTA's own uptime metric **excludes scheduled downtime**, so published figures
  overstate lived availability. At ~97% across 173 elevators, ~5 are out at any moment.
- Notification channels are documented as unreliable: the hotline is "often incorrect",
  in-station whiteboards "also are often wrong".
- **Every live outage observed listed restoration as "TBD"** — one out 5 days with no
  estimate. A rider cannot tell whether to wait or reroute.

## Prior art: essentially none

GitHub search for CTA+elevator returned zero maintained projects. Closest is
`PreethaSaha/Accessible_transit_planner` — 2 stars, a Jupyter notebook, last pushed
May 2025. Validates the concept, proves nobody shipped it.

## Honest caveats to state in any pitch

- Outages are **manually entered** by Control Center staff. No API fixes the lag
  between failure and entry — and that lag is what strands people.
- **CTA is already moving.** The new Austin station has an in-station real-time
  elevator monitor. Don't pitch as if CTA is doing nothing.
- No recent (2024-2026) lawsuit against CTA on accessibility was found. The landmark
  is Access Living v. CTA, settled 2001. Don't claim active litigation.

## Implementation gotchas (second verification pass)

- **Use `alerts.aspx`, NEVER `routes.aspx`** for accessibility. Across all 191 station
  entries, `RouteStatus` values were only: Normal Service (111), Service Change (33),
  Planned Work w/Bypass (31), Major Delays (16). **"Elevator Status" never appears.**
- **Single-result queries return an OBJECT, multi-result a LIST.** Handle both — this
  crashed the researcher's script.
- `FullDescription` is HTML inside CDATA — sanitize before rendering.
- Docs say `http://`; use `https://`. Both work.
- **Join key:** Alerts `ServiceId` = GTFS **parent** station ID (`4xxxx`).
  Platform stops are `3xxxx`.
- `type` and `stationid` are mutually exclusive on routes.aspx (verified error).
- **Poll immediately and store.** No backfill exists; every hour not polling is lost data.

## Severity bands

1-19 accessibility/informational (elevator = 5) · 20-39 planned · 40-59 minor ·
60-79 significant · 80-99 major.

Note: elevator alerts are all `special-note`/severity 5 **regardless of planned status**,
so planned-vs-unplanned is NOT a clean boolean for elevators specifically.

## Also unavailable

- **Escalators.** Zero escalator alerts exist, despite CTA running 176 escalators with
  *worse* uptime (90.9-97.4%) than elevators. Matters for ambulatory disabled riders.
- **Repair ETAs.** Every observed alert: `EventEnd: null`, `TBD: 1`. Always "TBD."
- **Rail crowding.** `psgld` is bus-only; no rail equivalent.
- **Broken bus ramps** — a documented stranding cause, exposed nowhere.

## Station count: pick one source

CTA says 110/146 accessible. GTFS says 108/143. Not staleness — the 3-station gap is
stations closed for reconstruction, excluded from the active feed. **State which you use.**

The city portal (`8pix-ypme`) is STALE: it flags Austin Green (41260) and Racine Blue
(40470) as `ada: false` though both are completed ASAP projects. **Prefer GTFS.**

## Prior art — fuller picture (third pass)

The space is NOT empty. Corrections to the earlier "nothing exists" read:

- **EL Tracker** (iOS, v4.6, Sept 2026, 4.92★/83 reviews) is **live and maintained**, with
  elevator-outage push notifications AND VoiceOver support. This is a real competitor.
  **Critical gap from its own reviews: *"It won't help people who need navigation help"* —
  it alerts, it does not route.** That gap is our opening.
- **Elevate Chicago** (Loyola students) — **DEAD.** Delisted from both stores, repo last
  pushed Nov 2022.
- **Elevator Uptime** (elevatoruptime.com) tracks 83 CTA stations and its station list is
  **visibly corrupted by prose parsing**: `"Ashland is"`, `"Racine is"`, triplicate
  `"35th-Bronzeville"`/`"35th-Bronzville"`/`"35th-Bronzeville-IIT"`.
  **Live empirical proof that naive text-scraping fails.** Station-level only.
- **UnlockedMaps** (academic, W4A '23) covered Chicago — **API now returns HTTP 502.**
  Its paper admits: *"none of them provide the data on past elevator outages to the public."*
- **Chi Hack Night has no accessibility/elevator/ADA project** at all.
- **Google's wheelchair-accessible transit** launched 2018 in London/NYC/Tokyo/Mexico City/
  Boston/Sydney — **Chicago not included.** Google's spec page lists `levels.txt` as
  UNSUPPORTED. Apple's iOS 27 transit guide: zero occurrences of "wheelchair"/"elevator"/
  "step-free". Transit App concedes: *"GTFS only has static wheelchair data. But what if
  an elevator at a station breaks...?"* — future work.

## Why this is structurally impossible to fix via the standard

- **GTFS-rt `EntitySelector` has exactly 6 fields** (`agency_id`, `route_id`, `route_type`,
  `trip`, `stop_id`, `direction_id`) — **no `pathway_id`.** An elevator outage is
  *literally not addressable* in the spec.
- [google/transit#268](https://github.com/google/transit/issues/268) — "extend
  EntitySelector to select pathways" — **open since April 2021.** 5+ years.
- **Pathways adoption is ~0.4% industry-wide**: ~18 of ~4,550 GTFS feeds. CTA is not
  among them. **Neither is NYC MTA.**
- **MBTA is the one agency that solved it — by leaving the standard.** Ships
  `pathways.txt`, `levels.txt` AND **`facilities.txt`** (per-elevator IDs), emitting
  `"effect":"ELEVATOR_CLOSURE"` with `"facility":"997"`. All non-standard extensions,
  invented precisely because `EntitySelector` has no `pathway_id`.
  **This is the model to copy.**

## New lead to check on day one

**`https://transitdata.transitchicago.com/`** — a newer **beta GTFS-RT portal**, serving
ServiceAlerts/TripUpdates/VehiclePositions as `.pb` and `.json`. **Key required.**
Registered in no public feed registry (not Mobility Database, not Transitland).
⚠️ Contents unverified — the portal page mentions "elevator" **zero times**.
Check it, but **do not assume it carries elevator data.**

## Verified: the `accessibility` param does what it says

`accessibility=false` dropped the result count 45 → 42, removing **exactly** the 3
elevator alerts. Clean filter.
