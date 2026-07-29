# CAMPAIGN 158

A zero-input, self-running dashboard for a 158-day sprint: **Jul 27 2026 → Dec 31 2026**.

Every number on the screen is derived from one input — `Date.now()`. There is no login, no
backend, no database, and nothing to record. The only interactive control is the visualization
switcher, and it never changes data.

Bars drain, they do not fill. The grid burns down from 158 to 0.

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
├── lib/constants.ts   CAMPAIGN, ACTS, DOCTRINE, MILESTONES
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
- **`getDayState()` is the single source of colour truth** for every day-shaped node.

## One deviation from the spec

§3.4 words today's contribution to campaign hours as "0 if closed/**not yet open**". Scoring a
dormant window as zero makes the campaign total jump *up* by 16 hours at 6:00 AM every morning —
a bar that refills each dawn, which is the one thing this app must never do. A dormant day
therefore counts as a whole unspent window. The formula is unchanged once the window opens, so
the spec's worked example (~2,486h on day 3 mid-morning) still holds.

## Not built, on purpose

No logging, check-ins, accounts, sync, notifications, points, badges, streaks, theming — and no
confetti. Celebrating the passage of time is backwards for a loss-framed app.
