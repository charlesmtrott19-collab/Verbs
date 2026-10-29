// Verbes: Conjugation engine: builds every table from verbs.js, and the card lists for practice.
// Plain script, no build step. Loaded by index.html in this order: core.js, conjugate.js, audio.js, study.js, screens.js, scheduler.js, app.js.
"use strict";
/* =========================================================================
   CONJUGATION ENGINE
   ========================================================================= */
const VOWEL_START = /^[aàâäeéèêëiîïoôöuùûüyÿœæ]/i;
function vowelStart(form, v) {
  const f = form.trim();
  if (VOWEL_START.test(f)) return true;
  if (/^h/i.test(f)) return !v.hAspire;
  return false;
}
function stripAgree(s) { return s.replace(/\((?:e|s)\)/g, ""); }

// One row of a table: the app adds the pronoun (elision, liaison) to a form.
// Impersonal verbs (persons: ["il"]) use il alone: il faut, il pleut. Reflexive pronouns for reflexive: true.
const IMPERS = { label: "il", fr: "il", speak: "il", phon: "eel" };
const REFL = { je: ["me", "m'", "muh", "m"], tu: ["te", "t'", "tuh", "t"], il: ["se", "s'", "suh", "s"], nous: ["nous", "", "noo", ""], vous: ["vous", "", "voo", ""], ils: ["se", "s'", "suh", "s"] };
// Adds the reflexive pronoun to a generated or override form (me lève, m'appelle, nous nous levons, vous vous êtes).
function reflx(v, p, form, phon, pre) {
  if (!v.reflexive) return [form, phon, pre];
  const R = REFL[p], vow = vowelStart(form, v), el = vow && R[1];
  const fr = el ? R[1] : R[0] + " ", ph = el ? R[3] : R[2] + " " + (vow ? "z" : "");
  return [fr + form, ph + phon, pre == null ? null : fr + pre];
}
function makeRow(v, p, form, phon, en, pre, end) {
  const P = v.impersonal && p === "il" ? IMPERS : PRONOUNS[p];
  const vowel = vowelStart(form, v);
  const elide = vowel && filled(P.elided);
  const pron = elide ? P.elided : P.fr + " ";
  const phonPron = elide ? (typeof P.phonElided === "string" ? P.phonElided : P.phon)
                         : P.phon + " " + (vowel && filled(P.liaison) ? P.liaison : "");
  const speakPron = elide ? P.elided : (filled(P.speak) ? P.speak : P.fr) + " ";
  return {
    key: p, person: p, label: filled(P.label) ? P.label : p,
    pron, form, pre: pre == null ? form : pre, end: end || "",
    fr: pron + form, phon: (phonPron + phon).trim(), en: en || "",
    speak: speakPron + stripAgree(form), elided: elide, vowel, fphon: phon
  };
}

function buildTable0(v, t) {
  const own = isObj(v.raw.conjugations) && isObj(v.raw.conjugations[t]) ? v.raw.conjugations[t] : null;
  if (own) {
    return {
      source: v.type === "irregular" ? "data" : "override",
      rule: v.type === "regular" ? "This verb has its own forms for this tense." : "",
      rows: v.persons.map(p => { const x = reflx(v, p, own[p].fr.trim(), own[p].phon.trim()); return makeRow(v, p, x[0], x[1], own[p].en); })
    };
  }
  const G = RULESX[v.group], R = G.tenses[t];
  const stem = v.inf.slice(0, v.inf.length - G.infinitiveEnding.length);
  if (R.from === "auxiliary") {
    const aux = v.auxiliary, A = AUX[aux], agree = aux === "être" ? AUX.agreement : null;
    const part = stem + G.participle.fr, partPh = v.stemPhon + G.participle.phon;
    return {
      source: "rules",
      rule: `${aux} (présent) + past participle ${part}${agree ? ", which agrees with the subject" : ""}`,
      rows: v.persons.map(p => {
        const ag = agree && !v.impersonal ? agree[p] : "";
        const pre = A[p].fr + " " + stem, x = reflx(v, p, pre + G.participle.fr + ag, A[p].phon + " " + partPh, pre);
        return makeRow(v, p, x[0], x[1], "", x[2], G.participle.fr + ag);
      })
    };
  }
  const future = R.from === "future";
  const base = future ? v.inf.slice(0, v.inf.length - (G.futureStem.drop || 0)) : stem;
  const basePh = future ? v.stemPhon + G.futureStem.phon : v.stemPhon;
  return {
    source: "rules",
    rule: `stem ${base}- + ` + PERSONS.map(p => (R.endings[p].fr ? "-" + R.endings[p].fr : "(nothing)")).join(", "),
    rows: v.persons.map(p => { const x = reflx(v, p, base + R.endings[p].fr, basePh + R.endings[p].phon, base); return makeRow(v, p, x[0], x[1], "", x[2], R.endings[p].fr); })
  };
}

