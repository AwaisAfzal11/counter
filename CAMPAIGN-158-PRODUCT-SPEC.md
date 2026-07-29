# CAMPAIGN 158 — Product Specification

**A zero-input, self-running obsession dashboard for a 158-day sprint.**

Document version: 1.0
Target stack: React 18 + TypeScript + Tailwind CSS + Vite (PWA)
Audience: an AI developer building this from scratch, with no other context.

---

## 0. Read this first — the one rule

**The user never touches this app to make it work.**

There are no buttons that record progress. No check-ins. No forms. No "mark day complete." No login. No backend. No database.

Every number on this screen is derived from one input: `Date.now()`.

The only interactive elements permitted are **view switchers** (changing which visualization you are looking at). Nothing the user taps ever changes the data.

If you find yourself building a "save" or "log" feature, stop. You have misread the brief.

---

## 1. What this is

A single-screen dashboard that a person opens every morning for 158 consecutive days to feel the pressure of a finite deadline.

It answers four questions instantly:

1. **Which day am I on right now?** → `DAY 3 / 158`
2. **How much of today's working window is left?** → `9h 42m`
3. **How much of the entire campaign is left?** → `2,486 hours`
4. **Where does today sit in the larger structure?** → Week 1 of 23, Act I of V

### The core concept: time as adversary

The previous version of this project had the tagline *"Days complete themselves. Sit back and watch."* **That framing is dead.** It produces a screensaver.

The new framing: **the clock is not your scoreboard, it is your opponent.** Every element is written and colored to make elapsed time feel like something being taken, not something being earned.

Practical consequence — the single most important design rule in this document:

> **Bars drain. They do not fill.**
> Copy reads `9h 42m left`, never `39% complete`.
> The grid burns down from 158 to 0. It does not build up from 0 to 158.

Loss framing produces materially stronger motivational pull than equivalent gain framing. Every readout in this app is loss-framed. Where you must show a completed percentage, pair it with the word **spent** or **unrecoverable**.

### The identity: Napoleonic campaign

The vernacular is military campaign, not productivity app. This is not decoration — it does real work. A "task tracker" is something you use. A "campaign" is something you are *inside of*. The vocabulary makes the 158 days feel like a single continuous operation rather than 158 separate opportunities to fail.

| Concept | App name | Count |
|---|---|---|
| The whole 158 days | **The Campaign** | 1 |
| A chunk (~a month) | **Act** | 5 |
| A week | **Battle** | 23 |
| A day | **March** | 158 |
| Daily 6:00 AM – 10:00 PM | **The March Window** | 16h/day |

---

## 2. Fixed constants

```ts
// src/lib/constants.ts

export const CAMPAIGN = {
  START: '2026-07-27T00:00:00+05:00',  // Monday
  END:   '2027-01-01T00:00:00+05:00',  // exclusive — Dec 31 2026 is the last day
  TOTAL_DAYS: 158,
  TZ_OFFSET_HOURS: 5,                   // PKT — no daylight saving, ever
  WINDOW_OPEN_HOUR: 6,                  // 6:00 AM
  WINDOW_CLOSE_HOUR: 22,                // 10:00 PM
  WINDOW_HOURS_PER_DAY: 16,
  TOTAL_WINDOW_HOURS: 2528,             // 158 × 16
} as const;
```

**Verified facts — do not recompute these wrong:**

- Jul 27, 2026 is a **Monday**.
- Dec 31, 2026 is a **Thursday**.
- Jul 27 → Dec 31 inclusive is exactly **158 days**.
- 158 days = **22 full Mon–Sun weeks + a 4-day final week**. Battle 23 is short (Mon Dec 28 → Thu Dec 31).
- Pakistan Standard Time is a flat **UTC+5** with **no DST**. You do not need date-fns, Luxon, or dayjs. Plain offset arithmetic is correct and sufficient.

### The five Acts

