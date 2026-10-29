#!/usr/bin/env node
// Writes tests/out/forms.json: every verb's forms as the app builds them (irregular from verbs.js,
// regular from the app's own rules). Used by tests/reference_check.py.
"use strict";
const fs = require("fs");
const path = require("path");
const { loadApp, plain } = require("./lib/load-app");

const PERSONS = ["je", "tu", "il", "nous", "vous", "ils"];

async function main() {
  const app = await loadApp();
  const out = app.verbes.verbs.map(v => {
    const forms = {};
    Object.keys(v.tables).forEach(t => {
      const rows = v.tables[t].rows;
      forms[t] = {};
      rows.forEach(r => { if (PERSONS.includes(r.key)) forms[t][r.key] = r.form; });
    });
    return { id: v.id, french: v.french, type: v.type, forms };
  });
  const dir = path.join(__dirname, "out");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "forms.json"), JSON.stringify(plain(out)));
  console.log(`Wrote ${out.length} verbs to tests/out/forms.json`);
  app.close();
}
main().catch(e => { console.error(e); process.exitCode = 1; });
