// Verbes: Library, verb pages, Tense guide, Settings page, export, import and reset.
// Plain script, no build step. Loaded by index.html in this order: core.js, conjugate.js, audio.js, study.js, screens.js, scheduler.js, app.js.
"use strict";
/* =========================================================================
   LIBRARY
   ========================================================================= */
const libF = { q: "", type: "all", status: "all", tense: "", due: "any", sort: "rank", review: false }, libOpen = new Set();
let libBack = false;   // opened from a card: offer the way back
function syncLibCtl() {
  const set = (id, v) => { const el = document.getElementById(id); if (el) { if (el.type === "checkbox") el.checked = v; else el.value = v; } };
  set("libSearch", libF.q); set("libType", libF.type); set("libStatus", libF.status); set("libTense", libF.tense); set("libDue", libF.due); set("libReview", libF.review);
}
function libRowHTML(v, st) {
  const open = libOpen.has(v.id);
  return `<section class="lverb" id="lb-${esc(v.id)}"><button class="lrow" data-libtoggle="${esc(v.id)}" aria-expanded="${open}"><span class="lname"><span class="lfr" lang="fr">${esc(v.french)}</span><span class="ldash"> — </span><span>${esc(v.english)}</span></span>` +
    `${tenseDots(st)}<span class="lmeta">${esc(st.label)}${st.persistent.length ? " · persistent" : ""}${st.due ? " · " + esc(fmtDate(st.due)) : ""}</span><span class="lchev">${ICON.chev}</span></button><div class="lbody"${open ? "" : " hidden"}>${open ? libVerbHTML(v) : ""}</div></section>`;
}
function libList() {
  const t = todayStr(), q = deacc(norm(libF.q)), rv = new Set(libF.review ? reviewActive().map(unitVerb) : []), rk = x => ST.indexOf(x);
  const out = [];
  VERBS_OK.forEach(v => {
    if (libF.type !== "all" && (libF.type === "irregular" ? v.type !== "irregular" : v.section !== libF.type)) return;
    if (q && deacc(norm(v.french + " " + v.english + " " + v.id)).indexOf(q) < 0) return;
    if (libF.review && !rv.has(v.id)) return;
    const st = verbStatus(v), s = libF.tense ? st.tenses[libF.tense] : st.status;
    if (libF.tense && libF.status === "all" && s === "new") return;
    if (libF.status === "persistent" ? !st.persistent.length : libF.status !== "all" && s !== libF.status) return;
    if (libF.due !== "any" && (!st.due || (libF.due === "overdue" ? st.due >= t : libF.due === "today" ? st.due > t : st.due > addDays(t, 7)))) return;
    out.push({ v, st, w: rk(s) });
  });
  const ord = schedSections();
  out.sort(libF.sort === "weak" ? (a, b) => a.w - b.w || b.st.persistent.length - a.st.persistent.length || a.v.rankNum - b.v.rankNum
    : libF.sort === "due" ? (a, b) => ((a.st.due || "9") < (b.st.due || "9") ? -1 : (a.st.due || "9") > (b.st.due || "9") ? 1 : a.v.rankNum - b.v.rankNum)
    : (a, b) => ord.indexOf(a.v.section) - ord.indexOf(b.v.section) || a.v.rankNum - b.v.rankNum);
  return out;
}
function renderLibList() {
  const list = libList();
  $("#libCount").textContent = `${plural(list.length, "verb")} shown.`;
  $("#libList").innerHTML = list.length ? list.map(x => libRowHTML(x.v, x.st)).join("") : '<p class="empty">No verbs match these filters.</p>';
}
function renderLibrary() {
  renderReviewSec();
  const n = VERBS_OK.length;
  $("#libLede").textContent = n ? `${plural(n, "verb")}. Tap a verb for its tables, status and recent attempts.` : "No verbs are loaded yet. Add them to verbs.js.";
  $("#problems").innerHTML = PROBLEMS.length ? `<details class="problems" open><summary>${plural(PROBLEMS.length, "problem")} in verbs.js. These parts were skipped; everything else loaded.</summary><ul>${PROBLEMS.map(p => `<li><b>${esc(p.where)}</b>: ${esc(p.errs.join("; "))}.</li>`).join("")}</ul></details>` : "";
  const it = curItem();
  $("#resume").innerHTML = it && (libBack || session.mode !== "sched") ? `<div class="resume"><p>${session.mode === "sched" ? "Session" : `Practice in progress: <b>${esc(session.title)}</b>,`} card ${session.idx + 1} of ${session.queue.length}.</p><button class="primary sm" data-resume>Back to your ${session.mode === "sched" ? "session" : "card"}</button></div>` : "";
  const ts = $("#libTense"); if (ts.options.length === 1) TENSE_KEYS.forEach(t => ts.add(new Option(TENSES[t].name, t)));
  renderLibList();
  loadLog().then(() => { if (currentScreen === "library") renderLibList(); });
}
["libSearch", "libType", "libStatus", "libTense", "libDue", "libSort", "libReview"].forEach(id => $("#" + id).addEventListener(id === "libSearch" ? "input" : "change", e => {
  const key = { libSearch: "q", libType: "type", libStatus: "status", libTense: "tense", libDue: "due", libSort: "sort", libReview: "review" }[id];
  libF[key] = id === "libReview" ? e.target.checked : e.target.value; renderLibList();
}));
$("#scr-library").addEventListener("click", e => {
  const t = e.target;
  const pr = t.closest("[data-practise]"); if (pr) { openPractise(verbsInScope(pr.dataset.practise), scopeLabel(pr.dataset.practise)); return; }
  const ls = t.closest("[data-learn-scope]"); if (ls) { navigate("learn", { scope: ls.dataset.learnScope }); return; }
  const lv = t.closest("[data-learn-verb]"); if (lv) { navigate("learn", { scope: "all", verb: lv.dataset.learnVerb }); return; }
  const pv = t.closest("[data-practise-verb]"); if (pv) { const v = BY_ID[pv.dataset.practiseVerb]; openPractise([v], v.french); return; }
  const say = t.closest("[data-say]"); if (say) { speak(sayArg(say), say); return; }
  const tg = t.closest("[data-libtoggle]"); if (tg) { toggleVerbIn($("#libList"), libOpen, "lb", tg.dataset.libtoggle, undefined, libVerbHTML); return; }
  const g = t.closest("[data-guide]"); if (g) { navigate("guide", { tense: g.dataset.guide }); return; }
  if (t.closest("[data-resume]")) navigate("study");
});

