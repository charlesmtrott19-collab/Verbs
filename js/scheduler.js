// Verbes: Scheduler: saved schedule, To review, card model and migrations, planning, the daily session, status model.
// Plain script, no build step. Loaded by index.html in this order: core.js, conjugate.js, audio.js, study.js, screens.js, scheduler.js, app.js.
"use strict";
/* ---------- saved data ---------- */
function loadStore(key, label, valid, fresh) {
  const raw = lsGet(key);
  if (raw == null) return fresh();
  try { const o = JSON.parse(raw); if (!valid(o)) throw new Error("bad"); return o; }
  catch (e) {
    const k = makeBackup(label + "-damaged", raw);
    addNotice(`Your saved ${label} data was damaged, so it has started fresh. The damaged copy is kept in this browser under “${k}”.`);
    return fresh();
  }
}
const freshSchedule = () => ({ schema: 1, verbs: {}, newLog: {} });
const freshTiming = () => ({ schema: 1, main: [], form: [], tense: [], keyforms: [] });
function loadSchedule() {
  const o = loadStore(KEYS.schedule, "schedule", x => isObj(x) && typeof x.schema === "number" && isObj(x.verbs), freshSchedule);
  if (!isObj(o.newLog)) o.newLog = {};
  return o;
}
function loadTiming() {
  const o = loadStore(KEYS.timing, "timing", x => isObj(x) && typeof x.schema === "number", freshTiming);
  CARD_TYPES.forEach(k => { o[k] = Array.isArray(o[k]) ? o[k].filter(x => typeof x === "number" && x > 0) : []; });
  return o;
}
function loadSessionRaw() {
  const raw = lsGet(KEYS.session);
  if (raw == null) return null;
  try {
    const o = JSON.parse(raw);
    if (isObj(o) && o.mode === "sched" && o.schema !== 2) {
      lsRemove(KEYS.session);
      addNotice("A session from the previous version was closed. Everything you had finished is saved; the rest comes back as new cards.");
      return null;
    }
    if (!isObj(o) || o.mode !== "sched" || !isDate(o.date) || !Array.isArray(o.queue) || !isObj(o.vs) || !Array.isArray(o.blocks)) throw new Error("bad");
    return o;
  } catch (e) {
    const k = makeBackup("session-damaged", raw);
    lsRemove(KEYS.session);
    addNotice(`Your saved session was damaged, so it couldn’t be resumed. Your progress is safe. The damaged copy is kept under “${k}”.`);
    return null;
  }
}
const saveSchedule = () => lsSet(KEYS.schedule, JSON.stringify(schedule));
const saveTiming = () => lsSet(KEYS.timing, JSON.stringify(timing));

/* ---------- per-form schedule (irregular verbs): frverbs.formsched ---------- */
// A "unit" is one scheduled card. Irregular verbs: "id|inf" (the infinitive) and "id|tense|person" (one form).
// Regular verbs: just the verb id, stored in schedule.verbs as before.
const freshForms = () => ({ schema: 1, forms: {}, newLog: {}, migrated: false });
let fsched = freshForms();
function loadForms() {
  const o = loadStore(KEYS.formsched, "form schedule", x => isObj(x) && typeof x.schema === "number" && isObj(x.forms), freshForms);
  if (!isObj(o.newLog)) o.newLog = {};
  return o;
}
const saveForms = () => lsSet(KEYS.formsched, JSON.stringify(fsched));
// v6.3: gaps count from the last review, so every reviewed card needs lastDate. Older entries lacking it get the
// date the ladder implies (due date minus the step's gap). Step and due date are never changed. Safe to run again.
function migrateSched() {
  const missing = [];
  [fsched.forms, schedule.verbs].forEach(st => Object.keys(st).forEach(k => { const e = st[k]; if (isObj(e) && (e.enc || 0) > 0 && !isDate(e.lastDate) && isDate(e.due)) missing.push(e); }));
  if (missing.length && !makeBundle("before-v6.3-scheduler")) return;   // no copy, no change; tried again next start
  missing.forEach(e => { const s = Math.max(1, Math.min(8, e.step | 0)); e.lastDate = addDays(e.due, -LADDER[s - 1]); });
  if (missing.length || fsched.sched !== 2 || schedule.sched !== 2) { fsched.sched = 2; schedule.sched = 2; saveForms(); saveSchedule(); }
}

