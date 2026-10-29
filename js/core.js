// Verbes: Constants, helpers, notices, backups, settings, verb data loading and validation.
// Plain script, no build step. Loaded by index.html in this order: core.js, conjugate.js, audio.js, study.js, screens.js, scheduler.js, app.js.
"use strict";
/* =========================================================================
   CONSTANTS AND SMALL HELPERS
   ========================================================================= */
const APP_VERSION = "6.10";
const SCHEMA = 1;
// Storage keys. NEVER rename these: saved progress lives under them.
const KEYS = { settings: "frverbs.settings", progress: "frverbs.progress", schedule: "frverbs.schedule", timing: "frverbs.timing", session: "frverbs.session", formsched: "frverbs.formsched", history: "frverbs.history", lastbackup: "frverbs.lastbackup", sync: "frverbs.sync", syncat: "frverbs.syncat", review: "frverbs.review", aikey: "frverbs.aikey", aibad: "frverbs.aibad", aistats: "frverbs.aistats", clipcache: "frverbs.clipcache", backup: "frverbs.backup." };
const EXPORT_SCHEMA = 4;
const TYPE_ORDER = ["irregular", "regular"];
const GLOSS = { present: "now, or what usually happens", passe_compose: "finished past: I did, I have done", imparfait: "ongoing past: I was doing, I used to do", futur: "future: I will do", conditionnel: "would: I would do, polite requests" };
const GLOSS_S = { present: "now", passe_compose: "finished past", imparfait: "ongoing past", futur: "future", conditionnel: "would" };
const TYPE_LABEL = { irregular: "Irregular verbs", regular: "Regular verbs" };

const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const isObj = o => o !== null && typeof o === "object" && !Array.isArray(o);
const filled = s => typeof s === "string" && s.trim() !== "";
const plural = (n, w) => n + " " + w + (n === 1 ? "" : "s");

const ICON = {
  back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  undo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14L4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5v5a1 1 0 0 0 1 1h3l4.3 3.6a1 1 0 0 0 1.7-.8V5.7a1 1 0 0 0-1.7-.8L8 8.5H5a1 1 0 0 0-1 1z" fill="currentColor"/><path d="M16.5 8.6a4.8 4.8 0 0 1 0 6.8M19 6.2a8.4 8.4 0 0 1 0 11.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  mic: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15a3.5 3.5 0 0 0 3.5-3.5v-6a3.5 3.5 0 1 0-7 0v6A3.5 3.5 0 0 0 12 15z" fill="currentColor"/><path d="M18.5 11a6.5 6.5 0 0 1-13 0M12 17.5V21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  chev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};

/* =========================================================================
   NOTICES AND TOAST
   ========================================================================= */