/* ---------- practise dialog ---------- */
let practiseTarget = null;
function practiseCount() { return practiseTarget ? cardsFor(practiseTarget.verbs, settings.practiseContent).length : 0; }
function syncPractise() {
  $$('#practiseDlg input[name="pcontent"]').forEach(r => { r.checked = r.value === settings.practiseContent; });
  $$('#practiseDlg input[name="porder"]').forEach(r => { r.checked = r.value === settings.practiseOrder; });
  const n = practiseCount();
  $("#pStart").textContent = `Start (${plural(n, "card")})`;
  $("#pStart").disabled = !n;
  const irr = practiseTarget.verbs.some(v => v.keyRows.length);
  $("#pNote").textContent = settings.practiseContent === "key" && !irr ? "Key forms cards are for irregular verbs only, so these verbs get the main card only."
    : settings.practiseContent === "key" ? "Regular verbs get the main card only; key forms are for irregular verbs." : "";
}
function openPractise(verbs, title) {
  if (!verbs.length) { toast("No verbs here yet."); return; }
  practiseTarget = { verbs, title };
  $("#pTitle").textContent = "Practise: " + title;
  syncPractise();
  $("#practiseDlg").showModal();
}
$("#practiseDlg").addEventListener("change", e => {
  if (e.target.name === "pcontent") settings.practiseContent = e.target.value;
  if (e.target.name === "porder") settings.practiseOrder = e.target.value;
  saveSettings(); syncPractise();
});
$("#pCancel").addEventListener("click", () => $("#practiseDlg").close());
$("#practiseDlg").addEventListener("click", e => { if (e.target === e.currentTarget) e.currentTarget.close(); });
$("#pStart").addEventListener("click", () => {
  $("#practiseDlg").close();
  startSession(cardsFor(practiseTarget.verbs, settings.practiseContent), practiseTarget.title, settings.practiseOrder);
});

/* =========================================================================
   VERB PAGES (tables, family, expressions)
   ========================================================================= */