/* ---------- To review: cards missed at their first try, read aloud until ticked off. Key: frverbs.review ---------- */
// Never changes the schedule. Items: { on: date missed, reads, done: date ticked off or "", u: last change in ms }, or { rm: true, u } once removed.
const freshReview = () => ({ schema: 1, items: {}, seeded: false });
let review = freshReview();
const REVIEW_KEEP_DAYS = 30;
function cleanReview(o) {
  const r = freshReview(); if (!isObj(o)) return r;
  r.seeded = !!o.seeded;
  if (isObj(o.items)) Object.keys(o.items).forEach(k => {
    const x = o.items[k]; if (!isObj(x)) return;
    const u = Number.isFinite(x.u) ? x.u : 0;
    if (x.rm === true) { r.items[k] = { rm: true, u }; return; }
    if (!isDate(x.on)) return;
    r.items[k] = { on: x.on, reads: Number.isInteger(x.reads) && x.reads >= 0 ? Math.min(x.reads, 99) : 0, done: isDate(x.done) ? x.done : "", u };
    if (Array.isArray(x.rd)) r.items[k].rd = x.rd.filter(isDate).slice(-REVIEW_RIGHT_DAYS);
  });
  return r;
}
function loadReview() { return cleanReview(loadStore(KEYS.review, "to-review list", x => isObj(x) && isObj(x.items), freshReview)); }
const saveReview = () => lsSet(KEYS.review, JSON.stringify(review));
const reviewTarget = () => settings.reviewTarget || 7;
function reviewPrune() {
  const today = todayStr(), cut = Date.now() - REVIEW_KEEP_DAYS * 86400000; let n = 0;
  Object.keys(review.items).forEach(k => {
    const x = review.items[k];
    if ((x.rm && x.u < cut) || (x.done && dayDiff(x.done, today) > REVIEW_KEEP_DAYS)) { delete review.items[k]; n++; }
  });
  if (n) saveReview();
}
function reviewTouch(k, patch) { review.items[k] = Object.assign({}, review.items[k], patch, { u: Date.now() }); saveReview(); syncSoon(); }
// To review (v6.4, recall): review a card by hearing or seeing its prompt, saying it, then checking. It clears once it is
// right on REVIEW_RIGHT_DAYS different days (rd: the days it was right). Never changes the schedule.
const REVIEW_RIGHT_DAYS = 2;
function reviewRecall(k, knew, date) {
  const x = review.items[k]; if (!x || x.rm || x.done) return;
  const t = date || todayStr(), rd = Array.isArray(x.rd) ? x.rd.slice() : [];
  if (knew && !rd.includes(t)) rd.push(t);
  reviewTouch(k, { rd, done: rd.length >= REVIEW_RIGHT_DAYS ? t : "" });
}
function startReviewSession() {
  const ks = reviewActive(); if (!ks.length) return;
  startSession(ks.map(k => unitSpec(k)), "To review", "shuffle");
  if (session) session.toReview = true;
}
function reviewAdd(k, date) { if (!reviewValid(k)) return; review.items[k] = { on: date, reads: 0, done: "", u: Date.now() }; saveReview(); }
function reviewRead(k) {
  const x = review.items[k]; if (!x || x.rm || x.done) return;
  const reads = x.reads + 1;
  reviewTouch(k, { reads, done: reads >= reviewTarget() ? todayStr() : "" });
}
function reviewBack(k) { const x = review.items[k]; if (x && !x.rm) reviewTouch(k, { reads: 0, done: "" }); }
function reviewRemove(k) { if (review.items[k]) { review.items[k] = { rm: true, u: Date.now() }; saveReview(); syncSoon(); } }
function reviewActive() {
  const it = review.items;
  return Object.keys(it).filter(k => !it[k].rm && !it[k].done && reviewValid(k))
    .sort((a, b) => it[b].on.localeCompare(it[a].on) || (it[b].u - it[a].u) || (a < b ? -1 : 1));
}
function reviewDoneList() {
  const it = review.items;
  return Object.keys(it).filter(k => !it[k].rm && it[k].done && reviewValid(k)).sort((a, b) => it[b].done.localeCompare(it[a].done) || (a < b ? -1 : 1));
}
// First run of v5.5: carry over cards whose latest review was a miss in the last two weeks.
function reviewSeed() {
  if (review.seeded) return;
  const today = todayStr(); let n = 0;
  const take = (k, e) => {
    if (e && e.missed === true && isDate(e.lastDate) && dayDiff(e.lastDate, today) <= 14 && unitValid(k) && !review.items[k]) { review.items[k] = { on: e.lastDate, reads: 0, done: "", u: Date.now() }; n++; }
  };
  Object.keys(fsched.forms).forEach(k => take(k, fsched.forms[k]));
  Object.keys(schedule.verbs).forEach(id => { if (BY_ID[id] && BY_ID[id].type === "regular" && !BY_ID[id].pattern) take(id, schedule.verbs[id]); });
  review.seeded = true; saveReview();
  if (n) addNotice(`${plural(n, "card")} you missed in the last two weeks ${n === 1 ? "was" : "were"} added to To review, in the Library.`);
}
function mergeReview(L, R) {
  const out = {};
  [L, R].forEach(o => { if (!isObj(o)) return; Object.keys(o).forEach(k => { const x = o[k]; if (!isObj(x)) return; if (!out[k] || (x.u || 0) > (out[k].u || 0)) out[k] = x; }); });
  return out;
}
function reviewMarks(vid, t) {
  const set = new Set();
  Object.keys(review.items).forEach(k => { const x = review.items[k]; if (x.rm || x.done) return; const p = k.split("|"); if (p.length === 3 && p[0] === vid && p[1] === t) set.add(p[2]); });
  return set;
}
function reviewHasVerb(v) { const x = review.items[v.type === "irregular" ? v.id + "|inf" : v.id]; return !!(x && !x.rm && !x.done); }
function reviewItem(k) {
  const p = k.split("|"), v = BY_ID[p[0]]; if (!v) return null;
  if (p.length === 1 || p[1] === "inf") return { fr: v.french, meta: p.length === 1 ? "regular verb" : "infinitive", en: v.english, say: [v.french], enSay: v.english };
  if (p[1] === "x") { const x = v.expressions[+p[2]]; return x ? { fr: x.fr, meta: v.french + " · expression", en: x.en, say: [x.fr], enSay: x.en } : null; }
  const tab = v.tables[p[1]], r = tab && tab.rows.find(x => x.key === p[2]); if (!r) return null;
  // English: one line per meaning. il · elle · on gives "he is / she is / one is"; a repeated meaning (ils · elles) shows once.
  let lines = r.subs ? Array.from(new Set(r.subs.map(x => String(x.en || "").split("\n")[0]).filter(Boolean))) : (r.enL && r.enL.length ? r.enL.slice() : String(r.en || "").split("\n").filter(Boolean));
  if (!lines.length) lines = [v.english];
  return { fr: r.subs ? r.subs.map(x => x.fr).join(" · ") : r.fr, meta: v.french + " · " + TENSES[p[1]].name, en: lines.join("\n"), say: clipsOf([r]), enSay: lines.join(". ") };
}
// French clips then one English clip per card. `spans` maps each card to the clip numbers it covers, for the row highlight.
function reviewClips(keys) {
  const clips = [], spans = {};
  keys.forEach(k => {
    const it = reviewItem(k); if (!it) return;
    const a = clips.length;
    it.say.forEach(t => clips.push(t));
    if (it.enSay) clips.push({ t: it.enSay, lang: "en" });
    spans[k] = Array.from({ length: clips.length - a }, (_, i) => a + i).join(" ");
  });
  return { clips, spans };
}
function reviewRowHTML(k, spans, done) {
  const it = reviewItem(k), x = review.items[k]; if (!it) return "";
  return `<li class="rvrow"${spans && spans[k] ? ` data-clips="${spans[k]}"` : ""}><div class="rvtxt"><div class="rvfr" lang="fr">${esc(it.fr)}</div><div class="rvmeta">${esc(it.meta)} · missed ${esc(fmtDate(x.on))}</div><div class="rven">${escL(it.en)}</div></div>` +
    `<div class="rvbtns">${playClipsBtn(it.say, "Play", "Play " + it.fr)}` +
    (done ? `<button class="ghost sm" data-rback="${esc(k)}">Put back</button>`
      : `<span class="rvprog">Right on ${(x.rd || []).length} of ${REVIEW_RIGHT_DAYS} days</span><button class="linkbtn sm" data-rrem="${esc(k)}">Remove</button>`) + `</div></li>`;
}
function reviewHTML() {
  const act = reviewActive(), dn = reviewDoneList(), sp = reviewClips(act).spans;
  let h = `<section class="lib rvsec" id="rvsec"><div class="libhead"><div><h2>To review</h2><p class="count">${act.length ? `${plural(act.length, "card")} you missed. Review them: see or hear each one, say it, then check. A card clears once you get it right on ${REVIEW_RIGHT_DAYS} different days.` : "Nothing to review. Cards you miss in your daily session appear here."}</p></div>` +
    (act.length ? `<div class="btnrow"><button class="primary sm" data-rstart>Review now</button><button class="play" data-rplayall aria-label="Play all to review, French then English">${ICON.play}<span>Play all</span></button><button class="ghost sm" data-rclear>Clear list</button></div>` : "") + "</div>";
  if (act.length) h += `<ul class="rvlist">${act.map(k => reviewRowHTML(k, sp, false)).join("")}</ul>`;
  if (dn.length) h += `<details class="shelpbox"><summary>Done (${dn.length}), kept for ${REVIEW_KEEP_DAYS} days</summary><ul class="rvlist">${dn.map(k => reviewRowHTML(k, null, true)).join("")}</ul></details>`;
  return h + "</section>";
}
function renderReviewSec() { const el = $("#reviewSec"); if (el) el.innerHTML = reviewHTML(); }
let lastRead = { k: "", t: 0 };
$("#reviewSec").addEventListener("click", async e => {
  const t = e.target;
  const say = t.closest("[data-say]"); if (say) { speak(sayArg(say), say); return; }
  if (t.closest("[data-rstart]")) { startReviewSession(); return; }
  const pa = t.closest("[data-rplayall]"); if (pa) { const c = reviewClips(reviewActive()).clips; if (c.length) speak(c, pa); return; }
  const rd = t.closest("[data-rread]");
  if (rd) {
    const k = rd.dataset.rread, now = Date.now();
    if (lastRead.k === k && now - lastRead.t < 600) return; // a double tap counts once
    lastRead = { k, t: now };
    stopSpeech(); reviewRead(k); renderReviewSec(); return;
  }
  const rm = t.closest("[data-rrem]"); if (rm) { stopSpeech(); reviewRemove(rm.dataset.rrem); renderReviewSec(); return; }
  const bk = t.closest("[data-rback]"); if (bk) { reviewBack(bk.dataset.rback); renderReviewSec(); return; }
  if (t.closest("[data-rclear]")) {
    const act = reviewActive();
    if (await confirmBox("Clear To review?", `<p>This removes ${plural(act.length, "card")} from the list. They come back only if you miss them again. Your schedule is not affected.</p>`, "Clear", true)) {
      stopSpeech(); act.forEach(reviewRemove); renderReviewSec();
    }
  }
});
const isFormUnit = k => k.indexOf("|") > 0;
const unitVerb = k => k.split("|")[0];
/* ---------- card model (Phase 6, v6.8: Section 2C, D3, D7) ----------
   Irregular verb: the infinitive, 6 présent person cards and one key card per other tense ("id|tense|*"), which asks
   one sampled person at each review. Impersonal verbs keep one il card per tense. Expression verbs (D7): the infinitive
   plus one card per expression ("id|x|0"). Regular groups (-er, -ir, -re): one pattern card per tense ("~er.present"),
   kept with the regular schedule; each review samples an introduced verb of the group and a person. */
