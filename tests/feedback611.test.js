// v6.11 (feedback after the first week on v6.10): English for regular verbs, full tables on card answers, To review
// grouped by verb and tense, rings that fill in quarters, and a second pass for missed and Hard cards.
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadApp } = require("./lib/load-app");

let app, I, V;
test.before(async () => { app = await loadApp(); I = app.internals; V = app.verbes; });
test.after(() => app && app.close());
const verb = id => V.verbs.find(v => v.id === id);

test("regular verbs have English in every row, built like the irregular data", () => {
  const en = (id, t, p) => I.enRegular(verb(id), t, p);
  assert.equal(en("aimer", "present", "il"), "he/she/one likes");
  assert.equal(en("trouver", "passe_compose", "je"), "I found / have found");
  assert.equal(en("chercher", "imparfait", "nous"), "we looked for / used to look for");
  assert.equal(en("arreter", "passe_compose", "il"), "he/she/one stopped / has stopped");
  assert.equal(en("etudier", "present", "il"), "he/she/one studies");
  assert.equal(en("s-appeler", "present", "je"), "I am called");
  assert.equal(en("se-passer", "futur", "il"), "it will happen");
  assert.equal(en("finir", "conditionnel", "vous"), "you would finish");
  V.verbs.filter(v => v.type === "regular").forEach(v => Object.values(v.tables).forEach(tb => tb.rows.forEach(r => assert.ok(r.en, `${v.id} ${r.key}`))));
  assert.equal(verb("parler").tables.present.rows.find(r => r.key === "il").subs[1].en, "she speaks");
});

test("a revealed card shows the whole tense with English and Play all, the asked person highlighted (présent too)", () => {
  for (const [id, tense, person] of [["aller", "present", "nous"], ["parler", "imparfait", "je"]]) {
    const it = I.newItem({ verbId: id, kind: "form", tense, person, mode: "en-fr" }); it.dir = "en-fr"; it.revealed = true;
    const h = I.formHTML(it, verb(id));
    assert.match(h, /Play all/);
    assert.match(h, /class="c-en"/);
    assert.equal((h.match(/class="asked"/g) || []).length, 1, id);
  }
});

test("To review groups cards by verb, then tense, each collapsible", () => {
  const h = I.reviewGroupsHTML(["etre|futur|tu", "etre|futur|vous", "etre|conditionnel|il", "avoir|inf", "parler"], {});
  assert.equal((h.match(/class="rvverb"/g) || []).length, 3, "être, avoir, parler");
  assert.equal((h.match(/class="rvtense"/g) || []).length, 4, "être futur, être conditionnel, avoir infinitive, parler");
  assert.match(h, /Futur simple \(tu, vous\)/);
  assert.match(h, /data-rverb="etre"/);
  assert.ok(h.indexOf("être") < h.indexOf("avoir"), "by importance");
});

test("rings fill in quarters as cards climb", () => {
  const st = (tenses, steps) => ({ tenses, cards: steps.map((s, i) => ({ k: "x|present|" + i, e: { step: s } })) });
  const T = s => ({ present: s, passe_compose: "new", imparfait: "new", futur: "new", conditionnel: "new" });
  assert.equal(I.ringFill(st(T("learning"), [1, 2]), "present"), 1);
  assert.equal(I.ringFill(st(T("learning"), [3, 4]), "present"), 2);
  assert.equal(I.ringFill(st(T("reviewing"), [5]), "present"), 3);
  assert.equal(I.ringFill(st(T("new"), []), "passe_compose"), 0);
});

test("second pass: today's new cards plus every card missed or marked Hard", () => {
  const s = { bi: 0, vs: {
    "etre|present|je": { blk: 0, isNew: true }, "etre|present|tu": { blk: 0, fail: true }, "etre|present|il": { blk: 0, hard: true },
    "etre|present|nous": { blk: 0 }, "parler": { blk: 1, fail: true } } };
  assert.deepEqual([...I.secondIds(s, 0)].sort(), ["etre|present|il", "etre|present|je", "etre|present|tu"]);
  assert.deepEqual([...I.secondIds(s, 1)], ["parler"]);
});
