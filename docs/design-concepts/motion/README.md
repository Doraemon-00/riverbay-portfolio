# Loading and swim motion

Approved prototype motion, exported 22 October 2026. The loader is wired into the app by `src/components/page-loader.tsx`; the logo swim easter egg is on hold.

- **Demo:** [demo.html](demo.html). Serve the repository root (for example `python -m http.server` from the repo folder) and open `/docs/design-concepts/motion/demo.html`; it loads the frames from `public/`.
- **Frames:** `public/assets/riverbay/motion/`. WebP (swim 220 px wide, run 148 px, hop 152 px), about 120 KB in total, plus `meadow-border.webp` for the ground strip. Sliced from Codex's frame sheets (`docs/pdf-concepts/claude/art/rb2-*-sheet.png`, `_INDEX.md` rows 32 to 42) and registered so the animal does not jump between frames.

## Behaviour to keep

| Element | Trigger | Timing | Notes |
|---|---|---|---|
| Beaver swim | Pointer rests on the logo for 250 ms | One 4.2 s pass along the stream under the top bar; frames every 225 ms | Pointer (hover) devices only. Cut at the waterline, small wake. `pointer-events: none`. |
| Loader | A navigation or request still waiting after 250 ms | Stays at least 700 ms once shown; squirrel frames every 105 ms, rabbit every 162 ms; 2.6 s per lap | Sign-in and page transitions. Fast loads show nothing. `role="status"` with a short text such as "Opening your classes…". |
| Reduced motion | `prefers-reduced-motion: reduce` | No swim; loader shows one still squirrel and the text | Required, not optional. |

The frames carry the pose (legs, body); CSS keyframes add only travel and the height of each stride or hop. Do not add squash or stretch on top of the frames.

## On Vercel

The 250/700 ms rule fits Vercel well: cold starts and Supabase round trips make some sign-ins and portfolio openings take a second or more, while warm requests stay fast and show nothing. In Next.js, a route-level `loading.tsx` (or a pending state on the sign-in form) can host the loader; the delay and minimum time still need a small client component so it does not flash.

## In the app

- **Two scenes, chosen at random** each time a loader shows: the squirrel and rabbit across the meadow, or the beaver swimming across a stream. Never the same scene three times in a row. With reduced motion, one still animal.
- **Full screen** (`PageLoader`): sign-in, My classes (top bar and Back to my classes), opening a portfolio from My classes, opening Administration and changing its academic year.
- **Compact strip** (`InlineLoader`, under the domain tabs, page stays visible): domain tabs, previous/next student, the student list and class switching inside a portfolio, including after Save or Discard in the unsaved-changes dialog. Labels name the target, for example "Opening Chinese…" or "Opening Bailey Tan…".
- Timing in the app: shown after 250 ms of waiting, then held at least 900 ms (full screen) or 1.1 s (compact strip). Each lap starts part-way across, so the animals are in view from the first frame.
- Not used for saving, photo uploads, AI drafting or PDF export, which have their own progress messages.
- Next keeps the previous page mounted but hidden for instant Back navigation; the loader resets when its page is hidden so Back never shows a frozen strip.
