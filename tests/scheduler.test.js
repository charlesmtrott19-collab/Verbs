// The scheduler's rules (applyResult, lapseStep, relapse, the daily review cap), pinned exactly.
// v6.1 (Phase 1): a miss never moves a card up; misses on new cards and 1-day reviews stay put, due tomorrow.
// v6.3 (Phase 3): gaps count from the last review; Know, Hard and Don't know; misses drop back in proportion;
//                 at most REVIEW_CAP reviews a day, most at risk first.
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadApp, plain } = require("./lib/load-app");

let app, S;
const D = "2026-11-02";
const day = n => S.addDays(D, n);
const fresh = () => ({ step: 0, enc: 0, due: D, intro: D });
const pick = (e, ...ks) => Object.fromEntries(ks.map(k => [k, e[k]]));

test.before(async () => { app = await loadApp(); S = app.internals; });
test.after(() => app && app.close());
test.beforeEach(() => S.setSetting("lapse", "on"));

test("ladder constants (starting values to test)", () => {
  assert.deepEqual(plain(S.OFFSETS), [1, 3, 7, 14, 30, 60, 180]);
  assert.deepEqual(plain(S.GAPS), [1, 2, 4, 7, 16, 30, 120]);
  assert.equal(S.LT_GAP, 180);
  assert.deepEqual(plain(S.LADDER), [1, 2, 4, 7, 16, 30, 120, 180]);
  assert.equal(S.GOOD_FACTOR, 2.0); assert.equal(S.HARD_FACTOR, 1.2); assert.equal(S.MAX_GAP, 365);
  assert.deepEqual(plain(S.LAPSE_TO), [0, 1, 1, 1, 2, 4, 5, 6, 6]);
  assert.equal(S.REVIEW_CAP, 120);
});

test("Know every time, on time: reviews land about where the old fixed ladder put them", () => {
  // Old ladder from the first-learnt date: 1, 3, 7, 14, 30, 60, 180, 360, then +180.
  // New, counting 2 x the gap since the last review within the ladder's range: 1, 3, 7, 15, 31, 63, 183, 423, then +365.
  const e = fresh();
  const expectDue = [1, 3, 7, 15, 31, 63, 183, 423, 788];
  const expectDir = ["en-fr", "fr-en", "en-fr", "fr-en", "en-fr", "fr-en", "en-fr", "fr-en", "en-fr"];
  let when = D;
  expectDue.forEach((n, i) => {
    S.applyResult(e, true, when);
    assert.equal(e.due, day(n), `after Know ${i + 1}`);
    assert.equal(e.step, Math.min(8, i + 1));
    assert.equal(e.dir, expectDir[i]);
    assert.deepEqual(pick(e, "enc", "lastDate", "last"), { enc: i + 1, lastDate: when, last: "pass" });
    when = e.due;
  });
});

test("Know after a late review earns a longer gap, up to the ladder gap two steps on", () => {
  const e = { step: 3, enc: 3, intro: D, lastDate: day(3), due: day(7) };   // given a 4-day gap
  S.applyResult(e, true, day(20));                                          // right, 13 days late (17 since last)
  assert.deepEqual(pick(e, "step", "due"), { step: 4, due: day(50) }, "2 x 17 = 34, capped at the 30-day ladder gap");
  const f = { step: 3, enc: 3, intro: D, lastDate: day(3), due: day(7) };
  S.applyResult(f, true, day(9));                                           // 2 days late (6 since last)
  assert.equal(f.due, day(21), "2 x 6 = 12 days");
});

test("Know is never shorter than the ladder gap, even when early", () => {
  const e = { step: 4, enc: 4, intro: D, lastDate: day(10), due: day(17) };
  S.applyResult(e, true, day(11));                                          // reviewed early (1 day since last)
  assert.deepEqual(pick(e, "step", "due"), { step: 5, due: day(27) }, "the 16-day ladder gap");
});

