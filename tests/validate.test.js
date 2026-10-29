// The validator passes today's verbs.js and catches deliberate mistakes of each kind.
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { validate } = require("./validate-verbs");
const { ROOT } = require("./lib/load-app");

const SRC = fs.readFileSync(path.join(ROOT, "verbs.js"), "utf8");
const swap = (from, to) => {
  assert.ok(SRC.includes(from), `test setup: "${from}" not found in verbs.js`);
  return SRC.replace(from, to);
};
const failures = r => r.appProblems.length + r.errors.length;

test("current verbs.js: no errors", async () => {
  const r = await validate(SRC);
  assert.deepEqual(r.appProblems, []);
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.counts, { total: 267, irregular: 92, regular: 175 });
});

test("catches a JavaScript syntax error", async () => {
  const r = await validate(SRC.replace("const VERBS", "const VERBS = [ ,,, ; const VERBS_BROKEN"));
  assert.ok(failures(r) > 0);
});

test("catches a wrong futur form (aller: je irais instead of irai)", async () => {
  const r = await validate(swap('je:   { fr: "irai", phon: "ee-ray"', 'je:   { fr: "irais", phon: "ee-ray"'));
  assert.ok(r.errors.some(e => /aller: futur/.test(e)), r.errors.join("\n"));
});

test("catches a wrong auxiliary (aller: ai allé)", async () => {
  const r = await validate(swap('je:   { fr: "suis allé(e)"', 'je:   { fr: "ai allé(e)"'));
  assert.ok(r.errors.some(e => /aller: passé composé je/.test(e)), r.errors.join("\n"));
});

test("catches a missing person (the app's own check)", async () => {
  const r = await validate(swap('je:   { fr: "irai", phon: "ee-ray", en: "I will go" },', ""));
  assert.ok(r.appProblems.length > 0, "the app reports the missing person");
});

test("catches an accent inside sounds-like text", async () => {
  const r = await validate(swap('phon: "ee-ray"', 'phon: "ée-ray"'));
  assert.ok(r.errors.some(e => /accented letter/.test(e)), r.errors.join("\n"));
});

test("Phase 7: every shared English prompt has a hint, so there are no warnings", async () => {
  const r = await validate(SRC);
  assert.deepEqual(r.warnings, []);
});
