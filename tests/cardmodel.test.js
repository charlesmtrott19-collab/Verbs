// Phase 6 (v6.8) card model: key cards, person sampling, introduction order, expression and pattern cards, migration.
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadApp, plain } = require("./lib/load-app");

const T = "2026-11-02";
const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

test("key card person: je first, then the person asked least recently", async () => {
  const app = await loadApp();
  try {
    const I = app.internals, v = app.verbes.verbs.find(x => x.id === "aller");
    assert.equal(I.samplePerson(v, "futur", null), "je", "new card");
    assert.equal(I.samplePerson(v, "futur", { enc: 0 }), "je", "first test");
    assert.equal(I.samplePerson(v, "futur", { enc: 2, pp: { je: "2026-11-01", tu: "2026-10-20" } }), "il", "never asked comes first, in table order");
    const all = { je: "2026-11-01", tu: "2026-10-20", il: "2026-10-25", nous: "2026-10-28", vous: "2026-10-29", ils: "2026-10-30" };
    assert.equal(I.samplePerson(v, "futur", { enc: 5, pp: all }), "tu", "otherwise the oldest");
  } finally { app.close(); }
});

test("introduction order: rank plus tense offset; key cards wait for the présent's first review", async () => {
  const app = await loadApp();
  try {
    const I = app.internals, list = I.irrOrder();
    for (let i = 1; i < list.length; i++) assert.ok(list[i].sk >= list[i - 1].sk, "sorted by rank + offset");
    const at = k => list.findIndex(x => x.k === k);
    const etre = app.verbes.verbs.find(v => v.id === "etre");
    const pc = at("etre|passe_compose|*"), cond = at("etre|conditionnel|*"), fut = at("etre|futur|*");
    assert.equal(list[pc].sk, etre.rankNum + 10);
    assert.ok(list.slice(0, pc).filter(x => x.k.endsWith("|present|je")).length >= 10, "être's passé composé comes with verb 11's présent");
    assert.ok(fut < cond, "conditionnel after the same verb's futur");
    // Gate: with être's présent at step 1, none of its key cards is chosen; at step 2 they can be.
    const C = app.verbes.avgCosts(), forms = {};
    etre.tables.present.rows.forEach(r => { forms["etre|present|" + r.key] = { step: 1, enc: 1, due: "2026-12-01", lastDate: T }; });
    const S = { verbs: {}, forms, newLog: {}, fNewLog: {} };
    I.irrOrder().filter(x => x.off === 0).forEach(x => { if (!S.forms[x.k]) S.forms[x.k] = { step: 1, enc: 1, due: "2026-12-01", lastDate: T }; });
    app.internals.setSetting("maxNewForms", 999);
    const pick = () => plain(I.selectNew(0, T, S, C, 0, 1e9).ids);
    assert.ok(!pick().some(k => k.startsWith("etre|")), "gated");
    etre.tables.present.rows.forEach(r => { S.forms["etre|present|" + r.key].step = 2; });
    assert.ok(I.presentPassed(S, etre));
  } finally { app.close(); }
});