| # | Name | Dates | Days | Index range |
|---|---|---|---|---|
| I | **Mobilization** | Jul 27 – Aug 31 | 36 | 1–36 |
| II | **The Blitz** | Sep 1 – Sep 30 | 30 | 37–66 |
| III | **Attrition** | Oct 1 – Oct 31 | 31 | 67–97 |
| IV | **Breakthrough** | Nov 1 – Nov 30 | 30 | 98–127 |
| V | **The Last March** | Dec 1 – Dec 31 | 31 | 128–158 |

Sum: 36 + 30 + 31 + 30 + 31 = **158**. ✓

Act I absorbs the 5 leftover July days so that Acts II–V align exactly to calendar months. This means **the Act layer doubles as the monthly progress layer** — you do not need a separate "month" concept in the UI.

**Why Act III is named "Attrition":** weeks 10–14 of any long sprint are where motivation collapses. Naming that stretch in advance, before it arrives, converts the slump from *evidence of personal failure* into *scripted terrain that the campaign already anticipated*. When the user hits a bad week in October and the app has been calling it Attrition since day one, the bad week confirms the plan instead of breaking it. Keep this name. It is load-bearing.

---

## 3. The time engine

This is the heart of the app. Get it exactly right; everything else is presentation.

### 3.1 Day index — 1-based, current day counts as in-progress

**This was explicitly called out by the user and is the most common thing to get wrong.**

On Wednesday Jul 29, 2026, the display reads **`DAY 3 / 158`**, because Jul 29 is the third day and it is currently being fought.

It does **not** read `2 / 158` ("two days completed"). Completed days are backward-looking and demotivating; the running day is what the user is standing in.

```ts
const msPerDay = 86_400_000;

// Midnight PKT of the given instant
function pktMidnight(now: Date): number {
  const shifted = now.getTime() + CAMPAIGN.TZ_OFFSET_HOURS * 3_600_000;
  return Math.floor(shifted / msPerDay) * msPerDay - CAMPAIGN.TZ_OFFSET_HOURS * 3_600_000;
}

// 1-based, inclusive of today
const dayIndex = Math.floor((pktMidnight(now) - startMidnight) / msPerDay) + 1;
```

Derived values:

- `daysSealed = dayIndex - 1` — days fully behind you (secondary display only)
- `daysAhead = TOTAL_DAYS - dayIndex` — days after today, still untouched
- `dayIndex` clamps to `[1, 158]`; before start show a pre-campaign state, after end show the archive state

### 3.2 The March Window

The 16-hour block from 6:00 AM to 10:00 PM local time. Three mutually exclusive states:

| State | Condition | Headline | Sub-copy |
|---|---|---|---|
| `DORMANT` | before 6:00 AM | `WINDOW OPENS IN 1h 12m` | `Day 3 has not begun.` |
| `OPEN` | 6:00 AM – 9:59:59 PM | `9h 42m LEFT` | `The window closes at 10:00 PM.` |
| `CLOSED` | 10:00 PM – 11:59:59 PM | `WINDOW CLOSED` | `Day 3 is now unrecoverable.` |

The drain bar shows `windowRemainingMs / (16 × 3600 × 1000)`. It starts full at 6:00 AM and empties to zero at 10:00 PM.

The three-state design gives every day a felt shape: an anticipation phase, a live phase, and a verdict phase. A bar that only exists between 6 and 10 with nothing on either side is emotionally flat.

### 3.3 Battles (weeks)

```ts
// Battle 1 = Jul 27–Aug 2. Weeks run Monday → Sunday.
const battleIndex   = Math.floor((dayIndex - 1) / 7) + 1;   // 1..23
const dayInBattle   = ((dayIndex - 1) % 7) + 1;             // 1..7
const battleLength  = battleIndex === 23 ? 4 : 7;           // Battle 23 is 4 days
```

### 3.4 Campaign hours remaining — the headline pressure number

```
campaignWindowMsLeft =
    (remaining full days after today × 16h)
  + (window time left in today, or 0 if closed/not yet open)
```

As of Wednesday Jul 29 mid-morning this is roughly **2,486 hours**. It ticks down every second and it is the most powerful single element on the page. Render it in tabular monospace so digits do not jitter.

Also show `hoursSpent` as a percentage, always labelled **spent** or **burned** — never "complete."

### 3.5 The tick