test("Hard: stays on its step; gap 1.2 x the days since the last review; a new card goes to step 1", () => {
  const n = fresh();
  S.applyResult(n, "hard", D);
  assert.deepEqual(pick(n, "step", "due", "last"), { step: 1, due: day(1), last: "hard" });
  const e = { step: 4, enc: 4, intro: D, lastDate: day(10), due: day(17) };
  S.applyResult(e, "hard", day(20));                                        // 10 days since last
  assert.deepEqual(pick(e, "step", "due", "last"), { step: 4, due: day(32), last: "hard" });
});

test("a miss on a new card or at the 1-day review keeps it where it is, due tomorrow", () => {
  const e = fresh();
  S.applyResult(e, false, D);
  assert.deepEqual(pick(e, "step", "due", "last", "enc"), { step: 0, due: day(1), last: "miss", enc: 1 });
  S.applyResult(e, true, day(1));
  assert.deepEqual(pick(e, "step", "due"), { step: 1, due: day(2) }, "then Know gives the 1-day step");
  const f = { step: 1, enc: 1, intro: D, lastDate: D, due: day(1) };
  S.applyResult(f, false, day(1));
  assert.deepEqual(pick(f, "step", "due"), { step: 1, due: day(2) });
  S.applyResult(f, true, day(2));
  assert.deepEqual(pick(f, "step", "due"), { step: 2, due: day(4) });
});

test("In proportion: a miss drops the card to a gap about a quarter of the one it failed at", () => {
  // step k was given LADDER[k-1] days; it goes back to step LAPSE_TO[k], due LADDER[that step - 1] days later.
  const cases = [[2, 1, 1], [3, 1, 1], [4, 2, 2], [5, 4, 7], [6, 5, 16], [7, 6, 30], [8, 6, 30]];
  cases.forEach(([k, toStep, gap]) => {
    const e = { step: k, enc: k, intro: D, lastDate: D, due: day(50) };
    S.applyResult(e, false, day(50));
    assert.deepEqual(pick(e, "step", "due", "last"), { step: toStep, due: day(50 + gap), last: "miss" }, `miss at step ${k}`);
    assert.equal(e.intro, D, "the first-learnt date is kept");
  });
});

test("Gentle: one step back", () => {
  S.setSetting("lapse", "gentle");
  const e = { step: 5, enc: 5, intro: D, lastDate: day(14), due: day(30) };
  S.applyResult(e, false, day(30));
  assert.deepEqual(pick(e, "step", "due"), { step: 4, due: day(37) });
});

test("invariants: due always after the review day, never more than 365 days on; a miss never moves a card up", () => {
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  ["on", "gentle"].forEach(mode => {
    S.setSetting("lapse", mode);
    for (let run = 0; run < 200; run++) {
      const e = fresh();
      for (let i = 0; i < 15; i++) {
        const when = S.addDays(e.due, Math.floor(rnd() * 40) - 3);       // a little early, on time, or up to 36 days late
        if (e.lastDate && when <= e.lastDate) continue;
        const r = rnd(), grade = r < 0.15 ? false : r < 0.3 ? "hard" : true, before = e.step;
        S.applyResult(e, grade, when);
        assert.ok(e.due > when, `${mode}: due ${e.due} not after ${when}`);
        assert.ok(S.dayDiff(when, e.due) <= 365);
        assert.ok(e.step >= 0 && e.step <= 8);
        if (grade === false) assert.ok(e.step <= Math.max(before, 0));
        if (grade === "hard") assert.ok(e.step === Math.max(1, before));
      }
    }
  });
});

test("a saved miss rule of Off (removed in v6.1) loads as In proportion", async () => {
  const old = await loadApp({ localStorage: { "frverbs.settings": JSON.stringify({ schema: 1, lapse: "off" }) } });
  try { assert.equal(old.verbes.settings.lapse, "on"); } finally { old.close(); }
});
