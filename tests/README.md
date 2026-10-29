# Verbes tests

These tests check the app without changing it. They load `index.html` and `verbs.js` in a simulated browser (jsdom) and compare what the app does against what it did when the tests were written. The tests themselves are never loaded by the app, so they do nothing on the live site.

## Setup (once, on a laptop)

1. Install Node.js 18 or later (the LTS version from nodejs.org).
2. In the repository folder, run `npm install`.

## Commands

| Command | What it does | When to run it |
| --- | --- | --- |
| `npm test` | All tests: 79 run, plus 3 that need a real export (about 40 seconds) | After every change, before uploading |
| `VERBES_EXPORT=path/to/backup.json npm test` | Also runs the real-data checks on one of your exported backups. Add `VERBES_OLD_INDEX=path/to/old/index.html` to compare with an earlier version. Keep both files outside the repository: your data must never be committed, because the site is public. | Before deploying a change to scheduling |
| `npm run validate` | Checks verbs.js: the app's own validation plus consistency checks (stems, auxiliaries, agreement, English subjects, sounds-like text). Exits with an error if anything is wrong. | Every time verbs.js changes |
| `npm run validate -- path/to/verbs.js` | Same, on another copy of the file | Before replacing verbs.js |
| `npm run export-forms` then `python3 tests/reference_check.py` | Compares every form with an independent conjugator (needs `pip install mlconjug3`) | When verbs are added or corrected |
| `node tests/make-golden.js` | Rewrites the expected outputs from the current app | Only when a change to tables or planning is intended |

## What the tests pin

- **app.test.js:** the app loads with no errors; all 267 verbs pass validation; the card model (31 cards per irregular verb, 6 for il-only verbs, 1 per regular verb, 2,977 in all); the first day's plan respects the new-card caps.
- **golden.test.js:** full conjugation tables for 11 sample verbs (être, avoir, aller, faire, se souvenir de, s'en aller, parler, finir, vendre, arriver, étudier), and what the planner introduces over 30 days from a fresh start.
- **scheduler.test.js:** every v6.3 scheduling rule, step by step: Know on time and late, Hard, misses on new cards and 1-day reviews, both miss rules, the constants, and randomised invariants (due always after the review day, at most 365 days on, a miss never moves a card up).
- **scheduler-plan.test.js:** at most 120 reviews a day, most at risk first, with new cards paused while any wait; the v6.3 migration; and that after a 7-day break no day goes over 30 minutes.
- **session.test.js:** one Start for the day and one session through both blocks within budget; the old two budgets carried over; a session left from an earlier day closing; To review as recall (2 right days clear a card, Undo restores); the il/ils listening note.
- **real-export.test.js:** (needs `VERBES_EXPORT`) on your real data: opening the app changes no step or due date; a year with a 7-day break never exceeds 30 minutes a day; and the 14-day review forecast for existing cards is within 10% of an earlier version, measured as if reviews were on time and with new cards switched off (so it compares scheduling alone).
- **grading.test.js:** in a real scheduled session and in Library practice: the front of a card offers only Show answer, keys 1, 2 and 3 reveal instead of grading, Hard is graded and logged correctly, a swipe can't grade an unrevealed card, and a first-try miss on a new card leaves it new and due tomorrow.
- **data-safety.test.js:** backups (two imports in a row stay fully restorable; the newest 3 bundles are kept; Import changes nothing if no copy can be kept), a simulated crash between saves never double-advances a card, the review log (one record per first try, Undo removes it, it survives export and import, Reset keeps it), and least-recently-played audio eviction.
- **verb-data.test.js:** (v6.5) impersonal verbs (il only), regular reflexive verbs (elision, être, agreement), the -ger and -cer groups scheduled inside the -er section, hints on the prompt, expressions and families in Learn, and validator checks for the new fields.
- **audio.test.js:** (v6.6) no OpenAI address or key in the app, an old key removed at start-up, a recorded clip for every one of the 2,977 cards in both voices, clips fetched only from audio/ and then kept on the device, Sounded wrong? and the regeneration list, and tools/make-audio.js (estimate first, needs yes, resumable, regenerates only flagged clips).
- **progress.test.js:** (v6.7) cardStatus on one synthetic history per status (lapses, practice and pre-log cards included), the Progress metrics against hand-calculated values from a 60-day log, Progress built in under 200 ms from a year of log with Pace only on request (B2), the same status in the Library row and verb page for 10 verbs, and Library practice logged as practice without touching the schedule (B3).
- **validate.test.js:** today's verbs.js passes, and five deliberate mistakes are each caught.

## When a change is intended

Tests named `CURRENT (Phase n changes)` pin behaviour the audit plans to change. When that phase changes it, update the test in the same commit. For an intended change to tables or planning, run `node tests/make-golden.js`, read the diff of `tests/fixtures/`, and commit it with the change.

## How the loader works

`tests/lib/load-app.js` inlines verbs.js into the page in memory, gives each page its own in-memory IndexedDB (the `fake-indexeddb` package; jsdom has none), and adds one line exposing scheduler internals as `window.__verbesTest`. It never writes to the app files. If either anchor it looks for (the verbs.js script tag, or the `window.__verbes = {` line) changes, it stops with a message saying what to update.

## Recording the audio (tools/make-audio.js)

The app plays clips recorded in advance (audio/manifest.json and audio/<voice>/*.mp3), falling back to the browser voice. Record them on a laptop:

1. `node tools/make-audio.js --dry-run` shows how many clips are missing and the estimated cost. It spends nothing.
2. `OPENAI_API_KEY=sk-... node tools/make-audio.js` records what is missing after you type yes. Stop and rerun at any time; finished clips are kept.
3. Options: `--voices marin,cedar` (the default), `--full` (also every line a play button can say: il · elle · on variants, regular tables, To review's English; about 6.5 times as much), `--regen <file>` (a list exported from Settings › Recorded voices), `--prune` (delete clips the app no longer uses).
4. Commit the audio/ folder with the change. Run it again after adding or correcting verbs.