test("expression verbs and impersonal verbs", async () => {
  const app = await loadApp();
  try {
    const I = app.internals, vs = app.verbes.verbs, valoir = vs.find(v => v.id === "valoir");
    assert.deepEqual(plain(I.verbUnits(valoir)), ["valoir|inf"].concat(valoir.expressions.map((x, i) => "valoir|x|" + i)));
    assert.equal(I.unitValid("valoir|present|je"), false, "no person tables");
    const sp = I.unitSpec("valoir|x|0"), it = I.newItem(Object.assign(sp, { mode: "en-fr" }));
    assert.equal(I.unitKey(it), "valoir|x|0");
    it.dir = "en-fr";
    assert.match(I.exprHTML(it, valoir), /it&#39;s better to/);
    it.revealed = true;
    assert.match(I.exprHTML(it, valoir), /il vaut mieux/);
    const falloir = vs.find(v => v.id === "falloir");
    assert.deepEqual(plain(I.verbUnits(falloir)), ["falloir|inf", "falloir|present|il", "falloir|passe_compose|il", "falloir|imparfait|il", "falloir|futur|il", "falloir|conditionnel|il"]);
  } finally { app.close(); }
});

test("a revealed key card shows the whole tense with the asked person highlighted", async () => {
  const app = await loadApp();
  try {
    const I = app.internals, v = app.verbes.verbs.find(x => x.id === "aller");
    const it = I.newItem({ verbId: "aller", kind: "form", tense: "futur", person: "nous", key: true, mode: "en-fr" });
    assert.equal(I.unitKey(it), "aller|futur|*");
    it.dir = "en-fr"; it.revealed = true;
    const h = I.formHTML(it, v);
    assert.equal((h.match(/class="asked"/g) || []).length, 1);
    assert.equal((h.match(/<tr/g) || []).length >= 7, true, "six rows plus the header");
  } finally { app.close(); }
});

test("pattern cards: 15, ready once 5 verbs of the group are in and the tense has started", async () => {
  const app = await loadApp();
  try {
    const I = app.internals, er = app.verbes.verbs.filter(v => v.type === "regular" && v.section === "er").slice(0, 5);
    const S = { verbs: {}, forms: { "etre|present|je": { step: 1, enc: 1, due: T } }, newLog: {}, fNewLog: {} };
    er.slice(0, 4).forEach(v => { S.verbs[v.id] = { step: 1, enc: 1, due: T }; });
    assert.ok(!I.regOrder(S).some(x => x.v.pattern), "4 verbs: not yet");
    S.verbs[er[4].id] = { step: 1, enc: 1, due: T };
    assert.deepEqual(plain(I.regOrder(S).filter(x => x.v.pattern).map(x => x.k)), ["~er.present"], "présent only: no other tense has started");
    // Sampling: an introduced verb of the group, a real person, logged under the pattern card.
    app.verbes.schedule.verbs[er[0].id] = { step: 1, enc: 1, due: T };
    const sp = I.sampled(I.unitSpec("~er.present"));
    assert.equal(sp.verbId, er[0].id);
    assert.ok(er[0].tables.present.rows.some(r => r.key === sp.person));
    assert.equal(I.unitKey(I.newItem(sp)), "~er.present");
  } finally { app.close(); }
});

test("migration: key card takes the weakest step and earliest due (not before today); old entries kept; one backup; safe twice", async () => {
  const d = today(), past = "2026-01-05", later = "2099-01-01";
  const forms = {
    "aller|futur|je": { step: 4, enc: 4, intro: "2025-12-01", lastDate: "2025-12-20", due: later },
    "aller|futur|tu": { step: 2, enc: 2, intro: "2025-12-01", lastDate: "2025-12-30", due: later, missed: true, dir: "fr-en" },
    "aller|futur|nous": { step: 5, enc: 5, intro: "2025-11-01", lastDate: "2025-12-10", due: past },
    "valoir|present|je": { step: 3, enc: 3, intro: "2025-12-01", lastDate: "2025-12-20", due: later }
  };
  const ls = { "frverbs.formsched": JSON.stringify({ schema: 1, forms, newLog: {}, migrated: true, sched: 2 }) };
  const app = await loadApp({ localStorage: ls });
  try {
    const F = plain(app.verbes.formsched.forms), I = app.internals;
    assert.deepEqual(F["aller|futur|*"], { step: 2, enc: 2, due: d, intro: "2025-11-01", lastDate: "2025-12-30", dir: "fr-en",
      pp: { je: "2025-12-20", tu: "2025-12-30", nous: "2025-12-10" }, pm: { tu: 1 } });
    ["aller|futur|je", "aller|futur|tu", "aller|futur|nous"].forEach(k => assert.deepEqual(F[k], forms[k], "old entry kept for rollback"));
    assert.equal(F["valoir|x|0"].step, 3, "expression card takes the présent's weakest");
    assert.equal(Object.keys(F).filter(k => k.endsWith("|*")).length, 1);
    assert.deepEqual(plain(I.listBundles().map(b => b.label)), ["before-v6.8-cards"]);
    assert.equal(I.migrateCards(), 0, "running again changes nothing");
    assert.equal(I.listBundles().length, 1);
    assert.equal(I.unitValid("aller|futur|je"), false, "old person cards are no longer scheduled");
    const st = I.cardStatus("aller|futur|*");
    assert.deepEqual(plain(st.pm), { tu: 1 });
  } finally { app.close(); }
});

test("a 365-day simulation with the offsets stays within 30 minutes a day", async () => {
  const app = await loadApp();
  try {
    const V = app.verbes, rows = V.simulate(365, 0.85, V.avgCosts(), T, false).rows;
    const max = Math.max(...rows.map(r => r.min));
    assert.ok(max <= 30, `busiest day ${max.toFixed(1)} min`);
  } finally { app.close(); }
});
