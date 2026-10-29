// Phase 7 (v6.5): the optional verb fields (hint, persons, reflexive, expressions, family), the -ger and -cer
// groups and the 25 added verbs. Forms are also checked against a reference conjugator by tests/reference_check.py.
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { loadApp, plain, ROOT } = require("./lib/load-app");
const { validate } = require("./validate-verbs");

let app, V;
test.before(async () => { app = await loadApp(); V = Object.fromEntries(app.verbes.verbs.map(v => [v.id, v])); });
test.after(() => app && app.close());
const fr = (id, t) => V[id].tables[t].rows.map(r => r.fr);

test("impersonal verbs (persons: [\"il\"]) have one il row per tense, with no elle or on, and 6 cards", () => {
  for (const id of ["falloir", "pleuvoir"]) {
    const v = V[id];
    assert.ok(v.impersonal, id);
    Object.values(v.tables).forEach(tb => { assert.equal(tb.rows.length, 1); assert.equal(tb.rows[0].label, "il"); assert.equal(tb.rows[0].subs, undefined); });
    assert.equal(app.internals.verbUnits(v).length, 6, id);
  }
  assert.deepEqual(plain(fr("falloir", "present")), ["il faut"]);
  assert.deepEqual(plain(fr("falloir", "passe_compose")), ["il a fallu"]);
  assert.deepEqual(plain(V.pleuvoir.tables.present.rows[0].enL), ["it rains", "it is raining"]);
  assert.equal(V.falloir.tables.futur.rows[0].speak, "il faudra");
});

test("regular reflexive verbs: me/te/se with elision, nous nous, être and agreement in the passé composé", () => {
  assert.equal(V["s-habiller"].auxiliary, "être");
  assert.deepEqual(plain(fr("s-habiller", "present")), ["je m'habille", "tu t'habilles", "il/elle/on s'habille", "nous nous habillons", "vous vous habillez", "ils/elles s'habillent"]);
  assert.deepEqual(plain(fr("se-lever", "passe_compose")), ["je me suis levé(e)", "tu t'es levé(e)", "il/elle/on s'est levé(e)", "nous nous sommes levé(e)s", "vous vous êtes levé(e)(s)", "ils/elles se sont levé(e)s"]);
  assert.deepEqual(plain(fr("se-lever", "present")).slice(0, 4), ["je me lève", "tu te lèves", "il/elle/on se lève", "nous nous levons"]);
  assert.deepEqual(plain(fr("s-appeler", "futur")).slice(0, 1), ["je m'appellerai"]);
  assert.equal(V["s-habiller"].tables.present.rows[3].phon, "noo noo zah-beey-oh(n)");
  assert.equal(V["s-habiller"].tables.present.rows[0].speak, "je m'habille");
  // Impersonal and reflexive: il only, no agreement.
  assert.deepEqual(plain(fr("se-passer", "passe_compose")), ["il s'est passé"]);
});

test("-ger and -cer groups keep the soft sound and are scheduled inside the -er section", () => {
  assert.deepEqual(plain(fr("manger", "present")).slice(3, 4), ["nous mangeons"]);
  assert.deepEqual(plain(fr("manger", "imparfait")), ["je mangeais", "tu mangeais", "il/elle/on mangeait", "nous mangions", "vous mangiez", "ils/elles mangeaient"]);
  assert.deepEqual(plain(fr("commencer", "present")).slice(3, 4), ["nous commençons"]);
  assert.equal(fr("commencer", "futur")[0], "je commencerai");
  const { schedSections, sectionVerbs } = app.internals;
  assert.deepEqual(plain(schedSections()), ["irregular", "er", "ir", "re"]);
  const er = sectionVerbs("er").map(v => v.id);
  assert.ok(er.includes("manger") && er.includes("commencer"));
  assert.ok(er.indexOf("regarder") < er.indexOf("manger") && er.indexOf("manger") < er.indexOf("utiliser"), "manger (R023) sits by rank between regarder (R008) and utiliser (R032)");
});

test("hints show in brackets after the English prompt, and the validator reports no ambiguous prompts", async () => {
  assert.equal(V.savoir.english, "to know (a fact, how to do something)");
  assert.equal(V.connaitre.english, "to know (a person, a place)");
  assert.equal(V.connaitre.gloss, "to know");
  const it = app.internals.newItem({ verbId: "connaitre", kind: "main" }); it.dir = "en-fr";
  assert.match(app.internals.mainHTML(it, V.connaitre), /to know \(a person, a place\)/);
  const r = await validate(fs.readFileSync(path.join(ROOT, "verbs.js"), "utf8"));
  assert.deepEqual(r.warnings, []);
});

test("Learn shows expressions and the family; the card back shows the family", () => {
  const { verbDetailHTML, familyText } = app.internals;
  assert.match(verbDetailHTML(V.valoir), /Common expressions[\s\S]*il vaut mieux/);
  assert.equal(familyText(V.apprendre), "Like prendre");
  assert.match(familyText(V.prendre), /^Same pattern: .*apprendre/);
  assert.match(verbDetailHTML(V.falloir), /used only with il/);
  const it = app.internals.newItem({ verbId: "apprendre", kind: "main" }); it.dir = "en-fr"; it.revealed = true;
  assert.match(app.internals.mainHTML(it, V.apprendre), /Like prendre\./);
});

const SRC = fs.readFileSync(path.join(ROOT, "verbs.js"), "utf8");
const swap = (from, to) => { assert.ok(SRC.includes(from), `test setup: "${from}" not found`); return SRC.replace(from, to); };

test("the validator catches mistakes in the new fields", async () => {
  // A shared prompt without a hint is a warning again.
  let r = await validate(swap('    hint: "a person, a place",\n', ""));
  assert.ok(r.warnings.some(w => /savoir, connaître/.test(w)), r.warnings.join("\n"));
  // persons naming an unknown person is an app error.
  r = await validate(swap('id: "pleuvoir",', 'id: "pleuvoir", persons: ["it"],').replace(/(id: "pleuvoir", persons: \["it"\],[\s\S]*?)    persons: \["il"\],\n/, "$1"));
  assert.ok(r.appProblems.some(p => /persons must list/.test(p)), r.appProblems.join("\n"));
  // A reflexive override written with its pronoun.
  r = await validate(SRC.replace(/(id: "se-lever"[\s\S]*?)fr: "lève"/, '$1fr: "me lève"'));
  assert.ok(r.errors.some(e => /without the reflexive pronoun/.test(e)), r.errors.join("\n"));
  // A family that names no verb.
  r = await validate(swap('family: "like prendre"', 'family: "like prandre"'));
  assert.ok(r.errors.some(e => /names no verb/.test(e)), r.errors.join("\n"));
});
