#!/usr/bin/env node
// Validate verbs.js before uploading it.  Usage:  npm run validate   (or: node tests/validate-verbs.js [path/to/verbs.js])
// 1. Loads the app in jsdom and reports every problem its own checks (checkVerb, checkRules) find.
// 2. Runs the extra consistency checks in tests/lib/checks.js.
// Exits with code 1 if there is any error, so it can gate a commit. Warnings never fail the run.
"use strict";
const fs = require("fs");
const path = require("path");
const { loadApp, loadVerbsData, ROOT } = require("./lib/load-app");
const { runChecks } = require("./lib/checks");

async function validate(verbsSource) {
  const out = { appProblems: [], errors: [], warnings: [], counts: null };
  let data;
  try { data = loadVerbsData(verbsSource); }
  catch (e) { out.errors.push("verbs.js could not be read as JavaScript: " + e.message); return out; }

  const app = await loadApp({ verbsSource }).catch(e => { out.errors.push(e.message); return null; });
  if (app) {
    out.appProblems = Array.from(app.verbes.problems || [], p => typeof p === "string" ? p : JSON.stringify(p));
    const vs = app.verbes.verbs;
    out.counts = { total: vs.length, irregular: vs.filter(v => v.type === "irregular").length, regular: vs.filter(v => v.type === "regular").length };
    if (app.errors.length) out.errors.push(...app.errors.map(e => "page error: " + e));
    app.close();
  }
  const r = runChecks(data);
  out.errors.push(...r.errors);
  out.warnings.push(...r.warnings);
  return out;
}

async function main() {
  const file = process.argv[2] ? path.resolve(process.argv[2]) : path.join(ROOT, "verbs.js");
  const res = await validate(fs.readFileSync(file, "utf8"));
  const errs = res.appProblems.length + res.errors.length;
  if (res.counts) console.log(`Loaded ${res.counts.total} verbs (${res.counts.irregular} irregular, ${res.counts.regular} regular) from ${path.relative(process.cwd(), file) || file}.`);
  if (res.appProblems.length) { console.log(`\nThe app would skip or flag these (${res.appProblems.length}):`); res.appProblems.forEach(p => console.log("  ✗ " + p)); }
  if (res.errors.length) { console.log(`\nData errors (${res.errors.length}):`); res.errors.forEach(e => console.log("  ✗ " + e)); }
  if (res.warnings.length) { console.log(`\nWarnings (${res.warnings.length}), not blocking:`); res.warnings.forEach(w => console.log("  ! " + w)); }
  console.log(errs ? `\nFAILED: ${errs} error(s). Fix these before uploading verbs.js.` : "\nOK: no errors.");
  process.exitCode = errs ? 1 : 0;
}

if (require.main === module) main().catch(e => { console.error(e); process.exitCode = 1; });
module.exports = { validate };
