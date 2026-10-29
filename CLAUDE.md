# Verbes: notes for Claude Code

Read this first. Keep every reply short: what changed, test results, what Charles must do. Charles has few credits left:
no long explanations, no re-reading large files, no repeated full test runs unless something changed, no long deliberation.
Decide, build, test, report. British English. Precise numbers over hedging.

## What this is
Verbes is Charles's French verb app (static site on GitHub Pages: https://charlesmtrott19-collab.github.io/Verbs/).
Goal: about 30 minutes a day of retrieval practice that builds spoken French (listening and speaking first, reading and
writing second). The app chooses the session; recall, not recognition; seen, recalled and retained are never mixed;
weaknesses drive what comes back; it must be reliable for months, and progress must never be lost.

## Files
- index.html: the whole app (one closure, about 3,900 lines). verbs.js: data only (267 verbs; header documents every field).
- tests/: Node + jsdom harness. tests/lib/load-app.js loads the app; HOOK_NAMES exposes internals to tests.
- tools/make-audio.js: records audio clips with OpenAI on this laptop (the app never calls OpenAI).
- handover/ROADMAP.md: the full audit, decisions D1–D8 and Section 7 phase specs, with status notes per phase.
  It replaces the Claude Doc (Claude Code cannot read it). handover/ is gitignored.

## Commands
- `npm install` once. `npm test`: 86 pass, 4 skipped (the 4 need a real export).
- `VERBES_EXPORT=/path/outside/repo/backup.json npm test`: real-data checks. The backup must never enter the repo.
- `npm run validate` (0 errors, 0 warnings required). `npm run export-forms && python3 tests/reference_check.py`
  (needs `pip install mlconjug3`; 0 mismatches required).
- `node tests/make-golden.js` only for intended changes; report the before/after difference.

## Rules (used for every phase so far)
- No code outside the phase being built. One APP_VERSION bump per phase (next: 6.9, 6.10).
- Read only the functions you change. Exact-text edits in one pass, then the full suite once.
- Every behaviour change gets tests. Tests named "CURRENT (Phase n changes)" are updated in the phase that changes them.
- Saved data: back up first (makeBundle), migrations safe to run twice, check with tests/real-export.test.js.
- Never commit personal data, API keys or backups. Never paste an API key into chat; Charles sets OPENAI_API_KEY himself.
- If you depart from the spec, say why with numbers (example: Phase 3 used Know factor 2.0, not 2.5).
- After each phase: a short status note under that phase in handover/ROADMAP.md, update its "Implementation progress"
  line, and one git commit named "Phase N (vX.Y): ...". Do not push unless Charles asks.

## State (29 Oct 2026, v6.8)
Done: Phases 0, 1, 2, 3, 4, 7 (v6.5), 9 (v6.6), 5 (v6.7), 6 (v6.8); real-export checks pass. Pending: recording the
audio (OPENAI_API_KEY not yet set); Phases 8, 10 (11 optional). Node and Git are in C:\Program Files (add to PATH). Session A notes and departures are under each phase in handover/ROADMAP.md.
