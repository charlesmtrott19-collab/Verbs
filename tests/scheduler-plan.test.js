// Phase 3 (v6.3) planning rules on generated data: the daily review cap and its order, the v6.3 migration, and a break.
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadApp, plain } = require("./lib/load-app");

const T = "2026-11-02";

// A device that has studied for a while: `n` irregular forms all due, spread over 0..19 days overdue.
async function appWithDue(n) {
  const probe = await loadApp();
  const I = probe.internals, units = [];
  probe.verbes.verbs.filter(v => v.type === "irregular").forEach(v => units.push(...I.verbUnits(v)));
  const forms = {};
  units.slice(0, n).forEach((k, i) => {
    const late = i % 20, step = 1 + (i % 7), gap = I.LADDER[step - 1];
    const due = I.addDays(T, -late);
    forms[k] = { step, enc: step, intro: I.addDays(due, -60), lastDate: I.addDays(due, -gap), due, last: "pass" };
  });
  probe.close();
  const fs = { schema: 1, forms, newLog: {}, migrated: true, sched: 2 };
  return loadApp({ localStorage: { "frverbs.formsched": JSON.stringify(fs) } });
}

test("at most 120 reviews a day; the rest wait; new cards pause while any wait", async () => {
  const app = await appWithDue(150);
  try {
    const p = app.verbes.plan(T);
    assert.equal(p.blocks[0].reviews.length + p.blocks[1].reviews.length, 120);
    assert.equal(p.held, 30);
    assert.equal(p.blocks[0].newIds.length + p.blocks[1].newIds.length, 0, "no new cards");
  } finally { app.close(); }
});

test("the cards most at risk come first: most overdue as a share of their gap", async () => {
  const app = await appWithDue(150);
  try {
    const I = app.internals, S = I.curState(), p = app.verbes.plan(T);
    const chosen = new Set(plain(p.blocks[0].reviews));
    const risk = k => I.riskOf(S.forms[k], T);
    const minChosen = Math.min(...[...chosen].map(risk));
    const maxLeft = Math.max(...Object.keys(S.forms).filter(k => !chosen.has(k)).map(risk));
    assert.ok(minChosen >= maxLeft, `every chosen card (min risk ${minChosen}) is at least as at risk as every held card (max ${maxLeft})`);
  } finally { app.close(); }
});

test("under the cap nothing is held and new cards still come", async () => {
  const app = await appWithDue(40);
  try {
    const p = app.verbes.plan(T);
    assert.equal(p.held, 0);
    assert.equal(p.blocks[0].reviews.length, 40);
    assert.ok(p.blocks[0].newIds.length > 0);
  } finally { app.close(); }
});

test("migration: a reviewed card without lastDate gets one; step and due never change; one backup; safe to repeat", async () => {
  const forms = {
    "etre|inf": { step: 3, enc: 3, intro: "2026-10-01", due: "2026-11-05" },                                  // no lastDate
    "etre|present|je": { step: 2, enc: 2, intro: "2026-10-01", lastDate: "2026-10-30", due: "2026-11-01" },  // has one
    "etre|present|tu": { step: 0, enc: 0, intro: T, due: T }                                                 // not yet seen
  };
  const ls = { "frverbs.formsched": JSON.stringify({ schema: 1, forms, newLog: {}, migrated: true }) };
  const app = await loadApp({ localStorage: ls });
  try {
    const F = plain(app.verbes.formsched.forms);
    assert.deepEqual(F["etre|inf"], Object.assign({}, forms["etre|inf"], { lastDate: "2026-11-01" }), "due minus the 4-day ladder gap");
    assert.deepEqual(F["etre|present|je"], forms["etre|present|je"]);
    assert.deepEqual(F["etre|present|tu"], forms["etre|present|tu"]);
    assert.equal(app.verbes.formsched.sched, 2);
    assert.deepEqual(plain(app.internals.listBundles().map(b => b.label)), ["before-v6.3-scheduler"]);
    app.internals.migrateSched();
    assert.equal(app.internals.listBundles().length, 1, "running again changes nothing and makes no new copy");
  } finally { app.close(); }
});

test("after a 7-day break no day goes over 30 minutes, and the backlog clears within a week", async () => {
  const app = await loadApp();
  try {
    const V = app.verbes, skip = new Set([40, 41, 42, 43, 44, 45, 46]);
    const rows = V.simulate(120, 0.85, V.avgCosts(), T, false, skip).rows;
    const after = rows.slice(47);
    assert.ok(after[0].held > 0, "the first day back holds some reviews");
    assert.ok(after[0].reviews <= 120);
    assert.ok(after.every(r => r.min <= 30), `max ${Math.max(...after.map(r => r.min)).toFixed(1)} min`);
    // The break's backlog clears within a week. Later, with the v6.5 curriculum (25 more verbs), the cap can trim a
    // handful of cards on busy days even without a break (2 on day 63 of an unbroken run), so allow up to 10.
    assert.ok(after.slice(0, 7).some(r => !r.held), "the backlog clears within a week");
    assert.ok(after.slice(7).every(r => r.held <= 10), `held a week after returning: ${Math.max(...after.slice(7).map(r => r.held))}`);
  } finally { app.close(); }
});