// "Like prendre" on a family member; "Same pattern: apprendre, comprendre" on the verb the family is named after.
function familyText(v) {
  if (v.family) return v.family.charAt(0).toUpperCase() + v.family.slice(1);
  const kids = VERBS_OK.filter(x => x.family === "like " + v.french);
  return kids.length ? "Same pattern: " + kids.map(x => x.french).join(", ") : "";
}
function expressionsHTML(v) {
  if (!v.expressions.length) return "";
  return `<div class="ltense"><div class="lthead"><h3>Common expressions</h3></div><table class="conj persons"><tbody>` +
    v.expressions.map(x => `<tr><td class="c-fr" lang="fr">${esc(x.fr)}</td><td class="c-en">${esc(x.en)}</td><td class="c-ph">${esc(x.phon)}</td><td class="c-pl">${playBtn(x.fr, "", x.fr)}</td></tr>`).join("") + "</tbody></table></div>";
}
// Status per row: a person card's own, or for a key tense the key card's on every row.
function rowStatus(st, t, rows) {
  const m = Object.fromEntries(st.cards.filter(c => c.k.split("|")[1] === t).map(c => [c.k.split("|")[2], c]));
  if (m[KEY]) rows.forEach(r => { m[r.key] = m[KEY]; });
  return m;
}
function verbDetailHTML(v, st) {
  const regular = v.type === "regular", fam = familyText(v);
  let h = `<div class="vhead"><div><div class="vfr" lang="fr">${esc(v.french)}</div><div class="vph">${esc(v.phonetic)}</div><div class="ven">${esc(v.english)}</div>` +
    `<p class="vmeta">${esc(typeName(v))}, importance ${esc(v.rank)}${v.auxiliary === "être" ? ", takes être in the passé composé" : ""}${v.impersonal ? ", used only with il (impersonal)" : ""}${fam ? ". " + esc(fam) : ""}${reviewHasVerb(v) ? '<span class="rvtag">to review</span>' : ""}</p></div>${playBtn(v.french, "Play")}</div>` +
    `<div class="vbtns"><button class="ghost sm" data-practise-verb="${esc(v.id)}">Practise this verb</button></div>` + expressionsHTML(v);
  TENSE_KEYS.forEach(t => {
    const tab = v.tables[t];
    h += `<div class="ltense"><div class="lthead"><h3>${esc(TENSES[t].name)}</h3><span class="gloss">${esc(GLOSS[t] || "")}</span><button class="linkbtn sm" data-guide="${esc(t)}">How it works</button>${playAllBtn(tab.rows, "Play all")}</div>` +
      (regular && tab.rule ? `<p class="rule">${esc(tab.rule)}</p>` : "") +
      tableHTML(tab.rows, { en: !regular || tab.rows.some(r => r.en), phon: true, hl: regular && tab.source === "rules", review: reviewMarks(v.id, t), st: st && !regular ? rowStatus(st, t, tab.rows) : null }) + "</div>";
  });
  return h;
}
function verbRowHTML(v, set, prefix, ss) {
  set = set || new Set(); prefix = prefix || "lv";
  const open = set.has(v.id);
  return `<section class="lverb" id="${prefix}-${esc(v.id)}"><button class="lrow" data-toggle="${esc(v.id)}" aria-expanded="${open}"><span class="lname"><span>${esc(v.english)}</span><span class="ldash"> — </span><span class="lfr" lang="fr">${esc(v.french)}</span></span>${v.test ? '<span class="tag">test</span>' : ""}<span class="lchev">${ICON.chev}</span></button><div class="lbody"${open ? "" : " hidden"}>${open ? verbDetailHTML(v) : ""}</div></section>`;
}
function toggleVerbIn(root, set, prefix, id, open, render) {
  const sec = root && document.getElementById(prefix + "-" + id); if (!sec || !root.contains(sec)) return;
  const btn = $(".lrow", sec), body = $(".lbody", sec);
  if (open === undefined) open = !set.has(id);
  if (open) { set.add(id); if (!body.innerHTML) body.innerHTML = (render || verbDetailHTML)(BY_ID[id]); }
  else set.delete(id);
  body.hidden = !open; btn.setAttribute("aria-expanded", open);
}

/* =========================================================================
   TENSE GUIDE
   ========================================================================= */
function guideEndings(t) {
  const gs = Object.keys(RULESX).filter(g => !brokenGroups.has(g));
  if (!gs.length) return "";
  const rows = gs.map(g => {
    const G = RULESX[g], R = G.tenses[t];
    let text;
    if (R.from === "auxiliary") text = `avoir or être (présent) + past participle: stem + -${G.participle.fr}`;
    else {
      const stemDesc = R.from === "future" ? (G.futureStem.drop ? `the infinitive minus its last ${G.futureStem.drop === 1 ? "letter" : G.futureStem.drop + " letters"}` : "the whole infinitive") : "stem";
      text = `${stemDesc} + ${PERSONS.map(p => (R.endings[p].fr ? "-" + R.endings[p].fr : "(nothing)")).join(", ")}`;
    }
    const ex = VERBS_OK.find(v => v.type === "regular" && v.group === g && v.tables[t] && v.tables[t].source === "rules");
    return `<tr><th>${esc(G.name)}</th><td>${esc(text)}</td><td>${ex ? `<span class="gex" lang="fr">${esc(ex.tables[t].rows[0].fr)}</span>` : ""}</td></tr>`;
  });
  return `<h3>Regular endings</h3><table class="gtable"><tbody>${rows.join("")}</tbody></table>`;
}
function renderGuide() {
  $("#guideList").innerHTML = TENSE_KEYS.map(t => {
    const T = TENSES[t];
    return `<section class="gentry" id="g-${esc(t)}"><h2>${esc(T.name)}</h2>` +
      (filled(T.formation) ? `<h3>How it’s formed</h3><p>${esc(T.formation)}</p>` : "") +
      (filled(T.use) ? `<h3>When it’s used</h3><p>${esc(T.use)}</p>` : "") + guideEndings(t) + "</section>";
  }).join("");
}