**One** `setInterval(fn, 1000)` for the entire application. One source of truth. Everything else consumes it via context.

```
useCampaignClock()  →  {
  now, dayIndex, daysSealed, daysAhead,
  weekday, localTime12h,
  window: { state, remainingMs, elapsedFraction, opensInMs },
  battle: { index, dayInBattle, length, remainingDays },
  act: { index, name, dayInAct, length, remainingDays },
  campaign: { windowMsRemaining, fractionSpent, daysRemaining },
  milestone: Milestone | null,
}
```

Do not create a second interval anywhere. Do not use `requestAnimationFrame` for numbers — a 1-second tick plus CSS transitions handles all smoothness (see §8).

---

## 4. Screen architecture

Mobile-first, single column, `max-width: 480px` centered on larger screens with an optional two-column desktop arrangement at `≥1024px`. Design for a 390px viewport first and treat desktop as the afterthought — this is a phone app that happens to run in a browser.

Vertical order, top to bottom:

```
┌─────────────────────────────────┐
│  LAYER 0   THE HOOK             │  ← above the fold, no scroll
│  LAYER 1   THE MARCH WINDOW     │  ← above the fold
├─────────────────────────────────┤
│  LAYER 2   NESTED PRESSURE      │
│  LAYER 3   THE FRONT (map tabs) │
│  LAYER 4   THE CHRONICLE        │
│  LAYER 5   FIELD DOCTRINE       │
└─────────────────────────────────┘
```

Layers 0 and 1 must both be fully visible on a 390 × 844 viewport with no scrolling. That pair is the entire product for 80% of opens.

---

### LAYER 0 — The Hook

The first thing seen at 7:04 AM before the brain is online. It has to land physically.

**Contents, in order:**

```
                              ● LIVE
        D A Y

           3
        ── / 158 ──

  WEDNESDAY · BATTLE 1 OF 23
  ACT I — MOBILIZATION

  7:04 AM                    2 sealed · 155 ahead
```

**Specification:**

- **`3`** — the largest element on the page by a wide margin. Target `clamp(120px, 34vw, 190px)`, monospace, tight leading, `--bone`. This number is the product.
- **`/ 158`** — roughly 1/6 the size, `--bone-dim`. The denominator should feel like a wall.
- **Context line** — uppercase, letterspaced `0.18em`, ~11px, `--bone-dim`. Weekday first because the weekday is what orients a human.
- **Act line** — same treatment, Act name in `--ember`.
- **Local clock** — **12-hour format with AM/PM**, e.g. `7:04 AM`. Explicitly requested. Never 24-hour. Show seconds only as a subtle low-opacity suffix, or omit them.
- **`2 sealed · 155 ahead`** — small, `--bone-dim`, right-aligned. Present but deliberately quiet.
- **Live dot** — 6px `--signal` circle with a slow 2s pulse. The only always-green thing on the page.

**Do not** put a progress ring around the number. Rings read as gain-framed completion and pull against the drain philosophy.

---

### LAYER 1 — The March Window

The emotional center of the app. Give it the most visual weight after the day number.

```
┌───────────────────────────────────────┐
│  THE MARCH WINDOW          6A ─── 10P │
│                                       │
│  9h 42m                               │
│  left in the window                   │
│                                       │
│  ████████████████████░░░░░░░░░░░░░░   │
│                                       │
│  Opened 6:00 AM        Closes 10:00 PM│
└───────────────────────────────────────┘
```

**Behavior:**

- Bar is **ember-filled on the left, empty on the right**, and shrinks left-to-right as the day burns. Filled = time you still have. Empty = time gone.
- The `9h 42m` figure is large monospace, `--ember`.
- Below 2 hours remaining: the bar and figure shift to a faster 1.2s pulse and the sub-label changes to `the window is closing`.
- In `DORMANT` state the bar is a flat `--gunmetal` track with no fill, and a thin `--signal` line sweeps left-to-right once every 3s to indicate armed-but-not-live.
- In `CLOSED` state the bar is fully empty, rendered in `--ash`, and the card border goes `--ember` at 30% opacity. Copy: `Day 3 is now unrecoverable.`

