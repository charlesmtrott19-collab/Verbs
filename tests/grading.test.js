// Honest grading (Phase 1, v6.1), tested end to end in a real scheduled session:
// the front of a card offers only Show answer, keys 1 and 2 reveal instead of grading,
// a swipe can't grade an unrevealed card, and a first-try miss on a new card leaves it new, due tomorrow.
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadApp } = require("./lib/load-app");

let app, w, d, clock = 1e6;
const V = () => app.verbes;
const S = () => V().session;
const cur = () => S().queue[S().idx];
// Same keys as the app: "être|inf" for an infinitive card, "être|present|je" for a form card.
const unitKey = it => it.kind === "main" ? `${it.verbId}|inf` : `${it.verbId}|${it.tense}|${it.person}`;
const acts = () => [...d.querySelectorAll("#actions [data-act]")].map(b => b.dataset.act);
const tick = () => { clock += 1000; };                       // past the 350 ms double-tap guard
const key = k => { tick(); d.dispatchEvent(new w.KeyboardEvent("keydown", { key: k, bubbles: true })); };
const press = act => { tick(); d.querySelector(`#actions [data-act="${act}"]`).click(); };

test.before(async () => {
  app = await loadApp();
  w = app.window; d = w.document;
  w.performance.now = () => clock;                          // controllable clock for the guards
  V().settings.animations = false;                          // no fly-out delay between cards
  d.querySelector('[data-sec^="start:"]').click();         // Today › Start
  d.querySelector('[data-today="ready"]').click();          // Learn step › I'm ready
  assert.equal(S().part, "test");
});
test.after(() => app && app.close());

test("the front of a speaking card offers only Show answer", () => {
  const it = cur();
  assert.equal(it.revealed, false);
  assert.notEqual(it.mode, "listen");
  assert.deepEqual(acts(), ["flip"]);
  assert.match(d.querySelector("#actions").textContent, /Show answer/);
});

test("key 1 on an unrevealed card shows the answer and records nothing", () => {
  const it = cur(), idx = S().idx, k = unitKey(it);
  const before = JSON.stringify(V().formsched.forms[k]);
  key("1");
  assert.equal(it.revealed, true, "answer shown");
  assert.equal(S().idx, idx, "still on the same card");
  assert.equal(JSON.stringify(V().formsched.forms[k]), before, "schedule untouched");
  assert.deepEqual(acts(), ["dont", "hard", "know"], "back offers the grades");
});

test("Know on the back grades and moves on", () => {
  const it = cur(), k = unitKey(it), idx = S().idx;
  press("know");
  assert.equal(S().idx, idx + 1);
  const e = V().formsched.forms[k];
  assert.equal(e.step, 1); assert.equal(e.last, "pass"); assert.equal(e.enc, 1);
});

test("Hard (key 3): reveals first, then grades Hard; the card stays on its step and the log says hard", async () => {
  const it = cur(), k = unitKey(it), idx = S().idx;
  key("3");
  assert.equal(it.revealed, true); assert.equal(S().idx, idx, "first press only shows the answer");
  key("3");
  assert.equal(S().idx, idx + 1, "second press grades");
  const e = V().formsched.forms[k];
  assert.deepEqual({ step: e.step, last: e.last }, { step: 1, last: "hard" }, "a new card graded Hard moves to step 1");
  assert.equal(e.due, app.internals.addDays(S().date, 1));
  await new Promise(r => setTimeout(r, 20));
  const rec = (await app.internals.logDB.all()).find(r => r.k === k);
  assert.equal(rec.g, "hard");
});

test("key 2 on an unrevealed card also only shows the answer", () => {
  const it = cur(), idx = S().idx;
  key("2");
  assert.equal(it.revealed, true);
  assert.equal(S().idx, idx);
  assert.ok(!S().vs[unitKey(it)].fail, "no miss recorded");
});

test("a swipe can't grade an unrevealed card", () => {
  press("dont");                                            // grade the revealed card from the last test, to move on
  const it = cur(), idx = S().idx, card = d.querySelector("#card");
  assert.equal(it.revealed, false);
  V().settings.swipe = true;
  const ev = (type, x) => { const e = new w.MouseEvent(type, { bubbles: true, clientX: x, clientY: 100, button: 0 }); e.pointerId = 1; card.dispatchEvent(e); };
  tick(); ev("pointerdown", 100); ev("pointermove", 400); ev("pointerup", 400);
  assert.equal(S().idx, idx, "no grade, still on the same card");
  assert.ok(!S().vs[unitKey(it)].fail, "no miss recorded");
});

test("a first-try miss on a new card leaves it new, due tomorrow, once the retry is right", () => {
  // The card missed in the previous test is retried later in the queue; answer everything Know until it is final.
  const missed = Object.entries(S().vs).find(([, v]) => v.fail);
  assert.ok(missed, "one card was missed at its first try");
  const [k, vs] = missed;
  for (let i = 0; i < 400 && !vs.final && S().part === "test"; i++) { if (!cur().revealed) press("flip"); press("know"); }
  assert.equal(vs.final, true, "the missed card was finally answered right");
  const e = V().formsched.forms[k];
  const tomorrow = app.internals.addDays(S().date, 1);
  assert.deepEqual({ step: e.step, last: e.last, due: e.due, missed: e.missed }, { step: 0, last: "miss", due: tomorrow, missed: true });
});

test("Library practice follows the same rule", async () => {
  const lib = await loadApp();
  try {
    const lw = lib.window, ld = lib.window.document; let t = 1e6;
    lw.performance.now = () => t; lib.verbes.settings.animations = false;
    ld.querySelector("#tabs [data-tab=library]").click();
    // v6.7: practice starts from a verb's page in the Library list (Section 3D).
    ld.querySelector('[data-libtoggle="etre"]').click();
    ld.querySelector('#libList [data-practise-verb="etre"]').click();
    ld.querySelector("#pStart").click();
    const s = lib.verbes.session, la = () => [...ld.querySelectorAll("#actions [data-act]")].map(b => b.dataset.act);
    assert.equal(s.mode, "library");
    assert.deepEqual(la(), ["flip"]);
    t += 1000; ld.dispatchEvent(new lw.KeyboardEvent("keydown", { key: "1", bubbles: true }));
    assert.equal(s.idx, 0); assert.deepEqual(la(), ["dont", "know"]);
    t += 1000; ld.querySelector('#actions [data-act="know"]').click();
    assert.equal(s.known, 1); assert.ok(s.done, "one card, so the round is finished");
  } finally { lib.close(); }
});
