# CAMPAIGN 158

A zero-input, self-running dashboard for a 158-day sprint: **Jul 27 2026 → Dec 31 2026**.

Every number on the screen is derived from one input — `Date.now()`. There is no login, no
backend, no database, and nothing to record. The only interactive control is the visualization
switcher, and it never changes data.

Bars drain, they do not fill. The grid burns down from 158 to 0.

## The five blocks

The 16-hour window is not one slab. It is five named blocks that tile 6:00 AM → 10:00 PM
with no gap, because a gap is an hour the app quietly forgives:

| # | Block | Span | Hours | Bar treatment |
|---|---|---|---|---|
| 1 | FIRST LIGHT | 6:00 — 9:00 AM | 3 | `dawn` — dim at 6, solid by 9 |
| 2 | THE MAIN ASSAULT | 9:00 AM — 2:00 PM | 5 | `ribs` — ruled columns |
| 3 | THE PIVOT | 2:00 — 3:00 PM | 1 | `hatch` — the bar's highest frequency |
| 4 | SECOND PUSH | 3:00 — 6:00 PM | 3 | `bands` — stacked horizontally |
| 5 | LAST WATCH | 6:00 — 10:00 PM | 4 | `dusk` — solid at 6, thinning to 10 |

Segment width is proportional to the block's hours, so the 1-hour Pivot is visibly a sliver
and the 5-hour Assault is visibly the day's main ground. Each segment drains toward its own
right edge, so burnt time sweeps left → right across the bar exactly as the clock does.

Every block is accounted for by name in the ledger, and each seals with a named toast — five
reminders a day that something just became unrecoverable. The campaign holds 790 of them
(158 × 5); the counter steps down five times a day and never once goes up.

## Commands

```bash
npm run dev
```

| Command | Does |
|---|---|
| `npm run dev` | Vite dev server on :5173 |
| `npm run build` | Typecheck + production build + service worker |
| `npm run preview` | Serve the built app (the only way to exercise the PWA) |
| `npm test` | Unit tests for the time engine |
| `npm run icons` | Regenerate `public/` icons from the palette |

## Structure

```
src/
├── lib/constants.ts   CAMPAIGN, BLOCKS, ACTS, DOCTRINE, MILESTONES
├── lib/time.ts        the engine — pure, fully unit-tested
├── lib/format.ts      12h clock, durations, hours, percentages
├── hooks/             the single setInterval; the only localStorage write
├── context/           clock state for the tree
└── components/        layer0 … layer5, events
```

`lib/time.ts` takes a `Date` and returns derived state with no side effects, so the whole engine
is testable by passing a fake instant — see `src/lib/time.test.ts`.

## Rules the code depends on

- **One `setInterval`**, in `useCampaignClock`. Everything else consumes it via context.
- **Heavy views are memoized on `dayIndex`** — grid, ring, calendar and chronicle re-render once
  per day, never on the tick. Bars move via a CSS custom property set once per second with CSS
  interpolating between ticks.
- **All campaign math is fixed UTC+5** (PKT, no DST). The Layer-0 clock shows *device-local*
  12-hour time with its timezone label, so travelling never shifts the day counter.
- **`getDayState()` is the single source of colour truth** for every day-shaped node —
  grid, ring, calendar and the battle-week cells. **`getBlockState()` is its twin** for every
  block-shaped node: bar segments and ledger rows. A block cannot read sealed in one place
  and ahead in another.

## Two additions beyond the spec

The spec treats the window as one 16-hour slab and Layer 2 as four stacked pressure rows.
Both were changed on request:

- **The window is subdivided into the five blocks above**, with a segmented, per-block bar.
- **Layer 2 is now the current battle alone** — the Block and Today rows were removed as
  duplicates of Layer 1, and the week is given a full card: a large days-left figure, the
  battle's date range, and a cell per day carrying its campaign number.

## One deviation from the spec

§3.4 words today's contribution to campaign hours as "0 if closed/**not yet open**". Scoring a
dormant window as zero makes the campaign total jump *up* by 16 hours at 6:00 AM every morning —
a bar that refills each dawn, which is the one thing this app must never do. A dormant day
therefore counts as a whole unspent window. The formula is unchanged once the window opens, so
the spec's worked example (~2,486h on day 3 mid-morning) still holds.

## Not built, on purpose

No logging, check-ins, accounts, sync, notifications, points, badges, streaks, theming — and no
confetti. Celebrating the passage of time is backwards for a loss-framed app.
