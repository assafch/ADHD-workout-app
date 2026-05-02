# Handoff: ADHD Strength PWA — Visual Refresh + PR System

## Overview

A mobile-first PWA helping an adult with ADHD stick to a dumbbell-only strength program. The whole UX is engineered around **minimum cognitive friction**: one decision on screen at a time, big tap targets, instant feedback, and a "bad day" mode where doing one set still counts.

This handoff contains a refreshed visual identity (replacing the existing stone+emerald palette), a clearer information hierarchy on Home, three explored "state systems" for the Workout screen, a 1RM PR-breaking system with AI coaching tips, and intentional empty/edge states.

---

## About the Design Files

The HTML files in this bundle are **design references** — wireframe prototypes built with React + inline JSX showing intended layout, hierarchy, and behavior. They are NOT production code to copy directly.

Your task is to **recreate these designs in the target codebase's existing environment** (React + Vite + TailwindCSS + react-i18next + Dexie, per the user's stack) using its established patterns. Treat the HTML as a spec, not a starting point. Do NOT bundle html-to-image, react-router replacements, or anything else from the prototype's plumbing — only translate the *visual + interaction* spec into the real app.

---

## Fidelity

**Low-fidelity wireframes** with a hint of the proposed visual system applied. They show:
- Layout structure, hierarchy, and flow
- Color palette directions (use the exact hex values listed under Design Tokens)
- Type pairing and sizing relationships
- Iconography system (geometric glyphs replacing emoji)
- Motion intent (notes, not implementations)

You should:
- Use the layout, copy, and hierarchy as authoritative
- Use the exact color tokens listed below
- Use the exact type scale and font pairing listed below
- Apply your existing TailwindCSS conventions for spacing, breakpoints, etc.
- Pick a real icon library (lucide-react recommended) for the geometric glyphs

---

## Stack & constraints (from user)

- React + Vite + TailwindCSS
- react-router for navigation
- react-i18next for i18n (Hebrew default RTL + English LTR)
- Dexie for offline cache + queued writes
- Service worker for PWA
- Express + Postgres backend (out of scope for this handoff)
- No native, no animations heavier than CSS pulses

**i18n:** All copy lives in `i18n/{he,en}.json`. Numbers always LTR (use a `.ltr-numbers` utility class).

---

## Design Tokens

### Color palette (dark-mode only)

```css
--ink:        #0d0d0e;  /* phone bezel / deepest black */
--bg:         #1c1b1a;  /* app background (warm near-black, replaces stone-950) */
--surface:    #252220;  /* cards, sheets (replaces stone-900) */
--surface-2:  #2a2724;  /* nav, dividers between rows */
--line:       #3a3633;  /* borders, dashed placeholders */
--text:       #f5f1ea;  /* primary text (warm white) */
--text-2:     #c9c2b6;  /* body text */
--text-mute:  #8a8378;  /* meta lines */
--text-dim:   #5a5550;  /* tertiary, very subtle */

--accent:     #d97047;  /* coral — primary CTA, PR meter, active state */
--accent-2:   #a8421f;  /* deeper coral — hover/pressed, sketch annotations */
--accent-glow: rgba(217,112,71,0.20);  /* halo around primary CTA */

--warn:       #d9aa47;  /* amber — offline banner, queued state */
--ai:         #7a6cd9;  /* violet — AI coach tip cards (kept off the orange) */

/* state-shift colors (Workout System 2 only — optional) */
--state-active:  #d97047;
--state-rest:    #9d7ad9;
--state-between: #7ad99d;
```

The palette intentionally drops Tailwind's `stone` and `emerald` for warmer near-black + coral. The single coral accent carries primary CTA, PR meter, "saved ✓", and streak fill — it's the dopamine signal.

### Typography

- **Heebo** (Google Fonts) — full Hebrew + Latin coverage, geometric, friendly. Weights used: 400, 600, 700, 800, 900.
- **JetBrains Mono** (Google Fonts) — every numeral in the app (weight, reps, time, dates, streak count). Reads cleanly mid-lift. Weights: 400, 500, 700.

