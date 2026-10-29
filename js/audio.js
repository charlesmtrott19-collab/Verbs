// Verbes: Audio: device voices, recorded clips (audio/), the clip cache, speech recognition.
// Plain script, no build step. Loaded by index.html in this order: core.js, conjugate.js, audio.js, study.js, screens.js, scheduler.js, app.js.
"use strict";
/* =========================================================================
   TEXT-TO-SPEECH (device voices, French)
   ========================================================================= */
const synth = ("speechSynthesis" in window) ? window.speechSynthesis : null;
let voices = [], voice = null, speakTok = 0, utterRef = null, safetyT = null, playingBtn = null;
function voiceRank(v) {
  let s = /^fr[-_]fr/i.test(v.lang) ? 10 : 0;
  if (/natural|neural|premium|enhanced/i.test(v.name)) s += 3; else if (/google/i.test(v.name)) s += 2; else s += 1;
  return s;
}
function loadVoices() {
  if (!synth) return;
  let all = [];
  try { all = synth.getVoices() || []; } catch (e) {}
  const seen = new Set();
  voices = all.filter(v => /^fr([-_]|$)/i.test(v.lang || ""))
    .filter(v => { const k = v.voiceURI + "|" + v.name; if (seen.has(k)) return false; seen.add(k); return true; })
    .sort((a, b) => voiceRank(b) - voiceRank(a));
  voice = voices.find(v => v.voiceURI === settings.voice) || voices.find(v => v.name === settings.voice) || voices[0] || null;
  syncVoiceUI();
}
function setPlaying(btn) {
  if (playingBtn) playingBtn.classList.remove("playing");
  playingBtn = btn || null;
  if (playingBtn) playingBtn.classList.add("playing");
}
let clipScope = null;
function enVoice() {
  let all = [];
  try { all = synth.getVoices() || []; } catch (e) {}
  return all.find(v => /^en[-_]gb/i.test(v.lang || "")) || all.find(v => /^en/i.test(v.lang || "")) || null;
}
function markClip(i) {
  if (!clipScope) return;
  clipScope.querySelectorAll("tr.speaking,li.speaking").forEach(r => r.classList.remove("speaking"));
  if (i == null) return;
  const hit = Array.from(clipScope.querySelectorAll("tr[data-clips],li[data-clips]")).filter(r => (" " + r.dataset.clips + " ").indexOf(" " + i + " ") >= 0);
  hit.forEach(r => r.classList.add("speaking"));
  if (hit[0] && hit[0].scrollIntoView) { try { hit[0].scrollIntoView({ block: "nearest", behavior: animOn() ? "smooth" : "auto" }); } catch (e) {} }
}
function stopSpeech() {
  speakTok++; clearTimeout(safetyT);
  stopAudioNow();
  markClip(null); clipScope = null;
  setPlaying(null);
}
const normLines = text => (Array.isArray(text) ? text : [text]).filter(x => x && (typeof x === "string" || x.t))
  .map(x => (typeof x === "string" ? { t: x, lang: "fr" } : { t: x.t, lang: x.lang === "en" ? "en" : "fr" }));