/* =========================================================================
   SETTINGS PAGE
   ========================================================================= */
const hasVibrate = "vibrate" in navigator;
function switchRow(key, label, help, helpId) {
  return `<div class="srow"><div class="stext"><span class="slabel" id="lbl-${key}">${esc(label)}</span>${help !== null ? `<p class="shelp"${helpId ? ` id="${helpId}"` : ""}>${esc(help)}</p>` : ""}</div><button class="switch" role="switch" aria-labelledby="lbl-${key}" data-setting="${key}"></button></div>`;
}
function segRow(key, label, opts, help) {
  return `<div class="srow col"><span class="slabel" id="lbl-${key}">${esc(label)}</span><div class="seg" role="group" aria-labelledby="lbl-${key}" data-seg="${key}">${opts.map(([v, l]) => `<button data-val="${esc(v)}">${esc(l)}</button>`).join("")}</div>${help ? `<p class="shelp">${esc(help)}</p>` : ""}</div>`;
}
function buildSettings() {
  $("#settingsBody").innerHTML =
    schedSettingsHTML() + `<section class="sgroup"><h2>Studying</h2>` +
    switchRow("autoplay", "Auto-play audio", "Plays the French automatically: on the front when French is shown first, otherwise when the card flips.") +
    segRow("direction", "Card direction", [["en-fr", "English → French"], ["fr-en", "French → English"], ["mixed", "Mixed"]], "Used for Library practice, and for scheduled sessions only if you choose that above. Mixed picks a random direction for each card.") +
    segRow("phonetics", "Sounds-like (phonetics)", [["always", "Always"], ["tap", "On tap"], ["hidden", "Hidden"]], "Applies to flashcards. The Learn view always shows it.") +
    switchRow("mic", "Microphone", "", "micHelp") +
    segRow("repeatAudio", "Play audio", [["1", "Once"], ["2", "Twice"]]) +
    switchRow("repeatPile", "Repeat missed cards", "Cards you don’t know come back at the end of each round until you know them.") +
    switchRow("swipe", "Swipe to grade", "On the main card, swipe right for know and left for don’t know.") +
    (hasVibrate ? switchRow("haptics", "Vibrate when grading", "A short buzz on your phone when you mark a card.") : "") +
    switchRow("animations", "Card animations", "Turn off for instant card changes.") +
    switchRow("keyLegend", "Keyboard shortcuts", "On a laptop, shows the keys under the card.") +
    `</section>` + aiSettingsHTML() + `<section class="sgroup"><h2>Browser voice</h2>` +
    `<p class="shelp">Used for anything not recorded, or when recorded voices are off.</p>` +
    `<div class="srow col"><label class="slabel" for="voiceSel">French voice</label><select id="voiceSel"></select><p class="shelp" id="voiceHelp"></p></div>` +
    `<div class="srow col"><label class="slabel" for="rateIn">Speaking speed: <span id="rateVal"></span></label><input type="range" id="rateIn" min="0.5" max="1.3" step="0.05"><div class="btnrow"><button class="ghost sm" id="testVoice">Test voice</button></div></div>` +
    `<details class="shelpbox"><summary>Get a better French voice</summary>` +
    `<p><b>Samsung phone:</b> open Settings and search “Text-to-speech”. Choose Speech Services by Google as the engine, open its settings, then Install voice data › French (France). Reload this page afterwards.</p>` +
    `<p><b>Windows laptop:</b> Settings › Time &amp; language › Speech › Add voices › French (France), then restart Chrome. Chrome also offers “Google français”, which needs an internet connection.</p></details>` +
    `</section><section class="sgroup"><h2>Display</h2>` +
    segRow("theme", "Theme", [["system", "Match device"], ["light", "Light"], ["dark", "Dark"]]) +
    segRow("textSize", "Text size", [["0", "Small"], ["1", "Normal"], ["2", "Large"], ["3", "Extra large"]]) +
    `</section>` + simHTML() + `<section class="sgroup"><h2>Your data</h2>` +
    switchRow("autoBackup", "Weekly backup to Downloads", "When you finish a section and your last backup is 7 or more days old, the app downloads a backup file. It can only do this while the app is open.") + `<p class="shelp" id="backupInfo"></p>` + `<p class="shelp">Progress and settings are saved in this browser. To keep your laptop and phone the same, use Sync between devices below, or export on one device and import the file on the other.</p>` +
    `<div class="btnrow wrap" style="margin-top:10px"><button class="primary sm" id="exportBtn">Export progress and settings</button><button class="ghost sm" id="importBtn">Import from a file</button></div>` +
    `<h3 class="sh3">Copies kept in this browser</h3><div id="bundleList"></div>` +
    `<h3 class="sh3">Reset</h3><div class="btnrow wrap"><button class="ghost sm" data-reset="progress">Reset progress</button><button class="ghost sm" data-reset="settings">Reset settings</button><button class="danger sm" data-reset="all">Reset everything</button></div>` +
    `</section>` + syncHTML() + `<section class="sgroup"><h2>About</h2><p class="shelp" id="aboutText"></p></section>`;
}
function micHelpText() {
  if (micState === "unsupported") return "Speech recognition isn’t available in this browser.";
  if (micState === "blocked") return "Blocked for this site. Allow the microphone in Chrome’s site settings, then reload.";
  if (micState === "unavailable") return "Speech recognition isn’t available on this device right now.";
  return "Shows a mic button on cards. Say the French and it shows what it heard. It’s a hint only: you still grade yourself.";
}
function syncVoiceUI() {
  const sel = $("#voiceSel"); if (!sel) return;
  if (!synth) { sel.innerHTML = "<option>Not available</option>"; sel.disabled = true; $("#voiceHelp").textContent = "This browser can’t play speech."; return; }
  if (!voices.length) { sel.innerHTML = '<option value="">Device default (French)</option>'; $("#voiceHelp").textContent = "No French voice found yet. Voices can take a few seconds to appear; if none does, see “Get a better French voice” below."; return; }
  sel.disabled = false;
  sel.innerHTML = voices.map(v => `<option value="${esc(v.voiceURI)}"${v === voice ? " selected" : ""}>${esc(v.name.replace(/^Microsoft\s+/, ""))} (${esc(v.lang)})${v.localService === false ? ", needs internet" : ""}</option>`).join("");
  $("#voiceHelp").textContent = `${plural(voices.length, "French voice")} on this device.`;
}
function syncSettingsUI0() {
  if (!$("#settingsBody").innerHTML) return;
  $$("#settingsBody [data-setting]").forEach(b => b.setAttribute("aria-checked", !!settings[b.dataset.setting]));
  $$("#settingsBody [data-seg]").forEach(g => { const k = g.dataset.seg; $$("button", g).forEach(b => b.setAttribute("aria-pressed", String(settings[k]) === b.dataset.val)); });
  const micBtn = $('#settingsBody [data-setting="mic"]'); if (micBtn) micBtn.disabled = micState !== "ok";
  const mh = $("#micHelp"); if (mh) mh.textContent = micHelpText();
  $("#rateIn").value = settings.rate;
  $("#rateVal").textContent = settings.rate.toFixed(2) + "×";
  syncVoiceUI();
  renderBundles();
  const tests = VERBS_OK.filter(v => v.test).length;
  $("#aboutText").textContent = `Version ${APP_VERSION}, saved-data schema ${SCHEMA}. ${plural(VERBS_OK.length, "verb")} loaded${tests ? ` (${tests} marked test)` : ""}, ${plural(TENSE_KEYS.length, "tense")}${PROBLEMS.length ? `, ${plural(PROBLEMS.length, "problem")} in verbs.js (see the Library)` : ""}.`;
}
function renderBundles() {
  const el = $("#bundleList"); if (!el) return;
  const bs = listBundles();
  const name = l => l.replace(/^before-/, "Before ").replace(/-/g, " ");
  const when = a => { const d = new Date(a); return isNaN(d) ? "" : d.toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); };
  el.innerHTML = bs.length
    ? '<p class="shelp">Saved automatically before each import, reset or restore. The newest 3 are kept.</p><ul class="blist">' +
      bs.map(b => `<li><span>${esc(name(b.label))} · ${esc(when(b.at))}</span><button class="ghost sm" data-restore="${esc(b.key)}">Restore</button></li>`).join("") + "</ul>"
    : '<p class="shelp">None yet. A copy of all your data is saved here automatically before each import, reset or restore.</p>';
}
async function restoreFromBrowser(key) {
  let b = null; try { b = JSON.parse(lsGet(key) || "null"); } catch (e) {}
  if (!isObj(b) || !isObj(b.stores)) { alertBox("Restore failed", "<p>That copy is damaged or no longer there. Nothing was changed.</p>"); renderBundles(); return; }
  const at = new Date(b.at), syncing = !!lsGet(KEYS.sync);
  const ok = await confirmBox("Restore this copy?",
    `<p>This puts back your schedule, settings, practice records, To review list and history as they were${isNaN(at) ? "" : " on " + esc(at.toLocaleString())}. A copy of your current data is kept first, and the app reloads.</p>` +
    (syncing ? "<p>GitHub sync is on: progress that is further ahead on your other device will merge back in at the next sync.</p>" : ""), "Restore", false);
  if (!ok) return;
  if (!makeBundle("before-restore")) { alertBox("Restore stopped", "<p>A copy of your current data couldn’t be kept first (storage may be full), so nothing was changed.</p>"); return; }
  restoreBundle(b);
  location.reload();
}
function applyDisplay() {
  const r = document.documentElement;
  r.dataset.theme = settings.theme;
  r.style.setProperty("--scale", SCALE[settings.textSize] || 1);
  document.body.classList.toggle("no-anim", !settings.animations);
  document.body.classList.toggle("no-legend", !settings.keyLegend);
}
function wireSettings() {
  const body = $("#settingsBody");
  body.addEventListener("click", e => {
    const sw = e.target.closest("[data-setting]");
    if (sw) { const k = sw.dataset.setting; settings[k] = !settings[k]; if (k === "mic" && !settings.mic) stopListening(); saveSettings(); applyDisplay(); syncSettingsUI(); return; }
    const sb = e.target.closest("[data-seg] button");
    if (sb) {
      const k = sb.closest("[data-seg]").dataset.seg;
      const val = typeof DEFAULTS[k] === "number" ? Number(sb.dataset.val) : sb.dataset.val;
      if (!CHOICES[k] || CHOICES[k].includes(val)) { settings[k] = val; saveSettings(); applyDisplay(); syncSettingsUI(); }
      return;
    }
    const rs = e.target.closest("[data-reset]"); if (rs) { doReset(rs.dataset.reset); return; }
    const rb = e.target.closest("[data-restore]"); if (rb) { restoreFromBrowser(rb.dataset.restore); return; }
  });
  $("#voiceSel").addEventListener("change", e => {
    settings.voice = e.target.value; saveSettings();
    voice = voices.find(v => v.voiceURI === settings.voice) || voice;
    speak("Bonjour. Je suis, tu es, il est.", undefined, undefined, null);
  });
  $("#rateIn").addEventListener("input", e => { settings.rate = Number(e.target.value); $("#rateVal").textContent = settings.rate.toFixed(2) + "×"; });
  $("#rateIn").addEventListener("change", () => { saveSettings(); speak("Je parle français.", undefined, undefined, null); });
  $("#testVoice").addEventListener("click", e => speak("Bonjour. Je suis, tu es, il est. Nous avons, vous avez, ils ont.", e.currentTarget, undefined, null));
  $("#exportBtn").addEventListener("click", exportData);
  $("#importBtn").addEventListener("click", () => { const f = $("#importFile"); f.value = ""; f.click(); });
  $("#importFile").addEventListener("change", e => { const f = e.target.files && e.target.files[0]; if (f) importData(f); });
}