const KEY = "*", TENSE_OFF = { present: 0, passe_compose: 10, imparfait: 25, futur: 35, conditionnel: 45 };
const exprVerb = v => v.type === "irregular" && v.expressions.length > 0;
const keyTense = (v, t) => t !== "present" && !v.impersonal && !exprVerb(v);
let PATTERNS = [];
function makePatterns() {
  PATTERNS = [];
  const gs = [];
  VERBS_OK.forEach(v => { if (v.type === "regular" && !gs.includes(v.section)) gs.push(v.section); });
  gs.forEach(g => TENSE_KEYS.forEach(t => {
    const p = { id: "~" + g + "." + t, type: "regular", pattern: true, group: g, section: g, ptense: t, french: "-" + g + " verbs · " + TENSES[t].name,
      english: "", gloss: "", rank: "R000", rankNum: 0, order: 1e6 + PATTERNS.length, tables: {}, keyRows: [], expressions: [], persons: [] };
    PATTERNS.push(p); BY_ID[p.id] = p;
  }));
}
function verbUnits(v) {
  if (v._u) return v._u;
  const us = [v.id + "|inf"];
  if (exprVerb(v)) v.expressions.forEach((x, i) => us.push(v.id + "|x|" + i));
  else TENSE_KEYS.forEach(t => { const tab = v.tables && v.tables[t]; if (!tab) return; if (keyTense(v, t)) us.push(v.id + "|" + t + "|" + KEY); else tab.rows.forEach(r => us.push(v.id + "|" + t + "|" + r.key)); });
  return (v._u = us);
}
function unitValid(k) {
  const p = k.split("|"), v = BY_ID[p[0]];
  if (!v) return false;
  if (p.length === 1) return true;
  if (v.type !== "irregular") return false;
  if (p[1] === "inf") return p.length === 2;
  if (p[1] === "x") return p.length === 3 && exprVerb(v) && !!v.expressions[+p[2]];
  const tab = v.tables[p[1]];
  if (!tab || p.length !== 3 || exprVerb(v)) return false;
  if (p[2] === KEY) return keyTense(v, p[1]);
  return !keyTense(v, p[1]) && !!tab.rows.find(r => r.key === p[2]);
}
// A form that exists in the tables, scheduled or not (To review keeps the person a key card asked).
const formExists = k => { const p = k.split("|"), v = BY_ID[p[0]], tab = v && p.length === 3 && v.tables[p[1]]; return !!(tab && tab.rows.find(r => r.key === p[2])); };
const reviewValid = k => unitValid(k) || formExists(k);
function unitSpec(k, mode) {
  const p = k.split("|"), pv = BY_ID[k];
  if (pv && pv.pattern) return { verbId: k, kind: "form", pat: k, tense: pv.ptense, person: null, mode: mode || "en-fr" };
  if (p.length === 1 || p[1] === "inf") return { verbId: p[0], kind: "main" };
  if (p[1] === "x") return { verbId: p[0], kind: "main", xi: +p[2], mode };
  if (p[2] === KEY) return { verbId: p[0], kind: "form", tense: p[1], person: null, key: true, mode: mode || "en-fr" };
  return { verbId: p[0], kind: "form", tense: p[1], person: p[2], mode: mode || "en-fr" };
}
function unitKey(it) {
  if (it.pat) return it.pat;
  if (it.kind === "main") return Number.isInteger(it.xi) ? it.verbId + "|x|" + it.xi : BY_ID[it.verbId].type === "irregular" ? it.verbId + "|inf" : it.verbId;
  return it.verbId + "|" + it.tense + "|" + (it.key ? KEY : it.person);
}
// A key card's first test asks the first person (je); later reviews ask the person asked least recently.
function samplePerson(v, t, e) {
  const rows = v.tables[t].rows, pp = e && isObj(e.pp) ? e.pp : {};
  if (!e || !((e.enc || 0) > 0)) return rows[0].key;
  let best = rows[0].key, bd = "~";
  rows.forEach(r => { const d = pp[r.key] || ""; if (d < bd) { bd = d; best = r.key; } });
  return best;
}
// A pattern card asks a random introduced verb of its group (any of the group's verbs if none is) and a random person.
function samplePattern(spec) {
  const pv = BY_ID[spec.pat], intro = VERBS_OK.filter(v => v.type === "regular" && v.section === pv.group && schedule.verbs[v.id]);
  const pool = intro.length ? intro : VERBS_OK.filter(v => v.type === "regular" && v.section === pv.group);
  const v = pool[Math.floor(Math.random() * pool.length)], rows = v.tables[pv.ptense].rows;
  return Object.assign(spec, { verbId: v.id, person: rows[Math.floor(Math.random() * rows.length)].key });
}
function sampled(spec) {
  if (spec.pat) return samplePattern(spec);
  if (spec.key) spec.person = samplePerson(BY_ID[spec.verbId], spec.tense, fsched.forms[unitKey(spec)]);
  return spec;
}
// v6.8: one key card per predictable tense replaces its person cards (Section 2C). It takes the weakest step among them
// and the earliest due date (never before today); its person history starts from their last dates and miss flags.
// Expression verbs: each expression card takes the weakest présent card. The old entries stay, no longer scheduled, so
// going back to v6.7 restores them exactly. Safe to run again: a card that already exists is never changed.
function migrateCards() {
  const today = todayStr(), add = {}, ok = e => isObj(e) && Number.isInteger(e.step) && isDate(e.due);
  const olds = (v, t) => v.tables[t].rows.map(r => [r.key, fsched.forms[v.id + "|" + t + "|" + r.key]]).filter(x => ok(x[1]));
  const merge = list => {
    const w = list.map(x => x[1]).sort((a, b) => a.step - b.step || (a.due < b.due ? -1 : a.due > b.due ? 1 : 0))[0];
    const due = list.map(x => x[1].due).sort()[0], intro = list.map(x => x[1].intro).filter(isDate).sort()[0];
    const e = { step: w.step, enc: w.enc || 0, due: due < today ? today : due, intro: intro || due, pp: {}, pm: {} };
    if (isDate(w.lastDate)) e.lastDate = w.lastDate;
    if (w.dir) e.dir = w.dir;
    list.forEach(([p, x]) => { if (isDate(x.lastDate)) e.pp[p] = x.lastDate; if (x.missed) e.pm[p] = 1; });
    return e;
  };
  VERBS_OK.forEach(v => {
    if (v.type !== "irregular") return;
    if (exprVerb(v)) { const o = olds(v, "present"); if (o.length) v.expressions.forEach((x, i) => { const k = v.id + "|x|" + i; if (!fsched.forms[k]) add[k] = merge(o); }); return; }
    TENSE_KEYS.filter(t => keyTense(v, t)).forEach(t => { const k = v.id + "|" + t + "|" + KEY, o = olds(v, t); if (!fsched.forms[k] && o.length) add[k] = merge(o); });
  });
  const n = Object.keys(add).length;
  if (!n || !makeBundle("before-v6.8-cards")) return 0;   // no copy, no change; tried again next start
  Object.assign(fsched.forms, add); saveForms();
  addNotice(`Version 6.8 tests each tense after the présent with one key card that asks a different person each time. ${plural(n, "key card")} took over from the forms you had started, at their weakest step. A backup is kept in this browser.`);
  return n;
}
const unitStore = (S, k) => (isFormUnit(k) ? S.forms : S.verbs);
function entryOfU(S, k) {
  const e = unitStore(S, k)[k];
  return isObj(e) && Number.isInteger(e.step) && e.step >= 0 && e.step <= 8 && isDate(e.due) ? e : null;
}
function unitCost(k, C, dir) {
  const spk = unitSpec(k).kind === "form" ? C.form : C.main;
  return dir === "fr-en" ? C.listen : dir === "en-fr" ? spk : (spk + C.listen) / 2;
}
const introduced = (S, v) => (v.type === "irregular" ? verbUnits(v).every(k => S.forms[k]) : !!S.verbs[v.id]);
// One-off move from the v3.1 per-verb schedule: every form starts at its verb's current step and due date.
function migrateForms() {
  if (fsched.migrated) return;
  let moved = 0;
  const have = VERBS_OK.filter(v => v.type === "irregular" && entryOf(schedule, v.id));
  if (have.length) {
    makeBackup("pre-v4-schedule", JSON.stringify(schedule));
    have.forEach(v => {
      const e = schedule.verbs[v.id];
      verbUnits(v).forEach((k, i) => {
        if (fsched.forms[k]) return;
        fsched.forms[k] = { step: e.step, enc: e.enc || 0, due: e.step >= 3 ? addDays(e.due, i % 4) : e.due, intro: isDate(e.intro) ? e.intro : e.due };
      });
      moved++;
    });
  }
  fsched.migrated = true; saveForms();
  if (moved) addNotice(`Version 4 now schedules every irregular form separately. ${plural(moved, "irregular verb")} you had already started carried over with the same step and due date. A backup of your old schedule is kept in this browser.`);
}