**Why this is loss-framed and stays that way:** a filling bar rewards the passage of time. A draining bar makes the passage of time cost something. Same data, opposite feeling.

---

### LAYER 2 — Nested pressure

Three stacked drain bars, always visible together, never collapsed behind a tab.

```
TODAY        9h 42m left            ████████░░░░░░
BATTLE 1     5 days left            M T W ○ ○ ○ ○
ACT I        34 days left           ███░░░░░░░░░░░
CAMPAIGN     2,486h left            █░░░░░░░░░░░░░
```

- **Weekday dots for the battle row**: `M T W T F S S`, with elapsed days as filled `--ash` dots, today as a pulsing `--signal` dot, future days as hollow `--bone-dim` rings. Battle 23 renders only 4 dots.
- Every row's right-hand figure is **remaining**, never elapsed.
- The `CAMPAIGN` row is the only place a percentage appears, and it is written as `1.7% burned`.

**Why nested:** the goal-gradient effect (acceleration near a finish line) operates independently at each scale. With four nested horizons, the user is never more than 24 hours from *some* boundary, so the end-of-stretch surge never fully switches off. This is the structural reason to show all four simultaneously rather than one at a time.

---

### LAYER 3 — The Front (visualization tabs)

A segmented control with three views. Swipeable on touch, tappable everywhere. Persist the last-selected tab to `localStorage` — this is the **only** thing that goes to storage in the entire app.

```
┌──────────┬──────────┬──────────┐
│   GRID   │   RING   │  MONTHS  │
└──────────┴──────────┴──────────┘
```

#### 3a. GRID — 158 blocks

GitHub-contribution style. 158 rounded squares, wrapped responsively (~14 per row on a 390px screen).

| Day type | Fill | Border | Note |
|---|---|---|---|
| Elapsed (1 → dayIndex−1) | `--ash` | none | spent, cannot be recovered |
| **Today** (dayIndex) | `--signal` | 1px `--signal` + glow | pulses at 2s; the only green square |
| Future | transparent | 1px `--gunmetal` | potential |
| Act boundary | — | 2px left gap | visual seam between Acts |

Elapsed days are **ash, not green**. This is the central palette decision (see §6) and it is what makes the grid read as burning down rather than filling up.

Thin ember tick marks sit above the grid at days 40, 79, 119 (quarter marks) and every Act boundary.

#### 3b. RING — 158 radial dashes

A circular dial. 158 dashes radiating from a center, one full revolution across the campaign.

- Elapsed dashes: `--ash`, short
- Today's dash: `--signal`, longer, glowing, with a thin sweep hand pointing at it
- Future dashes: `--gunmetal`, short
- Center of ring: the campaign hours remaining, monospace, ember

The sweep hand advances once per day, not per second. Resist animating it continuously — a hand that creeps in real time turns the whole campaign into a clock face and dilutes the daily boundary.

#### 3c. MONTHS — six mini calendars

Jul, Aug, Sep, Oct, Nov, Dec. Weekday-aligned, Monday-first columns.

- Days outside the campaign (Jul 1–26) render at 20% opacity as `--gunmetal` dots
- Elapsed campaign days: `--ash` squares
- Today: `--signal`, pulsing, with a small ember ring
- Future: `--bone-dim` outlines
- Each month header shows the Act it belongs to

---

### LAYER 4 — The Chronicle

Five Act cards, vertically stacked. This is the zoom-out narrative view.

```
┌──────────────────────────────────────┐
│ I    MOBILIZATION                    │
│      Jul 27 — Aug 31 · 36 marches    │
│      ████████░░░░░░░░░░░░  IN PROGRESS│
│      Day 3 of 36                     │
├──────────────────────────────────────┤
│ II   THE BLITZ                       │
│      Sep 1 — Sep 30 · 30 marches     │
│      ░░░░░░░░░░░░░░░░░░░░  AHEAD      │
├──────────────────────────────────────┤
│ III  ATTRITION           ...          │
```

**Three card states:**

