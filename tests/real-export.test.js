// Acceptance checks on a REAL exported backup. Your data never goes in the repository: point at it when running.
//   VERBES_EXPORT=~/Downloads/french-verbs-backup-2026-10-29.json npm test
// Optionally compare with the previous version of the app (e.g. an older index.html saved outside the repo):
//   VERBES_EXPORT=… VERBES_OLD_INDEX=~/old/index.html npm test
// Without VERBES_EXPORT these tests are skipped.
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { loadApp, plain } = require("./lib/load-app");
const { exportToStorage } = require("./lib/export-to-storage");

const FILE = process.env.VERBES_EXPORT, OLD = process.env.VERBES_OLD_INDEX;
const skip = !FILE ? "set VERBES_EXPORT to a backup file to run these" : false;
const data = FILE ? JSON.parse(fs.readFileSync(FILE, "utf8")) : null;
const T = data ? data.exportedAt.slice(0, 10) : "";

// The same data as if any overdue cards had been reviewed on time (their dates moved forward by the days they are late).
function onTime(d, addDays, dayDiff) {
  const c = JSON.parse(JSON.stringify(d));
  [c.formsched.forms, c.schedule.verbs].forEach(st => Object.values(st).forEach(e => {
    if (e.due < T) { const n = dayDiff(e.due, T); ["due", "lastDate", "intro"].forEach(f => { if (e[f]) e[f] = addDays(e[f], n); }); }
  }));
  return c;
}
async function forecast(indexPath, d) {
  const app = await loadApp({ indexPath, localStorage: exportToStorage(d) });
  try {
    // Reviews of the cards that already exist: new cards are switched off, so this measures scheduling alone
    // (how many new cards a day may come is a separate, budget question).
    const V = app.verbes; V.settings.maxNewForms = 0; V.settings.maxNew = 0;
    return V.simulate(15, 1, V.avgCosts(), T, false).rows.slice(1).reduce((a, r) => a + r.reviews, 0);
  }
  finally { app.close(); }
}

test("opening the app on this data changes no card's step or due date", { skip }, async () => {
  const app = await loadApp({ localStorage: exportToStorage(data) });
  try {
    const F = plain(app.verbes.formsched.forms), R = plain(app.verbes.schedule.verbs);
    for (const [k, e] of Object.entries(data.formsched.forms)) assert.deepEqual([F[k].step, F[k].due], [e.step, e.due], k);
    for (const [k, e] of Object.entries(data.schedule.verbs)) assert.deepEqual([R[k].step, R[k].due], [e.step, e.due], k);
    [...Object.values(F), ...Object.values(R)].forEach(e => { if (e.enc > 0) assert.match(String(e.lastDate), /^\d{4}-\d\d-\d\d$/); });
  } finally { app.close(); }
});

test("a 365-day simulation from this data, with a 7-day break, never goes over 30 minutes a day", { skip }, async () => {
  const app = await loadApp({ localStorage: exportToStorage(data) });
  try {
    const V = app.verbes, brk = new Set([60, 61, 62, 63, 64, 65, 66]);
    for (const pass of [1, 0.85]) {
      const rows = V.simulate(365, pass, V.avgCosts(), T, false, brk).rows;
      const worst = Math.max(...rows.map(r => r.min));
      assert.ok(worst <= 30, `pass rate ${pass}: busiest day ${worst.toFixed(1)} min`);
      assert.ok(rows[67].reviews <= 120);
    }
  } finally { app.close(); }
});

// 14 days, not 7: a 7-day window can cut between two days when a group of cards moves by one day (15 vs 14 days).
// CURRENT (Phase 6 changes): key cards replace 6 person cards per tense, so the forecast must drop (Section 2C).
test("CURRENT (Phase 6 changes) 14-day forecast of existing cards drops against the previous version, measured as if reviews were on time", { skip: skip || (!OLD && "set VERBES_OLD_INDEX to compare") }, async t => {
  const probe = await loadApp(); const { addDays, dayDiff } = probe.internals; probe.close();
  const d = onTime(data, addDays, dayDiff);
  const [before, after] = [await forecast(OLD, d), await forecast(undefined, d)];
  t.diagnostic(`14-day forecast: before ${before}, after ${after}`);
  assert.ok(after < before, `before ${before}, after ${after}`);
});

test("Phase 6 migration (2C): one key card per started tense, weakest step, nothing due before today", { skip }, async t => {
  const app = await loadApp({ localStorage: exportToStorage(data) });
  try {
    const I = app.internals, F = plain(app.verbes.formsched.forms), old = data.formsched.forms;
    let want = 0, tenses = 0;
    app.verbes.verbs.filter(v => v.type === "irregular" && !v.impersonal && !v.expressions.length).forEach(v => {
      ["passe_compose", "imparfait", "futur", "conditionnel"].forEach(tn => {
        const olds = v.tables[tn].rows.map(r => old[v.id + "|" + tn + "|" + r.key]).filter(Boolean), k = v.id + "|" + tn + "|*";
        if (!olds.length) { assert.ok(!F[k], k); return; }
        want++; tenses++;
        assert.ok(F[k], k);
        assert.equal(F[k].step, Math.min(...olds.map(e => e.step)), k + " weakest step");
        assert.ok(F[k].due >= T, k + " due " + F[k].due);
      });
    });
    const keys = Object.keys(F).filter(k => k.endsWith("|*"));
    assert.equal(keys.length, want);
    t.diagnostic(`key cards: ${keys.length} (one per started tense of each verb); scheduled irregular cards ${Object.keys(F).filter(I.unitValid).length}, was ${Object.keys(old).length}`);
  } finally { app.close(); }
});