/* ---------- steps, costs and cards ---------- */
function entryOf(S, id) {
  const e = S.verbs[id];
  return isObj(e) && Number.isInteger(e.step) && e.step >= 0 && e.step <= 8 && isDate(e.due) ? e : null;
}
// step 0 = new, 1–7 = review steps, 8 = long-term
// The step a card drops back to after a first-attempt miss on review step k (0 means no penalty).
// New cards (step 0) and the first, 1-day review (step 1) don't drop back: a miss keeps them where they are,
// due tomorrow (see applyResult). Since v6.1 a miss never moves a card up.
// On: reviews at 3, 7, 14 and 30 days go back to the 1-day step; 60 days, 180 days and long-term go back to the 7-day step.
// Gentle: one step back.
function lapseStep(k) {
  const m = settings.lapse;
  if (!(k >= 2)) return 0;
  if (m === "gentle") return k - 1;
  return LAPSE_TO[Math.min(8, k)];
}
// Put a card back on ladder step s: its next review is the ladder gap below that step, counted from `date`.
function relapse(e, s, date) {
  e.step = s; e.due = addDays(date, LADDER[Math.max(0, s - 1)]);
}
// grade: true or "good" (Know), "hard" (Hard), false or "again" (Don't know): the first attempt of the day only.
//  Know: one step up. Next gap = GOOD_FACTOR x the days since the last review, at least the ladder gap for the step and
//        at most the ladder gap two steps further on (or MAX_GAP), so a late right answer earns a longer gap.
//  Hard: stays on its step. Next gap = HARD_FACTOR x the days since the last review (at least 1 day). A new card moves to step 1.
//  Don't know: never moves a card up. Step 0 or 1: same step, due tomorrow. Step 2+: back down the ladder (lapseStep).
function applyResult(e, grade, date) {
  const g = grade === true || grade === "good" ? "good" : grade === "hard" ? "hard" : "again";
  const k = Math.max(0, Math.min(8, e.step | 0));
  const since = isDate(e.lastDate) && e.lastDate < date ? dayDiff(e.lastDate, date) : 0;
  e.enc = (e.enc || 0) + 1; e.lastDate = date;
  if (g === "again") {
    e.last = "miss";
    const back = lapseStep(k);
    if (back) relapse(e, back, date);
    else { e.step = k; e.due = addDays(date, 1); }
    return;
  }
  e.last = g === "hard" ? "hard" : "pass";
  e.dir = k === 0 ? "en-fr" : (e.dir === "fr-en" ? "en-fr" : "fr-en");
  let gap;
  if (g === "hard") { e.step = Math.max(1, k); gap = Math.max(1, Math.round(HARD_FACTOR * since)); }
  else {
    const lo = LADDER[Math.min(7, k)], hi = k === 0 ? 1 : (k + 2 <= 7 ? LADDER[k + 2] : MAX_GAP);
    gap = Math.min(hi, Math.max(lo, Math.round(GOOD_FACTOR * since)));
    e.step = Math.min(8, k + 1);
  }
  e.due = addDays(date, Math.min(MAX_GAP, gap));
}
function avgCosts() {
  const c = {};
  CARD_TYPES.forEach(k => {
    const a = timing[k] || [];
    if (a.length >= 50) { const r = a.slice(-200); c[k] = r.reduce((s, x) => s + x, 0) / r.length; }
    else c[k] = DEF_COST[k];
  });
  return c;
}
function learnCost(v) { return v.type === "irregular" ? 45 * TENSE_KEYS.length : 60; }
// Shuffle cards so the same verb doesn't come twice in a row where possible.
function spread(list) {
  const a = shuffled(list);
  for (let i = 1; i < a.length; i++) {
    if (a[i].verbId === a[i - 1].verbId) {
      const j = a.findIndex((x, k) => k > i && x.verbId !== a[i - 1].verbId && (k + 1 >= a.length || a[k + 1].verbId !== a[i].verbId));
      if (j > 0) { const t = a[i]; a[i] = a[j]; a[j] = t; }
    }
  }
  return a;
}

/* ---------- sections and ranks ---------- */
const byRank = (a, b) => a.rankNum - b.rankNum;
function schedSections() {
  const gs = [];
  VERBS_OK.forEach(v => { if (!gs.includes(v.section)) gs.push(v.section); });
  const order = settings.sectionOrder.filter(g => gs.includes(g));
  gs.forEach(g => { if (!order.includes(g)) order.push(g); });
  return order;
}
const sectionName = g => (g === "irregular" ? "Irregular verbs" : groupLabel(g));
function sectionVerbs(g) { return VERBS_OK.filter(v => v.section === g).sort(byRank); }

