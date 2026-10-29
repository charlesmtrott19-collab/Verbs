// Consistency checks on verbs.js data, beyond the app's own checkVerb (audit Section 2A).
// runChecks(data) returns { errors: [...], warnings: [...] }; each item is a plain sentence naming the verb.
// Errors are things that are wrong; warnings are things to look at (e.g. ambiguous English prompts).
"use strict";

const P = ["je", "tu", "il", "nous", "vous", "ils"];
const IMP = { je: "ais", tu: "ais", il: "ait", nous: "ions", vous: "iez", ils: "aient" };
const FUT = { je: "ai", tu: "as", il: "a", nous: "ons", vous: "ez", ils: "ont" };
const REFL = { je: ["me ", "m'"], tu: ["te ", "t'"], il: ["se ", "s'"], nous: ["nous "], vous: ["vous "], ils: ["se ", "s'"] };
const AGREE = { je: "(e)", tu: "(e)", il: "(e)", nous: "(e)s", vous: "(e)(s)", ils: "(e)s" };
const SUBJ = { je: /^I\b/, tu: /^you\b/, il: /^he\/she\/one\b/, nous: /^we\b/, vous: /^you\b/, ils: /^they\b/ };
const ACCENTS = /[àâäéèêëîïôöûùüç]/i;

// Être verbs whose passé composé correctly shows no agreement. Keep the reason with each entry.
const NO_AGREEMENT = {
  "se-faire": "the object follows the verb (elle s'est fait un café)",
  "s-ecrire": "reciprocal with an indirect object (ils se sont écrit)"
};

const stripAgree = s => s.replace(/\(e\)\(s\)|\(e\)s|\(e\)|\(s\)/g, "");