const SUBP = { il: [["il", "eel", ""], ["elle", "el", ""], ["on", "oh(n)", "n"]], ils: [["ils", "eel", "z"], ["elles", "el", "z"]] };
function agreeSub(x, who) {
  if (!x || x.indexOf("(e)") < 0) return x || "";
  return who === "elle" || who === "elles" ? x.replace("(e)", "e") : who === "on" ? x.replace("(e)", "(e)(s)") : x.replace("(e)", "");
}
const SUBJ_RE = /^(I|you|he|she|one|we|they|it)\b/i;
const escL = x => esc(x).replace(/\n/g, "<br>");
// "I was / have been" -> ["I was", "I have been"]: one option per line, subject repeated.
function enAlts(en) {
  if (!en) return [];
  const parts = en.split(" / ").map(x => x.trim()).filter(Boolean), m = SUBJ_RE.exec(parts[0]), subj = m ? m[1] : "";
  return parts.map((p, i) => (i === 0 || !subj || SUBJ_RE.test(p) ? p : subj + " " + p));
}
function addSubs(rows, v) {
  const nous = rows.find(r => r.key === "nous");
  rows.forEach(r => {
    if (v && v.impersonal && r.key === "il") { r.enL = enAlts(r.en); r.en = r.enL.join("\n"); return; }
    let L = r.key === "il" ? enAlts((r.en || "").replace(/^he\/she\/one/i, "he")) : enAlts(r.en);
    const nousL = r.key === "il" && nous ? enAlts(nous.en) : [];
    if (r.key === "tu") L = L.map(x => x + " (informal)");
    if (r.key === "vous") L = L.map(x => x + " (formal, or plural)");
    const Lp = r.key === "il" ? L.map(x => x.replace("himself/herself", "himself")) : L;
    r.en = Lp.join("\n"); r.enL = Lp;
    if (r.key === "il") r.label = "il · elle · on";
    if (r.key === "ils") r.label = "ils · elles";
    const defs = SUBP[r.key]; if (!defs) return;
    r.subs = defs.map(([w, ph, lia]) => {
      const form = agreeSub(r.form, w), end = agreeSub(r.end, w);
      let lines = L;
      if (r.key === "il") {
        const sw = w === "il" ? "he" : w === "elle" ? "she" : "one";
        lines = L.map(x => x.replace(/^he\b/, sw).replace("himself/herself", sw === "he" ? "himself" : sw === "she" ? "herself" : "oneself"));
        if (w === "on") lines = lines.concat(nousL.map(x => "casual: " + x));
      }
      return { key: r.key, label: w, pron: w + " ", form, pre: r.pre, end, fr: w + " " + form, phon: ph + " " + (r.vowel && lia ? lia : "") + r.fphon, en: lines.join("\n"), speak: w + " " + stripAgree(form), elided: false };
    });
  });
}
function buildTable(v, t) { const tb = buildTable0(v, t); addSubs(tb.rows, v); return tb; }

