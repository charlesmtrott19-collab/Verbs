#!/usr/bin/env node
// Regenerates the expected-output fixtures from the CURRENT app:
//   tests/fixtures/golden-tables.json  conjugation tables for 10 sample verbs
//   tests/fixtures/baseline-sim.json   what the planner introduces over 30 days from a fresh start
// Only run this when a change to tables or planning is intended, then review the diff before committing:
//   node tests/make-golden.js && git diff tests/fixtures
"use strict";
const fs = require("fs");
const path = require("path");
const { loadApp } = require("./lib/load-app");

// Chosen to cover: être/avoir, an être verb, a reflexive verb, s'en aller (en), the three regular groups,
// a regular être verb, and an -ier verb.
const SAMPLE = ["etre", "avoir", "aller", "faire", "se-souvenir", "s-en-aller", "parler", "finir", "vendre", "arriver", "etudier"];
const SIM_START = "2026-11-02";

const pickRow = r => ({ key: r.key, label: r.label, fr: r.fr, phon: r.phon, en: r.en, speak: r.speak,
  subs: (r.subs || []).map(s => ({ label: s.label, fr: s.fr, phon: s.phon, en: s.en, speak: s.speak })) });

function tablesOf(v) {
  const t = {};
  Object.keys(v.tables).forEach(k => { t[k] = v.tables[k].rows.map(pickRow); });
  return { id: v.id, french: v.french, english: v.english, phonetic: v.phonetic, type: v.type, group: v.group, auxiliary: v.auxiliary || null, tables: t };
}

function simSummary(verbes, passRate) {
  const r = verbes.simulate(30, passRate, verbes.avgCosts(), SIM_START, false);
  const rows = r.rows;
  return {
    passRate, start: SIM_START, days: rows.length,
    newIrregular: rows.reduce((s, x) => s + (x.pa ? x.pa.length : 0), 0),
    newRegular: rows.reduce((s, x) => s + (x.pb ? x.pb.length : 0), 0),
    totalReviews: rows.reduce((s, x) => s + (x.reviews || 0), 0),
    totalMinutes: Math.round(rows.reduce((s, x) => s + (x.min || 0), 0) * 10) / 10,
    firstIrregularCards: [].concat(...rows.map(x => x.pa || [])).slice(0, 40),
    firstRegularCards: [].concat(...rows.map(x => x.pb || [])).slice(0, 20)
  };
}

async function main() {
  const app = await loadApp();
  const byId = new Map(app.verbes.verbs.map(v => [v.id, v]));
  const missing = SAMPLE.filter(id => !byId.has(id));
  if (missing.length) throw new Error("Sample verbs not found: " + missing.join(", "));
  const golden = SAMPLE.map(id => tablesOf(byId.get(id)));
  const sim = { pass100: simSummary(app.verbes, 1), pass85: simSummary(app.verbes, 0.85) };
  const dir = path.join(__dirname, "fixtures");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "golden-tables.json"), JSON.stringify(golden, null, 1) + "\n");
  fs.writeFileSync(path.join(dir, "baseline-sim.json"), JSON.stringify(sim, null, 1) + "\n");
  console.log(`Wrote golden tables for ${golden.length} verbs and the 30-day planner baseline.`);
  app.close();
}

if (require.main === module) main().catch(e => { console.error(e); process.exitCode = 1; });
module.exports = { SAMPLE, SIM_START, tablesOf, simSummary };