// Silences whatever is playing, browser or AI, without changing the token.
function stopAudioNow() {
  clearTimeout(safetyT);
  if (synth) { try { synth.cancel(); } catch (e) {} }
  if (aiAudio) { try { aiAudio.pause(); } catch (e) {} }
  if (aiCurRes) { const f = aiCurRes; aiCurRes = null; f(false); }
}
// `text` is one string, or a list of clips (strings, or {t, lang:"en"}) spoken one after another (Play all). Repeat-audio repeats the list.
// `it` is the card, so one card keeps one recorded voice. `force` is a voice name, or null for the browser voice only.
function speak(text, btn, it, force) {
  const lines = normLines(text);
  if (!lines.length) return;
  if (!synth && !clipsActive()) { toast("This browser can’t play speech."); return; }
  if (listening) stopListening();
  if (synth && !voice) loadVoices();
  const tok = ++speakTok, times = settings.repeatAudio === 2 ? 2 : 1, queue = lines.length > 1;
  stopAudioNow();
  markClip(null);
  clipScope = queue && btn ? btn.closest(".ltense, .rvsec, #card") : null;
  setPlaying(btn);
  let vname = "";
  if (force !== null && clipsActive()) vname = force || (it ? (it.aiVoice || (it.aiVoice = pickVoice(lines))) : pickVoice(lines));
  speakRun(tok, lines, times, queue, vname).catch(() => {}).then(() => { if (tok === speakTok) { markClip(null); setPlaying(null); } });
}
async function speakRun(tok, lines, times, queue, vname) {
  for (let n = 0; n < times; n++) {
    for (let i = 0; i < lines.length; i++) {
      if (tok !== speakTok) return;
      if (vname) for (let j = i; j < Math.min(lines.length, i + 5); j++) aiPrefetch(vname, lines[j]); // keep a few clips ahead
      markClip(queue ? i : null);
      await playLine(lines[i], vname, tok);
      if (tok !== speakTok) return;
      if (i + 1 < lines.length) await new Promise(r => setTimeout(r, 400));
    }
    if (n + 1 < times) await new Promise(r => setTimeout(r, 450));
  }
}
// Playback order (D2): the recorded clip in the card's voice (or another recorded voice for this line), then the browser voice.
async function playLine(L, vname, tok) {
  if (vname && clipsActive()) {
    const vs = voicesFor(L.lang, L.t), v = vs.includes(vname) ? vname : vs[0];
    if (v) {
      try {
        const blob = await aiClip(v, L.lang, L.t);
        if (tok !== speakTok) return;
        if (blob) {
          aiCur = { voice: v, lang: L.lang, text: L.t }; showFix();
          const ok = await aiPlayBlob(blob);
          if (ok || tok !== speakTok) return;
        }
      } catch (e) { if (tok !== speakTok) return; }
    }
  }
  aiCur = null; hideFix();
  if (tok !== speakTok) return;
  await browserLine(L);
}
function browserLine(L) {
  return new Promise(res => {
    if (!synth) { res(); return; }
    const u = new SpeechSynthesisUtterance(L.t);
    utterRef = u; // keep a reference so Chrome doesn't drop the events
    if (L.lang === "en") {
      const ev = enVoice();
      u.lang = ev ? ev.lang.replace("_", "-") : "en-GB";
      if (ev) u.voice = ev;
    } else {
      u.lang = voice ? voice.lang.replace("_", "-") : "fr-FR";
      if (voice) u.voice = voice;
    }
    u.rate = settings.rate; u.pitch = 1;
    let fin = false;
    const done = () => { if (fin) return; fin = true; clearTimeout(safetyT); res(); };
    u.onend = done; u.onerror = done;
    clearTimeout(safetyT);
    safetyT = setTimeout(done, 5000 + L.t.length * 120 / settings.rate);
    try { synth.speak(u); } catch (e) { done(); }
  });
}

/* =========================================================================
   RECORDED VOICES (decision D2, v6.6). tools/make-audio.js generates every clip once, on a laptop, into audio/<voice>/
   and writes audio/manifest.json: { voices: [...], clips: { "fr|je suis": { marin: "<file id>", cedar: "<file id>" } } }.
   The app makes no call to any speech service. Clips come from this site, are kept in IndexedDB so they also play
   offline, and the browser voice covers anything missing. "Sounded wrong?" puts a clip on a regeneration list that
   Settings exports for the script; a regenerated clip gets a new file id, so the flag lapses by itself.
   ========================================================================= */