/* ---------- planning ---------- */
// Two blocks: 0 = irregular (one card per form), 1 = regular (main card only). Each has its own time budget.
const BLOCK_NAME = ["Irregular verbs", "Regular verbs"];
const regSections = () => schedSections().filter(g => g !== "irregular");
// One daily budget (settings.budget minutes), shared: irregular verbs are planned first, keeping back at least REG_MIN
// minutes (or the time regular reviews need), and regular verbs get what is left. For pacing new cards against future
// days, each block keeps a share: regular the larger of REG_MIN and a third, irregular the rest (20 + 10 at 30 minutes).
const REG_MIN = 5;
const regShare = () => Math.max(REG_MIN, Math.round(settings.budget / 3));
const blockBudget = bi => (bi === 0 ? settings.budget - regShare() : regShare()) * 60;
const secondF = () => (settings.secondPass ? 2 : 1);
function curState() { return { verbs: schedule.verbs, forms: fsched.forms, newLog: schedule.newLog, fNewLog: fsched.newLog }; }
function blockVerbs(bi) { return bi === 0 ? sectionVerbs("irregular") : [].concat(...regSections().map(sectionVerbs)); }
// Projected review load (raw seconds) on each future date, assuming every review passes.
function loadMap(S, date, C, bi) {
  const m = {}, end = addDays(date, 240);
  const walk = (k, e0) => {
    const e = Object.assign({}, e0), c = unitCost(k, C);
    let d = e.due < date ? date : e.due, n = 0;
    while (d <= end && n++ < 12) { if (d > date) m[d] = (m[d] || 0) + c; applyResult(e, true, d); d = e.due; }
  };
  if (bi === 0) Object.keys(S.forms).forEach(k => { if (unitValid(k)) { const e = entryOfU(S, k); if (e) walk(k, e); } });
  else Object.keys(S.verbs).forEach(id => { const v = BY_ID[id]; if (v && v.type === "regular") { const e = entryOfU(S, id); if (e) walk(id, e); } });
  return m;
}
// Irregular cards in introduction order (Section 2C): the verb's rank plus its tense's offset, then rank, then card order.
let IRR_ORDER = null;
function irrOrder() {
  if (IRR_ORDER) return IRR_ORDER;
  const list = [];
  sectionVerbs("irregular").forEach(v => verbUnits(v).forEach((k, i) => { const off = TENSE_OFF[k.split("|")[1]] || 0; list.push({ v, k, off, sk: v.rankNum + off, i }); }));
  list.sort((a, b) => a.sk - b.sk || a.v.rankNum - b.v.rankNum || a.i - b.i);
  return (IRR_ORDER = list);
}
// A verb's later tenses wait until every présent card has passed its first (1-day) review.
const presentPassed = (S, v) => v.tables.present.rows.every(r => { const e = S.forms[v.id + "|present|" + r.key]; return e && e.step >= 2; });
// Regular: pattern cards that are ready, then sections in the set order, then rank. A group's pattern card for a tense
// is ready once 5 verbs of the group are introduced and the same tense has started in the irregular curriculum.
function regOrder(S) {
  const tenses = new Set(Object.keys(S.forms).filter(unitValid).map(k => k.split("|")[1])), n = {};
  Object.keys(S.verbs).forEach(id => { const v = BY_ID[id]; if (v && v.type === "regular" && !v.pattern) n[v.section] = (n[v.section] || 0) + 1; });
  return PATTERNS.filter(p => (n[p.group] || 0) >= 5 && tenses.has(p.ptense)).map(v => ({ v, k: v.id, off: 0 }))
    .concat(blockVerbs(1).map(v => ({ v, k: v.id, off: 0 })));
}
// New cards in that order. The time budget, the daily cap or the future-day rule stops the day.
function selectNew(bi, date, S, C, rawSoFar, todaySec) {
  const budget = todaySec !== undefined ? todaySec : blockBudget(bi), cap = 0.9 * blockBudget(bi), max = bi === 0 ? settings.maxNewForms : settings.maxNew;
  const out = [], learn = new Set(), sp = secondF(), started = new Set(bi === 0 ? Object.keys(S.forms).map(unitVerb) : []);
  let planned = rawSoFar * 1.15, cost = 0, lm = null;
  for (const { v, k, off } of (bi === 0 ? irrOrder() : regOrder(S))) {
    if (bi === 0 ? S.forms[k] : S.verbs[k]) continue;
    if (off && !presentPassed(S, v)) continue;
    if (out.length >= max) break;
    const c = unitCost(k, C), c0 = unitCost(k, C, "en-fr"), lc = v.pattern ? 0 : (bi === 1 || (!started.has(v.id) && !learn.has(v.id))) ? learnCost(v) : 0;
    const add = lc + c0 + (sp > 1 ? C.listen : 0);
    if (planned + add * 1.15 > budget) break;
    if (!lm) lm = loadMap(S, date, C, bi);
    const fut = OFFSETS.map(o => addDays(date, o));
    if (fut.some(d => ((lm[d] || 0) + c) * 1.15 > cap)) break;
    out.push(k); planned += add * 1.15; cost += add;
    if (lc) learn.add(v.id);
    fut.forEach(d => { lm[d] = (lm[d] || 0) + c; });
  }
  return { ids: out, learn: Array.from(learn), cost };
}
// How far past due a card is, as a share of the gap it was given: the higher, the more at risk.
function riskOf(e, date) {
  const gap = isDate(e.lastDate) && e.lastDate < e.due ? dayDiff(e.lastDate, e.due) : 1;
  return dayDiff(e.due, date) / Math.max(1, gap);
}
// Due reviews from both blocks, most at risk first (then lower step, then rank), cut at REVIEW_CAP.
// Returns the set of review keys allowed today and how many wait for another day.
function capReviews(date, S) {
  const all = [];
  Object.keys(S.forms).filter(unitValid).forEach(k => { const e = S.forms[k]; if (e && (e.enc || 0) > 0 && e.due <= date) all.push(k); });
  Object.keys(S.verbs).forEach(id => { const v = BY_ID[id], e = S.verbs[id]; if (v && v.type === "regular" && e && (e.enc || 0) > 0 && e.due <= date) all.push(id); });
  const ent = k => unitStore(S, k)[k];
  all.sort((a, b) => riskOf(ent(b), date) - riskOf(ent(a), date) || (ent(a).step - ent(b).step) ||
    (BY_ID[unitVerb(a)].rankNum - BY_ID[unitVerb(b)].rankNum) || (a < b ? -1 : a > b ? 1 : 0));
  return { allowed: new Set(all.slice(0, REVIEW_CAP)), held: Math.max(0, all.length - REVIEW_CAP) };
}
function plan(date, S, C, extraBi) {
  const sp = secondF(), ord = regSections(), cap = capReviews(date, S);
  const blockPlan = (bi, todaySec) => {
    const keys = bi === 0 ? Object.keys(S.forms).filter(unitValid) : Object.keys(S.verbs).filter(id => BY_ID[id] && BY_ID[id].type === "regular");
    const rev = [], carry = [], seen = new Set();
    keys.forEach(k => {
      const e = entryOfU(S, k); if (!e) return;
      if ((e.enc || 0) > 0) seen.add(unitVerb(k));
      if (e.due > date) return;
      if ((e.enc || 0) === 0) { if (!cap.held) carry.push(k); }   // new cards wait while reviews are held back
      else if (cap.allowed.has(k)) rev.push(k);
    });
    const sec = k => (bi === 0 ? 0 : ord.indexOf(BY_ID[k].section)), rk = k => BY_ID[unitVerb(k)].rankNum;
    const cmp = (a, b) => sec(a) - sec(b) || rk(a) - rk(b) || (a < b ? -1 : a > b ? 1 : 0);
    rev.sort((a, b) => dayDiff(entryOfU(S, b).due, date) - dayDiff(entryOfU(S, a).due, date) || cmp(a, b));
    carry.sort(cmp);
    const carryLearn = bi === 0 ? Array.from(new Set(carry.map(unitVerb))).filter(id => !seen.has(id)) : carry.filter(id => !BY_ID[id].pattern);
    const raw = rev.reduce((s, k) => s + unitCost(k, C, entryOfU(S, k).dir || "en-fr"), 0) + carry.reduce((s, k) => s + unitCost(k, C, "en-fr") + (sp > 1 ? C.listen : 0), 0) + carryLearn.reduce((s, id) => s + learnCost(BY_ID[id]), 0);
    const log = bi === 0 ? S.fNewLog : S.newLog;
    const sel = ((Array.isArray(log[date]) && bi !== extraBi) || cap.held || todaySec <= 0) ? { ids: [], learn: [], cost: 0 } : selectNew(bi, date, S, C, raw, todaySec);
    return { reviews: rev, newIds: carry.concat(sel.ids), picked: sel.ids, learnIds: carryLearn.concat(sel.learn), sec: (raw + sel.cost) * 1.15 };
  };
  const B = settings.budget * 60, regOnly = blockPlan(1, 0);
  const irr = blockPlan(0, B - Math.max(REG_MIN * 60, regOnly.sec));
  const blocks = [irr, blockPlan(1, B - irr.sec)];
  return { blocks, sec: blocks[0].sec + blocks[1].sec, held: cap.held };
}

