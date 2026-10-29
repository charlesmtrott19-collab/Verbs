// The app loads, validates its data and builds the card model it is supposed to.
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadApp, plain } = require("./lib/load-app");

let app;
test.before(async () => { app = await loadApp(); });
test.after(() => app && app.close());

test("loads with no page errors", () => {
  assert.deepEqual(app.errors, []);
});

test("all verbs pass the app's own validation", () => {
  assert.deepEqual(plain(app.verbes.problems), []);
});

test("has 267 verbs: 92 irregular and 175 regular (v6.5 added 25)", () => {
  const vs = app.verbes.verbs;
  assert.equal(vs.length, 267);
  assert.equal(vs.filter(v => v.type === "irregular").length, 92);
  assert.equal(vs.filter(v => v.type === "regular").length, 175);
});

test("card model: 31 cards per irregular verb (6 for il-only verbs), 1 per regular verb, 2,977 in all", () => {
  // Irregular verbs are scheduled per form (verbUnits); a regular verb is scheduled as one card under its id.
  const { verbUnits } = app.internals;
  const irr = app.verbes.verbs.filter(v => v.type === "irregular");
  const reg = app.verbes.verbs.filter(v => v.type === "regular");
  irr.forEach(v => assert.equal(verbUnits(v).length, v.impersonal ? 6 : 31, `${v.id}`));
  assert.deepEqual(plain(verbUnits(irr[0]).slice(0, 2)), ["etre|inf", "etre|present|je"]);
  assert.equal(irr.reduce((n, v) => n + verbUnits(v).length, 0) + reg.length, 2977);
});

test("fresh start: the first plan respects the new-card caps and has no reviews", () => {
  const p = app.verbes.plan("2026-11-02");
  const s = app.verbes.settings;
  assert.equal(p.blocks[0].reviews.length, 0);
  assert.equal(p.blocks[1].reviews.length, 0);
  assert.ok(p.blocks[0].newIds.length > 0 && p.blocks[0].newIds.length <= s.maxNewForms, "irregular new cards within maxNewForms");
  assert.ok(p.blocks[1].newIds.length > 0 && p.blocks[1].newIds.length <= s.maxNew, "regular new verbs within maxNew");
  assert.equal(p.blocks[0].newIds[0], "etre|inf", "the first new card is être's infinitive");
});