const aiCfg = { cap: 150 * 1024 * 1024, timeout: 12000 };
const AUDIO_DIR = "audio/", CLIP_CACHE_VERSION = "pre1";
let aiLastVoice = "", aiCur = null, aiCurRes = null, aiFixT = null, clipMan = null, clipManP = null;
let aiAudio = null; try { aiAudio = new Audio(); } catch (e) {}
function loadManifest() {
  if (!clipManP) clipManP = typeof fetch !== "function" ? Promise.resolve(null) : fetch(AUDIO_DIR + "manifest.json", { cache: "no-cache" }).then(r => (r.ok ? r.json() : null))
    .then(m => { clipMan = isObj(m) && isObj(m.clips) && Array.isArray(m.voices) ? m : null; return clipMan; }).catch(() => null);
  return clipManP;
}
const clipsActive = () => settings.aiVoices !== false && !!clipMan;
const clipOf = (lang, text) => { const c = clipMan && clipMan.clips[lang + "|" + text]; return isObj(c) ? c : null; };
// Regeneration list: { "<voice>|<file id>": { voice, lang, text, id, on } }. Lists from before v6.6 (live AI clips) are dropped.
let regen = null;
function regenMap() {
  if (!regen) { try { regen = JSON.parse(lsGet(KEYS.aibad) || "{}"); } catch (e) { regen = {}; } if (!isObj(regen)) regen = {}; Object.keys(regen).forEach(k => { if (!isObj(regen[k]) || !regen[k].id) delete regen[k]; }); }
  return regen;
}
const saveRegen = () => lsSet(KEYS.aibad, JSON.stringify(regenMap()));
function flagClip(voice, lang, text) {
  const c = clipOf(lang, text); if (!c || !c[voice]) return false;
  regenMap()[voice + "|" + c[voice]] = { voice, lang, text, id: c[voice], on: todayStr() }; saveRegen(); return true;
}
// Voices with an unflagged clip for this line, in the manifest's order.
const voicesFor = (lang, text) => { const c = clipOf(lang, text); return c ? clipMan.voices.filter(v => c[v] && !regenMap()[v + "|" + c[v]]) : []; };
// Flags whose clip has since been regenerated (new file id) no longer apply.
const regenOpen = () => Object.values(regenMap()).filter(x => { const c = clipOf(x.lang, x.text); return c && c[x.voice] === x.id; });

// Review log: one record per card per day, written at its first try in a scheduled session
// ({ id: "date|card", d, k, g: "pass"|"miss", step, gap, late, m: "speak"|"listen", kind, s, t, v }).
// Kept in IndexedDB, included in exports, and merged (never replaced) on import. A reset adds a marker record
// ({ id: "mark|…", type: "reset" }) rather than deleting anything.
const logDB = {
  db: null, ready: null,
  open() {
    if (this.ready) return this.ready;
    this.ready = new Promise(res => {
      let rq; try { rq = indexedDB.open("frverbs-log", 1); } catch (e) { res(false); return; }
      rq.onupgradeneeded = () => { try { rq.result.createObjectStore("reviews", { keyPath: "id" }); } catch (e) {} };
      rq.onsuccess = () => { this.db = rq.result; res(true); };
      rq.onerror = rq.onblocked = () => res(false);
    });
    return this.ready;
  },
  async tx(mode, fn) {
    if (!(await this.open())) return null;
    return new Promise(res => {
      try {
        const t = this.db.transaction("reviews", mode), st = t.objectStore("reviews");
        let out = null; const r = fn(st); if (r) r.onsuccess = () => { out = r.result; };
        t.oncomplete = () => res(out === null ? true : out);
        t.onerror = t.onabort = () => res(null);
      } catch (e) { res(null); }
    });
  },
  put(rec) { logCache([rec]); return this.tx("readwrite", st => { st.put(rec); }); },
  del(id) { LOG = LOG.filter(r => r.id !== id); logIdx = null; return this.tx("readwrite", st => { st.delete(id); }); },
  async all() { const r = await this.tx("readonly", st => st.getAll()); return Array.isArray(r) ? r : []; },
  merge(recs) { logCache(recs); return this.tx("readwrite", st => { recs.forEach(r => st.put(r)); }); },
  mark(type) { return this.put({ id: "mark|" + Date.now(), type, d: todayStr(), t: Date.now(), v: APP_VERSION }); }
};
// In-memory copy of the log (Section 3E: every metric is one pass over it). Filled at start-up, kept current by put/del/merge.
let LOG = [], logIdx = null, logLoaded = null;
function logCache(recs) { const ids = new Set(recs.map(r => r && r.id)); LOG = LOG.filter(r => !ids.has(r.id)).concat(recs.filter(okLogRec)); logIdx = null; }
function loadLog() { if (!logLoaded) logLoaded = logDB.all().then(a => { const mine = LOG; LOG = a.filter(okLogRec); logCache(mine); return LOG; }); return logLoaded; }
const okLogRec = r => isObj(r) && typeof r.id === "string" && r.id.length > 0 && r.id.length < 300;