```css
--font-display: 'Heebo', system-ui, sans-serif;
--font-mono:    'JetBrains Mono', ui-monospace, monospace;
```

**Type scale:**

| Use | Family | Size | Weight | Letter-spacing |
|---|---|---|---|---|
| Day-name hero (PUSH/PULL/LEGS) | Heebo | 78px | 900 | -1px (he) / -3px (en) |
| Streak number | JetBrains Mono | 96px | 900 | -3px |
| Lift weight (active set) | JetBrains Mono | 84-110px | 900 | -3 to -4px |
| Rest timer | JetBrains Mono | 110-130px | 900 | -4px |
| Section title | Heebo | 32-38px | 900 | -1.5px |
| CTA label | Heebo | 21-24px | 800 | 0 |
| Body | Heebo | 13-14px | 400-600 | 0 |
| Meta (numbers/units) | JetBrains Mono | 11-13px | 500-700 | 0 |
| Eyebrow caps | Heebo | 11px | 700 | +2px tracking |

**Numerals always LTR** even inside RTL paragraphs — wrap in `<span class="ltr-numbers">` (`direction: ltr; unicode-bidi: isolate;`).

### Spacing

Standard Tailwind scale. Specific recurring values:
- Page padding: `p-6` (24px) — keeps existing `max-w-md mx-auto p-6` shell.
- Card padding: `p-4` to `p-5` (16-20px).
- Tap-target minimum: `min-h-[44px]`.
- Primary CTA height: `h-22` (88px) — the "Start workout" / "Set done" button.
- Sticky CTA bottom inset: `bottom-4` (16px), full-width minus 16px gutters.

### Border radius

| Use | Value |
|---|---|
| Primary CTA | `rounded-3xl` (24px) |
| Cards / sheets | `rounded-3xl` (24px) or `rounded-[28px]` for hero card |
| Secondary buttons | `rounded-2xl` (20px) |
| Pills / chips | `rounded-full` |
| Bottom sheet top | `rounded-t-[32px]` |
| Phone-pebble feel | err larger, not smaller |

### Shadows / glows

- Primary CTA glow: `shadow-[0_0_0_6px_rgba(217,112,71,0.20)]` — concentric halo, NOT drop shadow.
- Streak hero halo: `shadow-[0_0_0_18px_rgba(217,112,71,0.08),0_0_0_38px_rgba(217,112,71,0.04)]`.
- Sticky CTA "pressed" effect: `shadow-[0_8px_0_#a8421f]` (chunky offset, no blur).

### Iconography

Replace all emoji (🛏️ 🚶 ⚙️ 🏆) with **lucide-react** icons OR mono-glyphs. Keep weight and scale uniform.

| Emoji | Glyph | Lucide name |
|---|---|---|
| 🏋️ | ▮ | `dumbbell` |
| 🛏️ / rest | ○ | `moon` or `bed` |
| 🏆 / PR | △ | `trophy` or `triangle` |
| 📊 / history | ▦ | `bar-chart-3` |
| 🏠 | ⌂ | `home` |
| ⚙️ | ⚙ | `settings` |
| ◐ / offline | ◐ | `cloud-off` |
| 🔥 / streak | ▲ | `flame` |

Recommendation: **lucide-react with consistent `size={20}` and `strokeWidth={2}`** in nav, `size={28}` and `strokeWidth={2.5}` for hero placements.

---

## Screens / Views

### 1. Home

**Purpose:** Glanceable entry point. User opens the app and starts today's workout in one tap.

**Three explored directions** (the user has not picked yet — present all three or default to **Direction A · day-name as identity** which the design lead recommended).

#### Direction A · Day-name as identity (recommended)

