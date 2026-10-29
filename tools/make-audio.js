#!/usr/bin/env node
// Records the app's audio once, on a laptop, with OpenAI text to speech (decision D2). The app itself never calls OpenAI.
//
//   OPENAI_API_KEY=sk-... node tools/make-audio.js            record what is missing (asks before spending)
//   node tools/make-audio.js --dry-run                         show what would be recorded and the cost; spends nothing
//   OPENAI_API_KEY=sk-... node tools/make-audio.js --regen ~/Downloads/verbes-regenerate-2026-11-02.json
//                                                              record again the clips flagged "Sounded wrong?"
// Options: --voices marin,cedar (default)   --full (every line a play button can say, not only the cards)
//          --yes (no question)   --prune (delete clips the app no longer uses)   --dir <folder> (default: audio/)
//
// Safe to stop (Ctrl+C) and run again: finished clips are kept and skipped. Each clip is written to
// audio/<voice>/<file id>.mp3; audio/manifest.json tells the app which lines have clips. Commit the audio/ folder.
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const readline = require("readline");

const ROOT = path.resolve(__dirname, "..");
const MODEL = "gpt-4o-mini-tts", URL = "https://api.openai.com/v1/audio/speech";
const VOICES = ["cedar", "coral", "echo", "marin", "onyx", "shimmer"];          // the six that passed the listening test
const DEFAULT_VOICES = ["marin", "cedar"];
const INSTR = {
  fr: "Speak clear, natural French as a native speaker from Paris would, at an even, unhurried pace, like a teacher modelling a verb form for a learner. Read the text exactly as written, with correct liaisons, and add nothing.",
  en: "Speak clear, natural British English at an even, unhurried pace, like a teacher giving the English meaning of a French verb form. Read the text exactly as written and add nothing."
};
const PRICE_PER_MIN = 0.015;                                                     // provisional, as in the audit
const secsOf = t => Math.max(0.8, t.length * 0.08);                              // the app's own estimate per clip

const lineKey = L => L.lang + "|" + L.t;
// A clip's file id changes whenever its text, voice, model, instructions or regeneration count change.
const fileId = (voice, L, rev) => crypto.createHash("sha1").update([voice, L.lang, L.t, MODEL, INSTR[L.lang], rev || 0].join("\u0001")).digest("hex").slice(0, 12);

function parseArgs(argv) {
  const o = { voices: DEFAULT_VOICES.slice(), full: false, yes: false, dry: false, prune: false, regen: null, dir: path.join(ROOT, "audio") };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--voices") o.voices = String(argv[++i] || "").split(",").map(x => x.trim()).filter(Boolean);
    else if (a === "--full") o.full = true;
    else if (a === "--yes") o.yes = true;
    else if (a === "--dry-run") o.dry = true;
    else if (a === "--prune") o.prune = true;
    else if (a === "--regen") o.regen = argv[++i];
    else if (a === "--dir") o.dir = path.resolve(argv[++i]);
    else throw new Error("Unknown option " + a + ". See the top of tools/make-audio.js.");
  }
  const bad = o.voices.filter(v => !VOICES.includes(v));
  if (!o.voices.length || bad.length) throw new Error(`--voices must be from: ${VOICES.join(", ")}`);
  return o;
}

async function appLines(scope) {
  const { loadApp } = require(path.join(ROOT, "tests", "lib", "load-app"));
  const app = await loadApp();
  try { return JSON.parse(JSON.stringify(app.internals.allClipLines(scope))); } finally { app.close(); }
}

const readJSON = f => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch (e) { return null; } };
const exists = f => { try { return fs.statSync(f).size > 0; } catch (e) { return false; } };

function writeManifest(dir, voices, lines, rev) {
  const clips = {}, used = new Set();
  lines.forEach(L => voices.forEach(v => {
    const id = fileId(v, L, rev[v + "|" + lineKey(L)]);
    if (exists(path.join(dir, v, id + ".mp3"))) { (clips[lineKey(L)] = clips[lineKey(L)] || {})[v] = id; used.add(v); }
  }));
  const m = { version: 1, model: MODEL, made: new Date().toISOString().slice(0, 10), voices: voices.filter(v => used.has(v)), clips, rev };
  fs.mkdirSync(dir, { recursive: true });
  const tmp = path.join(dir, "manifest.json.tmp");
  fs.writeFileSync(tmp, JSON.stringify(m));
  fs.renameSync(tmp, path.join(dir, "manifest.json"));
  return m;
}

async function ask(q) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(res => rl.question(q, a => { rl.close(); res(a.trim().toLowerCase()); }));
}