const aiDB = {
  db: null, keys: new Map(), bytes: 0, ready: null, pruning: false,
  open() {
    if (this.ready) return this.ready;
    this.ready = new Promise(res => {
      let rq; try { rq = indexedDB.open("frverbs-audio", 1); } catch (e) { res(false); return; }
      rq.onupgradeneeded = () => { try { rq.result.createObjectStore("clips", { keyPath: "k" }); } catch (e) {} };
      rq.onsuccess = () => { this.db = rq.result; this.scan().then(() => res(true)); };
      rq.onerror = rq.onblocked = () => res(false);
    });
    return this.ready;
  },
  scan() {
    return new Promise(res => {
      this.keys = new Map(); this.bytes = 0;
      try {
        const rq = this.db.transaction("clips").objectStore("clips").openCursor();
        rq.onsuccess = () => { const c = rq.result; if (c) { this.keys.set(c.value.k, { size: c.value.size || 0, t: c.value.t || 0 }); this.bytes += c.value.size || 0; c.continue(); } else res(); };
        rq.onerror = () => res();
      } catch (e) { res(); }
    });
  },
  get(k) {
    return new Promise(res => {
      if (!this.db) { res(null); return; }
      try { const rq = this.db.transaction("clips").objectStore("clips").get(k); rq.onsuccess = () => { const r = rq.result || null; if (r) this.touch(r); res(r); }; rq.onerror = () => res(null); } catch (e) { res(null); }
    });
  },
  // Remember when a clip was last played, so pruning removes the least recently played first. Saved at most once a day per clip.
  touch(rec) {
    const now = Date.now();
    if (now - (rec.t || 0) < 864e5) return;
    const m = this.keys.get(rec.k); if (m) m.t = now;
    this.put(Object.assign({}, rec, { t: now }));
  },
  put(rec) {
    return new Promise(res => {
      if (!this.db) { res(false); return; }
      try {
        const t = this.db.transaction("clips", "readwrite"); t.objectStore("clips").put(rec);
        t.oncomplete = () => { const old = this.keys.get(rec.k); if (old) this.bytes -= old.size; this.keys.set(rec.k, { size: rec.size, t: rec.t }); this.bytes += rec.size; res(true); };
        t.onerror = t.onabort = () => res(false);
      } catch (e) { res(false); }
    });
  },
  del(k) {
    return new Promise(res => {
      if (!this.db) { res(); return; }
      try {
        const t = this.db.transaction("clips", "readwrite"); t.objectStore("clips").delete(k);
        t.oncomplete = () => { const m = this.keys.get(k); if (m) { this.bytes -= m.size; this.keys.delete(k); } res(); };
        t.onerror = t.onabort = () => res();
      } catch (e) { res(); }
    });
  },
  clear() {
    return new Promise(res => {
      if (!this.db) { res(); return; }
      try { const t = this.db.transaction("clips", "readwrite"); t.objectStore("clips").clear(); t.oncomplete = () => { this.keys = new Map(); this.bytes = 0; res(); }; t.onerror = t.onabort = () => res(); } catch (e) { res(); }
    });
  },
  // The least recently played clips go first once the saved audio passes its limit.
  async prune() {
    if (this.bytes <= aiCfg.cap || this.pruning) return;
    this.pruning = true;
    const old = Array.from(this.keys.entries()).sort((a, b) => a[1].t - b[1].t);
    for (const [k] of old) { if (this.bytes <= aiCfg.cap * 0.8) break; await this.del(k); }
    this.pruning = false;
  }
};