/* ---------- confirm / alert dialog ---------- */
function confirmBox(title, html, okText, danger, noCancel) {
  return new Promise(res => {
    const d = $("#confirmDlg");
    $("#cTitle").textContent = title; $("#cText").innerHTML = html;
    const ok = $("#cOk"), cancel = $("#cCancel");
    ok.textContent = okText || "OK"; ok.className = danger ? "danger" : "primary";
    cancel.hidden = !!noCancel;
    const fin = v => { ok.onclick = cancel.onclick = d.oncancel = null; if (d.open) d.close(); res(v); };
    ok.onclick = () => fin(true);
    cancel.onclick = () => fin(false);
    d.oncancel = e => { e.preventDefault(); fin(false); };
    d.showModal();
  });
}
const alertBox = (title, html) => confirmBox(title, html, "OK", false, true);

/* ---------- export / import / reset ---------- */
function daysSince(d) { return isDate(d) ? dayDiff(d, todayStr()) : 999; }
function maybeAutoBackup() { if (settings.autoBackup !== false && daysSince(lsGet(KEYS.lastbackup)) >= 7) exportData(true); }
async function exportData(auto) {
  auto = auto === true;
  let sess = null;
  try { sess = JSON.parse(lsGet(KEYS.session) || "null"); } catch (e) {}
  const log = await logDB.all();
  const data = { app: "french-verbs", schema: EXPORT_SCHEMA, appVersion: APP_VERSION, exportedAt: new Date().toISOString(), settings: Object.assign({}, settings), progress, schedule, formsched: fsched, review, history: hist, timing, session: sess, log };
  try {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `french-verbs-backup-${todayStr()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    lsSet(KEYS.lastbackup, todayStr()); toast(auto ? "Weekly backup saved to your Downloads folder." : "Backup saved to your downloads.");
  } catch (e) { alertBox("Export failed", "<p>The backup file couldn’t be created in this browser.</p>"); }
}
function validateImport(d) {
  if (!isObj(d) || d.app !== "french-verbs") return "That file isn’t a backup from this app.";
  if (typeof d.schema !== "number") return "The backup has no version number.";
  if (d.schema > EXPORT_SCHEMA) return "The backup was made by a newer version of the app.";
  if (!isObj(d.settings)) return "The backup has no settings section.";
  if (!isObj(d.progress) || !isObj(d.progress.verbs)) return "The backup has no progress section.";
  for (const id of Object.keys(d.progress.verbs)) {
    const r = d.progress.verbs[id];
    if (!isObj(r)) return `Practice record for “${id}” is damaged.`;
    for (const k of Object.keys(r)) {
      const c = r[k];
      if (!isObj(c)) return `Practice record for “${id}” is damaged.`;
      for (const f of ["seen", "known", "missed"]) if (c[f] !== undefined && (typeof c[f] !== "number" || c[f] < 0)) return `Practice record for “${id}” is damaged.`;
    }
  }
  if (d.schedule !== undefined && d.schedule !== null) {
    if (!isObj(d.schedule) || !isObj(d.schedule.verbs)) return "The schedule section is damaged.";
    for (const id of Object.keys(d.schedule.verbs)) {
      const e = d.schedule.verbs[id];
      if (!isObj(e) || !Number.isInteger(e.step) || e.step < 0 || e.step > 8 || !isDate(e.due)) return `Schedule entry for “${id}” is damaged.`;
    }
  }
  if (d.formsched !== undefined && d.formsched !== null) {
    if (!isObj(d.formsched) || !isObj(d.formsched.forms)) return "The form schedule section is damaged.";
    for (const k of Object.keys(d.formsched.forms)) { const e = d.formsched.forms[k]; if (!isObj(e) || !Number.isInteger(e.step) || e.step < 0 || e.step > 8 || !isDate(e.due)) return `Form schedule entry “${k}” is damaged.`; }
  }
  if (d.review !== undefined && d.review !== null && (!isObj(d.review) || !isObj(d.review.items))) return "The to-review section is damaged.";
  if (d.timing !== undefined && d.timing !== null && !isObj(d.timing)) return "The timing section is damaged.";
  return "";
}
async function importData(file) {
  let text;
  try { text = await file.text(); } catch (e) { alertBox("Import failed", "<p>The file couldn’t be read. Nothing was changed.</p>"); return; }
  let d;
  try { d = JSON.parse(text); } catch (e) { alertBox("Import failed", "<p>That file isn’t a valid backup (it isn’t JSON). Nothing was changed.</p>"); return; }
  const err = validateImport(d);
  if (err) { alertBox("Import failed", `<p>${esc(err)} Nothing was changed.</p>`); return; }
  const sv = isObj(d.schedule) ? Object.keys(d.schedule.verbs) : [];
  const when = d.exportedAt ? new Date(d.exportedAt) : null;
  const ok = await confirmBox("Replace your data?",
    `<p>Backup${when && !isNaN(when) ? " from " + esc(when.toLocaleString()) : ""}: schedule for ${plural(sv.length, "verb")} (${sv.filter(id => BY_ID[id]).length} in your current list), plus settings and practice records.</p><p>This replaces everything on this device. A copy of the current data is kept in this browser first (Settings › Your data lists these copies). Your review log is kept and the backup's log is added to it.</p>`,
    "Replace", false);
  if (!ok) return;
  if (!makeBundle("before-import")) { alertBox("Import stopped", "<p>A copy of your current data couldn’t be kept in this browser first (storage may be full), so nothing was changed. Export a backup, then try again.</p>"); return; }
  settings = cleanSettings(d.settings);
  progress = { schema: SCHEMA, verbs: d.progress.verbs };
  schedule = isObj(d.schedule) ? d.schedule : freshSchedule();
  if (!isObj(schedule.newLog)) schedule.newLog = {};
  fsched = isObj(d.formsched) ? d.formsched : freshForms();
  if (!isObj(fsched.newLog)) fsched.newLog = {};
  review = isObj(d.review) ? cleanReview(d.review) : freshReview();
  timing = freshTiming();
  if (isObj(d.timing)) CARD_TYPES.forEach(k => { if (Array.isArray(d.timing[k])) timing[k] = d.timing[k].filter(x => typeof x === "number" && x > 0); });
  hist = cleanHist(d.history); saveHist();
  if (Array.isArray(d.log)) await logDB.merge(d.log.filter(okLogRec));
  saveSettings(); saveProgress(); saveSchedule(); saveForms(); saveReview(); saveTiming();
  if (!fsched.migrated) migrateForms();
  migrateSched(); migrateCards();
  reviewSeed(); reviewPrune();
  if (isObj(d.session) && d.session.schema === 2 && d.session.mode === "sched" && isDate(d.session.date) && Array.isArray(d.session.queue)) lsSet(KEYS.session, JSON.stringify(d.session)); else lsRemove(KEYS.session);
  session = null;
  applyDisplay(); loadVoices(); syncSettingsUI();
  toast("Imported.");
}
async function doReset(kind) {
  const what = { progress: "This clears your schedule, every verb’s step, your time averages, your practice records and your To review list, on this device.", settings: "This puts every setting back to its default.", all: "This clears your schedule, time averages, practice records and your To review list, and puts every setting back to its default, on this device." }[kind];
  const ok = await confirmBox(kind === "all" ? "Reset everything?" : `Reset ${kind}?`, `<p>${what}</p><p>A copy of all your data is kept in this browser first (Settings › Your data lists these copies), but export too if you might want it back.</p>`, "Reset", true);
  if (!ok) return;
  if (!makeBundle("before-reset-" + kind)) { alertBox("Reset stopped", "<p>A copy of your current data couldn’t be kept in this browser first (storage may be full), so nothing was changed. Export a backup, then try again.</p>"); return; }
  if (kind !== "settings") {
    logDB.mark("reset-" + kind);
    progress = { schema: SCHEMA, verbs: {} }; schedule = freshSchedule(); fsched = freshForms(); timing = freshTiming(); review = freshReview(); review.seeded = true;
    saveProgress(); saveSchedule(); saveForms(); saveReview(); saveTiming(); lsRemove(KEYS.session); session = null; hist = {}; saveHist();
  }
  if (kind !== "progress") { settings = freshDefaults(); saveSettings(); applyDisplay(); loadVoices(); }
  syncSettingsUI();
  toast("Reset done.");
}

