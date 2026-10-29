// Verbes: Today, simulation, Progress, GitHub sync, schedule settings, navigation and start-up.
// Plain script, no build step. Loaded by index.html in this order: core.js, conjugate.js, audio.js, study.js, screens.js, scheduler.js, app.js.
"use strict";
/* ---------- Today screen ---------- */
function learnStepHTML(s) {
  const ids = liveIds(blk(s).learnIds), groups = {};
  ids.forEach(id => { const g = BY_ID[id].section; (groups[g] = groups[g] || []).push(id); });
  const heads = Object.keys(groups).map(g => {
    const all = sectionVerbs(g), pos = groups[g].map(id => all.findIndex(v => v.id === id) + 1).sort((a, b) => a - b);
    return `Learning: ${esc(sectionName(g))} (${pos.length === 1 ? "verb " + pos[0] : "verbs " + pos.join(", ")} of ${all.length})`;
  });
  return `<div class="sesshead" id="tHead">${sessHeadHTML(s)}</div>` +
    heads.map(h => `<p class="learnhead">${h}</p>`).join("") +
    `<p class="lede">Open each verb, read the tables and play the audio. Testing starts when you’re ready.</p>` +
    `<div class="btnrow" style="margin:12px 0"><button class="ghost sm" data-today="expand">Expand all</button><button class="ghost sm" data-today="collapse">Collapse all</button></div>` +
    `<div id="todayLearn">${ids.map(id => verbRowHTML(BY_ID[id], todayExpanded, "tv", s)).join("")}</div>` +
    `<button class="primary bigstart" data-today="ready">I’m ready — test me</button>`;
}
let hist = {};
function cleanHist(o) {
  const out = {}; if (!isObj(o)) return out;
  Object.keys(o).forEach(d => {
    if (!isDate(d) || !isObj(o[d])) return;
    const e = {};
    ["irr", "reg"].forEach(k => { const x = o[d][k]; if (isObj(x)) e[k] = { new: (Array.isArray(x.new) ? x.new : []).filter(y => Array.isArray(y) && typeof y[0] === "string").map(y => [y[0], (Array.isArray(y[1]) ? y[1] : []).filter(z => typeof z === "string")]) }; if (e[k] && typeof x.n === "number") e[k].n = x.n; });
    if (e.irr || e.reg) out[d] = e;
  });
  return out;
}
function loadHist() { try { return cleanHist(JSON.parse(lsGet(KEYS.history) || "{}")); } catch (e) { return {}; } }
function saveHist() { lsSet(KEYS.history, JSON.stringify(hist)); }
let paceCache = {};
const SECN = ["Irregular", "Regular"], SECK = ["irr", "reg"];
const tenseWord = t => (t === "inf" ? "infinitive" : t === "x" ? "expressions" :(TENSES[t] ? TENSES[t].name.toLowerCase() : t));
function groupForms(keys) {
  const out = [], idx = {};
  keys.forEach(k => {
    const p = k.split("|"), t = p[1] || "inf";
    if (!BY_ID[p[0]]) return;
    if (!(p[0] in idx)) { idx[p[0]] = out.length; out.push([p[0], []]); }
    const a = out[idx[p[0]]][1]; if (a.indexOf(t) < 0) a.push(t);
  });
  return out;
}
function newOf(bi, keys) { keys = keys.filter(k => unitValid(k) && !BY_ID[k.split("|")[0]].pattern); return bi === 0 ? groupForms(keys) : Array.from(new Set(keys)).map(id => [id, []]); }
function histList(e) { return ((e && e.new) || []).filter(x => BY_ID[x[0]] && !BY_ID[x[0]].pattern).map(x => [x[0], x[1].filter(t => t === "inf" || t === "x" || TENSES[t])]); }
function recHist(s, bi) {
  const b = s.blocks[bi]; if (!b) return;
  const keys = liveIds(b.newIds);
  if (!keys.length && !liveIds(b.reviewIds).length) return;
  const day = hist[s.date] || (hist[s.date] = {}), k = SECK[bi], e = day[k] || (day[k] = { new: [] });
  newOf(bi, keys).forEach(([id, ts]) => {
    const f = e.new.find(x => x[0] === id);
    if (f) ts.forEach(t => { if (f[1].indexOf(t) < 0) f[1].push(t); }); else e.new.push([id, ts]);
  });
  e.n = (e.n || 0) + Object.keys(s.vs).filter(k => s.vs[k].blk === bi && s.vs[k].final).length;
  saveHist();
}
function recordHist(s) { if (s.histDone) return; s.histDone = true; if (s.only === undefined) { recHist(s, 0); recHist(s, 1); } else recHist(s, s.only); }
function vlinks(list, sep) {
  return list.map(([id, ts]) => `<button class="linkbtn" data-vlink="${esc(id)}" lang="fr">${esc(BY_ID[id].french)}</button>` + (ts.length ? ` (${ts.map(tenseWord).join(", ")})` : "")).join(sep);
}
function secRow(bi, o) {
  const sep = bi === 0 ? "; " : ", ";
  let nw = o.list.length ? "New: " + vlinks(o.list, sep) : (!o.done && !o.reviews ? "Nothing due" : "");
  const meta = [];
  if (bi === 0 && o.n) meta.push(plural(o.n, "new form"));
  if (o.reviews) meta.push(plural(o.reviews, "review"));
  if (o.min) meta.push("about " + o.min + " min");
  const btn = o.done ? '<span class="tick">✓ Done</span>'
    : o.state === "start" ? `<button class="primary sm" data-sec="start:${bi}">Start</button>`
    : o.state === "continue" ? '<button class="primary sm" data-today="continue">Continue</button>'
    : o.state === "extra" ? `<button class="ghost sm" data-sec="extra:${bi}">Do now</button>` : "";
  return `<div class="sec${o.done ? " isdone" : ""}"><div class="sechead"><b>${SECN[bi]}</b>${btn}</div><p class="vsmall">${nw}${nw && meta.length ? " · " : ""}${meta.join(" · ")}</p></div>`;
}
// A session left unfinished on an earlier day closes when Today next opens: finished cards are already saved, and the
// rest are simply still due.
function closeStaleSession() {
  const s = schedSession(); if (!s || s.done || s.date >= todayStr()) return false;
  lsRemove(KEYS.session); if (session && session.mode === "sched") session = null;
  addNotice(`The session from ${fmtDate(s.date)} was closed. Cards you finished are saved; the rest are due today.`);
  return true;
}
function renderToday() {
  closeStaleSession();
  const t = todayStr(), body = $("#todayBody");
  $("#todayDate").textContent = parseD(t).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
  const s = schedSession(), prog = !!(s && !s.done);
  if (prog && s.part === "learn") { body.innerHTML = learnStepHTML(s); return; }
  if (!VERBS_OK.length) { body.innerHTML = '<p class="todayline">No verbs are loaded yet.</p><p class="lede">Add verbs to verbs.js.</p>'; return; }
  const C = avgCosts(), p = plan(t, curState(), C), sim = simulate(10, 1, C, t, false).rows;
  let h = p.held && !prog ? `<div class="notice"><p>${plural(p.held, "review")} will wait for another day: at most ${REVIEW_CAP} a day, the cards most at risk first. New cards pause until you’re caught up.</p></div>` : "";
  { const ds = daysSince(lsGet(KEYS.lastbackup)); if (ds >= 8) h += `<div class="notice"><p>Last backup: ${ds === 999 ? "never" : ds + " days ago"}.</p><button class="primary sm" data-today="backup">Save backup now</button></div>`; }
  { const nr = reviewActive().length; if (nr) h += `<div class="notice"><p>To review: ${plural(nr, "card")} you missed. Review them in the Library.</p><button class="ghost sm" data-today="review">Open</button></div>`; }
  // One session for the day. Each block shows what it holds; one button starts or continues the whole session.
  const doneB = [0, 1].map(bi => !!(hist[t] && hist[t][SECK[bi]]));
  const rows = [0, 1].map(bi => {
    if (doneB[bi]) return secRow(bi, { done: true, list: histList(hist[t][SECK[bi]]), reviews: 0, min: 0 });
    if (prog) {
      if (s.only !== undefined && s.only !== bi) return "";
      const b = s.blocks[bi];
      return secRow(bi, { list: newOf(bi, liveIds(b.newIds)), n: liveIds(b.newIds).length, reviews: liveIds(b.reviewIds).length, min: 0, state: "" });
    }
    const x = p.blocks[bi], list = newOf(bi, x.newIds), nn = x.newIds.filter(unitValid).length, has = x.reviews.length + list.length > 0;
    return secRow(bi, { list, n: nn, reviews: x.reviews.length, min: has ? Math.max(1, Math.round(x.sec / 60)) : 0, state: "" });
  });
  const todo = [0, 1].filter(bi => !doneB[bi] && (p.blocks[bi].reviews.length + p.blocks[bi].newIds.filter(unitValid).length > 0));
  const go = prog ? '<button class="primary sm" data-today="continue">Continue</button>'
    : todo.length ? `<button class="primary sm" data-sec="start:${todo.length === 2 ? "all" : todo[0]}">Start</button>`
    : doneB[0] || doneB[1] ? '<span class="tick">✓ Done</span>' : "";
  const totalMin = prog ? plannedMin(s) : Math.round(todo.reduce((a, bi) => a + p.blocks[bi].sec, 0) / 60);
  h += `<section class="day"><h2 class="dayh">${esc(fmtDate(t))} <small>Today</small></h2>` +
    `<div class="sec todaygo"><div class="sechead"><b>${prog ? "Session in progress" : "Today’s session"}${totalMin ? ` <small>about ${totalMin} min</small>` : ""}</b>${go}</div>` +
    // 4E empty state: nothing left today.
    (!prog && !todo.length ? `<div class="alldone"><p class="todayline">All done for today. Next reviews: ${sim[1] ? sim[1].reviews : 0} tomorrow.</p><button class="linkbtn" data-tab="library">Practise a verb</button></div>` : "") +
    `</div>${rows.join("")}</section>`;
  const extraOK = [0, 1].map(bi => !prog && hist[t] && hist[t][SECK[bi]] && selectNew(bi, t, curState(), C, 0).ids.length > 0);
  sim.slice(1).forEach((r, i) => {
    h += `<section class="day"><h2 class="dayh">${esc(fmtDate(r.date))}${i === 0 ? " <small>Tomorrow</small>" : ""}</h2>` +
      [0, 1].map(bi => secRow(bi, { list: newOf(bi, bi === 0 ? r.pa : r.pb), n: r.pa.length, reviews: 0, min: 0, state: i === 0 && extraOK[bi] ? "extra" : "" })).join("") + "</section>";
  });
  const days = Object.keys(hist).filter(isDate).sort().reverse();
  if (days.length) {
    h += `<details class="hist"><summary>History (${plural(days.length, "day")})</summary>` + days.map(d => {
      const e = hist[d], ticks = [0, 1].filter(bi => e[SECK[bi]]).map(bi => "✓ " + SECN[bi]).join("  ");
      return `<div class="sec isdone"><div class="sechead"><b>${esc(fmtDate(d))}</b><span class="tick">${ticks}</span></div>` +
        [0, 1].filter(bi => e[SECK[bi]]).map(bi => { const l = histList(e[SECK[bi]]); return l.length ? `<p class="vsmall">${SECN[bi]}: ${vlinks(l, bi === 0 ? "; " : ", ")}</p>` : ""; }).join("") + "</div>";
    }).join("") + "</details>";
  }
  body.innerHTML = h;
}
$("#scr-today").addEventListener("click", e => {
  const t = e.target;
  const vl = t.closest("[data-vlink]"); if (vl) { navigate("learn", { scope: "all", verb: vl.dataset.vlink }); return; }
  const sc = t.closest("[data-sec]");
  if (sc) {
    closeStaleSession();
    const cur = schedSession();
    if (cur && !cur.done) { resumeSched(); return; }
    const a = sc.dataset.sec.split(":");
    (async () => {
      if (syncCfg()) { toast("Syncing…"); await Promise.race([syncNow("start"), new Promise(r => setTimeout(r, 8000))]); }
      const again = schedSession(); if (again && !again.done) { resumeSched(); return; }
      session = buildSession(a[1] === "all" ? undefined : Number(a[1]), a[0] === "extra"); nextPart();
    })();
    return;
  }
  const b = t.closest("[data-today]");
  if (b) {
    const a = b.dataset.today;
    if (a === "backup") { exportData(true); renderToday(); }
    else if (a === "continue") resumeSched();
    else if (a === "ready") { session = schedSession(); if (session) enterPart("test"); }
    else if (a === "expand" || a === "collapse") {
      const s = schedSession();
      if (a === "expand" && s) liveIds(blk(s).learnIds).forEach(id => todayExpanded.add(id)); else todayExpanded.clear();
      renderToday();
    } else if (a === "library") navigate("library");
    else if (a === "review") { navigate("library"); setTimeout(() => { const el = $("#reviewSec"); if (el && el.scrollIntoView) el.scrollIntoView({ block: "start" }); }, 60); }
    return;
  }
  const say = t.closest("[data-say]"); if (say) { speak(sayArg(say), say); return; }
  const tg = t.closest("[data-toggle]"); if (tg) { toggleVerbIn($("#todayLearn"), todayExpanded, "tv", tg.dataset.toggle); return; }
  const g = t.closest("[data-guide]"); if (g) { navigate("guide", { tense: g.dataset.guide }); return; }
  const pv = t.closest("[data-practise-verb]"); if (pv) { const v = BY_ID[pv.dataset.practiseVerb]; openPractise([v], v.french); }
});
document.addEventListener("visibilitychange", () => { if (!document.hidden && currentScreen === "today") renderToday(); });