- `AHEAD` — dim, `--gunmetal` border, `--bone-dim` text. Feels distant on purpose.
- `IN PROGRESS` — `--ember` border, elevated, live drain bar, brighter text
- `CONCLUDED` — `--signal` left rule + a small seal glyph, otherwise muted

**`CONCLUDED` is the only place green appears at scale, and it happens exactly five times in 158 days.** That scarcity is the entire reason green means anything in this design.

---

### LAYER 5 — Field Doctrine

A single rotating line at the bottom. Changes on day rollover only — **not** on a timer, and not on refresh. One line per day means it becomes "today's line," which gives it weight. A line that shuffles every 8 seconds becomes noise inside a week.

Selection: `DOCTRINE[dayIndex % DOCTRINE.length]` — deterministic, so the same day always shows the same line.

Copy deck in §9.

---

## 5. Automatic events (no input required)

The app has ceremony without interaction. These fire on their own.

| Trigger | Time | Behavior |
|---|---|---|
| **Window opens** | 6:00 AM | Card transitions DORMANT → OPEN. Single ember-to-signal sweep across the bar, 900ms. Headline briefly reads `THE WINDOW IS OPEN`. |
| **Window closes** | 10:00 PM | Bar empties. Card border flares ember once. Copy locks to `Day N is now unrecoverable.` |
| **Day rollover** | 12:00 AM | Day number counts up with a 400ms odometer roll. Today's grid block turns ash; the next block ignites. New doctrine line. |
| **Battle concluded** | Sun 12:00 AM | Weekday dots reset. Toast, 4s: `Battle 4 concluded. 19 battles remain.` |
| **Act transition** | Act boundary midnight | Full-screen takeover, ~5s, dismissible by tap. Old Act name fades to a seal; new Act name types in. `ACT II — THE BLITZ · 30 MARCHES · BEGINS NOW`. |
| **Milestone** | see below | Persistent ember banner above Layer 0 for that full day. |

**Milestone days:**

| Day | Banner copy |
|---|---|
| 10 | `TEN MARCHES. THE CAMPAIGN IS REAL.` |
| 25 | `25 DOWN. 133 AHEAD.` |
| 40 | `ONE QUARTER BURNED.` |
| 79 | `HALFWAY. THE BACK NINE IS WHERE CAMPAIGNS ARE LOST.` |
| 100 | `100 MARCHES. 58 REMAIN.` |
| 119 | `THREE QUARTERS GONE.` |
| 138 | `20 LEFT. NOTHING BANKED, EVERYTHING SPENT.` |
| 148 | `10 LEFT.` |
| 153 | `FINAL BATTLE.` |
| 158 | `THE LAST MARCH.` |

Milestone banners are ember on near-black, full-width, uppercase, letterspaced. They do not animate beyond a slow border pulse.

**Peak-end note:** people judge an extended experience disproportionately by its emotional peak and its ending. The Act transitions and milestone days *are* those peaks. Give them real design attention — they are 15 moments that will define how the user remembers 158 days.

---

## 6. Design system

### 6.1 Palette

Near-black with a single accent is a common look; the specific deviations below are what make this one identifiable. Follow them exactly.

```css
--void:      #07080A;   /* page background */
--iron:      #0E1013;   /* card surfaces */
--gunmetal:  #1A1D22;   /* borders, tracks, future-day outlines */
--ash:       #2E3238;   /* SPENT days — warm-shifted grey, reads as burnt */
--bone:      #E8E4DA;   /* primary text — warm off-white, never #FFF */
--bone-dim:  #7E7A6E;   /* secondary text, labels */
--ember:     #FF5A1F;   /* pressure, drain, loss, urgency — the PRIMARY accent */
--signal:    #2FE36A;   /* live/concluded ONLY — the RARE accent */
```

**Three rules that carry the whole design:**

1. **Ember is the primary accent, not green.** Every drain bar, every countdown, every milestone is ember. The app's dominant emotional color is the color of something burning.
2. **Green is rationed.** `--signal` appears in exactly four places: the live dot, today's square/dash, the weekday "today" dot, and concluded Act seals. That is it. If green is everywhere, green means nothing; if green is rare, the eye hunts for it.
3. **Text is bone, never pure white.** `#E8E4DA` against `#07080A` reads as parchment and field-dispatch rather than terminal, which is the difference between this and every other dark dashboard.