const notices = [];
function addNotice(text) {
  notices.push({ id: Math.random().toString(36).slice(2), text });
  renderNotices();
}
function renderNotices() {
  $$(".notices").forEach(box => {
    box.innerHTML = notices.map(n => `<div class="notice" role="status"><p>${esc(n.text)}</p><button class="x" data-dismiss="${n.id}" aria-label="Dismiss">×</button></div>`).join("");
  });
}
let toastTimer = null;
function toast(text) {
  let t = $("#toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
  t.textContent = text; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
}

/* =========================================================================
   STORAGE (every read and write is wrapped)
   ========================================================================= */
let storageWarned = false, writeWarned = false;
function lsGet(k) {
  try { return localStorage.getItem(k); }
  catch (e) {
    if (!storageWarned) { storageWarned = true; addNotice("This browser is blocking saved data, so progress and settings will be lost when you close the page."); }
    return null;
  }
}
function lsSet(k, v) {
  try { localStorage.setItem(k, v); return true; }
  catch (e) {
    if (!writeWarned) { writeWarned = true; addNotice("Your progress couldn’t be saved in this browser (storage is full or blocked). Export a backup from Settings to keep it."); }
    return false;
  }
}
function lsRemove(k) { try { localStorage.removeItem(k); } catch (e) {} }
function stamp() { return new Date().toISOString().replace(/[:.]/g, "-"); }
// A copy of one store, made when that store is found damaged.
function makeBackup(label, raw) {
  if (raw == null) return null;
  const k = KEYS.backup + label + "." + stamp();
  lsSet(k, raw);
  pruneBackups();
  return k;
}
// Before an import, reset or restore, every store is copied into one bundle, so the whole state can be put back
// together. The newest 3 bundles are kept, and separately the newest 3 single-store copies.
const BUNDLE_STORES = [["settings", KEYS.settings], ["progress", KEYS.progress], ["schedule", KEYS.schedule], ["formsched", KEYS.formsched],
  ["review", KEYS.review], ["timing", KEYS.timing], ["session", KEYS.session], ["history", KEYS.history]];
const BUNDLE_PREFIX = KEYS.backup + "bundle.";
function makeBundle(label) {
  const stores = {};
  BUNDLE_STORES.forEach(([n, k]) => { stores[n] = lsGet(k); });
  const key = BUNDLE_PREFIX + label + "." + stamp();
  if (!lsSet(key, JSON.stringify({ v: 1, label, at: new Date().toISOString(), app: APP_VERSION, stores }))) return null;
  pruneBackups();
  return key;
}
function listBundles() {
  const out = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i); if (!k || k.indexOf(BUNDLE_PREFIX) !== 0) continue;
      let b = null; try { b = JSON.parse(lsGet(k)); } catch (e) {}
      if (isObj(b) && isObj(b.stores)) out.push({ key: k, label: String(b.label || ""), at: String(b.at || "") });
    }
  } catch (e) {}
  return out.sort((a, b) => b.key.slice(b.key.lastIndexOf(".") + 1).localeCompare(a.key.slice(a.key.lastIndexOf(".") + 1)));
}
// Writes a bundle's stores back. A store that was empty when the bundle was made is removed.
function restoreBundle(b) {
  if (!isObj(b) || !isObj(b.stores)) return false;
  BUNDLE_STORES.forEach(([n, k]) => { const raw = b.stores[n]; if (typeof raw === "string") lsSet(k, raw); else lsRemove(k); });
  return true;
}
function pruneBackups() {
  try {
    const bundles = [], singles = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i); if (!k || k.indexOf(KEYS.backup) !== 0) continue;
      (k.indexOf(BUNDLE_PREFIX) === 0 ? bundles : singles).push(k);
    }
    const when = k => k.slice(k.lastIndexOf(".") + 1);
    const newestFirst = (a, b) => when(b).localeCompare(when(a)) || b.localeCompare(a);
    [bundles, singles].forEach(ks => ks.sort(newestFirst).slice(3).forEach(lsRemove));
  } catch (e) {}
}

/* ---------- settings ---------- */
const DEFAULTS = {
  autoplay: true, direction: "en-fr", phonetics: "always", mic: true,
  voice: "", rate: 0.9, theme: "system", textSize: 1,
  repeatAudio: 1, repeatPile: true, swipe: true, haptics: true, animations: true, keyLegend: true,
  practiseContent: "main", practiseOrder: "order",
  maxNew: 8, secondPass: true, sectionOrder: ["irregular", "er", "ir", "re"],
  budget: 30, budgetIrr: 20, budgetReg: 10, maxNewForms: 20, autoBackup: true,
  lapse: "on", reviewTarget: 7,
  aiVoices: true
};
const CHOICES = {
  direction: ["en-fr", "fr-en", "mixed"], phonetics: ["always", "tap", "hidden"], theme: ["system", "light", "dark"],
  textSize: [0, 1, 2, 3], repeatAudio: [1, 2], practiseContent: ["main", "key", "full"], practiseOrder: ["order", "shuffle"],
  maxNew: [2, 4, 6, 8, 10, 12],
  budget: [20, 25, 30, 35, 40, 45], budgetIrr: [15, 18, 20], budgetReg: [5, 10, 15], maxNewForms: [10, 15, 20, 25, 30],
  lapse: ["gentle", "on"], reviewTarget: [3, 5, 7]
};
const SCALE = [0.9, 1, 1.15, 1.3];
function freshDefaults() { return JSON.parse(JSON.stringify(DEFAULTS)); }
let settings = freshDefaults();

