// Verbes: Study screen: cards, grading, undo, swipe and keys, the round summary.
// Plain script, no build step. Loaded by index.html in this order: core.js, conjugate.js, audio.js, study.js, screens.js, scheduler.js, app.js.
"use strict";
/* =========================================================================
   SESSION
   ========================================================================= */
let session = null, busy = false, suppressClickUntil = 0;
function newItem(spec) { return { verbId: spec.verbId, kind: spec.kind, tense: spec.tense, kf: spec.kf || null, person: spec.person || null, key: !!spec.key, xi: Number.isInteger(spec.xi) ? spec.xi : null, pat: spec.pat || null, mode: spec.mode || null, first: !!spec.first, retry: !!spec.retry, dir: null, revealed: false, pending: null, wrong: new Set(), heard: [], micMsg: "", phonShown: false, stage: 0 }; }
function specOf(it) { return { verbId: it.verbId, kind: it.kind, tense: it.tense, kf: it.kf || null, person: it.person || null, key: !!it.key, xi: Number.isInteger(it.xi) ? it.xi : null, pat: it.pat || null, mode: it.mode || null }; }
function curItem() { return session && !session.done && session.queue ? session.queue[session.idx] || null : null; }
function rowsOf(it) {
  const v = BY_ID[it.verbId];
  if (it.kind === "form") { const r = formRow(it); return r ? [r] : []; }
  if (it.kind === "keyforms") return it.kf ? it.kf.map(t => Object.assign({}, v.tables[t].rows[0], { key: t, label: TENSES[t].name, tense: t })) : v.keyRows;
  return it.kind === "tense" ? v.tables[it.tense].rows : [];
}
const isSingle = it => it.kind === "main" || it.kind === "form";
function formRow(it) {
  const v = BY_ID[it.verbId], tab = v && v.tables[it.tense];
  return tab ? (tab.rows.find(r => r.key === it.person) || null) : null;
}
const isListen = it => it.mode === "listen" || (it.kind === "form" && it.dir === "fr-en");
// French plays on the front for listening prompts always, otherwise only with auto-play
const frontAudio = it => it.mode === "listen" || (settings.autoplay && it.dir === "fr-en");
// Ignore grading taps for a moment after a card appears, so a double tap can't grade a card you haven't seen.
let shownAt = 0;
const tooSoon = () => performance.now() - shownAt < 350;
function shuffled(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
function resolveDir() { return settings.direction === "mixed" ? (Math.random() < 0.5 ? "en-fr" : "fr-en") : settings.direction; }
const animOn = () => settings.animations && !(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

function startSession(specs, title, order) {
  if (!specs.length) { toast("No cards to practise here."); return; }
  session = { mode: "library", title, order, base: specs.slice(), round: 1 };
  startRound(order === "shuffle" ? shuffled(specs) : specs.slice());
}
function startRound(specs) {
  Object.assign(session, { queue: specs.map(newItem), idx: 0, known: 0, missed: 0, pile: [], missedItems: [], undo: [], done: false });
  curItem().dir = resolveDir();
  navigate("study");
  presentCurrent(true);
}
function presentCurrent(animate) {
  const it = curItem(); if (!it) return;
  stopSpeech(); stopListening();
  if (!it.dir) it.dir = it.mode === "listen" ? "fr-en" : dirFor();
  it.t0 = Date.now();
  renderStudy(animate);
  if (frontAudio(it) && !it.revealed) speak(speakText(it), $("#card .cplay .play"), it);
  aiPrefetchAhead();
}
function haptic() { if (settings.haptics && navigator.vibrate) { try { navigator.vibrate(12); } catch (e) {} } }

function commit(it, wrongKeys, grade) {
  if (session.mode === "sched") { commitSched(it, wrongKeys, grade); return; }
  session.undo.push({ idx: session.idx, known: session.known, missed: session.missed, pileLen: session.pile.length, missedLen: session.missedItems.length });
  if (session.undo.length > 60) session.undo.shift();
  if (session.toReview) {
    const rk = unitKey(it);
    session.undo[session.undo.length - 1].rv = [rk, review.items[rk] ? JSON.stringify(review.items[rk]) : null];
    reviewRecall(rk, wrongKeys.length === 0);
  }
  const knew = wrongKeys.length === 0;
  // B3: a practice attempt goes to the review log as mode practice. Progress screens show it; the schedule never reads it.
  if (!it.retry) {
    const k = it.kind === "main" || it.kind === "form" ? unitKey(it) : it.verbId + "|" + (it.kind === "tense" ? it.tense : "keyforms");
    const rec = { id: todayStr() + "|p|" + k + "|" + Date.now(), d: todayStr(), k, g: knew ? (grade === "hard" ? "hard" : "pass") : "miss", p: "practice",
      m: isListen(it) ? "listen" : "speak", kind: it.kind, wrong: wrongKeys.slice(), t: Date.now(), v: APP_VERSION };
    logDB.put(rec); session.undo[session.undo.length - 1].logId = rec.id;
  }
  if (knew) session.known++;
  else {
    session.missed++;
    session.missedItems.push({ spec: specOf(it), wrong: wrongKeys.slice() });
    if (settings.repeatPile) session.pile.push(specOf(it));
  }
  haptic();
}
function undo() {
  if (!session || !session.undo || !session.undo.length || busy) return;
  if (session.mode === "sched") { undoSched(); return; }
  const u = session.undo.pop();
  stopSpeech(); stopListening();
  if (u.logId) logDB.del(u.logId);
  if (u.rv) { if (u.rv[1]) review.items[u.rv[0]] = JSON.parse(u.rv[1]); else delete review.items[u.rv[0]]; saveReview(); }
  Object.assign(session, { idx: u.idx, known: u.known, missed: u.missed, done: false });
  session.pile.length = u.pileLen; session.missedItems.length = u.missedLen;
  const old = session.queue[u.idx], fresh = newItem(specOf(old));
  fresh.dir = old.dir; session.queue[u.idx] = fresh;
  if (currentScreen !== "study") navigate("study");
  renderStudy(true);
}
function advance(dir) {
  stopSpeech(); stopListening();
  session.idx++;
  if (session.mode === "sched") saveSession();
  const next = curItem();
  // start the next card's audio inside the tap, so phones allow it
  if (next) {
    if (!next.dir) next.dir = next.mode === "listen" ? "fr-en" : dirFor();
    next.t0 = Date.now();
    if (frontAudio(next)) speak(speakText(next), undefined, next);
  }
  const finish = () => { if (!next) { if (session.mode === "sched") nextPart(); else endRound(); } else renderStudy(true); };
  if (dir && animOn()) flyOut(dir, finish); else finish();
}
function flyOut(dir, then) {
  const card = $("#card");
  busy = true;
  card.classList.add("fly");
  requestAnimationFrame(() => { card.style.transform = `translateX(${dir * 120}%) rotate(${dir * 9}deg)`; card.style.opacity = "0"; });
  setTimeout(() => { busy = false; card.classList.remove("fly"); then(); }, 210);
}
function afterReveal(it) { if (settings.autoplay && it.dir === "en-fr" && !isListen(it)) speak(speakText(it), $("#card .cplay .play"), it); }

function gradeMain(knew, viaSwipe, grade) {
  const it = curItem(); if (!it || busy) return;
  if (it.pending) { advance(it.pending === "known" ? 1 : -1); return; }
  if (!it.revealed) return; // a card can only be graded once its answer is showing
  stopListening();
  commit(it, knew ? [] : [it.kind === "form" ? it.person : "main"], grade);
  if (it.revealed || viaSwipe) { advance(knew ? 1 : -1); return; }
  it.revealed = true; it.pending = knew ? "known" : "missed";
  shownAt = performance.now();
  renderStudy(false); turnCard();
  afterReveal(it);
}
function revealMulti(allWrong) {
  const it = curItem(); if (!it) return;
  it.revealed = true;
  if (allWrong) rowsOf(it).forEach(r => it.wrong.add(r.key));
  renderStudy(false); turnCard();
  afterReveal(it);
}
function toggleAllWrong() {
  const it = curItem(), rows = rowsOf(it);
  if (it.wrong.size === rows.length) it.wrong.clear(); else rows.forEach(r => it.wrong.add(r.key));
  renderCard(false); renderActions();
}
function toggleRow(i) {
  const it = curItem();
  if (!it || isSingle(it) || !it.revealed) return;
  const r = rowsOf(it)[i]; if (!r) return;
  if (it.wrong.has(r.key)) it.wrong.delete(r.key); else it.wrong.add(r.key);
  renderCard(false); renderActions();
}
function commitMulti() {
  const it = curItem(); if (!it || busy) return;
  stopListening();
  const w = rowsOf(it).filter(r => it.wrong.has(r.key)).map(r => r.key);
  commit(it, w);
  advance(w.length ? -1 : 1);
}
function turnCard() { if (!animOn()) return; const c = $("#card"); c.classList.remove("turn", "enter"); void c.offsetWidth; c.classList.add("turn"); }

// On a card whose answer isn't showing yet, 1 and 2 show the answer instead of grading.
function onKnow() { const it = curItem(); if (!it || busy || tooSoon()) return; if (isSingle(it)) { if (!it.revealed && !it.pending) onFlip(); else gradeMain(true); } else if (!it.revealed) revealMulti(false); else commitMulti(); }
function onDont() { const it = curItem(); if (!it || busy || tooSoon()) return; if (isSingle(it)) { if (!it.revealed && !it.pending) onFlip(); else gradeMain(false); } else if (!it.revealed) revealMulti(true); else toggleAllWrong(); }
function onFlip() {
  const it = curItem(); if (!it || busy || tooSoon()) return;
  if (isSingle(it)) {
    if (it.pending) { advance(it.pending === "known" ? 1 : -1); return; }
    // Show the answer once; grading happens on the back. shownAt restarts the short guard against double taps.
    if (!it.revealed) { it.revealed = true; shownAt = performance.now(); renderStudy(false); turnCard(); afterReveal(it); }
  } else if (!it.revealed) revealMulti(false);
  else { it.revealed = false; renderStudy(false); turnCard(); }
}
// Hard: right, but slow or with a slip. Only scheduled sessions tell it apart from Know.
function onHard() {
  const it = curItem(); if (!it || busy || tooSoon() || !isSingle(it)) return;
  if (!it.revealed && !it.pending) { onFlip(); return; }
  gradeMain(true, false, session.mode === "sched" ? "hard" : undefined);
}
function onNext() { const it = curItem(); if (!it || tooSoon()) return; if (isSingle(it)) { if (it.pending) advance(it.pending === "known" ? 1 : -1); else onFlip(); } else if (it.revealed) commitMulti(); else revealMulti(false); }

function endRound() {
  stopSpeech(); stopListening();
  session.done = true;
  try { history.replaceState({ screen: "summary" }, ""); } catch (e) {}
  route({ screen: "summary" });
}

/* =========================================================================
   STUDY SCREEN RENDERING
   ========================================================================= */
function renderStudy(animate) {
  const it = curItem(); if (!it) return;
  if (!it.t0) it.t0 = Date.now();
  const s = session;
  $("#studyBack").setAttribute("aria-label", s.mode === "sched" ? "Close and save, back to Today" : "Back to Library");
  if (s.mode === "sched") renderSchedTop();
  else {
    $("#sTitle").textContent = s.title + (s.round > 1 ? ` (round ${s.round})` : "");
    $("#sScore").innerHTML = `<span>${Math.min(s.idx + 1, s.queue.length)} of ${s.queue.length}</span><span class="k">✓ ${s.known}</span><span class="m">✕ ${s.missed}</span>`;
    $("#sFill").style.width = (s.idx / s.queue.length * 100) + "%";
    $("#sSub").hidden = true;
  }
  $("#undoBtn").disabled = !s.undo.length;
  renderQuick();
  renderCard(animate);
  renderActions();
}
function renderQuick() {
  $(".quick").hidden = !!(session && session.mode === "sched");
  const q = (id, on, label, value, title) => { const b = $(id); b.classList.toggle("on", !!on); b.innerHTML = `<small>${label}</small><b>${value}</b>`; b.title = title; };
  q("#qAuto", settings.autoplay, "Auto-play", settings.autoplay ? "On" : "Off", "Auto-play audio on or off");
  q("#qDir", false, "Direction", { "en-fr": "EN→FR", "fr-en": "FR→EN", mixed: "Mixed" }[settings.direction], "Card direction: tap to change");
  const lockDir = !!(session && session.mode === "sched");
  if (lockDir) q("#qDir", false, "Direction", "EN→FR", "Scheduled sessions alternate speaking and listening on their own");
  $("#qDir").disabled = lockDir;
  q("#qPhon", false, "Phonetics", { always: "Always", tap: "On tap", hidden: "Hidden" }[settings.phonetics], "Phonetics: tap to change");
  const micOk = micState === "ok";
  q("#qMic", micOk && settings.mic, "Mic", micOk ? (settings.mic ? "On" : "Off") : "None", "Microphone on or off");
  $("#qMic").disabled = !micOk;
  const note = $("#micNote");
  if (settings.mic && !micOk) { note.hidden = false; note.textContent = micNoteText(); } else note.hidden = true;
}
function micNoteText() {
  if (micState === "unsupported") return "Speech recognition isn’t available in this browser, so the mic is hidden. Chrome on your laptop and phone supports it.";
  if (micState === "unavailable") return "Speech recognition isn’t available on this device right now, so the mic is hidden.";
  return "The microphone is blocked for this site, so the mic is hidden. To allow it, tap the icon left of the web address, then Permissions › Microphone › Allow, and reload." +
    (location.protocol === "file:" ? " Opened as a file from your computer? Use the GitHub Pages link instead." : "");
}
function phonBlock(text, it) {
  if (settings.phonetics === "hidden") return "";
  if (settings.phonetics === "tap" && !it.phonShown) return '<button class="phontap" data-phon>Show sounds-like</button>';
  return `<div class="cphon">${esc(text)}</div>`;
}
function playBtn(text, label, aria) {
  return `<button class="play" data-say="${esc(text)}" aria-label="Play ${esc(aria || label || text)}">${ICON.play}${label ? `<span>${esc(label)}</span>` : ""}</button>`;
}
// Every spoken line of a set of rows, in order. A row with sub-lines (il · elle · on, ils · elles) gives one clip per
// sub-line, so Play all says all nine forms instead of only the first of each row.
function clipsOf(rows) {
  const out = [];
  rows.forEach(r => { if (r.subs) r.subs.forEach(x => out.push(x.speak)); else out.push(r.speak); });
  return out.filter(Boolean);
}
function playAllBtn(rows, label) { return playClipsBtn(clipsOf(rows), label); }
function playClipsBtn(clips, label, aria) {
  const plain = clips.map(c => (typeof c === "string" ? c : c.t));
  return `<button class="play" data-say="${esc(plain.join(". ") + ".")}" data-clips="${esc(JSON.stringify(clips))}" aria-label="Play ${esc(aria || label)}">${ICON.play}${label ? `<span>${esc(label)}</span>` : ""}</button>`;
}
function sayArg(el) {
  if (el.dataset.clips) { try { const a = JSON.parse(el.dataset.clips); if (Array.isArray(a) && a.length) return a; } catch (e) {} }
  return el.dataset.say;
}
function fullLink(v) { return `<p><button class="linkbtn" data-full="${esc(v.id)}">Show full verb</button></p>`; }
function micBlock(it) {
  if (!settings.mic || micState !== "ok" || (session && session.mode === "sched")) return "";
  return `<div class="microw"><button class="micbtn${listening ? " on" : ""}" data-mic aria-label="${listening ? "Stop listening" : "Answer aloud"}" aria-pressed="${listening}">${ICON.mic}</button><div class="heard" aria-live="polite">${heardHTML(it)}</div></div>`;
}
function heardHTML(it) {
  if (it.micMsg) return `<span class="hmsg">${esc(it.micMsg)}</span>`;
  if (!it.heard.length) return `<span class="hmsg">${listening ? "Listening…" : "Tap the mic and say it in French."}</span>`;
  const said = it.heard.map(a => `<q>${esc(a[0])}</q>`).join(" ");
  let verdict = "";
  if (isSingle(it)) {
    const r = it.kind === "form" ? formRow(it) : null;
    const answers = it.kind === "main" ? [speakText(it)] : (r ? rowAnswers(r) : []);
    const lv = matchLevel([].concat.apply([], it.heard), answers);
    verdict = lv === 2 ? '<span class="hb ok">match</span>' : lv === 1 ? '<span class="hb close">close (check accents)</span>' : '<span class="hb no">no match</span>';
  } else {
    const rows = rowsOf(it), lv = rowLevels(it, rows) || [];
    verdict = `<span class="hb no">${lv.filter(x => x === 2).length} of ${rows.length} heard</span>`;
  }
  return `<span class="hmsg">Heard:</span> ${said}${verdict}${listening ? ' <span class="hmsg">Listening…</span>' : ""}`;
}
// Listening cards: audio only. Press Show answer to check, then choose Know or Don't know.
function listenFront(it, d) {
  return `<div class="cplay big">${playBtn(d.speak, "Play again")}</div><p class="cask">Listen and say what it means (verb, tense, person). Press Show answer to check, then choose Know or Don’t know.</p>`;
}
// il / ils often sound identical; say so on the card.
// il and ils (with elle, on, elles) often sound the same. On the front of a listening card the note names no form,
// so it doesn't give the answer away; after the reveal it shows both forms.
function soundAlike(v, it, front) {
  if (it.kind !== "form" || (it.person !== "il" && it.person !== "ils")) return "";
  const tab = v.tables[it.tense], a = tab && tab.rows.find(r => r.key === "il"), b = tab && tab.rows.find(r => r.key === "ils");
  if (!a || !b) return "";
  const fp = r => r.phon.split(" ").slice(1).join(" ");
  if (front) return fp(a) === fp(b) ? '<p class="cnote">Here <i>il</i> and <i>ils</i> sound the same, so either answer is right.</p>' : "";
  return fp(a) === fp(b) ? `<p class="cnote">“${esc(a.subs ? a.subs[0].fr : a.fr)}” and “${esc(b.subs ? b.subs[0].fr : b.fr)}” sound the same, so either answer is right.</p>` : "";
}
function subsHTML(it, r, noEn) {
  const pb = settings.phonetics === "tap" && !it.phonShown ? phonBlock("", it) : "";
  return '<div class="subs">' + r.subs.map(x => `<div class="sub"><div class="sline"><span class="sfr" lang="fr">${esc(x.fr)}</span>${playBtn(x.speak, "", x.fr)}</div>` +
    (cardPhonOn(it) ? `<div class="cphon">${esc(x.phon)}</div>` : "") + (x.en && !noEn ? `<div class="cen">${escL(x.en)}</div>` : "") + "</div>").join("") + pb + "</div>";
}
function formHTML(it, v) {
  const r = formRow(it), T = TENSES[it.tense];
  const listenMode = it.mode === "listen";
  let h = `<div class="ctop"><span>${esc(T.name)}${GLOSS_S[it.tense] ? ` <small class="gloss">· ${esc(GLOSS_S[it.tense])}</small>` : ""}${listenMode ? ", listening" : ""}</span>${it.pat ? `<span class="tag">-${esc(BY_ID[it.pat].group)} pattern</span>` : ""}${it.retry ? '<span class="tag retry">retry</span>' : ""}</div>`;
  if (!it.revealed) {
    if (listenMode) {
      h += listenFront(it, { speak: r.speak, fr: r.fr, phon: r.phon, en: r.en || v.english });
      h += soundAlike(v, it, true);
    } else if (it.dir === "fr-en") {
      h += r.subs ? subsHTML(it, r, true) + '<p class="cask">What does it mean? Then flip.</p>' : `<div class="cbig fr" lang="fr">${esc(r.fr)}</div>${phonBlock(r.phon, it)}<div class="cplay">${playBtn(r.speak, "Play")}</div><p class="cask">What does it mean? Then flip.</p>`;
    } else if (r.en) {
      h += `<div class="cbig en">${escL(r.en)}</div><p class="cue"><span lang="fr">${esc(v.french)}</span> · ${esc(T.name)}</p><p class="cask">Say just this one form in French, then flip.</p>`;
    } else {
      const P = PRONOUNS[it.person];
      h += `<div class="cbig fr" lang="fr">${r.subs ? r.subs.map(x => esc(x.label + " + " + v.french)).join("<br>") : esc(P.label || P.fr) + " + " + esc(v.french)}</div><p class="cue">${esc(T.name)}</p><p class="cask">Say just this one form in French, then flip.</p>`;
    }
  } else {
    if (r.subs) h += subsHTML(it, r); else h += `<div class="cbig fr" lang="fr">${esc(r.fr)}</div>${phonBlock(r.phon, it)}${r.en ? `<div class="cen">${escL(r.en)}</div>` : `<div class="cen">${esc(v.english)}</div>`}<div class="cplay">${playBtn(r.speak, "Play")}</div>`;
    if (listenMode) h += soundAlike(v, it);
    // Every form card shows the whole tense, with English and Play all, the asked person highlighted (v6.11).
    const rows = v.tables[it.tense].rows;
    h += `<div class="ctable"><div class="ctablehead"><span>${esc(v.french)} · ${esc(T.name)}</span>${playAllBtn(rows, "Play all")}</div>${tableHTML(rows, { ask: it.person, en: true })}</div>`;
    if (it.pending) h += `<p class="verdict ${it.pending}">${it.pending === "known" ? "Marked as known." : "Marked as don’t know. It comes back in a few cards."}</p>`;
    h += fullLink(v);
  }
  return h + micBlock(it);
}
function tableHTML(rows, o) {
  const marks = o.marks || null, split = !marks && !o.keyforms, showP = !!marks || !!o.keyforms;
  let h = `<table class="conj${marks ? " markable" : ""}${showP ? "" : " persons"}"><thead><tr>` +
    (marks ? '<th class="c-m"><span class="sr">Your mark</span></th>' : "") +
    (showP ? `<th class="c-p">${o.keyforms ? "Tense" : "Person"}</th>` : "") + '<th class="c-fr">French</th>' +
    (o.en ? '<th class="c-en">English</th>' : "") + (o.phon ? '<th class="c-ph">Sounds like</th>' : "") +
    '<th class="c-pl"><span class="sr">Play</span></th></tr></thead><tbody>';
  let ci = 0;
  rows.forEach((r0, i) => {
    const wrong = marks && marks.has(r0.key);
    const multi = !!(marks && r0.subs);
    (split && r0.subs ? r0.subs : [r0]).forEach(r => {
      const frHTML = multi ? r0.subs.map(x => esc(x.pron + x.form)).join("<br>") : esc(r.pron) + (o.hl && r.end ? esc(r.pre) + `<span class="end">${esc(r.end)}</span>` : esc(r.form));
      const nClip = split ? 1 : (r0.subs ? r0.subs.length : 1), clipIds = Array.from({ length: nClip }, (_, k) => ci + k).join(" ");
      ci += nClip;
      h += `<tr${marks ? ` data-row="${i}" class="${wrong ? "wrong" : "right"}"` : o.ask === r0.key ? ' class="asked"' : ""} data-clips="${clipIds}">` +
        (marks ? `<td class="c-m">${wrong ? "✕" : "✓"}<span class="sr">${wrong ? " marked wrong" : " marked right"}</span></td>` : "") +
        (showP ? `<td class="c-p">${esc(r.label)}</td>` : "") + `<td class="c-fr" lang="fr">${frHTML}${o.levels ? badge(o.levels[i]) : ""}${o.review && o.review.has(r0.key) ? '<span class="rvtag">to review</span>' : ""}${o.st && o.st[r0.key] ? stTag(o.st[r0.key].status, o.st[r0.key].persistent ? '<span class="stag persist">persistent</span>' : "") : ""}</td>` +
        (o.en ? `<td class="c-en">${escL(r.en)}</td>` : "") + (o.phon ? `<td class="c-ph">${multi ? r0.subs.map(x => esc(x.phon)).join("<br>") : esc(r.phon)}</td>` : "") +
        `<td class="c-pl">${playBtn(r.speak, "", r.fr)}</td></tr>`;
    });
  });
  return h + "</tbody></table>";
}
// Expression card (D7): English → the French expression, or audio → meaning.
function exprHTML(it, v) {
  const x = v.expressions[it.xi] || v.expressions[0];
  let h = `<div class="ctop"><span>Expression · <span lang="fr">${esc(v.french)}</span>${it.mode === "listen" ? ", listening" : ""}</span>${it.retry ? '<span class="tag retry">retry</span>' : ""}</div>`;
  if (!it.revealed) {
    if (it.mode === "listen") h += listenFront(it, { speak: x.fr });
    else if (it.dir === "fr-en") h += `<div class="cbig fr" lang="fr">${esc(x.fr)}</div>${phonBlock(x.phon, it)}<div class="cplay">${playBtn(x.fr, "Play")}</div><p class="cask">What does it mean? Tap the card to flip.</p>`;
    else h += `<div class="cbig en">${esc(x.en)}</div><p class="cask">Say it in French. Tap the card to flip.</p>`;
  } else {
    h += `<div class="cbig fr" lang="fr">${esc(x.fr)}</div>${phonBlock(x.phon, it)}<div class="cen">${esc(x.en)}</div><div class="cplay">${playBtn(x.fr, "Play")}</div>`;
    if (it.pending) h += `<p class="verdict ${it.pending}">${it.pending === "known" ? "Marked as known." : "Marked as don’t know."}</p>`;
    h += fullLink(v);
  }
  return h + micBlock(it);
}
function cardPhonOn(it) { return settings.phonetics === "always" || (settings.phonetics === "tap" && it.phonShown); }
function mainHTML(it, v) {
  let h = `<div class="ctop"><span>${esc(typeName(v))}</span>${v.test ? '<span class="tag">test</span>' : ""}${it.retry ? '<span class="tag retry">retry</span>' : ""}</div>`;
  if (!it.revealed) {
    if (it.mode === "listen") h += listenFront(it, { speak: v.french, fr: v.french, phon: v.phonetic, en: v.english });
    else if (it.dir === "fr-en") h += `<div class="cbig fr" lang="fr">${esc(v.french)}</div>${phonBlock(v.phonetic, it)}<div class="cplay">${playBtn(v.french, "Play")}</div><p class="cask">What does it mean? Tap the card to flip.</p>`;
    else h += `<div class="cbig en">${esc(v.english)}</div><p class="cask">Say it in French. Tap the card to flip.</p>`;
  } else {
    h += `<div class="cbig fr" lang="fr">${esc(v.french)}</div>${phonBlock(v.phonetic, it)}<div class="cen">${esc(v.english)}</div><div class="cplay">${playBtn(v.french, "Play")}</div>`;
    if (v.auxiliary === "être") h += '<p class="cnote">Takes être in the passé composé.</p>';
    if (familyText(v)) h += `<p class="cnote">${esc(familyText(v))}.</p>`;
    if (it.pending) h += `<p class="verdict ${it.pending}">${it.pending === "known" ? "Marked as known." : settings.repeatPile ? "Marked as don’t know. It comes back at the end of the round." : "Marked as don’t know."}</p>`;
    h += fullLink(v);
  }
  return h + micBlock(it);
}
function multiHTML(it, v) {
  const rows = rowsOf(it), tab = it.kind === "tense" ? v.tables[it.tense] : null;
  const title = it.kind === "keyforms" ? "Key forms" : TENSES[it.tense].name;
  const regular = v.type === "regular";
  const levels = rowLevels(it, rows);
  const playAll = playAllBtn(rows, "Play all");
  let h = `<div class="ctop"><span>${esc(typeName(v))}</span>${v.test ? '<span class="tag">test</span>' : ""}${it.retry ? '<span class="tag retry">retry</span>' : ""}</div>` +
    `<h2 class="mtitle"><span class="fr" lang="fr">${esc(v.french)}</span><span class="mtense">${esc(title)}</span></h2><p class="msub">${esc(v.english)}</p>`;
  if (!it.revealed) {
    if (it.dir === "en-fr") {
      h += '<ul class="plist">' + rows.map((r, i) => `<li><span class="pl">${esc(r.label)}</span><span class="dots" aria-label="hidden">· · ·</span>${levels ? badge(levels[i]) : ""}</li>`).join("") + "</ul>";
      h += `<p class="cask">${it.kind === "keyforms" ? "Say the je form of each tense aloud" : rows.length === 6 ? "Say all six aloud" : rows.length === 1 ? "Say it aloud" : `Say all ${rows.length} aloud`}, then show the answer.</p>`;
    } else {
      h += `<div class="cplay">${playAll}</div>`;
      if (settings.phonetics === "tap" && !it.phonShown) h += '<button class="phontap" data-phon>Show sounds-like</button>';
      h += tableHTML(rows, { en: false, phon: cardPhonOn(it), hl: false, keyforms: it.kind === "keyforms", levels });
      h += `<p class="cask">${regular ? "Say them aloud" : "Say what each one means"}, then show the answer.</p>`;
    }
  } else {
    if (regular && tab && tab.rule) h += `<p class="rule">${esc(tab.rule)}</p>`;
    h += `<div class="cplay">${playAll}</div>`;
    if (settings.phonetics === "tap" && !it.phonShown) h += '<button class="phontap" data-phon>Show sounds-like</button>';
    h += tableHTML(rows, { en: !regular || rows.some(r => r.en), phon: cardPhonOn(it), hl: regular && tab && tab.source === "rules", marks: it.wrong, keyforms: it.kind === "keyforms", levels });
    h += `<p class="cask">${it.wrong.size ? `${plural(it.wrong.size, "form")} marked wrong. Tap a row to change it.` : "All marked right. Tap any you got wrong."}</p>`;
    h += fullLink(v);
  }
  return h + micBlock(it);
}
function renderCard(animate) {
  const it = curItem(); if (!it) return;
  const v = BY_ID[it.verbId], card = $("#card");
  card.className = "card" + (animate && animOn() ? " enter" : "");
  card.style.transform = ""; card.style.opacity = ""; card.dataset.lean = "";
  if (animate) shownAt = performance.now();
  if (it.kind === "form" && !formRow(it)) { card.innerHTML = '<p class="cask">This card no longer matches your verb data. Press Know to skip it.</p>'; return; }
  card.innerHTML = (it.kind === "main" ? (Number.isInteger(it.xi) ? exprHTML(it, v) : mainHTML(it, v)) : it.kind === "form" ? formHTML(it, v) : multiHTML(it, v)) +
    (it.retry && !it.revealed ? '<p class="cnote">Retry: reread the full verb first if you need to.</p>' + fullLink(v) : "");
}
function renderActions() {
  const it = curItem(); if (!it) return;
  let h;
  if (isSingle(it)) {
    // Front: only Show answer. Back (4C): Again (1), Hard (2), Good (3), in that order in every mode.
    h = it.pending ? '<button class="act next" data-act="next">Next<kbd>Space</kbd></button>'
      : !it.revealed ? '<button class="act reveal" data-act="flip">Show answer<kbd>Space</kbd></button>'
      : session.mode === "sched"
        ? '<button class="act miss" data-act="dont">Again<kbd>1</kbd></button><button class="act hard" data-act="hard">Hard<kbd>2</kbd></button><button class="act know" data-act="know">Good<kbd>3</kbd></button>'
        : '<button class="act miss" data-act="dont">Again<kbd>1</kbd></button><button class="act know" data-act="know">Good<kbd>3</kbd></button>';
  } else if (!it.revealed) {
    h = '<button class="act reveal" data-act="flip">Show answer<kbd>Space</kbd></button>';
  } else {
    const all = it.wrong.size === rowsOf(it).length;
    h = `<button class="act miss" data-act="dont">${all ? "Clear marks" : "All wrong"}<kbd>2</kbd></button><button class="act know" data-act="next">Next<kbd>1</kbd></button>`;
  }
  $("#actions").innerHTML = h;
}

/* ---------- study events ---------- */
function openFullVerb(id) { navigate("learn", { scope: "all", verb: id, fromStudy: true }); }
$("#card").addEventListener("click", e => {
  if (performance.now() < suppressClickUntil) return;
  const it = curItem(); if (!it) return;
  const t = e.target;
  const say = t.closest("[data-say]");
  if (say) { say.blur(); speak(sayArg(say), say, it); return; }
  if (t.closest("[data-mic]")) { t.closest("[data-mic]").blur(); toggleMic(); return; }
  const full = t.closest("[data-full]");
  if (full) { openFullVerb(full.dataset.full); return; }
  if (t.closest("[data-phon]")) { it.phonShown = true; renderCard(false); return; }
  const row = t.closest("tr[data-row]");
  if (row) { toggleRow(Number(row.dataset.row)); return; }
  if (t.closest("button, a, input, select")) return;
  if (isSingle(it)) onFlip();
  else if (!it.revealed) revealMulti(false);
});
$("#actions").addEventListener("click", e => {
  const b = e.target.closest("[data-act]"); if (!b) return;
  b.blur();
  const a = b.dataset.act;
  if (a === "know") onKnow(); else if (a === "dont") onDont(); else if (a === "hard") onHard(); else if (a === "flip" || a === "clue") onFlip(); else if (a === "next") onNext();
});
$("#studyBack").innerHTML = ICON.back;
$("#undoBtn").innerHTML = ICON.undo;
$("#studyBack").addEventListener("click", () => navigate(homeOf()));
$("#undoBtn").addEventListener("click", e => { e.currentTarget.blur(); undo(); });
$("#qAuto").addEventListener("click", e => { e.currentTarget.blur(); settings.autoplay = !settings.autoplay; saveSettings(); renderQuick(); });
$("#qDir").addEventListener("click", e => {
  e.currentTarget.blur();
  const o = CHOICES.direction; settings.direction = o[(o.indexOf(settings.direction) + 1) % o.length]; saveSettings();
  const it = curItem();
  if (it && !it.revealed && !it.pending) {
    it.dir = dirFor(); renderStudy(false);
    if (settings.autoplay && it.dir === "fr-en") speak(speakText(it), $("#card .cplay .play"), it);
  } else renderQuick();
});
$("#qPhon").addEventListener("click", e => {
  e.currentTarget.blur();
  const o = CHOICES.phonetics; settings.phonetics = o[(o.indexOf(settings.phonetics) + 1) % o.length]; saveSettings();
  renderStudy(false);
});
$("#qMic").addEventListener("click", e => {
  e.currentTarget.blur();
  settings.mic = !settings.mic; saveSettings();
  if (!settings.mic) stopListening();
  renderStudy(false);
});

/* ---------- swipe (single cards, after the answer is shown) ---------- */
(function () {
  const card = $("#card");
  let sx = 0, sy = 0, dx = 0, t0 = 0, down = false, horiz = null, pid = null;
  card.addEventListener("pointerdown", e => {
    const it = curItem();
    if (!it || !isSingle(it) || !it.revealed || !settings.swipe || busy || e.button > 0) return; // swipe grades, so only once the answer shows
    if (e.target.closest("button, a, input, select")) return;
    down = true; pid = e.pointerId; sx = e.clientX; sy = e.clientY; dx = 0; t0 = performance.now(); horiz = null;
  });
  card.addEventListener("pointermove", e => {
    if (!down || e.pointerId !== pid) return;
    const mx = e.clientX - sx, my = e.clientY - sy;
    if (horiz === null && (Math.abs(mx) > 10 || Math.abs(my) > 10)) {
      horiz = Math.abs(mx) > Math.abs(my) * 1.2;
      if (horiz) { try { card.setPointerCapture(pid); } catch (_) {} card.classList.add("dragging"); }
    }
    if (!horiz) return;
    dx = mx;
    card.style.transform = `translateX(${dx}px) rotate(${dx / 25}deg)`;
    card.dataset.lean = dx > 40 ? "know" : dx < -40 ? "miss" : "";
  });
  const end = e => {
    if (!down || e.pointerId !== pid) return;
    down = false; card.classList.remove("dragging");
    if (!horiz) return;
    suppressClickUntil = performance.now() + 400;
    const dt = Math.max(1, performance.now() - t0);
    const far = Math.abs(dx) > Math.min(120, card.offsetWidth * 0.3), fast = Math.abs(dx) > 50 && Math.abs(dx) / dt > 0.5;
    if (e.type === "pointerup" && (far || fast)) gradeMain(dx > 0, true);
    else { card.style.transform = ""; card.dataset.lean = ""; }
  };
  card.addEventListener("pointerup", end);
  card.addEventListener("pointercancel", end);
})();

/* ---------- keyboard ---------- */
const dialogOpen = () => $$("dialog").some(d => d.open);
document.addEventListener("keydown", e => {
  if (currentScreen !== "study" || dialogOpen() || e.ctrlKey || e.metaKey || e.altKey) return;
  const tag = e.target && e.target.tagName;
  if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
  const it = curItem(); if (!it) return;
  const k = e.key;
  if (k === " " || k === "Spacebar") { e.preventDefault(); if (!e.repeat) onFlip(); }
  // v6.9 (4C/4E): single cards 1 Again, 2 Hard, 3 Good. Table cards keep 1 Next, 2 All wrong, 3–8 rows.
  else if (k === "1" && isSingle(it)) { e.preventDefault(); if (!e.repeat) onDont(); }
  else if (k === "2" && isSingle(it)) { e.preventDefault(); if (!e.repeat) { if (it.revealed && session.mode === "sched") onHard(); else if (!it.revealed) onFlip(); } }
  else if (k === "3" && isSingle(it)) { e.preventDefault(); if (!e.repeat) onKnow(); }
  else if (k === "1") { e.preventDefault(); if (!e.repeat) onKnow(); }
  else if (k === "2") { e.preventDefault(); if (!e.repeat) onDont(); }
  else if (/^[3-8]$/.test(k)) { e.preventDefault(); toggleRow(Number(k) - 3); }
  else if (k === "Enter") { if (e.target.closest && e.target.closest("button")) return; e.preventDefault(); if (!e.repeat) onNext(); }
  else if (k === "p" || k === "P" || k === "r" || k === "R") { e.preventDefault(); speak(speakText(it), $("#card .cplay .play"), it); }
  else if (k === "m" || k === "M") { e.preventDefault(); toggleMic(); }
  else if (k === "u" || k === "U" || k === "Backspace") { e.preventDefault(); undo(); }
  else if (k === "Escape") { e.preventDefault(); navigate(homeOf()); }
});
// Space on a focused button must not also click it.
document.addEventListener("keyup", e => {
  if (currentScreen === "study" && e.key === " " && e.target.closest && e.target.closest("button")) e.preventDefault();
});

/* =========================================================================
   ROUND SUMMARY
   ========================================================================= */
function renderSummary() {
  const s = session; if (!s) return;
  const total = s.queue.length;
  $("#sumTitle").textContent = s.missed ? (s.round === 1 ? "Round finished" : `Round ${s.round} finished`) : (s.round === 1 ? "All known" : `Cleared in ${s.round} rounds`);
  $("#sumText").textContent = `${s.known} known and ${s.missed} to work on, out of ${plural(total, "card")}.`;
  const byVerb = {};
  s.missedItems.forEach(m => { (byVerb[m.spec.verbId] = byVerb[m.spec.verbId] || []).push(m); });
  const ids = Object.keys(byVerb).sort((a, b) => BY_ID[a].order - BY_ID[b].order);
  $("#sumList").innerHTML = ids.length ? '<ul class="vlist">' + ids.map(id => {
    const v = BY_ID[id];
    const parts = byVerb[id].map(m => {
      const c = m.spec;
      if (c.kind === "main") return "Main card";
      const rows = rowsOf(c), wrong = rows.filter(r => m.wrong.includes(r.key)).map(r => r.label);
      return `${cardName(c)}: ${wrong.join(", ")}`;
    });
    return `<li><button class="vchip" data-learn-verb="${esc(id)}"><span class="vfr" lang="fr">${esc(v.french)}</span><span class="ven">${esc(parts.join(". "))}</span></button></li>`;
  }).join("") + "</ul>" : "";
  let a = "";
  if (s.pile.length) a += `<button class="primary" data-sum="repeat">Repeat the ${plural(s.pile.length, "missed card")}</button>`;
  a += `<button class="${s.pile.length ? "ghost" : "primary"}" data-sum="again">Practise the whole set again</button>`;
  if (s.undo.length) a += '<button class="ghost" data-sum="undo">Undo last card</button>';
  a += '<button class="ghost" data-sum="home">Back to Library</button>';
  $("#sumActions").innerHTML = a;
}
$("#sumActions").addEventListener("click", e => {
  const b = e.target.closest("[data-sum]"); if (!b || !session) return;
  const k = b.dataset.sum;
  if (k === "repeat") { session.round++; startRound(session.order === "shuffle" ? shuffled(session.pile) : session.pile.slice()); }
  else if (k === "again") startSession(session.base, session.title, session.order);
  else if (k === "undo") undo();
  else navigate("library");
});
$("#sumList").addEventListener("click", e => { const b = e.target.closest("[data-learn-verb]"); if (b) navigate("learn", { scope: "all", verb: b.dataset.learnVerb }); });