Elapsed days are `--ash`, deliberately warm-shifted. They should read as *scorched*, not as *disabled*.

### 6.2 Typography

| Role | Face | Usage |
|---|---|---|
| Numerals & data | **JetBrains Mono** | every number, clock, countdown. `font-variant-numeric: tabular-nums` is mandatory — non-tabular digits jitter once per second and the jitter is maddening. |
| UI & headings | **Sora** | headings, card titles, body |
| Labels | Sora, 600 weight | uppercase, `letter-spacing: 0.18em`, 10–11px, `--bone-dim` |

Scale (mobile):

```
day-number   clamp(120px, 34vw, 190px)  mono 700  leading .82  tracking -.04em
hero-metric  clamp(38px, 11vw, 54px)    mono 600
card-metric  24px                        mono 600
body         15px                         Sora 400
label        11px                         Sora 600  uppercase  .18em
micro        10px                         mono 500
```

The uppercase letterspaced label style is the connective tissue — it appears above every card and is what makes the interface read as instrumentation rather than a web page.

### 6.3 Layout

- Base unit: 4px. Card padding 20px. Gap between cards 12px.
- Radius: **10px**. Notably tighter than the previous version's 22px — softness undercuts the register. Grid squares get 2px.
- Cards: `--iron` background, 1px `--gunmetal` border, no drop shadows. Depth comes from border contrast, not blur.
- Full-bleed to viewport edges on mobile with 16px horizontal gutter.

### 6.4 Motion

Restrained. Ambient life, no decoration.

| Element | Motion |
|---|---|
| Live dot | 2s opacity pulse, 1 → 0.35 → 1 |
| Today's square/dash | 2s glow pulse, synced to the live dot |
| Drain bars | `transition: width 1000ms linear` — driven by a CSS variable updated once per second |
| Day rollover | 400ms odometer roll on the day number |
| Act transition | 5s full-screen sequence |
| Window ≤ 2h | pulse rate increases to 1.2s |

**No confetti.** The previous version fired green confetti on day rollover. Celebrating the mere passage of time is exactly backwards for a loss-framed app — the day ending is a cost, not an achievement. Remove it entirely.

Wrap all of the above in `@media (prefers-reduced-motion: reduce)`, where every animation resolves to a static end state.

### 6.5 The signature element

If the app is remembered for one thing, it should be **the March Window draining in ember while the day number sits above it in bone**. That pairing — a huge static number over a visibly emptying bar — is the whole thesis in one glance. Spend the design budget there and keep everything below it quiet.

---

## 7. Component architecture

```
src/
├── main.tsx
├── App.tsx
├── lib/
│   ├── constants.ts          // CAMPAIGN, ACTS, DOCTRINE, MILESTONES
│   ├── time.ts               // pure functions, fully unit-testable
│   └── format.ts             // formatTime12h, formatDuration, formatHours
├── hooks/
│   ├── useCampaignClock.ts   // THE single setInterval
│   └── useTabPersistence.ts  // localStorage — the only storage in the app
├── context/
│   └── ClockContext.tsx      // provides clock state to the whole tree
└── components/
    ├── layer0/  HeroCounter, LiveDot, LocalClock, MilestoneBanner
    ├── layer1/  MarchWindow, DrainBar
    ├── layer2/  NestedPressure, PressureRow, WeekdayDots
    ├── layer3/  FrontTabs, GridView, RingView, MonthsView
    ├── layer4/  Chronicle, ActCard
    ├── layer5/  FieldDoctrine
    └── events/  ActTransition, Toast
```

### Data flow

```
setInterval(1s)
   └→ useCampaignClock
        └→ ClockContext.Provider
             ├→ HeroCounter        (re-renders 1×/sec — cheap, one number)
             ├→ MarchWindow        (re-renders 1×/sec — cheap)
             ├→ NestedPressure     (re-renders 1×/sec — cheap)
             ├→ GridView   ← memo, deps: [dayIndex] only
             ├→ RingView   ← memo, deps: [dayIndex] only
             ├→ MonthsView ← memo, deps: [dayIndex] only
             └→ Chronicle  ← memo, deps: [actIndex, dayInAct]
```