function cleanSettings(o) {
  const s = freshDefaults();
  if (!isObj(o)) return s;
  Object.keys(DEFAULTS).forEach(k => {
    const v = o[k], d = DEFAULTS[k];
    if (v === undefined) return;
    if (CHOICES[k]) { if (CHOICES[k].includes(v)) s[k] = v; }
    else if (Array.isArray(d)) { if (Array.isArray(v) && v.every(x => typeof x === "string")) s[k] = v.slice(); }
    else if (k === "rate") { if (typeof v === "number" && v >= 0.5 && v <= 1.3) s[k] = v; }
    else if (typeof d === "boolean") { if (typeof v === "boolean") s[k] = v; }
    else if (typeof d === "string") { if (typeof v === "string") s[k] = v; }
  });
  // v6.4: the two section budgets became one daily budget. Carry over their total, to the nearest choice.
  if (o.budget === undefined && typeof o.budgetIrr === "number" && typeof o.budgetReg === "number") {
    const sum = o.budgetIrr + o.budgetReg; s.budget = CHOICES.budget.reduce((a, b) => (Math.abs(b - sum) < Math.abs(a - sum) ? b : a));
  }
  return s;
}
function loadSettings() {
  const raw = lsGet(KEYS.settings);
  if (raw == null) return freshDefaults();
  try {
    const o = JSON.parse(raw);
    if (!isObj(o) || typeof o.schema !== "number") throw new Error("bad");
    return cleanSettings(o);
  } catch (e) {
    const k = makeBackup("settings-damaged", raw);
    addNotice(`Your saved settings were damaged, so they’ve been reset to the defaults. The damaged copy is kept in this browser under “${k}”.`);
    return freshDefaults();
  }
}
function saveSettings() { lsSet(KEYS.settings, JSON.stringify(Object.assign({ schema: SCHEMA }, settings))); }

/* ---------- progress: { schema, verbs: { verbId: { cardKey: record } } } ---------- */
let progress = { schema: SCHEMA, verbs: {} };
function loadProgress() {
  const raw = lsGet(KEYS.progress);
  if (raw == null) return { schema: SCHEMA, verbs: {} };
  try {
    const o = JSON.parse(raw);
    if (!isObj(o) || typeof o.schema !== "number" || !isObj(o.verbs)) throw new Error("bad");
    if (o.schema > SCHEMA) throw new Error("newer");
    return o;
  } catch (e) {
    const k = makeBackup("progress-damaged", raw);
    addNotice(`Your saved progress was damaged and couldn’t be read, so it has started fresh. The damaged copy is kept in this browser under “${k}”. If you have an export file, import it from Settings.`);
    return { schema: SCHEMA, verbs: {} };
  }
}
function saveProgress() { lsSet(KEYS.progress, JSON.stringify(progress)); }
function getRec(verbId, key) {
  const v = progress.verbs[verbId];
  return isObj(v) && isObj(v[key]) ? v[key] : null;
}
function ensureRec(verbId, key) {
  if (!isObj(progress.verbs[verbId])) progress.verbs[verbId] = {};
  const v = progress.verbs[verbId];
  if (!isObj(v[key])) v[key] = { seen: 0, known: 0, missed: 0 };
  return v[key];
}

/* =========================================================================
   VERB DATA: LOAD AND VALIDATE
   ========================================================================= */