/* ---------- the scheduled session ---------- */
const PART_LABEL = { reviews: "Reviews", learn: "New: learn", test: "New: test", second: "Second pass" };
const PARTS = ["start", "reviews", "learn", "test", "second", "done"];
const liveIds = list => (list || []).filter(unitValid);
const blk = s => s.blocks[s.bi || 0] || s.blocks[0];
function partLabel(s) {
  if (s.part === "start" || s.part === "done") return "Today";
  const it = s.part === "learn" ? null : curItem();
  return BLOCK_NAME[s.bi || 0] + " · " + PART_LABEL[s.part] + (it ? (it.mode === "listen" ? " · listening" : " · speaking") : "");
}
function secondIds(s, bi) { bi = bi === undefined ? (s.bi || 0) : bi; return Object.keys(s.vs).filter(k => unitValid(k) && s.vs[k].blk === bi && s.vs[k].isNew); }
function dirFor() { return session && session.mode === "sched" ? "en-fr" : resolveDir(); }
const homeOf = () => (session && session.mode === "sched" ? "today" : "library");

// bi undefined: today's one session, irregular verbs then regular verbs. bi 0 or 1: one block only (the "Do now" extras).
function buildSession(bi, extra) {
  const both = bi === undefined, inSession = i => both || i === bi;
  const date = todayStr(), C = avgCosts(), p = plan(date, curState(), C, extra ? bi : -1);
  [0, 1].filter(inSession).forEach(i => {
    const x = p.blocks[i];
    if (i === 0) x.picked.forEach(k => { fsched.forms[k] = { step: 0, enc: 0, due: date, intro: date }; });
    else x.picked.forEach(id => { schedule.verbs[id] = { step: 0, enc: 0, due: date, intro: date }; });
    const lg = i === 0 ? fsched.newLog : schedule.newLog;
    lg[date] = (lg[date] || []).concat(x.picked);
  });
  [fsched.newLog, schedule.newLog].forEach(log => Object.keys(log).forEach(d => { if (!isDate(d) || dayDiff(d, date) > 30) delete log[d]; }));
  saveSchedule(); saveForms();
  const vs = {}, blocks = p.blocks.map((y, i) => {
    if (!inSession(i)) return { reviewIds: [], newIds: [], learnIds: [], plannedSec: 0 };
    y.reviews.forEach(k => { vs[k] = { st: "todo", left: 0, open: 0, fail: false, isNew: false, blk: i }; });
    y.newIds.forEach(k => { vs[k] = { st: "todo", left: 0, open: 0, fail: false, isNew: true, blk: i }; });
    return { reviewIds: y.reviews, newIds: y.newIds, learnIds: y.learnIds, plannedSec: y.sec };
  });
  return { mode: "sched", schema: 2, only: both ? undefined : bi, date, startedAt: Date.now(), elapsedMs: 0,
           plannedSec: both ? p.blocks[0].sec + p.blocks[1].sec : p.blocks[bi].sec, part: "start", bi: both ? 0 : bi, blocks, vs,
           queue: [], idx: 0, committed: -1, done: false, undo: [], title: "Today", round: 1 };
}
// One session for the day: the irregular block (reviews, learn, test, second pass), then the regular block in the same
// session, then the finish screen. Only a one-block session (s.only set, the "Do now" extras) stops after its block.
function nextPart() {
  const s = session;
  let bi = s.bi || 0, i = PARTS.indexOf(s.part) + 1;
  for (;;) {
    const b = s.blocks[bi];
    for (; i < PARTS.length - 1; i++) {
      const p = PARTS[i];
      if (p === "reviews" && !liveIds(b.reviewIds).length) continue;
      if (p === "learn" && !liveIds(b.learnIds).length) continue;
      if (p === "test" && !liveIds(b.newIds).length) continue;
      if (p === "second" && (!settings.secondPass || !secondIds(s, bi).length)) continue;
      s.bi = bi; enterPart(p); return;
    }
    if (s.only !== undefined || bi >= s.blocks.length - 1) { s.bi = bi; enterPart("done"); return; }
    bi++; i = 1;
  }
}
function enterPart(p) {
  const s = session, b = blk(s);
  s.part = p; s.queue = []; s.idx = 0; s.committed = -1;
  const speak = [], listen = [];
  const mk = (k, mode) => sampled(Object.assign(unitSpec(k), { mode }));
  const add = k => {
    const vs = s.vs[k]; if (!vs) return;
    const e = entryOfU(curState(), k), mode = e && e.dir === "fr-en" ? "listen" : "en-fr";
    vs.mode = mode; vs.left = 1; vs.open = 1;
    (mode === "listen" ? listen : speak).push(newItem(Object.assign(mk(k, mode), { first: true })));
  };
  if (p === "reviews") liveIds(b.reviewIds).forEach(add);
  else if (p === "test") liveIds(b.newIds).forEach(add);
  else if (p === "second") secondIds(s).forEach(k => { s.vs[k].mode = "listen"; listen.push(newItem(mk(k, "listen"))); s.vs[k].open = 1; s.vs[k].st = "todo"; });
  // Two passes: speaking first, then listening. Irregular cards are shuffled across verbs, tenses and persons.
  const order = list => (s.bi === 0 ? spread(list) : list);
  s.queue = order(speak).concat(order(listen));
  if (p === "done") { s.done = true; s.finishedAt = Date.now(); recordHist(s); toast(s.only === undefined ? "Session complete ✓" : "Section complete ✓"); maybeAutoBackup(); syncNow("done"); }
  saveSession();
  if (p === "learn" || p === "done") { navigate("today"); return; }
  navigate("study");
  presentCurrent(true);
}
function qSpec(it) { return { verbId: it.verbId, kind: it.kind, tense: it.tense, kf: it.kf || null, person: it.person || null, key: !!it.key, xi: Number.isInteger(it.xi) ? it.xi : null, pat: it.pat || null, mode: it.mode || null, first: !!it.first, retry: !!it.retry }; }
function sessionData(s) { const o = Object.assign({}, s); o.queue = (s.queue || []).map(qSpec); delete o.undo; return o; }
function saveSession() { if (session && session.mode === "sched") lsSet(KEYS.session, JSON.stringify(sessionData(session))); }
function restoreSession(o) {
  const s = Object.assign({}, o);
  // A card saved by an older version may no longer be scheduled (v6.8 key cards): it is dropped, not graded.
  s.queue = (o.queue || []).filter(q => isObj(q) && BY_ID[q.verbId]).map(newItem).filter(it => unitValid(unitKey(it)));
  s.undo = [];
  if (!Number.isInteger(s.idx) || s.idx < 0) s.idx = 0;
  if (s.committed === s.idx) s.idx++; // the card was graded before the app closed
  s.committed = -1;
  return s;
}
function schedSession() {
  if (session && session.mode === "sched") return session;
  const o = loadSessionRaw();
  return o ? restoreSession(o) : null;
}
function resumeSched() {
  session = schedSession();
  if (!session) { renderToday(); return; }
  if (session.part === "start") { nextPart(); return; }
  if (session.part === "learn") { navigate("today"); return; }
  if (!curItem()) { nextPart(); return; }
  navigate("study");
  presentCurrent(true);
}
function commitSched(it, wrongKeys, grade) {
  const s = session, k = unitKey(it), st = unitStore({ forms: fsched.forms, verbs: schedule.verbs }, k);
  const vs = s.vs[k] || (s.vs[k] = { st: "todo", left: 0, open: 1, fail: false, isNew: false, blk: s.bi || 0 });
  const tk = it.mode === "listen" ? "listen" : it.kind;
  s.undo.push({ data: JSON.stringify(sessionData(s)), id: k, entry: st[k] ? JSON.stringify(st[k]) : null, kind: tk, rev: review.items[k] ? JSON.stringify(review.items[k]) : null });
  if (s.undo.length > 30) s.undo.shift();
  if (!Array.isArray(timing[tk])) timing[tk] = [];
  const secs = Math.min(120, Math.max(1, (Date.now() - (it.t0 || Date.now())) / 1000));
  timing[tk].push(Math.round(secs * 10) / 10);
  if (timing[tk].length > 400) timing[tk] = timing[tk].slice(-400);
  saveTiming();
  const anyWrong = wrongKeys.length > 0;
  if (it.first) {
    // One review-log record per card per day, at its first try (read before finalizeUnit changes the entry).
    const prev = st[k] || null;
    const rec = { id: s.date + "|" + k, d: s.date, k, g: anyWrong ? "miss" : grade === "hard" ? "hard" : "pass", step: prev ? prev.step : 0,
      gap: prev && isDate(prev.lastDate) ? dayDiff(prev.lastDate, s.date) : null,
      late: prev && isDate(prev.due) ? dayDiff(prev.due, s.date) : null,
      m: it.mode === "listen" ? "listen" : "speak", kind: it.kind, s: Math.round(secs * 10) / 10, t: Date.now(), v: APP_VERSION };
    if (it.key || it.pat) rec.per = it.person;   // the person a key or pattern card asked (misses by person, Section 3)
    if (it.pat) rec.sv = it.verbId;
    logDB.put(rec);
    s.undo[s.undo.length - 1].logId = rec.id;
    if (it.key && prev) { prev.pp = Object.assign({}, prev.pp, { [it.person]: s.date }); saveForms(); }
  }
  if (it.first) { if (anyWrong) vs.fail = true; else if (grade === "hard") vs.hard = true; vs.left = 0; }
  if (it.first && anyWrong) reviewAdd(it.key || it.pat ? it.verbId + "|" + it.tense + "|" + it.person : k, s.date);
  if (!anyWrong) finalizeUnit(k);
  vs.open = Math.max(0, vs.open - 1);
  if (anyWrong) {
    vs.st = "retry";
    // A wrong card goes to the back of the pile and comes round again until it is right.
    s.queue.push(newItem(Object.assign(qSpec(it), { first: false, retry: true })));
    vs.open++;
  }
  if (vs.open === 0) vs.st = "done";
  s.committed = s.idx;
  haptic();
  saveSession(); syncSoon();
}
// Only the first attempt of the day changes a card's step.
function finalizeUnit(k) {
  const s = session, vs = s.vs[k], e = unitStore({ forms: fsched.forms, verbs: schedule.verbs }, k)[k];
  if (!e || vs.final) return;
  // Already applied for this session's day: the app closed after saving the schedule but before saving the
  // session. Don't apply it twice.
  if (e.lastDate === s.date && e.enc > 0) { vs.final = true; if (vs.before === undefined) vs.before = e.step; vs.after = e.step; return; }
  vs.before = e.step;
  applyResult(e, vs.fail ? "again" : vs.hard ? "hard" : "good", s.date); e.missed = !!vs.fail;
  vs.after = e.step; vs.final = true;
  if (isFormUnit(k)) saveForms(); else saveSchedule();
}
function undoSched() {
  const s = session, u = s.undo.pop();
  if (!u) return;
  stopSpeech(); stopListening();
  const st = unitStore({ forms: fsched.forms, verbs: schedule.verbs }, u.id);
  if (u.entry) st[u.id] = JSON.parse(u.entry); else delete st[u.id];
  if ("rev" in u) { if (u.rev) review.items[u.id] = JSON.parse(u.rev); else delete review.items[u.id]; saveReview(); }
  if (Array.isArray(timing[u.kind])) timing[u.kind].pop();
  if (u.logId) logDB.del(u.logId);
  saveSchedule(); saveForms(); saveTiming();
  const d = JSON.parse(u.data); d.committed = -1;
  const r = restoreSession(d); r.undo = s.undo; session = r;
  saveSession();
  if (currentScreen !== "study") navigate("study");
  renderStudy(true);
}
function schedCounts(s) {
  let todo = 0, retry = 0, done = 0;
  Object.keys(s.vs).forEach(id => { if (!unitValid(id) || s.vs[id].blk !== (s.bi || 0)) return; const st = s.vs[id].st; if (st === "done") done++; else if (st === "retry") retry++; else todo++; });
  return { todo, retry, done, total: todo + retry + done };
}
function countsHTML(c) { return `<span>${c.todo + c.retry} left</span>`; }
function plannedMin(s) { return Math.max(1, Math.round(s.plannedSec / 60)); }
function renderSchedTop() {
  const s = session, c = schedCounts(s);
  $("#sTitle").textContent = partLabel(s);
  $("#sScore").innerHTML = `<span>${progText(s, c)}</span>`;
  $("#sFill").style.width = (c.total ? c.done / c.total * 100 : 0) + "%";
  $("#sSub").hidden = true;
}
// 4C: "12 of 48 · about 9 min left".
function progText(s, c) { return `${c.done} of ${c.total} · about ${Math.max(1, plannedMin(s) - Math.round(s.elapsedMs / 60000))} min left`; }
function sessHeadHTML(s) {
  const c = schedCounts(s);
  return `<div class="sprog-text"><b>${esc(partLabel(s))}</b><span>${progText(s, c)}</span></div>` +
    `<div class="track"><div class="fill" style="width:${c.total ? c.done / c.total * 100 : 0}%"></div></div>`;
}
// Elapsed time counts only while a scheduled card or the Learn step is on screen.
let lastTick = Date.now(), tickN = 0;
setInterval(() => {
  const now = Date.now(), dt = Math.min(now - lastTick, 3000);
  lastTick = now;
  if (!session || session.mode !== "sched" || session.done || document.hidden) return;
  const onLearn = currentScreen === "today" && session.part === "learn";
  if (!(currentScreen === "study" && curItem()) && !onLearn) return;
  session.elapsedMs += dt;
  if (onLearn) { const h = $("#tHead"); if (h) h.innerHTML = sessHeadHTML(session); }
  else renderSchedTop();
  if (++tickN % 15 === 0) saveSession();
}, 1000);