- Greeting line at top (small, muted): `Good morning, Yoav` / `בוקר טוב, יואב`
- **Eyebrow:** `TODAY · יום 12` (uppercase, +2px tracking, accent color)
- **Day-name hero:** `PUSH` / `דחיפה` — 78px Heebo 900, fills the screen horizontally. THIS is the visual identity of the day.
- Sub-meta: `4 lifts · ~38 min` (mono, dim)
- **Primary CTA** (88px tall, accent fill, halo glow): `Start workout` / `התחל אימון`
- **Streak strip:** 7 day-dots (rounded squares 26×26), filled coral for completed days, dashed border for upcoming. Today gets a soft halo.
- Streak meta: `4 day streak 🔥` (mono, dim, replace emoji with `<Flame>` icon)
- Preview list: 4 exercises with `3×8` mono meta on each row, hairline dividers
- Bottom nav: 4 mono glyphs (▮ ▦ △ ○), active item bright

#### Direction B · Streak as hero

- Greet + settings glyph
- **Hero card** (gradient `#2a1f1a → #1c1b1a`): 96px coral mono `4`, label `DAY STREAK`, week dots underneath. Subtle halo around current day.
- Today card (smaller, surface bg): `TODAY · Push · 4 lifts ~38 min`
- Two dashed quick-access tiles side by side: bodyweight log + bad-day shortcut
- **Sticky CTA** at bottom: `Start workout →` with chunky `0 8px 0 #a8421f` offset

#### Direction C · One card

- One giant card centered on the screen (28px radius, surface bg)
- All info compressed inside the card: eyebrow + day name + 4-row exercise list + CTA
- Below-fold hint: `↓ adjust, history` (mono, very dim)
- Use when "radical reduction" is the priority

---

### 2. Workout — three state systems

Workout has three states: **Active set** (logging), **Resting** (timer), **Between exercises** (transition). Three different visual systems were explored:

#### System 1 · Layout shift (timer takes over)

- Persistent top: 4-segment progress strip, exercise name, `EX 2/4` meta
- **Active state:** two big "wheel" boxes side-by-side — Weight (12.5) and Reps (8), 56px mono numerals, ▲▼ pickers. Done CTA at bottom.
- **Resting state:** layout collapses. 130px timer numeral centered. Breathing circle (120×120, coral border, multi-step halo). Skip button is a thin outlined secondary at bottom.
- **Between state:** big checkmark + previous exercise name. 38px next-exercise name centered. CTA: `Next →`.

#### System 2 · Color shift (subtle bg + state pill)

- Background changes per state: warm near-black (active) → violet-tinted (rest) → green-tinted (between).
- A small pill at top: `● ACTIVE` / `● RESTING` / `● BETWEEN` in matching color.
- Same layout shape underneath: numbers, CTA. Color is the state cue.
- Risk: more chromatic noise. Use only if state confusion is a real bug.

#### System 3 · Stable layout + microcopy (recommended)

- Persistent top: exercise name + `2/3 · ex 2/4`, then 3-segment progress bar.
- **One eyebrow word changes per state**: `LIFT` / `REST` / `MOVE` (active color)
- The hero numeral always sits in the same spot: weight × reps when active, time when resting, exercise-name when between.
- Three step-indicator dots below to show state.
- CTA always same shape, same place, label flips: `Set done ✓` / `Skip →` / `Next →`.

This is the most ADHD-friendly choice — almost zero spatial change between states means no relearning the screen mid-workout.

---

### 2b. Breaking PRs — 1RM tracking + AI coach

**Three approaches** to encouraging the user to break their 1-rep-max:

#### A · Target bar

- A persistent **PR meter** lives at the top of the workout screen (next to exercise name).
- Shows `1RM 14.5kg` with a horizontal progress bar (gradient coral) representing how close today's set is to breaking the record.
- Beneath the lift numerals: **two equal-weight chips** side-by-side
  - `REPS PATH · +1 · +1 rep` (currently selected, coral border + tinted bg)
  - `WEIGHT PATH · +0.5 · +0.5 kg`