let TENSE_KEYS = [], PERSONS = [], VERBS_OK = [], BY_ID = {}, PROBLEMS = [], FATAL = "", SECTIONS = [];
let RULESX = {}, AUX = null;
const brokenGroups = new Set();
const rankSeen = new Set();
const rankKey = r => r[0] + parseFloat(r.slice(1));

function checkGroup(G) {
  const e = [];
  if (!isObj(G)) return ["must be { ... }"];
  if (!filled(G.name)) e.push("needs a name");
  if (!filled(G.infinitiveEnding)) e.push("needs infinitiveEnding");
  if (!isObj(G.participle) || typeof G.participle.fr !== "string" || typeof G.participle.phon !== "string") e.push("needs participle: { fr, phon }");
  if (!isObj(G.futureStem) || typeof G.futureStem.drop !== "number" || typeof G.futureStem.phon !== "string") e.push("needs futureStem: { drop, phon }");
  if (G.like !== undefined && (!filled(G.like) || !isObj(RULESX[G.like]) || RULESX[G.like].like !== undefined)) e.push('like must name another group without its own like, e.g. "er"');
  if (!isObj(G.tenses)) { e.push("needs tenses"); return e; }
  TENSE_KEYS.forEach(t => {
    const R = G.tenses[t];
    if (!isObj(R)) { e.push(`has no rule for the tense “${t}”`); return; }
    if (!["stem", "future", "auxiliary"].includes(R.from)) { e.push(`tenses.${t}.from must be "stem", "future" or "auxiliary"`); return; }
    if (R.from === "auxiliary") return;
    if (!isObj(R.endings)) { e.push(`tenses.${t} needs endings`); return; }
    PERSONS.forEach(p => {
      const x = R.endings[p];
      if (!isObj(x) || typeof x.fr !== "string" || typeof x.phon !== "string") e.push(`tenses.${t}.endings is missing “${p}” ({ fr, phon })`);
    });
  });
  Object.keys(G.tenses).forEach(t => { if (!TENSE_KEYS.includes(t)) e.push(`tenses has an unknown tense “${t}”`); });
  return e;
}