async function speakOne(fetchFn, key, voice, L) {
  for (let attempt = 1; ; attempt++) {
    let res;
    try {
      res = await fetchFn(URL, { method: "POST", headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
        body: JSON.stringify({ model: MODEL, voice, input: L.t, response_format: "mp3", instructions: INSTR[L.lang] }) });
    } catch (e) { if (attempt >= 5) throw new Error("Couldn't reach OpenAI: " + e.message); await sleep(2000 * attempt); continue; }
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    let detail = ""; try { const j = await res.json(); detail = (j && j.error && j.error.message) || ""; } catch (e) {}
    const fatal = res.status === 401 || res.status === 403 || (res.status === 429 && /quota|billing|credit|budget/i.test(detail));
    if (fatal || attempt >= 5) { const e = new Error(`OpenAI said ${res.status}: ${detail || "no detail"}`); e.fatal = true; throw e; }
    await sleep((res.status === 429 ? 5000 : 2000) * attempt);
  }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

// deps (for tests): { fetch, ask, log, lines }
async function run(argv, deps = {}) {
  const o = parseArgs(argv), log = deps.log || console.log, fetchFn = deps.fetch || globalThis.fetch;
  const manPath = path.join(o.dir, "manifest.json"), old = readJSON(manPath) || {};
  const rev = Object.assign({}, old.rev || {});
  const voices = Array.from(new Set(o.voices.concat(Array.isArray(old.voices) ? old.voices : [])));
  const full = deps.lines ? deps.lines.full : await appLines("full");
  const target = deps.lines ? (o.full ? deps.lines.full : deps.lines.cards) : (o.full ? full : await appLines("cards"));

  // Regeneration: each flagged clip that is still current gets a new revision (so a new file id), and its old file goes.
  if (o.regen) {
    const f = readJSON(path.resolve(o.regen));
    if (!f || f.type !== "regenerate" || !Array.isArray(f.items)) throw new Error("That file is not a regeneration list exported from the app.");
    let n = 0;
    f.items.forEach(x => {
      const L = { t: x.text, lang: x.lang }, k = x.voice + "|" + lineKey(L);
      if (!VOICES.includes(x.voice) || fileId(x.voice, L, rev[k]) !== x.id) return;   // already regenerated, or unknown
      try { fs.unlinkSync(path.join(o.dir, x.voice, x.id + ".mp3")); } catch (e) {}
      rev[k] = (rev[k] || 0) + 1; n++;
    });
    log(`Regeneration list: ${n} of ${f.items.length} clip(s) will be recorded again.`);
    f.items.forEach(x => { const L = { t: x.text, lang: x.lang }; if (!target.some(T => lineKey(T) === lineKey(L)) && full.some(F => lineKey(F) === lineKey(L))) target.push(L); });
  }

  const todo = [];
  o.voices.forEach(v => target.forEach(L => { if (!exists(path.join(o.dir, v, fileId(v, L, rev[v + "|" + lineKey(L)]) + ".mp3"))) todo.push({ v, L }); }));
  const secs = todo.reduce((n, x) => n + secsOf(x.L.t), 0), cost = secs / 60 * PRICE_PER_MIN;
  const perVoice = o.voices.map(v => `${v} ${todo.filter(x => x.v === v).length}`).join(", ");
  log(`${target.length} lines (${o.full ? "full list" : "cards"}), voices ${o.voices.join(" and ")}. To record: ${todo.length} clips (${perVoice}).`);
  log(`Estimated cost: about $${cost.toFixed(2)} (${(secs / 60).toFixed(0)} min of audio at $${PRICE_PER_MIN}/min, provisional).`);

  if (!o.dry && todo.length) {
    const key = (process.env.OPENAI_API_KEY || "").trim();
    if (!key && !deps.fetch) throw new Error("Set OPENAI_API_KEY first, e.g.  OPENAI_API_KEY=sk-... node tools/make-audio.js");
    if (!o.yes) { const a = await (deps.ask || ask)(`Spend about $${cost.toFixed(2)}? Type yes to start: `); if (a !== "yes") { log("Nothing recorded."); return { recorded: 0, todo: todo.length, cost }; } }
    o.voices.forEach(v => fs.mkdirSync(path.join(o.dir, v), { recursive: true }));
    let done = 0, failed = 0, stop = null, next = 0;
    const worker = async () => {
      while (!stop && next < todo.length) {
        const { v, L } = todo[next++];
        try {
          const buf = await speakOne(fetchFn, key, v, L), f = path.join(o.dir, v, fileId(v, L, rev[v + "|" + lineKey(L)]) + ".mp3");
          fs.writeFileSync(f + ".tmp", buf); fs.renameSync(f + ".tmp", f); done++;
          if (done % 50 === 0) { writeManifest(o.dir, voices, full, rev); log(`  ${done} of ${todo.length}`); }
        } catch (e) { if (e.fatal) stop = e; else failed++; }
      }
    };
    await Promise.all([1, 2, 3, 4].map(worker));
    const m = writeManifest(o.dir, voices, full, rev);
    log(`Recorded ${done} clip(s)${failed ? `, ${failed} failed (run again to retry)` : ""}. The manifest lists ${Object.keys(m.clips).length} lines.`);
    if (stop) throw new Error(stop.message + " Fix it and run again; finished clips are kept.");
  } else if (!o.dry) { writeManifest(o.dir, voices, full, rev); log("Nothing to record. Manifest refreshed."); }

  if (o.prune && !o.dry) {
    const m = readJSON(manPath), keep = new Set();
    Object.values(m.clips).forEach(c => Object.entries(c).forEach(([v, id]) => keep.add(v + "/" + id + ".mp3")));
    let n = 0;
    voices.forEach(v => { let fl = []; try { fl = fs.readdirSync(path.join(o.dir, v)); } catch (e) {} fl.forEach(f => { if (!keep.has(v + "/" + f)) { fs.unlinkSync(path.join(o.dir, v, f)); n++; } }); });
    log(`Pruned ${n} unused file(s).`);
  }
  return { todo: todo.length, cost };
}

if (require.main === module) run(process.argv.slice(2)).catch(e => { console.error("\n" + e.message); process.exitCode = 1; });
module.exports = { run, fileId, parseArgs, DEFAULT_VOICES };