/* ---------- simulation (works on a copy; never saved) ---------- */
function rng(seed) { let a = seed; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function simStart() { const t = todayStr(), h = hist[t]; return h && h.irr && h.reg ? addDays(t, 1) : t; }
// skip: optional set of day indexes on which no session happens (to test breaks).
function simulate(days, passRate, C, start, stopWhenAllIn, skip) {
  const S = JSON.parse(JSON.stringify(curState()));
  const rnd = rng(20261018), rows = [];
  let d = start, allIn = null;
  for (let i = 0; i < days; i++) {
    if (skip && skip.has(i)) { rows.push({ date: d, pa: [], pb: [], reviews: 0, added: 0, min: 0, minI: 0, minR: 0, held: 0, skipped: true }); d = addDays(d, 1); continue; }
    const p = plan(d, S, C), [a, b] = p.blocks;
    a.picked.forEach(k => { S.forms[k] = { step: 0, enc: 0, due: d, intro: d }; });
    b.picked.forEach(id => { S.verbs[id] = { step: 0, enc: 0, due: d, intro: d }; });
    S.fNewLog[d] = (S.fNewLog[d] || []).concat(a.picked); S.newLog[d] = (S.newLog[d] || []).concat(b.picked);
    const secs = [0, 0];
    p.blocks.forEach((x, bi) => {
      const run = (k, isNew) => {
        const e = unitStore(S, k)[k], c = unitCost(k, C, isNew ? "en-fr" : (e.dir || "en-fr")), pass = rnd() < passRate;
        secs[bi] += c + (pass ? 0 : c * 0.5) + (settings.secondPass && isNew ? C.listen : 0);
        applyResult(e, pass, d);
      };
      x.reviews.forEach(k => run(k, false)); x.newIds.forEach(k => run(k, true));
      x.learnIds.forEach(id => { secs[bi] += learnCost(BY_ID[id]); });
    });
    rows.push({ date: d, pa: a.picked.slice(), pb: b.picked.slice(), reviews: a.reviews.length + b.reviews.length, added: a.picked.length + b.picked.length, min: (secs[0] + secs[1]) / 60, minI: secs[0] / 60, minR: secs[1] / 60, held: p.held || 0 });
    if (!allIn && VERBS_OK.length && VERBS_OK.every(v => introduced(S, v))) { allIn = d; if (stopWhenAllIn) break; }
    d = addDays(d, 1);
  }
  return { rows, allIn };
}
function runSim() {
  const num = (id, lo, hi, d) => { const x = Number($(id).value); return isFinite(x) && $(id).value !== "" ? Math.min(hi, Math.max(lo, x)) : d; };
  const days = Number($("#simDays").value) || 30, pass = num("#simPass", 0, 100, 85) / 100;
  const C = { main: num("#simMain", 1, 300, 10), form: num("#simForm", 1, 300, 10), listen: num("#simListen", 1, 300, 12), tense: 30, keyforms: 20 };
  const r = simulate(days, pass, C, simStart(), false);
  const m = r.rows.map(x => x.min), avg = m.reduce((a, b) => a + b, 0) / (m.length || 1), max = Math.max(0, ...m);
  const added = r.rows.reduce((a, x) => a + x.added, 0);
  $("#simOut").innerHTML = `<p class="shelp">Average ${avg.toFixed(1)} min a day, busiest day ${max.toFixed(1)} min, ${plural(added, "new card")} introduced${r.allIn ? `; every verb introduced by ${esc(fmtDate(r.allIn))}` : ""}. Your real progress was not changed.</p>` +
    `<div class="simtable"><table class="simt"><thead><tr><th>Date</th><th>Reviews</th><th>New</th><th>Irreg min</th><th>Reg min</th></tr></thead><tbody>` +
    r.rows.map(x => `<tr><td>${esc(fmtDate(x.date))}</td><td>${x.reviews}</td><td>${x.added}</td><td>${x.minI.toFixed(1)}</td><td>${x.minR.toFixed(1)}</td></tr>`).join("") + "</tbody></table></div>";
}

/* ---------- Stats ---------- */
const ABOUT = `<p>This schedule uses the spacing effect: a memory lasts longer when you review it just as it starts to fade, and each successful review lets the next gap grow. Each card is reviewed on fixed days after you first learn it: day 1, 3, 7, 14, 30, 60 and 180, then every 180 days. Those days never move.</p>
<p>The aim is strong long-term memory, not guaranteed 100% recall. A miss is repeated at the back of the pile until you get it right, but only your first try of the day counts toward the schedule. Know moves a card up and roughly doubles the gap since its last review; Hard keeps it on its step with a slightly longer gap; a miss sends it back down to a gap about a quarter of the one it failed at (the miss rule can be changed in Settings). A miss on a new card or at its 1-day review keeps it where it is, due again the next day. If you are late and still right, the next gap is longer, not shorter. At most ${REVIEW_CAP} reviews come up in a day, the cards most at risk first; any others wait, and new cards pause until you’re caught up.</p>
<p>Irregular verbs: the infinitive and each présent form are their own cards. Every other tense is one key card that asks a different person each time (je first) and then shows the whole tense, so a form you know moves out to months while a weak one keeps coming back. A few low-use verbs are practised as everyday expressions instead (il vaut mieux, ça suffit). Cards are shuffled across all verbs, tenses and persons. New cards come in importance order: the présent first, each later tense some verbs behind it, and never before the verb’s présent has passed its first review.</p>
<p>Regular verbs follow rules, so each one has a single card: English to the French infinitive. One pattern card per group and tense (-er, -ir, -re) keeps the rule alive by asking a verb and person you have learnt. Full tables are for learning, on the Learn page.</p>
<p>Each card alternates between two directions: speaking (English shown, you say the French) and listening (audio only, you say the meaning). A new card is tested speaking, then listening in the second pass. After that it flips at every review, starting with speaking. A miss repeats the card in the same direction until you get it right. On a listening card you press Show answer to see the French and English, then choose Know or Don’t know. Speaking cards are done first in a session, then listening cards.</p>`;
// Every metric in one pass over the log (Section 3E). Scheduled first tries only, except the practice count.
const MIN_RATE = 50, MIN_BUCKET = 20, MIN_CELL = 10, MIN_WEAK = 3;
const GAP_BUCKETS = [[1, 6], [7, 20], [21, 59], [60, Infinity]];
function progressMetrics(today) {
  const f30 = addDays(today, -29), f28 = addDays(today, -27);
  const m = { rate: { n: 0, ok: 0 }, gaps: GAP_BUCKETS.map(([a, b]) => ({ a, b, n: 0, ok: 0 })), grid: {}, days: new Map(), practice: 0 };
  LOG.forEach(r => {
    if (!r.k || !isDate(r.d) || r.d > today) return;
    if (r.p) { if (r.d >= f28) m.practice++; return; }
    if (r.d >= f28) m.days.set(r.d, (m.days.get(r.d) || 0) + (r.s || 0));
    if (!((r.step || 0) > 0 && typeof r.gap === "number")) return;   // reviews only, not a new card's first test
    const ok = r.g !== "miss";
    if (r.d >= f30) { m.rate.n++; if (ok) m.rate.ok++; }
    const b = m.gaps.find(x => r.gap >= x.a && r.gap <= x.b); if (b) { b.n++; if (ok) b.ok++; }
    const p = r.k.split("|"), per = p[2] === KEY ? r.per : p[2];   // key cards: the person asked
    if (p.length === 3 && p[1] !== "x" && per) { const c = m.grid[p[1] + "|" + per] || (m.grid[p[1] + "|" + per] = { n: 0, miss: 0 }); c.n++; if (!ok) c.miss++; }
  });
  const cov = { irr: {}, reg: {} }, weak = [];
  ST.forEach(s => { cov.irr[s] = 0; cov.reg[s] = 0; });
  let persistent = 0;
  VERBS_OK.forEach(v => verbCards(v).forEach(k => {
    const c = cardStatus(k); cov[v.type === "irregular" ? "irr" : "reg"][c.status]++;
    if (c.persistent) persistent++;
    const last = c.recs.slice(-10), miss = last.filter(r => r.g === "miss").length;
    if (c.persistent || (last.length >= MIN_WEAK && miss)) weak.push({ k, persistent: c.persistent, lapses: c.lapses, rate: miss / last.length, n: last.length });
  }));
  weak.sort((a, b) => b.persistent - a.persistent || b.lapses - a.lapses || b.rate - a.rate || b.n - a.n);
  const load = [];
  for (let i = 0; i < 14; i++) load.push({ d: addDays(today, i), n: 0 });
  [fsched.forms, schedule.verbs].forEach(S => Object.keys(S).forEach(k => { const e = entryOfU({ forms: fsched.forms, verbs: schedule.verbs }, k); if (!e || !unitValid(k) && !(BY_ID[k] && BY_ID[k].type === "regular")) return; const i = Math.max(0, dayDiff(today, e.due)); if (i < 14) load[i].n++; }));
  const secs = Array.from(m.days.values());
  return Object.assign(m, { cov, persistent, weak: weak.slice(0, 10), load, practiceDays: m.days.size, avgMin: secs.length ? secs.reduce((a, b) => a + b, 0) / secs.length / 60 : 0 });
}
const pct = (a, n) => Math.round(a / n * 100) + "%";
function renderProgress() {
  const el = $("#statsBody");
  el.innerHTML = '<p class="shelp">Loading…</p>';
  return loadLog().then(() => { el.innerHTML = progressHTML(todayStr()); });
}
function progressHTML(today) {
  const m = progressMetrics(today), C = avgCosts();
  const rate = m.rate.n >= MIN_RATE ? `<p class="ptot"><b>${pct(m.rate.ok, m.rate.n)}</b> of ${m.rate.n.toLocaleString()} reviews right at the first try in the last 30 days. Target 85–95%: ${m.rate.ok / m.rate.n > 0.95 ? "above it, so gaps could safely be longer." : m.rate.ok / m.rate.n < 0.85 ? "below it, so too much is being forgotten between reviews." : "on target."}</p>`
    : `<p class="shelp">Not enough data yet: ${m.rate.n} of ${MIN_RATE} reviews needed.</p>`;
  const gaps = `<table class="kv"><thead><tr><th>Days since last review</th><th>Right first try</th></tr></thead><tbody>` + m.gaps.map(g => `<tr><th>${g.b === Infinity ? g.a + "+" : g.a + "–" + g.b}</th><td>${g.n >= MIN_BUCKET ? `${pct(g.ok, g.n)} <small>(${g.n})</small>` : `<small>not enough data (${g.n} of ${MIN_BUCKET})</small>`}</td></tr>`).join("") + "</tbody></table>";
  const nI = ST.reduce((a, s) => a + m.cov.irr[s], 0), nR = ST.reduce((a, s) => a + m.cov.reg[s], 0);
  const cov = `<table class="kv"><thead><tr><th></th><th>Irregular cards (${nI.toLocaleString()})</th><th>Regular verbs (${nR})</th></tr></thead><tbody>` + ST.map(s => `<tr><th>${ST_LABEL[s]}</th><td>${m.cov.irr[s].toLocaleString()}</td><td>${m.cov.reg[s]}</td></tr>`).join("") +
    `</tbody></table><p class="shelp">Persistent mistakes (${PERSIST}+ lapses): ${m.persistent}. Seen, recalled and retained are counted separately; Library practice and same-day repeats never count.</p>`;
  const weak = m.weak.length ? "<ol>" + m.weak.map(w => `<li><span lang="fr">${esc(unitName(w.k))}</span> <small>${w.persistent ? `persistent, ${w.lapses} lapses` : `Again ${pct(w.rate * w.n, w.n)} of the last ${w.n}`}</small></li>`).join("") + "</ol>" : `<p class="shelp">Not enough data yet: a card needs ${MIN_WEAK} first tries to be ranked.</p>`;
  const grid = `<div class="simtable"><table class="kv grid"><thead><tr><th></th>${PERSONS.map(p => `<th>${esc(p)}</th>`).join("")}</tr></thead><tbody>` + TENSE_KEYS.map(t => `<tr><th>${esc(TENSES[t].name)}</th>${PERSONS.map(p => { const c = m.grid[t + "|" + p]; return !c ? "<td class=\"few\">–</td>" : `<td class="${c.n < MIN_CELL ? "few" : ""}" title="${c.miss} of ${c.n}">${pct(c.miss, c.n)}</td>`; }).join("")}</tr>`).join("") + `</tbody></table></div><p class="shelp">Again rate per tense and person on reviews. Grey cells have fewer than ${MIN_CELL} attempts.</p>`;
  const maxL = Math.max(REVIEW_CAP, ...m.load.map(x => x.n));
  const load = m.load.map(x => `<div class="fc"><span>${esc(fmtDate(x.d))}</span><div class="barwrap"><div class="bar${x.n > REVIEW_CAP ? " over" : ""}" style="width:${Math.max(1, x.n / maxL * 100)}%"></div></div><span>${x.n}</span></div>`).join("") + `<p class="shelp">Cards due each day, overdue ones counted today, before new cards. At most ${REVIEW_CAP} come up in a day; the rest wait.</p>`;
  return `<section class="sgroup"><h2>Am I remembering?</h2>${rate}</section>` +
    `<section class="sgroup"><h2>Does it hold over longer gaps?</h2>${gaps}</section>` +
    `<section class="sgroup"><h2>How much do I know?</h2>${cov}</section>` +
    `<section class="sgroup"><h2>What do I keep getting wrong?</h2>${weak}</section>` +
    `<section class="sgroup"><h2>Where exactly?</h2>${grid}</section>` +
    `<section class="sgroup"><h2>Next 14 days</h2>${load}</section>` +
    `<section class="sgroup"><h2>Am I consistent?</h2><p>${m.practiceDays} of the last 28 days practised${m.practiceDays ? `, about ${Math.round(m.avgMin)} min of answering a day` : ""}. Library practice: ${plural(m.practice, "attempt")} (not counted above).</p></section>` +
    `<section class="sgroup"><details class="shelpbox"><summary>Pace</summary><p class="shelp">How long until every card is introduced, at your current settings. It runs only when asked (up to 365 days).</p><div class="btnrow"><button class="ghost sm" id="paceRun">Calculate</button></div><p id="paceOut"></p></details></section>` +
    `<section class="sgroup"><details class="shelpbox"><summary>Timing and how the schedule works</summary><table class="kv"><tbody>${["main", "form", "listen"].map(k => { const n = timing[k].length; return `<tr><th>${CARD_LABEL[k]}<span class="shelp" style="display:block;font-weight:400">${n >= 50 ? `Your average over the last ${Math.min(n, 200)}` : `Default until you’ve done 50 (${n} so far)`}</span></th><td>${Math.round(C[k])} s</td></tr>`; }).join("")}</tbody></table>${ABOUT}</details></section>`;
}
// B2: the pace simulation runs only on request, capped at 365 days, and is cached for the day.
function paceText() {
  const C = avgCosts(), start = simStart();
  if (!VERBS_OK.length) return "No verbs are loaded yet.";
  if (VERBS_OK.every(v => introduced(curState(), v))) return "Every verb has been introduced.";
  const pk = [todayStr(), Object.keys(fsched.forms).length, Object.keys(schedule.verbs).length, settings.budget, settings.maxNew, settings.maxNewForms, settings.secondPass].join("|");
  if (paceCache.k !== pk) paceCache = { k: pk, v: simulate(365, 1, C, start, true).allIn };
  return paceCache.v ? `At this pace, every card will be introduced by ${parseD(paceCache.v).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}.` : "At this pace, introducing every card takes more than a year. A bigger daily budget or more new cards a day would speed it up.";
}
$("#statsBody").addEventListener("click", e => { if (e.target.closest("#paceRun")) $("#paceOut").textContent = paceText(); });

/* ---------- GitHub sync ---------- */
let syncing = false, syncTimer = null, syncErr = "", syncNotified = false;
const b64 = x => { const b = new TextEncoder().encode(x); let o = ""; for (let i = 0; i < b.length; i += 0x8000) o += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(o); };
const unb64 = x => { const o = atob(x.replace(/\s/g, "")), b = new Uint8Array(o.length); for (let i = 0; i < o.length; i++) b[i] = o.charCodeAt(i); return new TextDecoder().decode(b); };
function syncCfg() { try { const c = JSON.parse(lsGet(KEYS.sync) || "null"); return isObj(c) && c.user && c.repo && c.token ? c : null; } catch (e) { return null; } }
const ghUrl = c => `https://api.github.com/repos/${encodeURIComponent(c.user)}/${encodeURIComponent(c.repo)}/contents/${c.path || "frverbs-data.json"}`;
function ghFetch(c, url, opts) {
  opts = opts || {};
  opts.headers = Object.assign({ Authorization: "Bearer " + c.token, Accept: "application/vnd.github+json" }, opts.headers || {});
  opts.cache = "no-store";
  return fetch(url, opts);
}
const okEntry = e => isObj(e) && Number.isInteger(e.step) && e.step >= 0 && e.step <= 8 && isDate(e.due);
function better(a, b) {
  if (!a) return b; if (!b) return a;
  const ea = a.enc || 0, eb = b.enc || 0;
  if (ea !== eb) return ea > eb ? a : b;
  const la = a.lastDate || "", lb = b.lastDate || "";
  if (la !== lb) return la > lb ? a : b;
  return (a.step || 0) >= (b.step || 0) ? a : b;
}
function mergeUnits(L, R) {
  const out = {};
  Object.keys(R || {}).concat(Object.keys(L || {})).forEach(k => { if (k in out) return; const e = better(okEntry(L && L[k]) ? L[k] : null, okEntry(R && R[k]) ? R[k] : null); if (e) out[k] = e; });
  return out;
}
function mergeLogs(L, R) {
  const out = {};
  [L, R].forEach(o => { if (!isObj(o)) return; Object.keys(o).forEach(d => { if (!isDate(d) || !Array.isArray(o[d])) return; out[d] = Array.from(new Set((out[d] || []).concat(o[d].filter(x => typeof x === "string")))); }); });
  return out;
}
function mergeHist(L, R) {
  const out = cleanHist(L), r = cleanHist(R);
  Object.keys(r).forEach(d => {
    out[d] = out[d] || {};
    ["irr", "reg"].forEach(k => {
      if (!r[d][k]) return;
      const a = out[d][k]; if (!a) { out[d][k] = r[d][k]; return; }
      r[d][k].new.forEach(([id, ts]) => { const f = a.new.find(x => x[0] === id); if (f) ts.forEach(t => { if (f[1].indexOf(t) < 0) f[1].push(t); }); else a.new.push([id, ts]); });
      if (typeof r[d][k].n === "number") a.n = Math.max(a.n || 0, r[d][k].n);
    });
  });
  return out;
}
const syncCore = o => [o.forms, o.verbs, o.fNewLog, o.newLog, o.hist, o.review && o.review.items];
const stable = o => JSON.stringify(o, (k, v) => (v && typeof v === "object" && !Array.isArray(v) ? Object.keys(v).sort().reduce((a, x) => (a[x] = v[x], a), {}) : v));
function syncPayload() { return { app: "french-verbs-sync", v: 1, savedAt: new Date().toISOString(), forms: fsched.forms, verbs: schedule.verbs, fNewLog: fsched.newLog, newLog: schedule.newLog, hist, review: { items: review.items, seeded: review.seeded } }; }
function applyRemote(R) {
  fsched.forms = mergeUnits(fsched.forms, R.forms); schedule.verbs = mergeUnits(schedule.verbs, R.verbs);
  fsched.newLog = mergeLogs(fsched.newLog, R.fNewLog); schedule.newLog = mergeLogs(schedule.newLog, R.newLog);
  hist = mergeHist(hist, R.hist);
  if (isObj(R.review)) { const rr = cleanReview(R.review); review.items = mergeReview(review.items, rr.items); review.seeded = review.seeded || rr.seeded; reviewPrune(); saveReview(); }
  saveForms(); saveSchedule(); saveHist();
}
function setSyncStatus(m) { const el = $("#syncStatus"); if (el) el.textContent = m; }
function syncIdleText() {
  const c = syncCfg(), at = lsGet(KEYS.syncat);
  return syncErr ? syncErr : c ? `Connected to ${c.user}/${c.repo}.` + (at ? " Last synced " + new Date(at).toLocaleString() + "." : "") : "Not connected.";
}
async function syncNow(why) {
  const c = syncCfg(); if (!c || syncing) return false;
  syncing = true; setSyncStatus("Syncing…");
  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      const r = await ghFetch(c, ghUrl(c));
      let sha = null, remote = null;
      if (r.status === 404) { /* no file yet */ }
      else if (!r.ok) throw new Error(r.status === 401 || r.status === 403 ? "GitHub refused the token. Check it hasn’t expired and has Contents: Read and write." : "GitHub error " + r.status);
      else {
        const j = await r.json(); sha = j.sha;
        let txt = j.content ? unb64(j.content) : "";
        if (!txt) { const r2 = await ghFetch(c, ghUrl(c), { headers: { Accept: "application/vnd.github.raw+json" } }); txt = await r2.text(); }
        try { remote = JSON.parse(txt); } catch (e) { throw new Error("The synced file on GitHub is damaged."); }
      }
      if (remote && remote.app === "french-verbs-sync") applyRemote(remote);
      const mine = syncPayload();
      if (!(remote && stable(syncCore(remote)) === stable(syncCore(mine)))) {
        const body = { message: "Verbes sync", content: b64(JSON.stringify(mine)) };
        if (sha) body.sha = sha;
        const p = await ghFetch(c, ghUrl(c), { method: "PUT", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });
        if (p.status === 409 || p.status === 422) continue;
        if (!p.ok) throw new Error(p.status === 404 ? "Repository not found, or the token can’t write to it." : p.status === 401 || p.status === 403 ? "GitHub refused the token. Check it has Contents: Read and write." : "GitHub error " + p.status);
      }
      lsSet(KEYS.syncat, new Date().toISOString()); syncErr = ""; syncNotified = false;
      setSyncStatus(syncIdleText());
      return true;
    }
    throw new Error("Two devices wrote at once. Try again.");
  } catch (e) {
    syncErr = e instanceof TypeError ? "Offline. Your progress is safe on this device and will sync later." : "Sync failed: " + (e && e.message ? e.message : e);
    setSyncStatus(syncErr);
    if (!(e instanceof TypeError) && !syncNotified) { syncNotified = true; addNotice(syncErr + " (Settings > Sync)"); }
    return false;
  } finally { syncing = false; }
}
function syncSoon() { if (!syncCfg()) return; clearTimeout(syncTimer); syncTimer = setTimeout(() => syncNow("auto"), 20000); }
function syncHTML() {
  const f = (id, label, type) => `<div class="srow col"><label class="slabel" for="${id}">${label}</label><input id="${id}" type="${type || "text"}" autocomplete="off" autocapitalize="off" spellcheck="false" style="min-height:44px;border:1px solid var(--line);border-radius:10px;padding:0 12px;background:var(--paper)"></div>`;
  return `<section class="sgroup"><h2>Sync between devices (GitHub)</h2><p class="shelp">Keeps your progress the same on your laptop and phone, using a private GitHub repository you own. Voice and display settings stay separate on each device. Use one device at a time.</p>` +
    f("syUser", "GitHub username") + f("syRepo", "Repository name") + f("syToken", "Access token", "password") +
    `<div class="btnrow wrap" style="margin-top:10px"><button class="primary sm" id="syncSave">Save and sync</button><button class="ghost sm" id="syncNow">Sync now</button><button class="ghost sm" id="syncOff">Disconnect</button></div><p class="shelp" id="syncStatus"></p>` +
    `<details class="shelpbox"><summary>How to set this up (about 5 minutes)</summary>` +
    `<p><b>1. Make the repository.</b> On github.com press + then New repository. Name it <b>verbs-data</b>, choose <b>Private</b>, tick <b>Add a README file</b>, then Create repository.</p>` +
    `<p><b>2. Make a token.</b> Click your profile picture, then Settings, then Developer settings, then Personal access tokens, then Fine-grained tokens, then Generate new token. Name it Verbes and pick the longest expiry allowed. Under Repository access choose <b>Only select repositories</b> and pick verbs-data. Under Repository permissions set <b>Contents</b> to <b>Read and write</b>. Generate the token and copy it now; GitHub shows it only once.</p>` +
    `<p><b>3. Connect.</b> Type your username, verbs-data and the token above, then press Save and sync. Do the same on your other device.</p>` +
    `<p>The token stays on that device and is never put in backup files. If a device is lost, delete the token on GitHub. When a token expires, make a new one and paste it here.</p></details></section>`;
}
function refreshSyncUI() {
  const c = syncCfg();
  if ($("#syUser") && c && !$("#syUser").value) { $("#syUser").value = c.user; $("#syRepo").value = c.repo; $("#syToken").placeholder = "Saved on this device"; }
  setSyncStatus(syncIdleText());
  const ds = daysSince(lsGet(KEYS.lastbackup));
  if ($("#backupInfo")) $("#backupInfo").textContent = "Last backup: " + (ds === 999 ? "never" : ds === 0 ? "today" : ds + " days ago") + ".";
}
function wireSync() {
  $("#settingsBody").addEventListener("click", async e => {
    if (e.target.closest("#syncSave")) {
      const old = syncCfg(), user = $("#syUser").value.trim(), repo = $("#syRepo").value.trim(), tok = $("#syToken").value.trim() || (old ? old.token : "");
      if (!user || !repo || !tok) { setSyncStatus("Fill in the username, repository name and token."); return; }
      lsSet(KEYS.sync, JSON.stringify({ user, repo, token: tok, path: "frverbs-data.json" })); $("#syToken").value = "";
      if (await syncNow("save")) toast("Synced.");
    } else if (e.target.closest("#syncNow")) {
      if (!syncCfg()) { setSyncStatus("Not connected yet."); return; }
      if (await syncNow("manual")) toast("Synced.");
    } else if (e.target.closest("#syncOff")) { lsRemove(KEYS.sync); lsRemove(KEYS.syncat); setSyncStatus("Disconnected. The token was removed from this device."); }
  });
}

