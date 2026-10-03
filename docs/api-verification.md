# End-to-end API verification — 2026-10-03

Both Customer Alerts endpoints on `lapi.transitchicago.com`, tested with **no key**.
Both returned `ErrorCode: 0` with real data.

## Route Status (`routes.aspx`) — keyless ✅

| Param | Result |
|---|---|
| `type=bus` | 127 entries |
| `type=rail` | 8 entries |
| `type=station` | 191 entries |
| `type=systemwide` | 3 entries |
| `routeid=Red` | **returns an OBJECT, not a list** |
| `type` + `stationid` together | `ErrorCode 104` — mutually exclusive |

## Detailed Alerts (`alerts.aspx`) — keyless ✅

| Param | Total | Elevator |
|---|---|---|
| `activeonly=true` | 45 | 3 |
| `activeonly=false` | 112 | 3 |
| `accessibility=true` (default) | 112 | 3 |
| **`accessibility=false`** | **109** | **0** |
| `planned=false` | 5 | 3 |
| `recentdays=7` | 81 | 3 |
| `stationid=40710` | 2 | 1 |
| `routeid=Red` | 1 | 1 |

**`accessibility=false` removes exactly the elevator alerts** (45→42, 3→0). Never set it
to false. Default is true, so leaving it off is safe.

**`planned=false` is a useful filter**: 45 → 5 alerts, keeping all 3 elevator outages.
Good for a "what's wrong right now that nobody planned" view.

## 🔴 The defect, reproduced live

For every station with an active elevator outage, Route Status **fails to mention it**:

| Station | Route Status reports | Reality |
|---|---|---|
| Chicago (40710) | **"Normal Service"** | Elevator out since **Sep 28** (6 days) |
| Cumberland (40230) | "Service Change" | Elevator out since 08:37 today |
| Roosevelt (41400) | **"Normal Service"**, "Planned Work" | Elevator out since 10:18 today |

A wheelchair user checking Chicago station sees "Normal Service" while the elevator has
been dead for six days. **Only `alerts.aspx` filtered on `Impact=="Elevator Status"`
tells the truth.**

## Code-level gotchas (all reproduced)

1. **Single result → object; multiple → list.** `routeid=Red` returns a dict where
   `type=rail` returns a list. Normalize every response:
   ```python
   if isinstance(x, dict): x = [x]
   ```
2. `type` and `stationid` cannot be combined on routes.aspx (ErrorCode 104).
3. Station-level Route Status returns **one entry per line serving the station**, so
   Roosevelt yields three rows with three different statuses.
4. `http://` works; `https://` also works on `www.transitchicago.com`. Prefer https.
5. `FullDescription` is HTML inside CDATA — sanitize before rendering.

## Keys: what's actually needed

| API | Key | Verified |
|---|---|---|
| Customer Alerts (`alerts.aspx`) | **No** | `ErrorCode 0`, live data |
| Route Status (`routes.aspx`) | **No** | `ErrorCode 0`, live data |
| Static GTFS | **No** | 68.7MB download |
| Train Tracker (`ttarrivals.aspx`) | **Yes** | `errCd 100` without one |

Same host, same path prefix — only Train Tracker is gated.
