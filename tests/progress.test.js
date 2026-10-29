// Phase 5 (v6.7): one status model (3B), metrics from the review log (3C), the Library list (3D), B2 and B3.
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadApp, plain } = require("./lib/load-app");

const T = "2026-12-31";
let n = 0;
const rec = (k, d, g, o = {}) => Object.assign({ id: `t${n++}|${d}|${k}`, d, k, g, step: 3, gap: 1, m: "speak", kind: "form", s: 30, t: n }, o);
async function withApp(fn) { const app = await loadApp(); try { await app.internals.loadLog(); return await fn(app, app.internals); } finally { app.close(); } }
const entry = (step, due = T) => ({ step, due, enc: 1, lastDate: "2026-12-01", intro: "2026-10-01" });

test("cardStatus: one synthetic history per status", () => withApp(async (app, I) => {
  const F = app.verbes.formsched.forms, add = (k, step, recs) => { F[k] = entry(step); return recs; };
  const recs = [].concat(
    add("aller|present|je", 2, [rec("aller|present|je", "2026-12-01", "pass", { gap: 1 }), rec("aller|present|je", "2026-12-04", "pass", { gap: 3 })]),
    add("aller|present|tu", 4, [rec("aller|present|tu", "2026-12-10", "pass", { gap: 7 })]),
    add("aller|present|il", 6, [rec("aller|present|il", "2026-12-20", "hard", { gap: 31 })]),
    add("aller|present|nous", 8, [rec("aller|present|nous", "2026-12-20", "pass", { gap: 61 }), rec("aller|present|nous", "2026-12-24", "pass", { gap: 65, m: "listen" })]),
    add("aller|present|vous", 3, [rec("aller|present|vous", "2026-12-01", "pass", { gap: 31 }), rec("aller|present|vous", "2026-12-10", "miss", { gap: 20, step: 6 })]),
    add("aller|present|ils", 1, [1, 2, 3, 4].map(i => rec("aller|present|ils", `2026-12-1${i}`, "miss", { gap: 2, step: 2 }))),
    add("aller|futur|je", 2, [rec("aller|futur|je", "2026-12-20", "pass", { gap: 40, p: "practice" })]));
  F["aller|imparfait|je"] = entry(7);                              // learnt before the log began
  await app.internals.logDB.merge(recs);
  const st = k => I.cardStatus(k).status;
  assert.equal(st("aller|conditionnel|je"), "new");
  assert.equal(st("aller|present|je"), "learning");
  assert.equal(st("aller|present|tu"), "reviewing");
  assert.equal(st("aller|present|il"), "retained", "Hard counts as right at the first try");
  assert.equal(st("aller|present|nous"), "mastered", "60+ days in both speaking and listening");
  assert.equal(st("aller|present|vous"), "learning", "a lapse starts the climb again");
  assert.equal(I.cardStatus("aller|present|ils").persistent, true);
  assert.equal(st("aller|futur|je"), "learning", "Library practice never counts");
  assert.equal(st("aller|imparfait|je"), "retained"); assert.equal(I.cardStatus("aller|imparfait|je").inferred, true);
  const v = I.verbStatus(app.verbes.verbs.find(x => x.id === "aller"));
  assert.equal(v.status, "learning"); assert.equal(v.tenses.conditionnel, "new"); assert.equal(v.persistent.length, 1);
}));

test("metrics from a synthetic 60-day log match hand-calculated values", () => withApp(async (app, I) => {
  const k = "etre|present|je", days = ["2026-12-05", "2026-12-10", "2026-12-15", "2026-12-20", "2026-12-25", "2026-12-30"], recs = [];
  // 60 reviews in the last 30 days: gap 3 (25, 21 right), gap 10 (20, 17 right), gap 40 (15, 13 right) = 51 of 60 right.
  [[3, 25, 21], [10, 20, 17], [40, 15, 13]].forEach(([gap, nn, ok]) => { for (let i = 0; i < nn; i++) recs.push(rec(k, days[recs.length % 6], i < ok ? "pass" : "miss", { gap })); });
  for (let i = 0; i < 10; i++) recs.push(rec(k, "2026-11-16", "pass", { gap: 70 }));          // 45 days ago: gap chart only
  for (let i = 0; i < 5; i++) recs.push(rec(k, days[0], "pass", { gap: null, step: 0 }));     // a new card's first test: not a review
  for (let i = 0; i < 3; i++) recs.push(rec(k, days[1], "pass", { p: "practice" }));
  await app.internals.logDB.merge(recs);
  const m = I.progressMetrics(T);
  assert.deepEqual(plain([m.rate.n, m.rate.ok]), [60, 51]);                                          // 85%
  assert.deepEqual(plain(m.gaps.map(g => [g.n, g.ok])), [[25, 21], [20, 17], [15, 13], [10, 10]]);
  assert.deepEqual(plain(m.grid["present|je"]), { n: 70, miss: 9 });
  assert.equal(m.practice, 3);
  assert.equal(m.practiceDays, 6);
  assert.ok(Math.abs(m.avgMin - 65 * 30 / 6 / 60) < 1e-9);                                   // 5.4 min
  const h = I.progressHTML(T);
  assert.match(h, /85%<\/b> of 60 reviews/);
  assert.match(h, /not enough data \(10 of 20\)/, "the 60+ bucket needs 20 attempts");
}));

