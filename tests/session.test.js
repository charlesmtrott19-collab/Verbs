// Phase 4 (v6.4): one daily session with one shared budget, old sessions closing, recall-based To review,
// and the il/ils note on the front of listening cards.
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadApp, plain } = require("./lib/load-app");

function drive(app) {
  const w = app.window, d = w.document; let clock = 1e6;
  w.performance.now = () => clock; app.verbes.settings.animations = false;
  const press = act => { clock += 1000; const b = d.querySelector(`#actions [data-act="${act}"]`); if (b) b.click(); return !!b; };
  return {
    w, d,
    starts: () => [...d.querySelectorAll("#todayBody [data-sec]")].map(b => b.dataset.sec),
    // Answer everything right until the session is done. Returns the parts seen, in order.
    runAll() {
      const seen = [];
      for (let i = 0; i < 3000; i++) {
        const s = app.verbes.session; if (!s || s.done) break;
        const tag = (s.bi || 0) + ":" + s.part; if (seen[seen.length - 1] !== tag) seen.push(tag);
        const ready = d.querySelector('[data-today="ready"]');
        if (s.part === "learn" && ready) { ready.click(); continue; }
        if (!press("flip")) press("know"); else press("know");
      }
      return seen;
    }
  };
}

test("Today offers one Start for the whole day, and one session runs both blocks within the budget", async () => {
  const app = await loadApp(); const D = drive(app);
  try {
    assert.deepEqual(D.starts(), ["start:all"]);
    D.d.querySelector('[data-sec="start:all"]').click();
    const s = app.verbes.session;
    assert.equal(s.only, undefined);
    assert.ok(s.plannedSec <= (app.verbes.settings.budget + 2) * 60, `planned ${Math.round(s.plannedSec / 60)} min`);
    const parts = D.runAll();
    assert.deepEqual(parts, ["0:learn", "0:test", "0:second", "1:learn", "1:test", "1:second"]);
    const t = s.date, h = plain(app.verbes.history || {})[t] || JSON.parse(app.window.localStorage.getItem("frverbs.history"))[t];
    assert.ok(h.irr && h.reg, "both blocks recorded as done");
    assert.match(D.d.querySelector("#todayBody").textContent, /✓ Done/);
    assert.deepEqual(D.starts().filter(x => x.startsWith("start")), [], "no second Start today");
  } finally { await new Promise(r => setTimeout(r, 150)); app.close(); }   // let the end-of-session sync and backup settle
});

test("the two old section budgets carry over as one daily budget", async () => {
  for (const [irr, reg, want] of [[20, 10, 30], [18, 15, 35], [15, 5, 20]]) {
    const app = await loadApp({ localStorage: { "frverbs.settings": JSON.stringify({ schema: 1, budgetIrr: irr, budgetReg: reg }) } });
    try { assert.equal(app.verbes.settings.budget, want, `${irr} + ${reg}`); } finally { app.close(); }
  }
  const app = await loadApp({ localStorage: { "frverbs.settings": JSON.stringify({ schema: 1, budget: 40, budgetIrr: 15, budgetReg: 5 }) } });
  try { assert.equal(app.verbes.settings.budget, 40, "an explicit budget wins"); } finally { app.close(); }
});

test("a session left unfinished on an earlier day closes when Today opens", async () => {
  const a = await loadApp(); const A = drive(a); let ls;
  try {
    A.d.querySelector('[data-sec="start:all"]').click();
    A.d.querySelector('[data-today="ready"]').click();
    ls = a.storage();
    const sess = JSON.parse(ls["frverbs.session"]);
    sess.date = a.internals.addDays(sess.date, -1);
    ls["frverbs.session"] = JSON.stringify(sess);
  } finally { a.close(); }
  const b = await loadApp({ localStorage: ls }); const B = drive(b);
  try {
    assert.equal(b.window.localStorage.getItem("frverbs.session"), null, "closed");
    assert.ok(B.starts().some(x => x.startsWith("start")), "Today offers Start, not Continue");
    assert.match(b.window.document.body.textContent, /was closed\. Cards you finished are saved/);
  } finally { b.close(); }
});

test("To review: Review now runs a recall round; right on 2 different days clears a card; Undo puts it back", async () => {
  const k = "etre|present|je", t0 = "2026-10-29";
  const review = { schema: 1, seeded: true, items: { [k]: { on: t0, reads: 0, done: "", u: 1 } } };
  const app = await loadApp({ localStorage: { "frverbs.review": JSON.stringify(review) } }); const D = drive(app);
  try {
    D.d.querySelector("#tabs [data-tab=library]").click();
    D.d.querySelector("[data-rstart]").click();
    const s = app.verbes.session;
    assert.equal(s.mode, "library"); assert.equal(s.toReview, true); assert.equal(s.queue.length, 1);
    let c = 2e6;
    const click = act => { c += 1000; app.window.performance.now = () => c; D.d.querySelector(`#actions [data-act="${act}"]`).click(); };
    click("flip"); click("know");
    const today = JSON.parse(app.window.localStorage.getItem("frverbs.review")).items[k];
    assert.equal(today.rd.length, 1); assert.equal(today.done, "", "one right day is not enough");
    app.window.document.querySelector('[data-sum="undo"]').click();          // the round has ended: Undo is on the summary
    assert.equal(JSON.parse(app.window.localStorage.getItem("frverbs.review")).items[k].rd, undefined, "Undo restores it");
    app.internals.reviewRecall(k, true, "2026-11-01");
    app.internals.reviewRecall(k, true, "2026-11-01");
    assert.equal(JSON.parse(app.window.localStorage.getItem("frverbs.review")).items[k].done, "", "same day twice counts once");
    app.internals.reviewRecall(k, false, "2026-11-02");
    app.internals.reviewRecall(k, true, "2026-11-03");
    assert.equal(JSON.parse(app.window.localStorage.getItem("frverbs.review")).items[k].done, "2026-11-03", "cleared on the second right day");
  } finally { app.close(); }
});

test("listening cards: the il/ils note shows on the front without giving the answer away", async () => {
  const app = await loadApp(); const { soundAlike } = app.internals, V = id => app.verbes.verbs.find(v => v.id === id);
  try {
    const front = soundAlike(V("voir"), { kind: "form", person: "il", tense: "present" }, true);
    assert.match(front, /either answer is right/);
    assert.doesNotMatch(front, /voit|voient/, "names no form");
    assert.match(soundAlike(V("voir"), { kind: "form", person: "ils", tense: "present" }), /voit.*voient|voient.*voit/);
    assert.equal(soundAlike(V("faire"), { kind: "form", person: "il", tense: "present" }, true), "", "il fait and ils font differ");
    assert.equal(soundAlike(V("voir"), { kind: "form", person: "je", tense: "present" }, true), "");
  } finally { app.close(); }
});