/* =========================================================================
   DAILY SCHEDULE (spaced repetition). Library practice never touches this.
   ========================================================================= */
// The ladder: the usual gap in days after a right answer at each step (1, 2, 4, 7, 16, 30, 120, then 180), which puts
// on-time reviews about 1, 3, 7, 14, 30, 60 and 180 days after a card is first learnt (OFFSETS, used for load forecasts).
// Since v6.3 gaps count from the last review (see applyResult). The numbers below are starting values to test.
const GAPS = [1, 2, 4, 7, 16, 30, 120], LT_GAP = 180, OFFSETS = [1, 3, 7, 14, 30, 60, 180];
const LADDER = GAPS.concat(LT_GAP);            // LADDER[k]: the ladder gap after a right answer at step k (k >= 7: 180)
const GOOD_FACTOR = 2.0;                        // Know: next gap = 2 x the days since the last review, kept within the ladder's range
const HARD_FACTOR = 1.2;                        // Hard: the card stays on its step; next gap = 1.2 x the days since the last review
const MAX_GAP = 365;
const LAPSE_TO = [0, 1, 1, 1, 2, 4, 5, 6, 6];   // a miss at step k returns the card to step LAPSE_TO[k]
const REVIEW_CAP = 120;                         // most reviews in one day; the rest wait, most at risk first
const DEF_COST = { main: 10, tense: 30, keyforms: 20, form: 10, listen: 12 };
const CARD_TYPES = ["main", "form", "tense", "keyforms", "listen"];
const CARD_LABEL = { main: "Infinitive / regular verb card", form: "Single form card", tense: "Tense card (table)", keyforms: "Key forms card", listen: "Listening card" };
let schedule = { schema: 1, verbs: {}, newLog: {} };
let timing = { schema: 1, main: [], tense: [], keyforms: [] };
const todayExpanded = new Set();

const pad2 = n => String(n).padStart(2, "0");
const dstr = d => d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
const todayStr = () => dstr(new Date());
const isDate = s => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
function parseD(s) { const p = s.split("-").map(Number); return new Date(p[0], p[1] - 1, p[2], 12); }
function addDays(s, n) { const d = parseD(s); d.setDate(d.getDate() + n); return dstr(d); }
function dayDiff(a, b) { return Math.round((parseD(b) - parseD(a)) / 86400000); }
function fmtDate(s) { return parseD(s).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }); }
const mins = ms => Math.floor((ms || 0) / 60000);