test("Progress renders in under 200 ms with a year of log; Pace runs only when asked (B2)", () => withApp(async (app, I) => {
  const units = app.verbes.verbs.filter(v => v.type === "irregular").slice(0, 40).flatMap(v => I.verbUnits(v)), recs = [];
  for (let d = 0; d < 365; d++) for (let j = 0; j < 120; j++) recs.push(rec(units[(d * 120 + j) % units.length], I.addDays("2026-01-01", d), j % 9 ? "pass" : "miss", { gap: 1 + (j % 70), m: j % 2 ? "listen" : "speak" }));
  await app.internals.logDB.merge(recs);
  const t0 = Date.now(); const h = I.progressHTML(T); const ms = Date.now() - t0;
  assert.ok(ms < 200, `${ms} ms for ${recs.length} records`);
  assert.match(h, /id="paceRun"/); assert.doesNotMatch(h, /will be introduced by/);
  assert.match(I.paceText(), /introduced|more than a year/);
}));

test("Library row, verb page and Progress use the same status for 10 verbs", () => withApp(async (app, I) => {
  const vs = app.verbes.verbs.filter((v, i) => i % 26 === 0).slice(0, 10), F = app.verbes.formsched.forms, recs = [];
  vs.forEach((v, i) => { if (v.type === "irregular") I.verbUnits(v).forEach((k, j) => { F[k] = entry(j % 9); recs.push(rec(k, "2026-12-20", "pass", { gap: [1, 8, 35][i % 3] })); }); else app.verbes.schedule.verbs[v.id] = entry(i % 9); });
  await app.internals.logDB.merge(recs);
  const rows = new Map(I.libList().map(x => [x.v.id, x.st.label]));
  vs.forEach(v => {
    const label = I.verbStatus(v).label;
    assert.equal(rows.get(v.id), label, v.id);
    assert.ok(I.libVerbHTML(v).includes(label), `${v.id} verb page shows ${label}`);
  });
}));

test("B3: Library practice is logged as practice, never changes the schedule or frverbs.progress, and Undo removes it", () => withApp(async (app, I) => {
  const lw = app.window, ld = lw.document; let t = 1e6; lw.performance.now = () => t; app.verbes.settings.animations = false;
  const before = JSON.stringify([app.verbes.schedule, app.verbes.formsched]), prog = lw.localStorage.getItem("frverbs.progress");
  ld.querySelector("#tabs [data-tab=library]").click();
  ld.querySelector('[data-libtoggle="etre"]').click();
  ld.querySelector('#libList [data-practise-verb="etre"]').click();
  ld.querySelector("#pStart").click();
  t += 1000; ld.dispatchEvent(new lw.KeyboardEvent("keydown", { key: " ", bubbles: true }));
  t += 1000; ld.querySelector('#actions [data-act="know"]').click();
  let st = I.verbStatus(app.verbes.verbs.find(v => v.id === "etre"));
  const pr = st.cards[0].all.filter(r => r.p === "practice");
  assert.equal(pr.length, 1); assert.equal(pr[0].g, "pass");
  assert.equal(st.cards[0].status, "new", "practice does not introduce or advance a card");
  assert.equal(JSON.stringify([app.verbes.schedule, app.verbes.formsched]), before);
  assert.equal(lw.localStorage.getItem("frverbs.progress"), prog);
  assert.match(I.libVerbHTML(app.verbes.verbs.find(v => v.id === "etre")), /<td>practice<\/td>/);
  I.undo();
  await new Promise(r => setTimeout(r, 20));
  st = I.verbStatus(app.verbes.verbs.find(v => v.id === "etre"));
  assert.equal(st.cards[0].all.filter(r => r.p).length, 0, "Undo removes the record");
}));