const aiInflight = new Map();
// Resolves to the clip's audio Blob (saved copy first, then this site), or null when there is no clip for this voice.
function aiClip(voice, lang, text) {
  const c = clipOf(lang, text), id = c && c[voice];
  if (!id) return Promise.resolve(null);
  const k = voice + "|" + id;
  if (aiInflight.has(k)) return aiInflight.get(k);
  const p = (async () => {
    await aiDB.open();
    const hit = await aiDB.get(k); if (hit && hit.blob) return hit.blob;
    const ctl = typeof AbortController !== "undefined" ? new AbortController() : null, to = setTimeout(() => { if (ctl) ctl.abort(); }, aiCfg.timeout);
    try {
      const res = await fetch(AUDIO_DIR + voice + "/" + id + ".mp3", { signal: ctl ? ctl.signal : undefined });
      if (!res.ok) return null;
      const blob = await res.blob();
      await aiDB.put({ k, blob, size: blob.size, t: Date.now() });
      aiDB.prune();
      return blob;
    } catch (e) { return null; } finally { clearTimeout(to); }
  })();
  aiInflight.set(k, p); p.then(() => aiInflight.delete(k), () => aiInflight.delete(k));
  return p;
}
function aiPrefetch(voice, L) { if (clipsActive()) aiClip(voice, L.lang, L.t).catch(() => {}); }
// One voice per card, alternating between cards: a voice with a clip for every line, else one with the first line, else none.
function pickVoice(lines) {
  if (!clipMan) return "";
  let cand = clipMan.voices.filter(v => lines.every(L => voicesFor(L.lang, L.t).includes(v)));
  if (!cand.length) cand = voicesFor(lines[0].lang, lines[0].t);
  if (!cand.length) return "";
  const alt = cand.filter(v => v !== aiLastVoice), from = alt.length ? alt : cand;
  const v = from[Math.floor(Math.random() * from.length)]; aiLastVoice = v; return v;
}
function aiPlayBlob(blob) {
  return new Promise(res => {
    if (!aiAudio) { res(false); return; }
    let url = ""; try { url = URL.createObjectURL(blob); } catch (e) { res(false); return; }
    const fin = ok => { if (aiCurRes === fin) aiCurRes = null; aiAudio.onended = aiAudio.onerror = null; try { URL.revokeObjectURL(url); } catch (e) {} res(ok); };
    aiCurRes = fin;
    aiAudio.onended = () => fin(true); aiAudio.onerror = () => fin(false);
    try { aiAudio.src = url; const pr = aiAudio.play(); if (pr && pr.catch) pr.catch(() => fin(false)); } catch (e) { fin(false); }
  });
}
// Reads ahead in a session so the next few cards' audio is ready before you reach them.
function aiPrefetchAhead() {
  if (!clipsActive() || !session || !session.queue) return;
  for (let j = session.idx; j < Math.min(session.queue.length, session.idx + 7); j++) {
    const it = session.queue[j]; if (!it) continue;
    let lines; try { lines = normLines(speakText(it)); } catch (e) { continue; }
    if (!lines.length) continue;
    if (!it.aiVoice) it.aiVoice = pickVoice(lines);
    if (it.aiVoice) lines.slice(0, 3).forEach(L => aiPrefetch(it.aiVoice, L));
  }
}
function showFix() { const el = $("#aiFix"); if (!el) return; el.hidden = false; clearTimeout(aiFixT); aiFixT = setTimeout(hideFix, 10000); }
function hideFix() { const el = $("#aiFix"); if (el) el.hidden = true; clearTimeout(aiFixT); }
// "Sounded wrong?": put this clip on the regeneration list, drop its saved copy, and play the line in another voice.
async function aiFix() {
  const c = aiCur; hideFix(); if (!c) return;
  const cl = clipOf(c.lang, c.text);
  flagClip(c.voice, c.lang, c.text);
  if (cl && cl[c.voice]) await aiDB.del(c.voice + "|" + cl[c.voice]);
  const left = voicesFor(c.lang, c.text);
  stopSpeech(); syncAiUI();
  const it = curItem();
  if (!left.length) { toast("Added to the regeneration list. No other voice has this one, so the browser voice plays it."); speak([{ t: c.text, lang: c.lang }], undefined, undefined, null); return; }
  if (it && it.aiVoice === c.voice) it.aiVoice = left[0];
  toast("Added to the regeneration list. Trying " + left[0] + ".");
  speak([{ t: c.text, lang: c.lang }], undefined, undefined, left[0]);
}
// The lines tools/make-audio.js records, once each. "cards" (the default): everything a scheduled session speaks by
// itself (each card's infinitive or form, in speaking and listening) plus expressions. "full" adds every other line
// a play button can say: il · elle · on and ils · elles variants, regular verbs' tables, and To review's English.
function allClipLines(scope) {
  const out = [], seen = new Set(), add = (t, lang) => { if (!t) return; const k = lang + "|" + t; if (!seen.has(k)) { seen.add(k); out.push({ t, lang }); } };
  VERBS_OK.forEach(v => {
    add(v.french, "fr");
    // A key card can ask any person, so every person of its tense is a card line.
    if (v.type === "irregular") verbUnits(v).forEach(k => { const sp = unitSpec(k); if (sp.kind === "form") (sp.key ? v.tables[sp.tense].rows.map(r => r.key) : [sp.person]).forEach(p => add(speakText(newItem(Object.assign({}, sp, { person: p }))), "fr")); });
    v.expressions.forEach(x => add(x.fr, "fr"));
  });
  if (scope === "full") VERBS_OK.forEach(v => {
    TENSE_KEYS.forEach(t => clipsOf(v.tables[t].rows).forEach(x => add(x, "fr")));
    (v.type === "irregular" ? verbUnits(v) : [v.id]).forEach(k => { const r = reviewItem(k); if (r) { r.say.forEach(x => add(x, "fr")); add(r.enSay, "en"); } });
  });
  return out;
}
function speakText(it) {
  const v = BY_ID[it.verbId];
  if (it.kind === "main") return Number.isInteger(it.xi) ? v.expressions[it.xi].fr : v.french;
  if (it.kind === "form") { const r = formRow(it); return r ? r.speak : ""; }
  return clipsOf(rowsOf(it));
}