/* ---------- schedule settings ---------- */
function schedSettingsHTML() {
  const nums = (a, f) => a.map(n => [String(n), f ? f(n) : String(n)]);
  return `<section class="sgroup"><h2>Daily schedule</h2>` +
    segRow("budget", "Daily time", nums([20, 25, 30, 35, 40, 45], n => n + " min"), "One session a day, within about this time. Reviews come first (at most 120 a day, the cards most at risk first); new cards fill the time that is left. Regular verbs always get at least 5 minutes.") +
    segRow("maxNewForms", "Most new irregular forms per day", nums([10, 15, 20, 25, 30]), "Introduced verb by verb in rank order: the infinitive, then présent (je to ils), then the other tenses.") +

    segRow("maxNew", "Most new regular verbs per day", nums([2, 4, 6, 8, 10, 12])) +
    switchRow("secondPass", "Second pass", "At the end of each section, one more go at today’s new cards (as listening) and at every card you missed or marked Hard. Practice only: it never changes when a card is next due.") +
    segRow("lapse", "When you miss a card at a review", [["gentle", "Gentle"], ["on", "In proportion"]], "In proportion: the card drops back to a gap about a quarter of the one it failed at (after a gap of 2–4 days: back to 1 day; 7 days: 2 days; 16 days: 7 days; 30 days: 16 days; 120 days or more: 30 days), then climbs again. Gentle: it drops back one step. Either way, a miss on a new card or at its 1-day review keeps it where it is, due tomorrow. Only your first try of the day counts.") +

    `<p class="shelp">Each card alternates between speaking (English to French) and listening (audio only). A new card is tested speaking and then listening in the second pass; its first review is speaking again. A miss goes to the back of the pile, in the same direction, until you get it right. Only your first try of the day counts toward the schedule. Speaking cards come first in a session, then listening cards.</p>` +
    `<div class="srow col"><span class="slabel">Order of regular groups for new verbs</span><p class="shelp">Within each group, verbs are introduced by importance rank. Irregular verbs have their own block.</p><ol class="secorder" id="secOrder"></ol></div>` +
    `</section>`;
}
function simHTML() {
  return `<section class="sgroup"><details class="shelpbox"><summary>Advanced: simulate</summary><p class="shelp">Fast-forwards a copy of your progress to show the daily load. A miss adds retry time and, with the miss rule on, sends the card back down the ladder. Your real progress is never touched.</p>` +
    `<div class="simgrid"><label>Days<select id="simDays"><option>7</option><option selected>30</option><option>90</option><option>180</option><option>365</option></select></label>` +
    `<label>Pass rate (%)<input id="simPass" type="number" min="0" max="100" value="85" inputmode="numeric"></label>` +
    `<label>Speaking infinitive / regular card (s)<input id="simMain" type="number" min="1" max="300" value="10" inputmode="numeric"></label>` +
    `<label>Speaking form card (s)<input id="simForm" type="number" min="1" max="300" value="10" inputmode="numeric"></label>` +
    `<label>Listening card (s)<input id="simListen" type="number" min="1" max="300" value="12" inputmode="numeric"></label></div>` +
    `<div class="btnrow" style="margin-top:10px"><button class="primary sm" id="simRun">Run simulation</button></div><div id="simOut"></div></details></section>`;
}
function syncSchedSettings() {
  if (!$("#secOrder")) return;
  const ord = regSections();
  $("#secOrder").innerHTML = ord.map((g, i) => `<li><span>${esc(sectionName(g))}</span><button class="ghost sm" data-sec-up="${esc(g)}"${i ? "" : " disabled"}>Move up</button></li>`).join("");
}
function aiSettingsHTML() {
  return `<section class="sgroup"><h2>Recorded voices</h2><p class="shelp">Every form is recorded in advance in two natural voices, which alternate between cards. Clips are downloaded from this site as you need them and kept on this device, so they also play offline. Anything not recorded uses the browser voice.</p>` +
    switchRow("aiVoices", "Use recorded voices", null) +
    `<p class="shelp" id="aiStatus" role="status" aria-live="polite"></p>` +
    `<div class="srow col"><span class="slabel">Regeneration list</span><p class="shelp" id="aiRegenInfo"></p><div class="btnrow wrap"><button class="ghost sm" id="aiRegenExport">Export list</button><button class="ghost sm" id="aiRegenClear">Clear list</button></div><p class="shelp">“Sounded wrong?” on a card adds its clip here. Export the list and give it to tools/make-audio.js on your laptop to record those clips again.</p></div>` +
    `<div class="srow col"><span class="slabel">Saved audio</span><p class="shelp" id="aiCacheInfo"></p><div class="btnrow"><button class="ghost sm" id="aiCacheClear">Clear saved audio</button></div></div></section>`;
}
function syncAiUI() {
  if (!$("#aiStatus")) return;
  const n = clipMan ? Object.keys(clipMan.clips).length : 0;
  $("#aiStatus").textContent = !clipMan ? "No recorded audio was found, so the browser voice is used." : !settings.aiVoices ? "Recorded voices are switched off, so the browser voice is used." : `${n.toLocaleString()} lines recorded in ${clipMan.voices.join(" and ")}.`;
  const open = regenOpen().length;
  $("#aiRegenInfo").textContent = open ? `${plural(open, "clip")} to record again.` : "Empty.";
  $("#aiCacheInfo").textContent = `${plural(aiDB.keys.size, "clip")} kept on this device, ${(aiDB.bytes / 1048576).toFixed(1)} MB of ${Math.round(aiCfg.cap / 1048576)} MB. The least recently played are removed first.`;
}
function regenFile() { return { app: "verbes", type: "regenerate", made: todayStr(), version: APP_VERSION, items: regenOpen().map(x => ({ voice: x.voice, lang: x.lang, text: x.text, id: x.id })) }; }
function wireAi() {
  const root = $("#settingsBody");
  root.addEventListener("click", async e => {
    const t = e.target;
    if (t.closest("#aiRegenExport")) {
      const f = regenFile(); if (!f.items.length) { toast("The list is empty."); return; }
      const url = URL.createObjectURL(new Blob([JSON.stringify(f, null, 1)], { type: "application/json" })), a = document.createElement("a");
      a.href = url; a.download = `verbes-regenerate-${todayStr()}.json`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000);
    } else if (t.closest("#aiRegenClear")) {
      if (await confirmBox("Clear the regeneration list?", "<p>Flagged clips play again in their voice. Clear it after you have run the script on the exported list.</p>", "Clear", true)) { regen = {}; saveRegen(); syncAiUI(); }
    } else if (t.closest("#aiCacheClear")) {
      if (await confirmBox("Clear saved audio?", "<p>This deletes the audio clips kept on this device. They download again as you need them.</p>", "Clear", true)) { await aiDB.clear(); syncAiUI(); toast("Saved audio cleared."); }
    }
  });
  $("#aiFix").addEventListener("click", aiFix);
}
function syncSettingsUI() { syncSettingsUI0(); syncSchedSettings(); refreshSyncUI(); syncAiUI(); }
function wireSched() {
  $("#settingsBody").addEventListener("click", e => {
    const up = e.target.closest("[data-sec-up]");
    if (up) {
      const ord = regSections(), i = ord.indexOf(up.dataset.secUp);
      if (i > 0) { const x = ord[i - 1]; ord[i - 1] = ord[i]; ord[i] = x; settings.sectionOrder = ["irregular"].concat(ord); saveSettings(); syncSchedSettings(); }
      return;
    }
    if (e.target.closest("#simRun")) runSim();
  });
}