- AI coach tip card below (violet accent — see "AI Coach Tips" section).
- CTA: `Break PR △` with halo.

#### B · Ghost duel (most viscerally motivating)

- A duel card showing two stacked rows:
  - **Past PR row** (faded, dashed border, mono): `PAST PR · 14d ago — 13.5 × 8`
  - **Today row** (coral border, bright): `TODAY — 13.5 × 9?` (the `9?` is coral, the question-mark indicates the not-yet-done rep)
- Helper line: `One more rep breaks it △`
- Below: a row of 9 rep-blocks. 8 are filled coral, the 9th is dashed-empty — visually unfilled means literally beating your past self by filling it.
- AI tip + CTA `Crush it △`.

#### C · Pick path (between-sets decision)

- After completing a set, a screen appears with:
  - Top: `✓ SET DONE` + completed lift summary
  - PR card showing current 1RM (56px mono) + date achieved
  - Prompt: `Pick path ↓`
  - Two giant tappable rows:
    - **Reps path** (coral border, accent-tinted): `13.5 × 9` + `+1 rep`
    - **Weight path** (surface bg, neutral border): `14 × 8` + `+0.5 kg`
- Both are equally celebrated — no hierarchy implies one is "better."
- AI tip below.

#### PR Celebration overlay (when PR is broken)

- Full-takeover overlay with gradient `#1c1b1a → #2a1f1a`
- Handwritten "New PR!" / "שיא חדש!" in Caveat 58px coral, slight rotation (-3°)
- Exercise name (eyebrow tracking)
- **130px mono `14kg`** centered, then `× 8 reps`
- Delta pill: `△ +0.5kg vs past PR`
- AI follow-up tip suggesting next session's target
- CTA: `Continue →`

> **Recommended PR system:** **Variation B (Ghost duel)** is the design's strongest answer to "make me want to break records." The visual unfilled rep slot is a powerful dopamine prompt. Pair it with the celebration overlay.

---

### 3. AI Coach Tips

A small reusable component appearing under PR contexts and at key decision points.

**Anatomy:**
- Container: `rounded-2xl` violet-tinted background `bg-[#7a6cd9]/10` with `border border-[#7a6cd9]/25`
- Avatar circle (22×22): solid violet `#7a6cd9` with `AI` letters in dark ink (11px, weight 800)
- Eyebrow: `COACH TIP` (uppercase, +1.5 tracking, violet color)
- Body: 12px text-2 color, 1.35 line-height

**Voice rules:**
- Short — max 2 sentences, ~140 chars
- Specific — granular numbers ("PR breaks at +0.25kg"), not vague encouragement
- Forgiving — always offers an out ("if not, skip and add a set")
- Never blame the user

**Three flavors used in mocks:**
- **Reps tip:** `Slow on the way down. One more rep is in there.`
- **Weight tip:** `PR breaks at +0.25kg. Take a breath before the set.`
- **Form tip:** `Elbow at 45°. If not — skip and add a set.`

**When to show:**
- After warmup set completed → set strategy tip
- Mid-rest (last 15s of timer) → cue for next set
- After PR break → next-session suggestion
- After 2 missed sets in a row → form check / drop-down suggestion

Use the violet color *only* for AI tips. Never for CTAs. The user reads "coral = my action, violet = advice."

---

### 4. Bad day mode

- Eyebrow: `BAD DAY MODE` (deep coral, +2 tracking)
- Headline (32px Heebo 900): `Show up. That's it.` / `תופיע. זה הכל.`
- Sub: `One set = day saved`
- Three giant 96px-tall buttons stacked:
  1. `One set` + `60 seconds` — **primary** (coral fill)
  2. `Walk` + `10 min` — secondary (surface bg, line border)
  3. `Stretch` + `5 min` — secondary
- Tiny back link at bottom in mono: `← back to normal`