/* =========================================================================
   SPEECH RECOGNITION (French, hint only)
   ========================================================================= */
const SRClass = window.SpeechRecognition || window.webkitSpeechRecognition || null;
let micState = SRClass ? "ok" : "unsupported"; // ok | unsupported | blocked | unavailable
let rec = null, recTok = 0, listening = false, micPromise = null;

function ensureMic() {
  // Asking for the microphone directly is what makes Chrome show its permission prompt.
  if (micPromise) return micPromise;
  micPromise = (async () => {
    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) return { ok: true };
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      s.getTracks().forEach(t => t.stop());
      return { ok: true };
    } catch (e) { return { ok: false, reason: (e && e.name) || "error" }; }
  })();
  micPromise.then(r => { if (!r.ok) micPromise = null; });
  return micPromise;
}
function setMicState(state) {
  micState = state;
  stopListening();
  if (currentScreen === "study" && session) renderStudy(false);
  syncSettingsUI();
}
if (micState === "ok" && navigator.permissions && navigator.permissions.query) {
  navigator.permissions.query({ name: "microphone" }).then(st => {
    const apply = () => {
      if (st.state === "denied") { if (micState === "ok") setMicState("blocked"); }
      else if (micState === "blocked") { micPromise = null; setMicState("ok"); }
    };
    apply(); st.onchange = apply;
  }).catch(() => {});
}
function toggleMic() {
  const it = curItem();
  if (!it || !settings.mic || micState !== "ok") return;
  if (listening) { stopListening(); return; }
  stopSpeech();
  it.micMsg = "";
  if (it.kind === "main") it.heard = []; // one word: judge the latest attempt only
  const tok0 = ++recTok;
  listening = true; refreshMic();
  ensureMic().then(r => {
    if (tok0 !== recTok || curItem() !== it) { if (tok0 === recTok) listening = false; return; }
    if (!r.ok) {
      listening = false;
      if (r.reason === "NotAllowedError" || r.reason === "SecurityError") { setMicState("blocked"); return; }
      it.micMsg = r.reason === "NotFoundError" ? "No microphone was found." : r.reason === "NotReadableError" ? "Another app is using the microphone." : "The microphone couldn’t start. Tap the mic to try again.";
      refreshMic(); return;
    }
    startRecognition(it);
  });
}
function startRecognition(it) {
  const tok = ++recTok;
  try { rec = new SRClass(); } catch (e) { listening = false; setMicState("unsupported"); return; }
  rec.lang = "fr-FR";
  rec.interimResults = false;
  rec.maxAlternatives = 5;
  rec.continuous = it.kind !== "main";
  rec.onresult = e => {
    if (tok !== recTok || curItem() !== it) return;
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const res = e.results[i];
      if (!res.isFinal) continue;
      const alts = [];
      for (let j = 0; j < res.length; j++) { const t = (res[j].transcript || "").trim(); if (t) alts.push(t); }
      if (alts.length) it.heard.push(alts);
    }
    it.micMsg = ""; refreshMic();
  };
  rec.onerror = e => {
    if (tok !== recTok) return;
    const er = e.error;
    if (er === "not-allowed") { setMicState("blocked"); return; }
    if (er === "service-not-allowed") { setMicState("unavailable"); return; }
    it.micMsg = er === "no-speech" ? "Didn’t catch anything. Tap the mic to try again."
      : er === "network" ? "Speech recognition needs an internet connection."
      : er === "audio-capture" ? "No microphone found, or another app is using it."
      : er === "aborted" ? "" : "The mic stopped (" + er + "). Tap to try again.";
    refreshMic();
  };
  rec.onend = () => { if (tok !== recTok) return; listening = false; rec = null; refreshMic(); };
  try { rec.start(); listening = true; refreshMic(); }
  catch (e) { listening = false; it.micMsg = "The mic couldn’t start. Tap to try again."; refreshMic(); }
}
function stopListening() {
  recTok++;
  if (rec) { try { rec.abort(); } catch (e) {} rec = null; }
  if (listening) { listening = false; refreshMic(); }
}
function refreshMic() { if (currentScreen === "study" && session && curItem()) renderCard(false); }