`lib/time.ts` must be pure — it takes a `Date` and returns derived state with no side effects. This makes the entire engine testable by passing in a fake date, which you should do (see §11).

---

## 8. Performance requirements

**The trap:** 158 grid squares + 158 ring dashes + 6 calendar months = ~470 DOM nodes. If any of them re-render on the 1-second tick, mid-range Android phones will drop frames continuously, the battery will drain, and the "alive" feeling turns into a stutter.

**Rules:**

1. `GridView`, `RingView`, `MonthsView` and `Chronicle` are wrapped in `React.memo` and depend on **`dayIndex` only** — never on `now`. They re-render once per day.
2. Only **today's** node subscribes to the per-second tick, and even then its pulse is a pure CSS animation with no JS involvement.
3. Smooth bars are driven by a CSS custom property set once per second, with CSS interpolating between ticks:
   ```tsx
   <div style={{ '--fill': `${pct}%` }} />
   /* .bar__fill { width: var(--fill); transition: width 1000ms linear; } */
   ```
   This gives visually continuous motion at 1 state update per second.
4. `content-visibility: auto` on Layers 3–5.
5. No animation library. Everything here is achievable with CSS keyframes and transitions; a physics library is dead weight for this motion vocabulary.

**Targets:** ≤16ms scripting per tick, 60fps scroll on a mid-range Android, <150KB gzipped JS, first paint under 1.2s on 4G.

---

## 9. Copy deck

### Voice

Terse. Declarative. Second person or no person. Present tense. No exclamation marks. No emoji. The app never congratulates and never scolds — it **reports**.

**Banned strings** (explicitly rejected — do not reintroduce under any wording):

- `Next day fills in…`
- `Cycle ends in…`
- `Days complete themselves.`
- `Sit back and watch.`
- Anything of the form `N days done` as a primary display
- Anything of the form `N% complete` without the word *spent* or *burned*

### Field Doctrine lines

These are **original lines written for this app**. Do not attribute them to any real person. If you want verified quotations from historical or living figures, source them yourself and attribute them precisely — an invented quotation attached to a real name is worse than no quotation.

```
Ground can be retaken. The hour cannot.
The plan is not the work. The hour is the work.
Every campaign is decided before anyone notices it was decided.
Speed is the only advantage that cannot be bought.
Rest is a position, not a retreat. Know which one you are in.
Momentum compounds. So does its absence.
The window does not care whether you are ready.
There are 158 of these. This is one of them.
Difficulty is the terrain, not the verdict.
Ambition without a clock is a hobby.
Nobody is coming. That is the whole advantage.
The enemy is not the work. The enemy is the hour after the work.
Small days, taken consecutively, are indistinguishable from genius.
The campaign is not won on the good days.
You are not behind. You are here. Move.
Obsession is just consistency with the excuses removed.
Half-measures cost the same hours as whole ones.
The record is being written whether or not you are writing it.
There is no version of this that does not require today.
Discipline outlives motivation by about nine days.
Act as if the deadline were fixed. It is.
The only unrecoverable resource is the one on the bar above.
```

### Interface strings

```
window.dormant.title    WINDOW OPENS IN {duration}
window.dormant.sub      Day {n} has not begun.
window.open.sub         The window closes at 10:00 PM.
window.closing.sub      The window is closing.
window.closed.title     WINDOW CLOSED
window.closed.sub       Day {n} is now unrecoverable.

pressure.today          {duration} left
pressure.battle         {n} days left
pressure.act            {n} days left
pressure.campaign       {hours}h left · {pct}% burned

toast.battle            Battle {n} concluded. {r} battles remain.
transition.act          ACT {roman} — {NAME} · {n} MARCHES · BEGINS NOW

chronicle.state.ahead      AHEAD
chronicle.state.active     IN PROGRESS
chronicle.state.concluded  CONCLUDED

campaign.pre            The campaign begins {date}.
campaign.over           158 marches. The campaign is closed.
```