**Critical:** any of the three preserves the streak. The DB write should be a single `bad_day_session` record with type discriminator.

---

### 5. Rest timer (bottom sheet)

- Bottom sheet (460px tall, `rounded-t-[32px]`, surface bg) slides up over the workout screen.
- The screen behind blurs slightly + opacity 25% (use a real `backdrop-blur-sm` and `opacity-25` on a snapshot div, not on the live workout — keeps it performant).
- Drag handle at top (44×4 line).
- Eyebrow: `REST` (coral, tracked).
- **Breathing circle** — 200×200, coral 2px border + concentric `box-shadow` halos at 18px and 38px.
  - Inner dashed ring (1px) at 14px inset for visual rhythm.
  - 58px mono timer centered inside (`1:24`).
- Helper: `inhale … exhale` (very dim, +1 tracking).
- Next preview chip: `next: 12.5kg × 8` (mono, dashed border, inline).

Animation: scale the outer ring `1.0 → 1.06 → 1.0` over 5s ease-in-out infinite, mirror with halo opacity. Single CSS keyframe, no JS.

---

### 6. Edge / Empty states

#### Rest day
- Centered 100×100 dashed circle (line color)
- 28px Heebo 900: `Rest day` / `היום מנוחה`
- Sub: `but if you want...` / `אבל אם בא לך...`
- Outlined coral button (NOT filled — this is opt-in, not the default action): `+ Extra workout`

#### Offline
- Top banner (margin 14px, amber-tinted: `bg-[#d9aa47]/12` `border-[#d9aa47]/30`):
  - `◐ Offline · saving locally` (12px, amber text)
- Workout works as usual underneath.
- A queued-writes pill in the corner: `3 sets queued ↑` (mono, amber-tinted).
- Use Dexie for the queue. Surface count from the table.

---

### 7. Streak system

Four explored treatments — design lead recommends **#1 (week dots)** for daily glance and **#3 (4-week heatmap)** for the History tab:

1. **Week dots (recommended for Home):** 7 dots, current day has soft halo, future days dashed-border-only.
2. **Number + glyph:** 72px coral mono number + small `▲` glyph. Reads as a stat.
3. **4-week heatmap:** 28-cell grid, opacity proportional to volume. Goes on History tab.
4. **Growing weekly bar chart:** sets-per-day this week. Use on Exercise Detail.

---

## Interactions & Behavior

### Global
- **No hover-only states.** Everything is `:active` or focus-visible. Tap targets ≥ 44px.
- **One decision per screen.** Never two equal-weight buttons. If you find yourself wanting two CTAs, split into two screens.
- **CSS-only animations** as user requested. No Framer Motion.