/* =========================================================================
   NAVIGATION
   ========================================================================= */
let currentScreen = "";
const SCREENS = ["today", "library", "study", "summary", "guide", "stats", "settings"];
// v6.9 (Section 4B): three tabs. Settings sit behind the gear on Today; Learn is the verb page in the Library.
const TAB_OF = { today: "today", library: "library", learn: "library", guide: "library", progress: "stats", stats: "stats", settings: "today" };
function showScreen(name) {
  if (currentScreen === "study" && name !== "study") { stopSpeech(); stopListening(); }
  SCREENS.forEach(s => { $("#scr-" + s).hidden = s !== name; });
  currentScreen = name;
  const full = name === "study" || name === "summary";
  $("#tabs").hidden = full;
  document.body.classList.toggle("in-study", name === "study");
  $$("#tabs [data-tab]").forEach(b => b.setAttribute("aria-current", b.dataset.tab === TAB_OF[name] ? "page" : "false"));
  $$(".subnav [data-tab]").forEach(b => b.setAttribute("aria-current", b.dataset.tab === name ? "page" : "false"));
}
function navigate(name, extra) {
  const st = Object.assign({ screen: name }, extra || {});
  try { history.pushState(st, ""); } catch (e) {}
  route(st);
}
function route(st) {
  st = st || {};
  let name = st.screen === "progress" ? "stats" : st.screen === "learn" || SCREENS.includes(st.screen) ? st.screen : "library";
  // The Learn list is merged into the Library: a verb link opens that verb's page there.
  if (name === "learn") {
    name = "library"; libBack = !!st.fromStudy || !!curItem();
    if (st.verb && BY_ID[st.verb]) { Object.assign(libF, { q: "", type: "all", status: "all", tense: "", due: "any", review: false }); libOpen.add(st.verb); syncLibCtl(); }
  } else if (name === "library") libBack = false;
  if (name === "study" && !curItem()) name = session && session.mode === "sched" ? "today" : (session && session.done ? "summary" : "library");
  if (name === "summary" && !(session && session.mode !== "sched" && session.done)) name = curItem() ? "study" : "today";
  if (name === "today") renderToday();
  else if (name === "stats") renderProgress();
  else if (name === "library") renderLibrary();
  else if (name === "study") renderStudy(false);
  else if (name === "summary") renderSummary();
  else if (name === "guide") renderGuide();
  else if (name === "settings") syncSettingsUI();
  showScreen(name);
  if (name === "library" && st.verb && document.getElementById("lb-" + st.verb)) {
    document.getElementById("lb-" + st.verb).scrollIntoView({ block: "start" });
  } else if (name === "guide" && st.tense && document.getElementById("g-" + st.tense)) {
    const el = document.getElementById("g-" + st.tense);
    el.scrollIntoView({ block: "start" });
    if (animOn()) { el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash"); }
  } else window.scrollTo(0, 0);
}
window.addEventListener("popstate", e => route(e.state || { screen: "library" }));
document.addEventListener("click", e => { const b = e.target.closest(".tabs [data-tab], .subnav [data-tab], .pagehead [data-tab], .alldone [data-tab]"); if (b && b.dataset.tab !== currentScreen) navigate(b.dataset.tab); });
document.addEventListener("click", e => {
  const b = e.target.closest("[data-dismiss]");
  if (b) { const i = notices.findIndex(n => n.id === b.dataset.dismiss); if (i >= 0) notices.splice(i, 1); renderNotices(); }
});

/* =========================================================================
   START
   ========================================================================= */
function showFatal(msg) {
  const f = $("#fatal");
  f.hidden = false;
  f.innerHTML = `<h1>Verbes can’t start</h1><p>${esc(msg)}</p><p>Your saved progress is untouched. Fix the problem and reload the page.</p>`;
  SCREENS.forEach(s => { $("#scr-" + s).hidden = true; });
  $("#tabs").hidden = true;
}
function init() {
  settings = loadSettings();
  progress = loadProgress();
  schedule = loadSchedule();
  fsched = loadForms();
  review = loadReview();
  hist = loadHist();
  timing = loadTiming();
  applyDisplay();
  loadData();
  if (FATAL) { showFatal(FATAL); return; }
  migrateForms();
  migrateSched();
  migrateCards();
  reviewSeed(); reviewPrune();
  SECTIONS = buildSections();
  buildSettings();
  wireSettings();
  wireSched();
  wireSync();
  wireAi(); loadLog();
  lsRemove(KEYS.aikey); lsRemove(KEYS.aistats); // v6.6: no API key is kept on any device (risk R2)
  aiDB.open().then(async () => { if (lsGet(KEYS.clipcache) !== CLIP_CACHE_VERSION) { await aiDB.clear(); lsSet(KEYS.clipcache, CLIP_CACHE_VERSION); } syncAiUI(); });
  loadManifest().then(syncAiUI);
  const raw = loadSessionRaw();
  if (raw) session = restoreSession(raw);
  if (synth) {
    loadVoices();
    if (synth.addEventListener) synth.addEventListener("voiceschanged", loadVoices); else synth.onvoiceschanged = loadVoices;
    [250, 1000, 2500, 5000].forEach(ms => setTimeout(loadVoices, ms));
  }
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e) {}
  renderNotices();
  try { history.replaceState({ screen: "today" }, ""); } catch (e) {}
  route({ screen: "today" });
  window.addEventListener("storage", e => { if (e.key && e.key.indexOf("frverbs.") === 0 && e.key.indexOf(KEYS.backup) !== 0 && e.key !== KEYS.syncat) addNotice("Verbes seems to be open in another tab. Use one tab at a time, or progress can be overwritten."); });
  setTimeout(() => { if (synth && !voices.length) addNotice("No French voice found on this device yet. See Settings › Browser voice for how to add one."); }, 6000);
  document.addEventListener("visibilitychange", () => {
    if (!syncCfg()) return;
    if (document.hidden) syncNow("hide"); else syncNow("show").then(() => { if (currentScreen === "today" && !(session && session.mode === "sched" && !session.done)) renderToday(); });
  });
  if (syncCfg()) syncNow("open").then(() => { if (currentScreen === "today") renderToday(); });
  window.addEventListener("error", e => { if (e && e.filename && /verbs\.js/i.test(e.filename)) return; toast("Something went wrong: " + (e.message || "unknown error")); });
}
try { init(); }
catch (e) { showFatal("Something went wrong while starting: " + (e && e.message || e)); }

// Exposed for checking from the browser console.
window.__verbes = { get verbs() { return VERBS_OK; }, get problems() { return PROBLEMS; }, get settings() { return settings; }, get progress() { return progress; }, get schedule() { return schedule; }, get formsched() { return fsched; }, curState, avgCosts, get session() { return session; }, plan: (d) => plan(d || todayStr(), curState(), avgCosts()), simulate, formHTML, mainHTML, tableHTML, syncNow, mergeUnits, renderProgress, matchLevel, norm };