// Matching: lowercase, trim, drop punctuation. Accent-only differences are "close".
function norm(s) { return String(s).toLowerCase().normalize("NFC").replace(/[’‘`´']/g, " ").replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim(); }
function deacc(s) { return s.normalize("NFD").replace(/\p{M}/gu, ""); }
function phraseIn(hay, needle) { return !!needle && (" " + hay + " ").indexOf(" " + needle + " ") >= 0; }
function matchLevel(alts, answers) {
  const A = answers.map(norm).filter(Boolean), AD = A.map(deacc);
  let best = 0;
  for (const t of alts) {
    const n = norm(t), nd = deacc(n);
    if (A.some(a => n === a || phraseIn(n, a))) return 2;
    if (AD.some(a => nd === a || phraseIn(nd, a))) best = 1;
  }
  return best;
}
function agreeVariants(f) {
  if (f.indexOf("(") < 0) return [f];
  return Array.from(new Set([
    f.replace(/\((e|s)\)/g, ""), f.replace(/\((e|s)\)/g, "$1"),
    f.replace(/\(e\)/g, "e").replace(/\(s\)/g, ""), f.replace(/\(e\)/g, "").replace(/\(s\)/g, "s")
  ]));
}
function rowAnswers(r) {
  const P = PRONOUNS[r.person];
  const prons = r.elided ? [P.elided] : P.fr.split("/").map(s => s.trim() + " ");
  const out = [];
  prons.forEach(pr => agreeVariants(r.form).forEach(f => out.push(pr + f)));
  return out;
}
function rowLevels(it, rows) {
  if (!it.heard.length) return null;
  const alts = [].concat.apply([], it.heard);
  return rows.map(r => matchLevel(alts, rowAnswers(r)));
}
function badge(level) {
  return level === 2 ? '<span class="hb ok">heard</span>' : level === 1 ? '<span class="hb close">close (check accents)</span>' : "";
}