function prepareVerb(raw, i) {
  const en = raw.english.trim().replace(/^to go \/ come home$/, "to go home, to come home"), G = RULESX[raw.group];
  const persons = Array.isArray(raw.persons) ? PERSONS.filter(p => raw.persons.includes(p)) : PERSONS.slice();
  const v = {
    id: raw.id, type: raw.type, group: raw.group, english: filled(raw.hint) ? en + " (" + raw.hint.trim() + ")" : en, gloss: en, hint: filled(raw.hint) ? raw.hint.trim() : "",
    french: raw.french.trim(), inf: raw.reflexive ? raw.french.trim().replace(/^(se |s')/, "") : raw.french.trim(), reflexive: !!raw.reflexive,
    persons, impersonal: persons.length === 1 && persons[0] === "il", family: filled(raw.family) ? raw.family.trim() : "",
    expressions: Array.isArray(raw.expressions) ? raw.expressions : [], section: isObj(G) && filled(G.like) ? G.like : raw.group,
    phonetic: raw.phonetic.trim(), auxiliary: raw.reflexive ? "être" : raw.auxiliary || "avoir", stemPhon: raw.stemPhon || "",
    hAspire: !!raw.hAspire, test: !!raw.test, order: i, raw, tables: {}, keyRows: [],
    rank: raw.rank, rankNum: parseFloat(raw.rank.slice(1))
  };
  TENSE_KEYS.forEach(t => { v.tables[t] = buildTable(v, t); });
  if (v.type === "irregular") {
    v.keyRows = TENSE_KEYS.filter(t => TENSES[t].keyForm !== false).map(t => {
      const r = v.tables[t].rows[0];
      return Object.assign({}, r, { key: t, label: TENSES[t].name, tense: t });
    });
  }
  return v;
}

function groupLabel(g) { return g === "irregular" ? "Irregular" : (isObj(RULESX[g]) && filled(RULESX[g].name) ? RULESX[g].name : g); }
function typeName(v) { return v.type === "irregular" ? "Irregular verb" : "Regular -" + RULESX[v.group].infinitiveEnding + " verb"; }

// Sections and subsections come from the data, never from a fixed list.
function buildSections() {
  const types = [];
  VERBS_OK.forEach(v => {
    let T = types.find(x => x.type === v.type);
    if (!T) { T = { type: v.type, label: TYPE_LABEL[v.type] || v.type, groups: [], verbs: [] }; types.push(T); }
    T.verbs.push(v);
    let G = T.groups.find(x => x.group === v.group);
    if (!G) { G = { group: v.group, label: groupLabel(v.group), verbs: [] }; T.groups.push(G); }
    G.verbs.push(v);
  });
  const rank = t => { const i = TYPE_ORDER.indexOf(t); return i < 0 ? 99 : i; };
  types.sort((a, b) => rank(a.type) - rank(b.type));
  const gk = Object.keys(RULESX);
  const gr = g => (g === "irregular" ? -1 : gk.indexOf(g));
  types.forEach(T => { T.groups.sort((a, b) => gr(a.group) - gr(b.group)); T.verbs.sort((a, b) => a.rankNum - b.rankNum); T.groups.forEach(G => G.verbs.sort((a, b) => a.rankNum - b.rankNum)); });
  return types;
}
function verbsInScope(scope) {
  if (!scope || scope === "all") return VERBS_OK.slice();
  const p = scope.split(":");
  if (p[0] === "type") return VERBS_OK.filter(v => v.type === p[1]);
  if (p[0] === "group") return VERBS_OK.filter(v => v.type === p[1] && v.group === p[2]);
  if (p[0] === "verb") return VERBS_OK.filter(v => v.id === p[1]);
  return VERBS_OK.slice();
}
function scopeLabel(scope) {
  if (!scope || scope === "all") return "All verbs";
  const p = scope.split(":");
  if (p[0] === "type") return TYPE_LABEL[p[1]] || p[1];
  if (p[0] === "group") return groupLabel(p[2]);
  if (p[0] === "verb") return BY_ID[p[1]] ? BY_ID[p[1]].french : p[1];
  return "All verbs";
}
function scopeOptions() {
  const out = [["all", "All verbs"]];
  SECTIONS.forEach(T => {
    out.push(["type:" + T.type, T.label]);
    if (T.type === "regular" || T.groups.length > 1) T.groups.forEach(G => out.push([`group:${T.type}:${G.group}`, "   " + G.label]));
  });
  return out;
}

/* ---------- cards ---------- */
function cardsFor(verbs, content) {
  const out = [];
  verbs.forEach(v => {
    out.push({ verbId: v.id, kind: "main" });
    if (content === "key" && v.keyRows.length) out.push({ verbId: v.id, kind: "keyforms" });
    if (content === "full") TENSE_KEYS.forEach(t => out.push({ verbId: v.id, kind: "tense", tense: t }));
  });
  return out;
}
function cardKeyOf(c) { return c.kind === "main" ? "main" : c.kind === "keyforms" ? "keyforms" : "t:" + c.tense; }
function cardName(c) { return c.kind === "main" ? "Main card" : c.kind === "keyforms" ? "Key forms" : TENSES[c.tense].name; }
