// Generated output must not change by accident.
// If a change is intended, run `node tests/make-golden.js`, review `git diff tests/fixtures`, and commit both.
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadApp, plain } = require("./lib/load-app");
const { SAMPLE, tablesOf, simSummary } = require("./make-golden");
const golden = require("./fixtures/golden-tables.json");
const baseline = require("./fixtures/baseline-sim.json");

let app;
test.before(async () => { app = await loadApp(); });
test.after(() => app && app.close());

test("conjugation tables match the golden copy for the sample verbs", async t => {
  const byId = new Map(app.verbes.verbs.map(v => [v.id, v]));
  for (const want of golden) {
    await t.test(want.id, () => {
      const v = byId.get(want.id);
      assert.ok(v, `${want.id} is missing`);
      assert.deepEqual(plain(tablesOf(v)), want);
    });
  }
  assert.deepEqual(golden.map(g => g.id), SAMPLE, "fixture covers the sample list");
});

test("spot checks a reader can verify by eye", () => {
  const g = id => golden.find(x => x.id === id).tables;
  assert.equal(g("aller").passe_compose[3].fr, "nous sommes allé(e)s");
  assert.equal(g("etre").imparfait[0].fr, "j'étais");
  assert.equal(g("finir").present[3].fr, "nous finissons");
  assert.equal(g("vendre").present[2].subs[0].fr, "il vend");
  assert.equal(g("etudier").imparfait[3].fr, "nous étudiions");
  assert.equal(g("se-souvenir").present[0].fr, "je me souviens");
});

test("30-day planner baseline is unchanged (all passed)", () => {
  assert.deepEqual(plain(simSummary(app.verbes, 1)), baseline.pass100);
});

test("30-day planner baseline is unchanged (85% passed, seeded)", () => {
  assert.deepEqual(plain(simSummary(app.verbes, 0.85)), baseline.pass85);
});