function runChecks(data) {
  const { VERBS, AUXILIARIES } = data;
  const errors = [], warnings = [];
  const err = (v, msg) => errors.push(`${v.french || v.id}: ${msg}`);

  // Duplicates across the whole list.
  const seen = { id: new Map(), french: new Map(), rank: new Map() };
  VERBS.forEach(v => {
    [["id", v.id], ["french", v.french], ["rank", v.rank && v.rank[0] + parseFloat(v.rank.slice(1))]].forEach(([k, val]) => {
      if (val === undefined) return;
      if (seen[k].has(val)) err(v, `duplicate ${k} (also used by ${seen[k].get(val)})`);
      else seen[k].set(val, v.french || v.id);
    });
    if (typeof v.phonetic === "string" && ACCENTS.test(v.phonetic)) err(v, `phonetic contains an accented letter: "${v.phonetic}"`);
    if (typeof v.stemPhon === "string" && ACCENTS.test(v.stemPhon)) err(v, `stemPhon contains an accented letter: "${v.stemPhon}"`);
    (Array.isArray(v.expressions) ? v.expressions : []).forEach(x => { if (x && typeof x.phon === "string" && ACCENTS.test(x.phon)) err(v, `expression "${x.fr}": phon contains an accented letter: "${x.phon}"`); });
    if (typeof v.family === "string") {
      const m = /^like (.+)$/.exec(v.family);
      if (!m) err(v, `family "${v.family}" should read "like <infinitive>"`);
      else if (!VERBS.some(w => w.french === m[1] && w !== v)) err(v, `family "${v.family}" names no verb in the list`);
    }
    // Regular overrides: no accents in sounds-like, and reflexive overrides leave the pronoun to the app.
    if (v.type === "regular" && v.conjugations) Object.keys(v.conjugations).forEach(t => Object.keys(v.conjugations[t] || {}).forEach(p => {
      const row = v.conjugations[t][p] || {};
      if (typeof row.phon === "string" && ACCENTS.test(row.phon)) err(v, `${t} ${p}: phon contains an accented letter: "${row.phon}"`);
      if (v.reflexive && typeof row.fr === "string" && /^(me|te|se|nous|vous|m'|t'|s')( |$)|^[mts]'/.test(row.fr)) err(v, `${t} ${p}: write "${row.fr}" without the reflexive pronoun; the app adds it`);
    }));
  });

  VERBS.filter(v => v.type === "irregular" && v.conjugations).forEach(v => {
    const C = v.conjugations;
    const reflexive = /^(se |s')/.test(v.french);
    const PS = Array.isArray(v.persons) ? P.filter(p => v.persons.includes(p)) : P;
    const impersonal = PS.length === 1 && PS[0] === "il";
    const has = t => C[t] && PS.every(p => C[t][p] && typeof C[t][p].fr === "string");

    // The verb form without its reflexive pronoun (and the "en" of s'en aller).
    const body = (t, p) => {
      let f = C[t][p].fr;
      if (reflexive) {
        const r = REFL[p].find(x => f.startsWith(x));
        if (!r) { err(v, `${t} ${p}: "${f}" should start with ${REFL[p].map(x => `"${x.trim()}"`).join(" or ")}`); return f; }
        f = f.slice(r.length);
        if (f.startsWith("en ")) f = f.slice(3);
      }
      return f;
    };
    const lastWord = (t, p) => body(t, p).split(" ").pop();

    // Accents in sounds-like text, and English subjects.
    Object.keys(C).forEach(t => P.forEach(p => {
      const row = C[t][p]; if (!row) return;
      if (typeof row.phon === "string" && ACCENTS.test(row.phon)) err(v, `${t} ${p}: phon contains an accented letter: "${row.phon}"`);
      if (typeof row.en === "string" && !(impersonal ? /^it\b/ : SUBJ[p]).test(row.en)) err(v, `${t} ${p}: English "${row.en}" should start with ${impersonal ? '"it" (impersonal verb)' : "the subject for " + p}`);
    }));

    // Imparfait: one stem, regular endings, and the stem equals the nous présent stem (être excepted).
    if (has("imparfait")) {
      const stems = PS.map(p => { const w = lastWord("imparfait", p); return w.endsWith(IMP[p]) ? w.slice(0, -IMP[p].length) : null; });
      if (stems.includes(null) || new Set(stems).size > 1) err(v, `imparfait does not share one stem with the usual endings: ${PS.map(p => C.imparfait[p].fr).join(", ")}`);
      else if (v.id !== "etre" && has("present") && PS.includes("nous")) {
        const n = lastWord("present", "nous");
        if (!n.endsWith("ons") || n.slice(0, -3) !== stems[0]) err(v, `imparfait stem "${stems[0]}" differs from the nous présent "${C.present.nous.fr}"`);
      }
    }

    // Futur and conditionnel: one shared stem ending in r.
    let futStem = null;
    if (has("futur")) {
      const s = PS.map(p => { const w = lastWord("futur", p); return w.endsWith(FUT[p]) ? w.slice(0, -FUT[p].length) : null; });
      if (s.includes(null) || new Set(s).size > 1) err(v, `futur does not share one stem with the usual endings: ${PS.map(p => C.futur[p].fr).join(", ")}`);
      else { futStem = s[0]; if (!/r$/.test(futStem)) err(v, `futur stem "${futStem}" does not end in r`); }
    }
    if (has("conditionnel")) {
      const s = PS.map(p => { const w = lastWord("conditionnel", p); return w.endsWith(IMP[p]) ? w.slice(0, -IMP[p].length) : null; });
      if (s.includes(null) || new Set(s).size > 1) err(v, `conditionnel does not share one stem with the usual endings: ${PS.map(p => C.conditionnel[p].fr).join(", ")}`);
      else if (futStem && s[0] !== futStem) err(v, `conditionnel stem "${s[0]}" differs from futur stem "${futStem}"`);
    }

    // Passé composé: right auxiliary for each person, one participle, agreement only with être.
    if (has("passe_compose") && AUXILIARIES) {
      const aux = v.auxiliary || "avoir";
      const parts = PS.map(p => {
        const w = body("passe_compose", p).split(" ");
        const auxForm = w.slice(0, -1).join(" "), part = w[w.length - 1];
        const want = AUXILIARIES[aux] && AUXILIARIES[aux][p] && AUXILIARIES[aux][p].fr;
        if (want && auxForm !== want) err(v, `passé composé ${p}: "${C.passe_compose[p].fr}" should use "${want}" (auxiliary ${aux})`);
        return { p, part };
      });
      const bare = new Set(parts.map(x => stripAgree(x.part)));
      if (bare.size > 1) err(v, `passé composé uses more than one participle: ${[...bare].join(", ")}`);
      if (aux === "être" && !NO_AGREEMENT[v.id] && !impersonal) parts.forEach(({ p, part }) => { if (!part.endsWith(AGREE[p])) err(v, `passé composé ${p}: "${C.passe_compose[p].fr}" should end in ${AGREE[p]} (être agreement)`); });
      if (aux === "avoir" && parts.some(x => /\(e\)/.test(x.part))) err(v, "passé composé shows agreement but the auxiliary is avoir");
    }
  });

  // Regular verbs: the group's infinitive ending (the app checks this too) and a stemPhon.
  VERBS.filter(v => v.type === "regular").forEach(v => {
    if (typeof v.stemPhon !== "string" || !v.stemPhon.trim()) err(v, "regular verb has no stemPhon");
  });

  // Warnings: English prompts that more than one verb answers, unless every one of them has its own hint.
  const firstGloss = e => String(e || "").toLowerCase().split(/[;,(]/)[0].trim();
  const byGloss = new Map();
  VERBS.forEach(v => { const g = firstGloss(v.english); if (!byGloss.has(g)) byGloss.set(g, []); byGloss.get(g).push(v); });
  byGloss.forEach((list, g) => {
    if (list.length < 2) return;
    const hints = list.map(v => (typeof v.hint === "string" ? v.hint.trim().toLowerCase() : ""));
    if (hints.includes("") || new Set(hints).size < hints.length) warnings.push(`"${g}" is the English prompt for ${list.map(v => v.french).join(", ")}: add a hint to tell them apart`);
  });

  return { errors, warnings };
}

module.exports = { runChecks, NO_AGREEMENT };