### Home
- Tap CTA → navigate to `/workout/today` (creates session if not started, resumes otherwise).
- Tap streak → `/history` deep-linked to streak view.
- Tap exercise row → preview only (don't start workout). Use it as an at-a-glance check.
- Long-press exercise → quick-edit sheet (target weight/reps for today).

### Workout (System 3 recommended)
- Default action ALWAYS available as the bottom CTA — never gated behind a modal.
- `+ Add set` and `+ Add exercise` are small text links at fixed position. One tap, no confirmation.
- Skip exercise: long-press exercise name → confirms with single button "Skip" — NOT a modal with Cancel. Cancel = tap outside.
- Done set → automatic transition to Rest state with timer pre-populated from exercise config.

### PR system
- 1RM is calculated client-side using **Epley formula:** `weight × (1 + reps / 30)` capped at reps ≤ 12.
- After every set, compare estimated 1RM to recorded PR. If new estimated 1RM > current PR, record it AND trigger the celebration overlay.
- The "two paths" (reps vs weight) are computed, not authored — pick whichever requires the smaller delta.

### AI Coach Tips
- Tips are short; do NOT call the LLM mid-set. Pre-generate at session-start (one call) using a small prompt with: today's plan + last session + current PR + rest-day count. Cache to Dexie.
- Show tips at the rule-based moments listed above.
- Tips fade in (opacity 0 → 1, 200ms) when their trigger fires. No layout shift — reserve the slot.

### Rest timer
- Default rest values per exercise type stored in config.
- Last 15s: timer numeral pulses (scale 1 → 1.04 → 1, 1s loop).
- Tap anywhere on the sheet (except skip) → does nothing. Skip is an explicit secondary button at bottom.
- Service-worker keeps timer running if app is backgrounded. Notify when complete.

### Bad day
- Tapping any of the three buttons writes a single record AND increments the streak counter.
- After completion, route home with a tiny toast: `Day saved ✓` (3s, dismissible).

---

## State management

Use whatever the codebase has (Zustand / Redux / Context). The state shape:

```ts
type WorkoutSession = {
  id: string;
  startedAt: number;
  exercises: ExerciseLog[];
  currentExerciseIndex: number;
  currentSetIndex: number;
  uiState: 'active' | 'resting' | 'between';
  restEndsAt: number | null;
  badDayMode: boolean;
};

type ExerciseLog = {
  exerciseId: string;
  sets: SetLog[];
  targetSets: number;
  targetReps: number;
  targetWeight: number;
};

type SetLog = {
  weight: number;
  reps: number;
  completedAt: number;
  estimated1RM: number;
  brokePR: boolean;
};

type PRRecord = {
  exerciseId: string;
  weight: number;
  reps: number;
  estimated1RM: number;
  achievedAt: number;
};

type StreakState = {
  count: number;
  lastWorkoutDate: string;  // ISO date
  weekDays: boolean[];      // 7 booleans, Sun..Sat
};
```

All writes go through a Dexie-backed mutation queue so offline → online transitions sync cleanly.

---

## i18n

Every string lives in `i18n/{he,en}.json`. The HTML mock has all copy in both languages — copy keys directly from `home-variations.jsx`, `workout-variations.jsx`, `pr-variations.jsx`, `extras-variations.jsx`.

Direction: `<html dir>` switches with language. CSS uses `padding-inline-start` / `margin-inline-end` etc. — never raw `padding-left`. Numerals: wrap every digit run in `<span class="ltr-numbers">`.

---

## Assets

Nothing proprietary in the design. Replace mono-glyphs with **lucide-react**. Replace `Caveat` (handwritten margin notes used in the wireframe) — those are wireframe annotations, not part of the production UI.

Fonts to load: **Heebo** + **JetBrains Mono** from Google Fonts, preconnect + preload `font-display: swap`.

---

## Files in this bundle

- `ADHD Strength Wireframes.html` — main entry; pan/zoom canvas with all sections side-by-side
- `home-variations.jsx` — 3 Home directions (A/B/C)
- `workout-variations.jsx` — 3 workout state systems × 3 states
- `pr-variations.jsx` — 3 PR-tracking variations + celebration overlay + AI tip component
- `extras-variations.jsx` — bad day, rest sheet, streak system, edge states
- `phone-frame.jsx` — phone-bezel wrapper used for layout (NOT for production)
- `design-canvas.jsx`, `tweaks-panel.jsx` — wireframe presentation infrastructure (NOT for production)

To preview: open `ADHD Strength Wireframes.html` in a browser. The Tweaks panel (bottom-right) toggles Hebrew ↔ English to verify bilingual parity.

---

## Build order suggestion

1. Set up tokens (colors, typography, fonts) in Tailwind config + a `tokens.css`.
2. Build the AI Coach Tip component first — it's reused across PR, mid-rest, bad-day cues.
3. Workout System 3 + PR Variation B (ghost duel) + celebration overlay together — that's the core loop.
4. Home Direction A.
5. Bad day, Rest sheet (bottom sheet pattern reused later).
6. Edge states + streak system.
7. History / Exercise Detail / Settings (use the same patterns; not in this handoff).

Ship behind a feature flag if you want to A/B test the new visual against current.