function checkVerb(v, errs, seen) {
  if (!isObj(v)) { errs.push("is not a verb entry { ... }"); return; }
  ["id", "type", "group", "english", "french", "phonetic"].forEach(f => { if (!filled(v[f])) errs.push(`missing “${f}”`); });
  if (filled(v.id) && !/^[a-z0-9_-]+$/.test(v.id)) errs.push("id must use lowercase letters, digits, - or _ only (no accents or spaces)");
  if (filled(v.id) && seen.has(v.id)) errs.push(`duplicate id: an earlier entry already uses “${v.id}”`);
  if (filled(v.type) && !TYPE_ORDER.includes(v.type)) errs.push(`unknown type “${v.type}” (use "irregular" or "regular")`);
  const groups = ["irregular"].concat(Object.keys(RULESX));
  if (filled(v.group)) {
    if (!groups.includes(v.group)) errs.push(`unknown group “${v.group}” (use one of: ${groups.join(", ")})`);
    else if (v.type === "regular" && v.group === "irregular") errs.push(`a regular verb needs a regular group (${Object.keys(RULESX).join(", ")})`);
  }
  if (!filled(v.rank) || !/^[IR]\d+(\.\d+)?$/.test(v.rank)) errs.push('missing or invalid “rank” (e.g. "I01" for irregular, "R001" for regular)');
  else {
    if (filled(v.type) && v.rank[0] !== (v.type === "irregular" ? "I" : "R")) errs.push(`rank “${v.rank}” must start with ${v.type === "irregular" ? "I" : "R"} for a ${v.type} verb`);
    if (rankSeen.has(rankKey(v.rank))) errs.push(`duplicate rank “${v.rank}”: an earlier verb already has it`);
  }
  if (v.auxiliary !== undefined && v.auxiliary !== "avoir" && v.auxiliary !== "être") errs.push('auxiliary must be "avoir" or "être"');
  if (v.hAspire !== undefined && typeof v.hAspire !== "boolean") errs.push("hAspire must be true or false");
  if (v.test !== undefined && typeof v.test !== "boolean") errs.push("test must be true or false");
  if (v.hint !== undefined && !filled(v.hint)) errs.push("hint must be a short piece of text");
  if (v.family !== undefined && !filled(v.family)) errs.push('family must be text, e.g. "like prendre"');
  if (v.reflexive !== undefined && typeof v.reflexive !== "boolean") errs.push("reflexive must be true or false");
  if (v.reflexive === true && v.type !== "regular") errs.push("reflexive: true is for regular verbs; irregular reflexive verbs write the pronoun into every form");
  if (v.type === "regular" && filled(v.french) && /^(se |s')/.test(v.french) !== (v.reflexive === true)) errs.push(v.reflexive === true ? "a reflexive verb's french must start with se or s'" : "a regular verb starting with se or s' needs reflexive: true");
  if (v.reflexive === true && v.auxiliary === "avoir") errs.push("reflexive verbs take être in the passé composé");
  const PS = Array.isArray(v.persons) ? v.persons : PERSONS;
  if (v.persons !== undefined && (!Array.isArray(v.persons) || !v.persons.length || v.persons.some(p => !PERSONS.includes(p)) || new Set(v.persons).size !== v.persons.length)) errs.push(`persons must list one or more of: ${PERSONS.join(", ")}`);
  if (v.expressions !== undefined && (!Array.isArray(v.expressions) || v.expressions.length < 1 || v.expressions.length > 3 || v.expressions.some(x => !isObj(x) || !filled(x.fr) || !filled(x.phon) || !filled(x.en)))) errs.push("expressions must list 1 to 3 phrases, each { fr, phon, en }");
  if (v.conjugations !== undefined && !isObj(v.conjugations)) errs.push("conjugations must be { ... }");
  const C = isObj(v.conjugations) ? v.conjugations : {};
  Object.keys(C).forEach(t => {
    if (!TENSE_KEYS.includes(t)) { errs.push(`unknown tense “${t}” in conjugations (use: ${TENSE_KEYS.join(", ")})`); return; }
    const tab = C[t];
    if (!isObj(tab)) { errs.push(`conjugations.${t} must be { je: {...}, ... }`); return; }
    PS.forEach(p => {
      const f = tab[p];
      if (!isObj(f)) { errs.push(`conjugations.${t} is missing the person “${p}”`); return; }
      if (!filled(f.fr)) errs.push(`conjugations.${t}.${p} needs fr`);
      if (!filled(f.phon)) errs.push(`conjugations.${t}.${p} needs phon`);
      if (v.type === "irregular" && !filled(f.en)) errs.push(`conjugations.${t}.${p} needs en`);
    });
    Object.keys(tab).forEach(p => { if (!PS.includes(p)) errs.push(PERSONS.includes(p) ? `conjugations.${t} has “${p}”, which is not in persons` : `conjugations.${t} has an unknown person “${p}” (use: ${PERSONS.join(", ")})`); });
  });
  if (v.type === "irregular") {
    if (!isObj(v.conjugations)) errs.push("irregular verbs need conjugations");
    else TENSE_KEYS.forEach(t => { if (!C[t]) errs.push(`conjugations is missing the tense “${t}”`); });
  }
  if (v.type === "regular" && isObj(RULESX[v.group])) {
    const G = RULESX[v.group];
    if (brokenGroups.has(v.group)) errs.push(`RULES.${v.group} has problems (listed above)`);
    if (!filled(v.stemPhon)) errs.push('regular verbs need stemPhon (the sound of the stem, e.g. "parl")');
    if (filled(v.french) && filled(G.infinitiveEnding) && !v.french.endsWith(G.infinitiveEnding)) errs.push(`“${v.french}” doesn’t end in -${G.infinitiveEnding}`);
    const needsAux = isObj(G.tenses) && TENSE_KEYS.some(t => isObj(G.tenses[t]) && G.tenses[t].from === "auxiliary" && !C[t]);
    if (needsAux && !AUX) errs.push("AUXILIARIES is missing or incomplete, so the passé composé can’t be built");
  }
}

function loadData() {
  if (window.__verbsMissing) { FATAL = "verbs.js didn’t load. It must sit in the same folder as index.html, with exactly that name."; return; }
  if (window.__verbsErrors.length || typeof VERBS === "undefined") {
    FATAL = "verbs.js has an error, so no verbs could be loaded" +
      (window.__verbsErrors.length ? ": " + window.__verbsErrors.join("; ") + "." : ". Open Chrome’s console (Ctrl+Shift+J) to see the line. A missing comma or bracket is the usual cause.");
    return;
  }
  const T = typeof TENSES !== "undefined" ? TENSES : null;
  if (!isObj(T) || !Object.keys(T).length) { FATAL = "verbs.js has no TENSES object."; return; }
  const P = typeof PRONOUNS !== "undefined" ? PRONOUNS : null;
  if (!isObj(P) || !Object.keys(P).length) { FATAL = "verbs.js has no PRONOUNS object."; return; }
  PERSONS = Object.keys(P);
  const pErr = PERSONS.filter(p => !isObj(P[p]) || !filled(P[p].fr) || typeof P[p].phon !== "string");
  if (pErr.length) { FATAL = `PRONOUNS.${pErr[0]} needs fr and phon.`; return; }
  TENSE_KEYS = Object.keys(T).filter(k => {
    if (isObj(T[k]) && filled(T[k].name)) return true;
    PROBLEMS.push({ where: `TENSES.${k}`, errs: ["needs a name, so this tense was skipped"] });
    return false;
  });
  if (!TENSE_KEYS.length) { FATAL = "TENSES has no usable tenses."; return; }
  RULESX = (typeof RULES !== "undefined" && isObj(RULES)) ? RULES : {};
  Object.keys(RULESX).forEach(g => {
    const e = checkGroup(RULESX[g]);
    if (e.length) { brokenGroups.add(g); PROBLEMS.push({ where: `RULES.${g}`, errs: e }); }
  });
  const A = typeof AUXILIARIES !== "undefined" ? AUXILIARIES : null;
  const auxOk = isObj(A) && ["avoir", "être"].every(a => isObj(A[a]) && PERSONS.every(p => isObj(A[a][p]) && filled(A[a][p].fr) && typeof A[a][p].phon === "string"))
    && isObj(A.agreement) && PERSONS.every(p => typeof A.agreement[p] === "string");
  if (auxOk) AUX = A; else if (A !== null) PROBLEMS.push({ where: "AUXILIARIES", errs: ["needs avoir and être with every person ({ fr, phon }) and agreement for every person"] });
  if (!Array.isArray(VERBS)) { FATAL = "VERBS in verbs.js must be a list: [ ... ]."; return; }

  const seen = new Set();
  VERBS.forEach((raw, i) => {
    const where = `Verb ${i + 1}` + (isObj(raw) && filled(raw.id) ? ` (id “${raw.id}”)` : "");
    const errs = [];
    let prepared = null;
    try {
      checkVerb(raw, errs, seen);
      if (!errs.length) prepared = prepareVerb(raw, i);
    } catch (ex) { errs.push("couldn’t be read (" + (ex && ex.message || ex) + ")"); }
    if (errs.length) PROBLEMS.push({ where, errs });
    else { VERBS_OK.push(prepared); BY_ID[prepared.id] = prepared; seen.add(prepared.id); rankSeen.add(rankKey(prepared.rank)); }
  });
  makePatterns();
}