---

## 10. Edge cases

| Case | Behavior |
|---|---|
| Before Jul 27, 2026 | Pre-campaign screen: countdown to start, Chronicle visible with all Acts `AHEAD`, grid fully hollow. |
| After Dec 31, 2026 | Archive state: `158 / 158`, all squares ash, all Acts `CONCLUDED`, hours remaining `0h`. Nothing pulses. |
| Device clock in another timezone | All campaign math uses fixed UTC+5. The Layer-0 clock displays **device-local** 12-hour time, labelled with the timezone abbreviation, so a user who travels sees both truths without the day counter shifting. |
| Tab backgrounded for hours | `visibilitychange` listener forces a full recompute on return. Never rely on interval accumulation to stay accurate. |
| Device asleep across midnight | Same recompute path. On wake, if `dayIndex` changed, run the rollover animation once. |
| System clock manually changed | Recompute and re-render. Do not attempt to detect or prevent tampering. |
| Offline | Fully functional. There is no network dependency after first load. |

---

## 11. Build checklist

**Correctness**
- [ ] `DAY 3 / 158` on Wed Jul 29, 2026 — current day counts as in progress, not as completed
- [ ] Clock displays 12-hour format with AM/PM
- [ ] Window drains 6:00 AM → 10:00 PM and shows *remaining*, not elapsed
- [ ] Battle 1 = Jul 27–Aug 2; Battle 23 = Dec 28–31 and renders only 4 weekday dots
- [ ] Act boundaries land on days 36/37, 66/67, 97/98, 127/128
- [ ] Unit tests for `lib/time.ts` at: campaign start, 5:59 AM, 6:00 AM, 9:59 PM, 10:00 PM, 11:59 PM, midnight rollover, each Act boundary, final day
- [ ] Grid, ring and calendar all report the same `dayIndex` at every instant

**Behavior**
- [ ] Zero controls that alter data — view switching only
- [ ] Only one `setInterval` in the entire codebase
- [ ] Heavy views memoized on `dayIndex`, verified with React DevTools profiler
- [ ] `visibilitychange` recompute confirmed after backgrounding

**Design**
- [ ] Layers 0 and 1 fully visible on 390 × 844 with no scroll
- [ ] `--signal` green appears in only four contexts
- [ ] Every progress element drains; none fill
- [ ] Tabular numerals everywhere — no digit jitter on the tick
- [ ] No confetti anywhere
- [ ] `prefers-reduced-motion` honored on every animation
- [ ] Visible keyboard focus rings on the three tabs

**Delivery**
- [ ] PWA installable — manifest, icons, standalone display, `--void` theme color
- [ ] Service worker caches the shell; works fully offline
- [ ] Tested on a real phone at 6:00 AM and 10:00 PM to verify state transitions

---

## 12. Out of scope for v1

Do not build these. They are recorded here only so the architecture leaves room.

- Any form of manual logging, check-in, or day-sealing
- Accounts, sync, backend, analytics
- Notifications or push
- Points, badges, levels, or streak rewards — extrinsic reward schedules can erode the intrinsic drive this app exists to amplify. Keep every reward *representational* (the record looks a certain way) rather than transactional (you earned a thing).
- Theming or customization. One campaign, one look.

### One note, recorded and set aside

A purely time-derived dashboard can generate **pressure** — finitude, structure, narrative, the felt cost of an hour. It cannot generate **feedback**, because it has no idea what you did. The gap between the two is real, and around week 6 the display may start to feel like weather: true, ambient, and no longer directive.

The minimum fix, if that ever happens, is one tap per day — three buttons at 10:00 PM, `WON / HELD / LOST` — which would let the grid record outcomes instead of only elapsed time, and would let a *Work Track* diverge visibly from the *Time Track*. That divergence is the strongest motivational mechanism available to a tracker of this kind.

It is explicitly excluded from v1 per the brief. Build `lib/time.ts` as a pure function of `now` and keep the grid's color logic in a single `getDayState(dayIndex)` function, and adding it later is a two-hour job rather than a rewrite.