/* ---------- status model (Section 3B, v6.7) ----------
   cardStatus(k) is the only definition of a card's status, verbStatus(v) rolls it up; every screen uses these two.
   Evidence is the review log's first tries in scheduled sessions (never same-day repeats or Library practice):
   Learning = introduced; Reviewing = right after a gap of 7+ days; Retained = right after 30+; Mastered = right after 60+
   in both speaking and listening. Only attempts after the latest miss count, so a lapse starts the climb again.
   Cards learnt before the log began: the step they had reached shows the gaps they passed (step 5+ passed a 7-day
   review, step 7+ a 30-day one); Mastered always needs the log. Persistent mistake = 4 or more lapses. */
const ST = ["new", "learning", "reviewing", "retained", "mastered"];
const ST_LABEL = { new: "New", learning: "Learning", reviewing: "Reviewing", retained: "Retained", mastered: "Mastered" };
const ST_REV = 7, ST_RET = 30, ST_MAS = 60, PERSIST = 4;
function logIndex() {
  if (logIdx) return logIdx;
  logIdx = new Map();
  LOG.forEach(r => { if (!r.k || !isDate(r.d)) return; let a = logIdx.get(r.k); if (!a) logIdx.set(r.k, a = []); a.push(r); });
  logIdx.forEach(a => a.sort((x, y) => (x.d < y.d ? -1 : x.d > y.d ? 1 : (x.t || 0) - (y.t || 0))));
  return logIdx;
}
const verbCards = v => (v.type === "irregular" ? verbUnits(v) : [v.id]);
function cardStatus(k) {
  const e = entryOfU({ forms: fsched.forms, verbs: schedule.verbs }, k), all = logIndex().get(k) || [];
  const recs = all.filter(r => !r.p), lapses = recs.filter(r => r.g === "miss" && (r.step || 0) > 0).length;
  // Key cards: misses by the person asked (log field per), starting from the old person cards' miss flags.
  const pm = Object.assign({}, e && isObj(e.pm) ? e.pm : {});
  recs.forEach(r => { if (r.per && r.g === "miss") pm[r.per] = (pm[r.per] || 0) + 1; });
  const out = { k, status: "new", lapses, persistent: lapses >= PERSIST, e, recs, all, inferred: false, pm };
  if (!e && !recs.length) return out;
  let i = recs.length - 1; while (i >= 0 && recs[i].g !== "miss") i--;
  const since = recs.slice(i + 1), ok = r => r.g !== "miss" && typeof r.gap === "number";
  let best = 0;
  since.forEach(r => { if (ok(r) && r.gap >= ST_RET) best = 2; else if (ok(r) && r.gap >= ST_REV) best = Math.max(best, 1); });
  if (i < 0) { const s0 = recs.length ? recs[0].step || 0 : e.step, inf = s0 >= 7 ? 2 : s0 >= 5 ? 1 : 0; if (inf > best) { best = inf; out.inferred = true; } }
  const mastered = ["speak", "listen"].every(m => since.some(r => ok(r) && r.gap >= ST_MAS && r.m === m));
  out.status = mastered ? "mastered" : ["learning", "reviewing", "retained"][best];
  return out;
}
function verbStatus(v) {
  const cs = verbCards(v).map(cardStatus), rk = x => ST.indexOf(x);
  const minOf = list => (list.length ? list.reduce((a, c) => (rk(c.status) < rk(a) ? c.status : a), "mastered") : "new");
  const tenses = {};
  TENSE_KEYS.forEach(t => { tenses[t] = v.type === "irregular" ? minOf(cs.filter(c => c.k.split("|")[1] === t)) : cs[0].status; });
  let status = cs.every(c => c.status === "new") ? "new" : v.type === "irregular" ? minOf(cs.filter(c => /\|(inf|present|x)(\||$)/.test(c.k))) : cs[0].status;
  if (status === "new" && cs.some(c => c.status !== "new")) status = "learning";
  const core = tenses.present === "mastered" && (tenses.passe_compose === "mastered" || !("passe_compose" in tenses));
  const complete = TENSE_KEYS.every(t => tenses[t] === "mastered");
  const dues = cs.filter(c => c.e).map(c => c.e.due).sort();
  return { status, tenses, cards: cs, persistent: cs.filter(c => c.persistent), core, complete, due: dues[0] || null,
    label: complete ? "Complete" : core ? "Core secure" : ST_LABEL[status] };
}
const stTag = (s, extra) => `<span class="stag st-${s}">${esc(ST_LABEL[s])}</span>${extra || ""}`;
function tenseDots(st) {
  return `<span class="tdots">${TENSE_KEYS.map(t => `<i class="sd sd-${st.tenses[t]}" title="${esc(TENSES[t].name)}: ${ST_LABEL[st.tenses[t]]}"></i>`).join("")}</span><span class="sr">${esc(TENSE_KEYS.map(t => TENSES[t].name + " " + ST_LABEL[st.tenses[t]]).join(", "))}</span>`;
}
// Plain-language reason for a verb's next review, and the last 10 first attempts (practice included, labelled).
function verbReason(v, st) {
  if (st.complete || st.status === "mastered") { const r = st.cards.flatMap(c => c.recs).filter(r => r.g !== "miss" && r.gap >= ST_MAS).pop(); return `Mastered${r ? `: right after ${r.gap} days, both directions` : ""}.`; }
  const c = st.cards.filter(x => x.e).sort((a, b) => (a.e.due < b.e.due ? -1 : 1))[0];
  if (!c) return "Not introduced yet. It comes up in the daily session by importance.";
  const e = c.e, gap = isDate(e.lastDate) ? dayDiff(e.lastDate, e.due) : null, last = c.recs.filter(r => r.g !== "miss").pop();
  return `Due ${fmtDate(e.due)}: ${last ? `last right on ${fmtDate(last.d)}` : "not yet right at a first try"}${gap !== null ? `, next gap ${plural(gap, "day")}` : ""}.`;
}
const unitName = k => { const p = k.split("|"), v = BY_ID[p[0]]; if (!v) return k; if (p.length === 1 || p[1] === "inf") return v.french; if (p[1] === "keyforms") return v.french + " key forms"; if (p.length === 2 || p[2] === KEY) return v.french + " " + TENSES[p[1]].name; if (p[1] === "x") return v.expressions[+p[2]] ? v.expressions[+p[2]].fr : k; const r = v.tables[p[1]] && v.tables[p[1]].rows.find(x => x.key === p[2]); return r ? r.fr : k; };
function attemptsHTML(st) {
  const recs = st.cards.flatMap(c => c.all).concat(LOG.filter(r => r.p && r.k && st.cards.length && r.k.split("|")[0] === st.cards[0].k.split("|")[0] && !st.cards.some(c => c.k === r.k)))
    .sort((a, b) => (a.d < b.d ? 1 : a.d > b.d ? -1 : (b.t || 0) - (a.t || 0))).slice(0, 10);
  if (!recs.length) return '<p class="shelp">No attempts logged yet.</p>';
  const G = { pass: "Right", hard: "Hard", miss: "Again" };
  return `<table class="attempts"><thead><tr><th>Date</th><th>Card</th><th>Grade</th><th>Gap</th><th>Mode</th></tr></thead><tbody>` +
    recs.map(r => `<tr><td>${esc(fmtDate(r.d))}</td><td lang="fr">${esc(unitName(r.k))}${r.per ? ` (${esc(r.per)})` : ""}</td><td>${G[r.g] || esc(r.g)}</td><td>${typeof r.gap === "number" ? r.gap + " d" : "–"}</td><td>${r.p ? "practice" : r.m === "listen" ? "listening" : "speaking"}</td></tr>`).join("") + "</tbody></table>";
}
function libVerbHTML(v) {
  const st = verbStatus(v);
  return `<div class="vstatus"><p>${stTag(st.status)}${st.label !== ST_LABEL[st.status] ? ` <b>${esc(st.label)}</b>` : ""}${st.persistent.length ? '<span class="stag persist">Persistent mistake</span>' : ""} ${esc(verbReason(v, st))}</p>` +
    `<details class="shelpbox"><summary>Last 10 attempts</summary>${attemptsHTML(st)}</details></div>` + verbDetailHTML(v, st);
}
