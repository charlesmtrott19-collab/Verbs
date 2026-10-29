/* ============================================================================
   verbs.js: DATA ONLY for the French verb flashcard app (index.html).
   No app code lives here. index.html reads the five objects below.
   ----------------------------------------------------------------------------

   WHAT THIS FILE DEFINES (in this order)
     TENSES       which tenses exist, the order they are shown in, names, explanations
     PRONOUNS     the six persons and how their pronouns are written and pronounced
     RULES        how REGULAR verbs are conjugated, one entry per group (er, ir, re)
     AUXILIARIES  avoir and être in the présent, used to build the passé composé of
                  regular verbs, plus the être agreement endings
     VERBS        the verb list. It must end with the line   // END OF VERBS

   ----------------------------------------------------------------------------
   ADDING A VERB
   Add one object to VERBS. New verbs are introduced by "rank" within each section
   (the section order is a setting in the app), not by their position in VERBS.

     id           REQUIRED. Unique. Lowercase a-z, 0-9, "-" or "_" only, no accents.
                  NEVER change an id once it exists: saved progress is keyed by it.
     rank         REQUIRED. Importance label: "I01", "I02"... for irregular verbs,
                  "R001", "R002"... for regular verbs. Lower number = more important =
                  introduced earlier within its section. Must be unique and start with
                  I for irregular, R for regular. A decimal ("I05.5") can slot a verb
                  between two existing ranks without renumbering anything.
     type         REQUIRED. "irregular" or "regular".
     group        REQUIRED. "irregular" for irregular verbs. For regular verbs, one of
                  the keys of RULES: "er", "ir" or "re".
     english      REQUIRED. Meaning of the infinitive, e.g. "to be".
     french       REQUIRED. The infinitive, e.g. "être".
     phonetic     REQUIRED. Sounds-like of the infinitive, e.g. "eh-truh" (see PHONETIC KEY).
     auxiliary    Optional. "être" if the passé composé uses être (aller, arriver...).
                  Leave it out for avoir (the default).
     stemPhon     REQUIRED for regular verbs. Sounds-like of the stem, used to build the
                  sounds-like of every generated form. See the note on each RULES group.
                  Examples: parler "parl", finir "fee-n", vendre "vah(n)", arriver "ah-reev".
     hAspire      Optional. true only if the verb starts with an aspirated h (no j', no
                  liaison), e.g. haïr. Otherwise a starting h is treated as silent.
     test         Optional. true marks a test entry, so it is easy to find and remove.
     hint         Optional. A short disambiguator shown in brackets after the English prompt:
                  english "to know" + hint "a person, a place" shows "to know (a person, a place)".
                  Give one to every verb that shares an English prompt (the validator warns).
                  It must not give the answer away.
     persons      Optional. The persons the verb is drilled in, e.g. ["il"]. Its tables (written
                  or generated) then hold only these persons, and conjugations need only them.
                  ["il"] alone means an impersonal verb (falloir, pleuvoir, se passer): the
                  pronoun is il, never elle or on, the English starts with "it", and a generated
                  être passé composé shows no agreement (il s'est passé).
     reflexive    Optional, regular verbs only. true for se lever, s'appeler: french starts with
                  "se " or "s'"; every generated form gets me, te, se, nous, vous, se (m', t', s'
                  before a vowel or silent h); the passé composé uses être with agreement. Write
                  overrides in conjugations WITHOUT the reflexive pronoun ("appelle"); the app
                  adds it. Irregular reflexive verbs keep the pronoun in every written form.
     expressions  Optional. 1 to 3 fixed phrases the verb is mostly used in, each { fr, phon, en }:
                    expressions: [ { fr: "il vaut mieux", phon: "eel voh myuh", en: "it's better to" } ]
                  Shown in Learn (they become cards in a later version).
     family       Optional. "like <infinitive>" when the verb follows another verb's pattern,
                  e.g. "like prendre" on apprendre. Shown on cards and in Learn, where the named
                  verb lists its family. It never changes the order of introduction.
     conjugations REQUIRED for irregular verbs, with a table for EVERY tense in TENSES.
                  Optional for regular verbs: a table here REPLACES the generated forms for
                  that tense only (use it for spelling changes, e.g. manger: nous mangeons).
                  Each table lists all six persons (or only those in persons):

                    present: {
                      je:   { fr: "suis",   phon: "swee",  en: "I am" },
                      tu:   { fr: "es",     phon: "eh",    en: "you are" },
                      il:   { fr: "est",    phon: "eh",    en: "he/she/one is" },
                      nous: { fr: "sommes", phon: "sum",   en: "we are" },
                      vous: { fr: "êtes",   phon: "et",    en: "you are" },
                      ils:  { fr: "sont",   phon: "soh(n)", en: "they are" }
                    }

                  fr    the verb form WITHOUT the pronoun: "suis", "ai été", "suis allé(e)".
                  phon  sounds-like of that form WITHOUT the pronoun.
                  en    English WITH its subject: "I am", "he/she is". Required for irregular
                        verbs. Optional on regular overrides (regular verbs show English for
                        the infinitive only).
                  The app adds the pronoun itself (see PRONOUNS): je becomes j' before a
                  vowel or silent h, and the liaison "z" is added to the sounds-like after
                  nous, vous and ils/elles when the form starts with a vowel sound.
                  Passé composé with être: write the agreement into fr, like this:
                    je, tu, il: "allé(e)"   nous, ils: "allé(e)s"   vous: "allé(e)(s)"
     Any other field is ignored.

   KEY FORMS CARD (irregular verbs only)
     Built automatically from conjugations: the je form of every tense whose TENSES
     entry does not say keyForm: false. No extra fields are needed.

   ----------------------------------------------------------------------------
   PHONETIC KEY (sounds-like)
     Hyphens separate syllables. Read each part as English.
       ay = é, -er, -ez (café)        eh = è, ê, ai, -ais, -ait (bet)
       uh = weak e (the)               ee = i (see)
       ew = u: say "ee" with rounded lips
       oo = ou (food)                  oh = o, au (go)
       wah = oi                        zh = j, soft g (measure)
       (n) = the vowel before it is nasal and the n is not pronounced:
             oh(n) = on,  ah(n) = an/en,  a(n) = in/ain
     Only compulsory liaisons are shown (nous_avons, ils_ont, vous_êtes).

   ----------------------------------------------------------------------------
   TENSES
     The key (e.g. "present") is the tense id used in conjugations and in saved
     progress. Never rename a key. The ORDER of the keys is the display order.
       name       display name
       formation  how the tense is formed, in plain English
       use        when the tense is used
       keyForm    false = leave this tense out of the key forms card (omit = included)
     To add a tense: add it here, add a table for it to every irregular verb, and add
     a rule for it to every group in RULES.

   RULES (regular verbs)
     One entry per group. The key is the group id that verbs use. A group added here
     (and used by at least one verb) appears in the Library automatically.
       name              display name, e.g. "-er verbs"
       infinitiveEnding  removed from the infinitive to get the stem: parler -> parl
       participle        { fr, phon }: past participle = stem + fr; its sounds-like =
                         stemPhon + phon
       like              Optional. Another group's key, e.g. "er". The verbs show under their own
                         group in the Library but are scheduled and introduced inside that group's
                         section, by rank, so -ger and -cer verbs sit among the -er verbs.
       futureStem        { drop, phon }: futur and conditionnel stem = the infinitive
                         minus its last `drop` letters (parler -> parler-, vendre -> vendr-);
                         its sounds-like = stemPhon + phon
       tenses            one entry for EVERY key in TENSES:
                           { from: "stem",   endings: { je: {fr, phon}, ... } }
                               stem + ending
                           { from: "future", endings: { ... } }
                               future stem + ending
                           { from: "auxiliary" }
                               auxiliary in the présent + past participle (AUXILIARIES)
     A generated sounds-like is simply stemPhon + the ending's phon, joined as written
     (each ending's phon carries its own hyphen where one is wanted).

   AUXILIARIES
     avoir and être in the présent ({fr, phon} for each person), and `agreement`: what
     is added to the participle for each person when the auxiliary is être.

   ----------------------------------------------------------------------------
   VALIDATION
     When the app loads it checks every entry. A bad entry is skipped (the others
     still load) and listed in a warning panel at the top of the Library.
     A syntax error (e.g. a missing comma or bracket) stops the whole file loading,
     and the app says so. Check commas carefully when editing.
   ============================================================================ */


const TENSES = {
  present: {
    name: "Présent",
    formation: "Regular verbs: stem + ending (for -er verbs: -e, -es, -e, -ons, -ez, -ent). Irregular verbs have their own forms, which you learn by heart.",
    use: "What happens now, what usually happens, and general truths: I speak, I am speaking. Also the near future with a time word (je pars demain).",
    keyForm: false
  },
  passe_compose: {
    name: "Passé composé",
    formation: "The présent of avoir (or of être for some verbs, such as aller and arriver) + the past participle (parlé, fini, vendu). With être, the participle agrees with the subject: add -e for feminine and -s for plural.",
    use: "A completed action in the past: I spoke, I have spoken. It is the main past tense of everyday speech."
  },
  imparfait: {
    name: "Imparfait",
    formation: "Take the nous form of the présent, drop -ons, and add -ais, -ais, -ait, -ions, -iez, -aient (nous parlons → je parlais). Only être is irregular (j'étais).",
    use: "The past as background, description or habit: I was speaking, I used to speak. It often sets the scene for an event in the passé composé."
  },
  futur: {
    name: "Futur simple",
    formation: "Future stem + -ai, -as, -a, -ons, -ez, -ont. The stem is the infinitive (parler-, finir-); -re verbs drop the final -e (vendr-). Irregular verbs have special stems (ser-, aur-, ir-) but the same endings.",
    use: "What will happen: I will speak. For something about to happen, French also uses aller + infinitive (je vais parler)."
  },
  conditionnel: {
    name: "Conditionnel présent",
    formation: "The futur stem + the imparfait endings -ais, -ais, -ait, -ions, -iez, -aient (je parlerais, je serais).",
    use: "What would happen: I would speak. Also for polite requests (je voudrais) and for the result of an \"if\" (si + imparfait)."
  }
};


const PRONOUNS = {
  //       label in tables   written      before a vowel   spoken     sounds-like       before a vowel   liaison
  je:   { label: "je",        fr: "je",        elided: "j'",    speak: "je",   phon: "zhuh",   phonElided: "zh" },
  tu:   { label: "tu",        fr: "tu",                         speak: "tu",   phon: "tew" },
  il:   { label: "il/elle/on", fr: "il/elle/on",              speak: "il",   phon: "eel/el/oh(n)" },
  nous: { label: "nous",      fr: "nous",                       speak: "nous", phon: "noo",                     liaison: "z" },
  vous: { label: "vous",      fr: "vous",                       speak: "vous", phon: "voo",                     liaison: "z" },
  ils:  { label: "ils/elles", fr: "ils/elles",                  speak: "ils",  phon: "eel/el",                  liaison: "z" }
};


const RULES = {
  // stemPhon for -er verbs: the stem as heard in "je parle": parler "parl", arriver "ah-reev"
  er: {
    name: "-er verbs",
    infinitiveEnding: "er",
    participle: { fr: "é", phon: "-ay" },
    futureStem: { drop: 0, phon: "-uh-r" },
    tenses: {
      present: { from: "stem", endings: {
        je:   { fr: "e",     phon: "" },
        tu:   { fr: "es",    phon: "" },
        il:   { fr: "e",     phon: "" },
        nous: { fr: "ons",   phon: "-oh(n)" },
        vous: { fr: "ez",    phon: "-ay" },
        ils:  { fr: "ent",   phon: "" }
      }},
      passe_compose: { from: "auxiliary" },
      imparfait: { from: "stem", endings: {
        je:   { fr: "ais",   phon: "-eh" },
        tu:   { fr: "ais",   phon: "-eh" },
        il:   { fr: "ait",   phon: "-eh" },
        nous: { fr: "ions",  phon: "-yoh(n)" },
        vous: { fr: "iez",   phon: "-yay" },
        ils:  { fr: "aient", phon: "-eh" }
      }},
      futur: { from: "future", endings: {
        je:   { fr: "ai",    phon: "ay" },
        tu:   { fr: "as",    phon: "ah" },
        il:   { fr: "a",     phon: "ah" },
        nous: { fr: "ons",   phon: "oh(n)" },
        vous: { fr: "ez",    phon: "ay" },
        ils:  { fr: "ont",   phon: "oh(n)" }
      }},
      conditionnel: { from: "future", endings: {
        je:   { fr: "ais",   phon: "eh" },
        tu:   { fr: "ais",   phon: "eh" },
        il:   { fr: "ait",   phon: "eh" },
        nous: { fr: "ions",  phon: "yoh(n)" },
        vous: { fr: "iez",   phon: "yay" },
        ils:  { fr: "aient", phon: "eh" }
      }}
    }
  },

  // -ger verbs keep an e before a and o (nous mangeons, je mangeais). stemPhon: the stem before g: manger "mah(n)"
  ger: {
    name: "-ger verbs",
    like: "er",
    infinitiveEnding: "ger",
    participle: { fr: "gé", phon: "-zhay" },
    futureStem: { drop: 0, phon: "-zhuh-r" },
    tenses: {
      present: { from: "stem", endings: {
        je:   { fr: "ge", phon: "zh" },
        tu:   { fr: "ges", phon: "zh" },
        il:   { fr: "ge", phon: "zh" },
        nous: { fr: "geons", phon: "-zhoh(n)" },
        vous: { fr: "gez", phon: "-zhay" },
        ils:  { fr: "gent", phon: "zh" }
      }},
      passe_compose: { from: "auxiliary" },
      imparfait: { from: "stem", endings: {
        je:   { fr: "geais", phon: "-zheh" },
        tu:   { fr: "geais", phon: "-zheh" },
        il:   { fr: "geait", phon: "-zheh" },
        nous: { fr: "gions", phon: "-zhyoh(n)" },
        vous: { fr: "giez", phon: "-zhyay" },
        ils:  { fr: "geaient", phon: "-zheh" }
      }},
      futur: { from: "future", endings: {
        je:   { fr: "ai", phon: "ay" },
        tu:   { fr: "as", phon: "ah" },
        il:   { fr: "a", phon: "ah" },
        nous: { fr: "ons", phon: "oh(n)" },
        vous: { fr: "ez", phon: "ay" },
        ils:  { fr: "ont", phon: "oh(n)" }
      }},
      conditionnel: { from: "future", endings: {
        je:   { fr: "ais", phon: "eh" },
        tu:   { fr: "ais", phon: "eh" },
        il:   { fr: "ait", phon: "eh" },
        nous: { fr: "ions", phon: "yoh(n)" },
        vous: { fr: "iez", phon: "yay" },
        ils:  { fr: "aient", phon: "eh" }
      }}
    }
  },

  // -cer verbs write ç before a and o (nous commençons, je commençais). stemPhon: the stem before c: commencer "koh-mah(n)"
  cer: {
    name: "-cer verbs",
    like: "er",
    infinitiveEnding: "cer",
    participle: { fr: "cé", phon: "-say" },
    futureStem: { drop: 0, phon: "-suh-r" },
    tenses: {
      present: { from: "stem", endings: {
        je:   { fr: "ce", phon: "s" },
        tu:   { fr: "ces", phon: "s" },
        il:   { fr: "ce", phon: "s" },
        nous: { fr: "çons", phon: "-soh(n)" },
        vous: { fr: "cez", phon: "-say" },
        ils:  { fr: "cent", phon: "s" }
      }},
      passe_compose: { from: "auxiliary" },
      imparfait: { from: "stem", endings: {
        je:   { fr: "çais", phon: "-seh" },
        tu:   { fr: "çais", phon: "-seh" },
        il:   { fr: "çait", phon: "-seh" },
        nous: { fr: "cions", phon: "-syoh(n)" },
        vous: { fr: "ciez", phon: "-syay" },
        ils:  { fr: "çaient", phon: "-seh" }
      }},
      futur: { from: "future", endings: {
        je:   { fr: "ai", phon: "ay" },
        tu:   { fr: "as", phon: "ah" },
        il:   { fr: "a", phon: "ah" },
        nous: { fr: "ons", phon: "oh(n)" },
        vous: { fr: "ez", phon: "ay" },
        ils:  { fr: "ont", phon: "oh(n)" }
      }},
      conditionnel: { from: "future", endings: {
        je:   { fr: "ais", phon: "eh" },
        tu:   { fr: "ais", phon: "eh" },
        il:   { fr: "ait", phon: "eh" },
        nous: { fr: "ions", phon: "yoh(n)" },
        vous: { fr: "iez", phon: "yay" },
        ils:  { fr: "aient", phon: "eh" }
      }}
    }
  },

  // stemPhon for -ir verbs: the stem with a hyphen before its last consonant: finir "fee-n"
  ir: {
    name: "-ir verbs",
    infinitiveEnding: "ir",
    participle: { fr: "i", phon: "ee" },
    futureStem: { drop: 0, phon: "ee-r" },
    tenses: {
      present: { from: "stem", endings: {
        je:   { fr: "is",       phon: "ee" },
        tu:   { fr: "is",       phon: "ee" },
        il:   { fr: "it",       phon: "ee" },
        nous: { fr: "issons",   phon: "ee-soh(n)" },
        vous: { fr: "issez",    phon: "ee-say" },
        ils:  { fr: "issent",   phon: "eess" }
      }},
      passe_compose: { from: "auxiliary" },
      imparfait: { from: "stem", endings: {
        je:   { fr: "issais",   phon: "ee-seh" },
        tu:   { fr: "issais",   phon: "ee-seh" },
        il:   { fr: "issait",   phon: "ee-seh" },
        nous: { fr: "issions",  phon: "ee-syoh(n)" },
        vous: { fr: "issiez",   phon: "ee-syay" },
        ils:  { fr: "issaient", phon: "ee-seh" }
      }},
      futur: { from: "future", endings: {
        je:   { fr: "ai",    phon: "ay" },
        tu:   { fr: "as",    phon: "ah" },
        il:   { fr: "a",     phon: "ah" },
        nous: { fr: "ons",   phon: "oh(n)" },
        vous: { fr: "ez",    phon: "ay" },
        ils:  { fr: "ont",   phon: "oh(n)" }
      }},
      conditionnel: { from: "future", endings: {
        je:   { fr: "ais",   phon: "eh" },
        tu:   { fr: "ais",   phon: "eh" },
        il:   { fr: "ait",   phon: "eh" },
        nous: { fr: "ions",  phon: "yoh(n)" },
        vous: { fr: "iez",   phon: "yay" },
        ils:  { fr: "aient", phon: "eh" }
      }}
    }
  },

  // stemPhon for -re verbs: the stem WITHOUT its final d, which is silent in je/tu/il:
  // vendre "vah(n)". The endings below put the d back where it is heard.
  re: {
    name: "-re verbs",
    infinitiveEnding: "re",
    participle: { fr: "u", phon: "-dew" },
    futureStem: { drop: 1, phon: "-dr" },
    tenses: {
      present: { from: "stem", endings: {
        je:   { fr: "s",     phon: "" },
        tu:   { fr: "s",     phon: "" },
        il:   { fr: "",      phon: "" },
        nous: { fr: "ons",   phon: "-doh(n)" },
        vous: { fr: "ez",    phon: "-day" },
        ils:  { fr: "ent",   phon: "-d" }
      }},
      passe_compose: { from: "auxiliary" },
      imparfait: { from: "stem", endings: {
        je:   { fr: "ais",   phon: "-deh" },
        tu:   { fr: "ais",   phon: "-deh" },
        il:   { fr: "ait",   phon: "-deh" },
        nous: { fr: "ions",  phon: "-dyoh(n)" },
        vous: { fr: "iez",   phon: "-dyay" },
        ils:  { fr: "aient", phon: "-deh" }
      }},
      futur: { from: "future", endings: {
        je:   { fr: "ai",    phon: "ay" },
        tu:   { fr: "as",    phon: "ah" },
        il:   { fr: "a",     phon: "ah" },
        nous: { fr: "ons",   phon: "oh(n)" },
        vous: { fr: "ez",    phon: "ay" },
        ils:  { fr: "ont",   phon: "oh(n)" }
      }},
      conditionnel: { from: "future", endings: {
        je:   { fr: "ais",   phon: "eh" },
        tu:   { fr: "ais",   phon: "eh" },
        il:   { fr: "ait",   phon: "eh" },
        nous: { fr: "ions",  phon: "ee-yoh(n)" },
        vous: { fr: "iez",   phon: "ee-yay" },
        ils:  { fr: "aient", phon: "eh" }
      }}
    }
  }
};


const AUXILIARIES = {
  "avoir": {
    je:   { fr: "ai",     phon: "ay" },
    tu:   { fr: "as",     phon: "ah" },
    il:   { fr: "a",      phon: "ah" },
    nous: { fr: "avons",  phon: "ah-voh(n)" },
    vous: { fr: "avez",   phon: "ah-vay" },
    ils:  { fr: "ont",    phon: "oh(n)" }
  },
  "être": {
    je:   { fr: "suis",   phon: "swee" },
    tu:   { fr: "es",     phon: "eh" },
    il:   { fr: "est",    phon: "eh" },
    nous: { fr: "sommes", phon: "sum" },
    vous: { fr: "êtes",   phon: "et" },
    ils:  { fr: "sont",   phon: "soh(n)" }
  },
  // added to the past participle when the auxiliary is être
  agreement: { je: "(e)", tu: "(e)", il: "(e)", nous: "(e)s", vous: "(e)(s)", ils: "(e)s" }
};


const VERBS = [

  /* ---------- IRREGULAR: batch 1 (I01–I10) ---------- */

  {
    id: "etre",
    rank: "I01",
    type: "irregular",
    group: "irregular",
    english: "to be",
    french: "être",
    phonetic: "eh-truh",
    conjugations: {
      present: {
        je:   { fr: "suis", phon: "swee", en: "I am" },
        tu:   { fr: "es", phon: "eh", en: "you are" },
        il:   { fr: "est", phon: "eh", en: "he/she/one is" },
        nous: { fr: "sommes", phon: "sum", en: "we are" },
        vous: { fr: "êtes", phon: "et", en: "you are" },
        ils:  { fr: "sont", phon: "soh(n)", en: "they are" }
      },
      passe_compose: {
        je:   { fr: "ai été", phon: "ay ay-tay", en: "I was / have been" },
        tu:   { fr: "as été", phon: "ah ay-tay", en: "you were / have been" },
        il:   { fr: "a été", phon: "ah ay-tay", en: "he/she/one was / has been" },
        nous: { fr: "avons été", phon: "ah-voh(n) ay-tay", en: "we were / have been" },
        vous: { fr: "avez été", phon: "ah-vay ay-tay", en: "you were / have been" },
        ils:  { fr: "ont été", phon: "oh(n) ay-tay", en: "they were / have been" }
      },
      imparfait: {
        je:   { fr: "étais", phon: "ay-teh", en: "I was / used to be" },
        tu:   { fr: "étais", phon: "ay-teh", en: "you were / used to be" },
        il:   { fr: "était", phon: "ay-teh", en: "he/she/one was / used to be" },
        nous: { fr: "étions", phon: "ay-tyoh(n)", en: "we were / used to be" },
        vous: { fr: "étiez", phon: "ay-tyay", en: "you were / used to be" },
        ils:  { fr: "étaient", phon: "ay-teh", en: "they were / used to be" }
      },
      futur: {
        je:   { fr: "serai", phon: "suh-ray", en: "I will be" },
        tu:   { fr: "seras", phon: "suh-rah", en: "you will be" },
        il:   { fr: "sera", phon: "suh-rah", en: "he/she/one will be" },
        nous: { fr: "serons", phon: "suh-roh(n)", en: "we will be" },
        vous: { fr: "serez", phon: "suh-ray", en: "you will be" },
        ils:  { fr: "seront", phon: "suh-roh(n)", en: "they will be" }
      },
      conditionnel: {
        je:   { fr: "serais", phon: "suh-reh", en: "I would be" },
        tu:   { fr: "serais", phon: "suh-reh", en: "you would be" },
        il:   { fr: "serait", phon: "suh-reh", en: "he/she/one would be" },
        nous: { fr: "serions", phon: "suh-ryoh(n)", en: "we would be" },
        vous: { fr: "seriez", phon: "suh-ryay", en: "you would be" },
        ils:  { fr: "seraient", phon: "suh-reh", en: "they would be" }
      }
    }
  },

  {
    id: "avoir",
    rank: "I02",
    type: "irregular",
    group: "irregular",
    english: "to have",
    french: "avoir",
    phonetic: "ah-vwahr",
    conjugations: {
      present: {
        je:   { fr: "ai", phon: "ay", en: "I have" },
        tu:   { fr: "as", phon: "ah", en: "you have" },
        il:   { fr: "a", phon: "ah", en: "he/she/one has" },
        nous: { fr: "avons", phon: "ah-voh(n)", en: "we have" },
        vous: { fr: "avez", phon: "ah-vay", en: "you have" },
        ils:  { fr: "ont", phon: "oh(n)", en: "they have" }
      },
      passe_compose: {
        je:   { fr: "ai eu", phon: "ay ew", en: "I had / have had" },
        tu:   { fr: "as eu", phon: "ah ew", en: "you had / have had" },
        il:   { fr: "a eu", phon: "ah ew", en: "he/she/one had / has had" },
        nous: { fr: "avons eu", phon: "ah-voh(n) ew", en: "we had / have had" },
        vous: { fr: "avez eu", phon: "ah-vay ew", en: "you had / have had" },
        ils:  { fr: "ont eu", phon: "oh(n) ew", en: "they had / have had" }
      },
      imparfait: {
        je:   { fr: "avais", phon: "ah-veh", en: "I had / used to have" },
        tu:   { fr: "avais", phon: "ah-veh", en: "you had / used to have" },
        il:   { fr: "avait", phon: "ah-veh", en: "he/she/one had / used to have" },
        nous: { fr: "avions", phon: "ah-vyoh(n)", en: "we had / used to have" },
        vous: { fr: "aviez", phon: "ah-vyay", en: "you had / used to have" },
        ils:  { fr: "avaient", phon: "ah-veh", en: "they had / used to have" }
      },
      futur: {
        je:   { fr: "aurai", phon: "oh-ray", en: "I will have" },
        tu:   { fr: "auras", phon: "oh-rah", en: "you will have" },
        il:   { fr: "aura", phon: "oh-rah", en: "he/she/one will have" },
        nous: { fr: "aurons", phon: "oh-roh(n)", en: "we will have" },
        vous: { fr: "aurez", phon: "oh-ray", en: "you will have" },
        ils:  { fr: "auront", phon: "oh-roh(n)", en: "they will have" }
      },
      conditionnel: {
        je:   { fr: "aurais", phon: "oh-reh", en: "I would have" },
        tu:   { fr: "aurais", phon: "oh-reh", en: "you would have" },
        il:   { fr: "aurait", phon: "oh-reh", en: "he/she/one would have" },
        nous: { fr: "aurions", phon: "oh-ryoh(n)", en: "we would have" },
        vous: { fr: "auriez", phon: "oh-ryay", en: "you would have" },
        ils:  { fr: "auraient", phon: "oh-reh", en: "they would have" }
      }
    }
  },

  {
    id: "faire",
    rank: "I03",
    type: "irregular",
    group: "irregular",
    english: "to do, make",
    french: "faire",
    phonetic: "fehr",
    conjugations: {
      present: {
        je:   { fr: "fais", phon: "feh", en: "I do / make" },
        tu:   { fr: "fais", phon: "feh", en: "you do / make" },
        il:   { fr: "fait", phon: "feh", en: "he/she/one does / makes" },
        nous: { fr: "faisons", phon: "fuh-zoh(n)", en: "we do / make" },
        vous: { fr: "faites", phon: "fet", en: "you do / make" },
        ils:  { fr: "font", phon: "foh(n)", en: "they do / make" }
      },
      passe_compose: {
        je:   { fr: "ai fait", phon: "ay feh", en: "I did / have done" },
        tu:   { fr: "as fait", phon: "ah feh", en: "you did / have done" },
        il:   { fr: "a fait", phon: "ah feh", en: "he/she/one did / has done" },
        nous: { fr: "avons fait", phon: "ah-voh(n) feh", en: "we did / have done" },
        vous: { fr: "avez fait", phon: "ah-vay feh", en: "you did / have done" },
        ils:  { fr: "ont fait", phon: "oh(n) feh", en: "they did / have done" }
      },
      imparfait: {
        je:   { fr: "faisais", phon: "fuh-zeh", en: "I was doing / used to do" },
        tu:   { fr: "faisais", phon: "fuh-zeh", en: "you were doing / used to do" },
        il:   { fr: "faisait", phon: "fuh-zeh", en: "he/she/one was doing / used to do" },
        nous: { fr: "faisions", phon: "fuh-zyoh(n)", en: "we were doing / used to do" },
        vous: { fr: "faisiez", phon: "fuh-zyay", en: "you were doing / used to do" },
        ils:  { fr: "faisaient", phon: "fuh-zeh", en: "they were doing / used to do" }
      },
      futur: {
        je:   { fr: "ferai", phon: "fuh-ray", en: "I will do" },
        tu:   { fr: "feras", phon: "fuh-rah", en: "you will do" },
        il:   { fr: "fera", phon: "fuh-rah", en: "he/she/one will do" },
        nous: { fr: "ferons", phon: "fuh-roh(n)", en: "we will do" },
        vous: { fr: "ferez", phon: "fuh-ray", en: "you will do" },
        ils:  { fr: "feront", phon: "fuh-roh(n)", en: "they will do" }
      },
      conditionnel: {
        je:   { fr: "ferais", phon: "fuh-reh", en: "I would do" },
        tu:   { fr: "ferais", phon: "fuh-reh", en: "you would do" },
        il:   { fr: "ferait", phon: "fuh-reh", en: "he/she/one would do" },
        nous: { fr: "ferions", phon: "fuh-ryoh(n)", en: "we would do" },
        vous: { fr: "feriez", phon: "fuh-ryay", en: "you would do" },
        ils:  { fr: "feraient", phon: "fuh-reh", en: "they would do" }
      }
    }
  },

  {
    id: "aller",
    rank: "I04",
    type: "irregular",
    group: "irregular",
    english: "to go",
    french: "aller",
    phonetic: "ah-lay",
    auxiliary: "être",
    conjugations: {
      present: {
        je:   { fr: "vais", phon: "veh", en: "I go / am going" },
        tu:   { fr: "vas", phon: "vah", en: "you go / are going" },
        il:   { fr: "va", phon: "vah", en: "he/she/one goes / is going" },
        nous: { fr: "allons", phon: "ah-loh(n)", en: "we go / are going" },
        vous: { fr: "allez", phon: "ah-lay", en: "you go / are going" },
        ils:  { fr: "vont", phon: "voh(n)", en: "they go / are going" }
      },
      passe_compose: {
        je:   { fr: "suis allé(e)", phon: "swee ah-lay", en: "I went / have gone" },
        tu:   { fr: "es allé(e)", phon: "eh ah-lay", en: "you went / have gone" },
        il:   { fr: "est allé(e)", phon: "eh ah-lay", en: "he/she/one went / has gone" },
        nous: { fr: "sommes allé(e)s", phon: "sum ah-lay", en: "we went / have gone" },
        vous: { fr: "êtes allé(e)(s)", phon: "et ah-lay", en: "you went / have gone" },
        ils:  { fr: "sont allé(e)s", phon: "soh(n) ah-lay", en: "they went / have gone" }
      },
      imparfait: {
        je:   { fr: "allais", phon: "ah-leh", en: "I was going / used to go" },
        tu:   { fr: "allais", phon: "ah-leh", en: "you were going / used to go" },
        il:   { fr: "allait", phon: "ah-leh", en: "he/she/one was going / used to go" },
        nous: { fr: "allions", phon: "ah-lyoh(n)", en: "we were going / used to go" },
        vous: { fr: "alliez", phon: "ah-lyay", en: "you were going / used to go" },
        ils:  { fr: "allaient", phon: "ah-leh", en: "they were going / used to go" }
      },
      futur: {
        je:   { fr: "irai", phon: "ee-ray", en: "I will go" },
        tu:   { fr: "iras", phon: "ee-rah", en: "you will go" },
        il:   { fr: "ira", phon: "ee-rah", en: "he/she/one will go" },
        nous: { fr: "irons", phon: "ee-roh(n)", en: "we will go" },
        vous: { fr: "irez", phon: "ee-ray", en: "you will go" },
        ils:  { fr: "iront", phon: "ee-roh(n)", en: "they will go" }
      },
      conditionnel: {
        je:   { fr: "irais", phon: "ee-reh", en: "I would go" },
        tu:   { fr: "irais", phon: "ee-reh", en: "you would go" },
        il:   { fr: "irait", phon: "ee-reh", en: "he/she/one would go" },
        nous: { fr: "irions", phon: "ee-ryoh(n)", en: "we would go" },
        vous: { fr: "iriez", phon: "ee-ryay", en: "you would go" },
        ils:  { fr: "iraient", phon: "ee-reh", en: "they would go" }
      }
    }
  },

  {
    id: "dire",
    rank: "I05",
    type: "irregular",
    group: "irregular",
    english: "to say, tell",
    french: "dire",
    phonetic: "deer",
    conjugations: {
      present: {
        je:   { fr: "dis", phon: "dee", en: "I say / tell" },
        tu:   { fr: "dis", phon: "dee", en: "you say / tell" },
        il:   { fr: "dit", phon: "dee", en: "he/she/one says / tells" },
        nous: { fr: "disons", phon: "dee-zoh(n)", en: "we say / tell" },
        vous: { fr: "dites", phon: "deet", en: "you say / tell" },
        ils:  { fr: "disent", phon: "deez", en: "they say / tell" }
      },
      passe_compose: {
        je:   { fr: "ai dit", phon: "ay dee", en: "I said / have said" },
        tu:   { fr: "as dit", phon: "ah dee", en: "you said / have said" },
        il:   { fr: "a dit", phon: "ah dee", en: "he/she/one said / has said" },
        nous: { fr: "avons dit", phon: "ah-voh(n) dee", en: "we said / have said" },
        vous: { fr: "avez dit", phon: "ah-vay dee", en: "you said / have said" },
        ils:  { fr: "ont dit", phon: "oh(n) dee", en: "they said / have said" }
      },
      imparfait: {
        je:   { fr: "disais", phon: "dee-zeh", en: "I was saying / used to say" },
        tu:   { fr: "disais", phon: "dee-zeh", en: "you were saying / used to say" },
        il:   { fr: "disait", phon: "dee-zeh", en: "he/she/one was saying / used to say" },
        nous: { fr: "disions", phon: "dee-zyoh(n)", en: "we were saying / used to say" },
        vous: { fr: "disiez", phon: "dee-zyay", en: "you were saying / used to say" },
        ils:  { fr: "disaient", phon: "dee-zeh", en: "they were saying / used to say" }
      },
      futur: {
        je:   { fr: "dirai", phon: "dee-ray", en: "I will say" },
        tu:   { fr: "diras", phon: "dee-rah", en: "you will say" },
        il:   { fr: "dira", phon: "dee-rah", en: "he/she/one will say" },
        nous: { fr: "dirons", phon: "dee-roh(n)", en: "we will say" },
        vous: { fr: "direz", phon: "dee-ray", en: "you will say" },
        ils:  { fr: "diront", phon: "dee-roh(n)", en: "they will say" }
      },
      conditionnel: {
        je:   { fr: "dirais", phon: "dee-reh", en: "I would say" },
        tu:   { fr: "dirais", phon: "dee-reh", en: "you would say" },
        il:   { fr: "dirait", phon: "dee-reh", en: "he/she/one would say" },
        nous: { fr: "dirions", phon: "dee-ryoh(n)", en: "we would say" },
        vous: { fr: "diriez", phon: "dee-ryay", en: "you would say" },
        ils:  { fr: "diraient", phon: "dee-reh", en: "they would say" }
      }
    }
  },

  {
    id: "prendre",
    rank: "I06",
    type: "irregular",
    group: "irregular",
    english: "to take; to have (food)",
    french: "prendre",
    phonetic: "prah(n)-druh",
    conjugations: {
      present: {
        je:   { fr: "prends", phon: "prah(n)", en: "I take" },
        tu:   { fr: "prends", phon: "prah(n)", en: "you take" },
        il:   { fr: "prend", phon: "prah(n)", en: "he/she/one takes" },
        nous: { fr: "prenons", phon: "pruh-noh(n)", en: "we take" },
        vous: { fr: "prenez", phon: "pruh-nay", en: "you take" },
        ils:  { fr: "prennent", phon: "pren", en: "they take" }
      },
      passe_compose: {
        je:   { fr: "ai pris", phon: "ay pree", en: "I took / have taken" },
        tu:   { fr: "as pris", phon: "ah pree", en: "you took / have taken" },
        il:   { fr: "a pris", phon: "ah pree", en: "he/she/one took / has taken" },
        nous: { fr: "avons pris", phon: "ah-voh(n) pree", en: "we took / have taken" },
        vous: { fr: "avez pris", phon: "ah-vay pree", en: "you took / have taken" },
        ils:  { fr: "ont pris", phon: "oh(n) pree", en: "they took / have taken" }
      },
      imparfait: {
        je:   { fr: "prenais", phon: "pruh-neh", en: "I was taking / used to take" },
        tu:   { fr: "prenais", phon: "pruh-neh", en: "you were taking / used to take" },
        il:   { fr: "prenait", phon: "pruh-neh", en: "he/she/one was taking / used to take" },
        nous: { fr: "prenions", phon: "pruh-nyoh(n)", en: "we were taking / used to take" },
        vous: { fr: "preniez", phon: "pruh-nyay", en: "you were taking / used to take" },
        ils:  { fr: "prenaient", phon: "pruh-neh", en: "they were taking / used to take" }
      },
      futur: {
        je:   { fr: "prendrai", phon: "prah(n)-dray", en: "I will take" },
        tu:   { fr: "prendras", phon: "prah(n)-drah", en: "you will take" },
        il:   { fr: "prendra", phon: "prah(n)-drah", en: "he/she/one will take" },
        nous: { fr: "prendrons", phon: "prah(n)-droh(n)", en: "we will take" },
        vous: { fr: "prendrez", phon: "prah(n)-dray", en: "you will take" },
        ils:  { fr: "prendront", phon: "prah(n)-droh(n)", en: "they will take" }
      },
      conditionnel: {
        je:   { fr: "prendrais", phon: "prah(n)-dreh", en: "I would take" },
        tu:   { fr: "prendrais", phon: "prah(n)-dreh", en: "you would take" },
        il:   { fr: "prendrait", phon: "prah(n)-dreh", en: "he/she/one would take" },
        nous: { fr: "prendrions", phon: "prah(n)-dree-yoh(n)", en: "we would take" },
        vous: { fr: "prendriez", phon: "prah(n)-dree-yay", en: "you would take" },
        ils:  { fr: "prendraient", phon: "prah(n)-dreh", en: "they would take" }
      }
    }
  },

  {
    id: "voir",
    rank: "I07",
    type: "irregular",
    group: "irregular",
    english: "to see",
    french: "voir",
    phonetic: "vwahr",
    conjugations: {
      present: {
        je:   { fr: "vois", phon: "vwah", en: "I see" },
        tu:   { fr: "vois", phon: "vwah", en: "you see" },
        il:   { fr: "voit", phon: "vwah", en: "he/she/one sees" },
        nous: { fr: "voyons", phon: "vwah-yoh(n)", en: "we see" },
        vous: { fr: "voyez", phon: "vwah-yay", en: "you see" },
        ils:  { fr: "voient", phon: "vwah", en: "they see" }
      },
      passe_compose: {
        je:   { fr: "ai vu", phon: "ay vew", en: "I saw / have seen" },
        tu:   { fr: "as vu", phon: "ah vew", en: "you saw / have seen" },
        il:   { fr: "a vu", phon: "ah vew", en: "he/she/one saw / has seen" },
        nous: { fr: "avons vu", phon: "ah-voh(n) vew", en: "we saw / have seen" },
        vous: { fr: "avez vu", phon: "ah-vay vew", en: "you saw / have seen" },
        ils:  { fr: "ont vu", phon: "oh(n) vew", en: "they saw / have seen" }
      },
      imparfait: {
        je:   { fr: "voyais", phon: "vwah-yeh", en: "I was seeing / used to see" },
        tu:   { fr: "voyais", phon: "vwah-yeh", en: "you were seeing / used to see" },
        il:   { fr: "voyait", phon: "vwah-yeh", en: "he/she/one was seeing / used to see" },
        nous: { fr: "voyions", phon: "vwah-yoh(n)", en: "we were seeing / used to see" },
        vous: { fr: "voyiez", phon: "vwah-yay", en: "you were seeing / used to see" },
        ils:  { fr: "voyaient", phon: "vwah-yeh", en: "they were seeing / used to see" }
      },
      futur: {
        je:   { fr: "verrai", phon: "veh-ray", en: "I will see" },
        tu:   { fr: "verras", phon: "veh-rah", en: "you will see" },
        il:   { fr: "verra", phon: "veh-rah", en: "he/she/one will see" },
        nous: { fr: "verrons", phon: "veh-roh(n)", en: "we will see" },
        vous: { fr: "verrez", phon: "veh-ray", en: "you will see" },
        ils:  { fr: "verront", phon: "veh-roh(n)", en: "they will see" }
      },
      conditionnel: {
        je:   { fr: "verrais", phon: "veh-reh", en: "I would see" },
        tu:   { fr: "verrais", phon: "veh-reh", en: "you would see" },
        il:   { fr: "verrait", phon: "veh-reh", en: "he/she/one would see" },
        nous: { fr: "verrions", phon: "veh-ryoh(n)", en: "we would see" },
        vous: { fr: "verriez", phon: "veh-ryay", en: "you would see" },
        ils:  { fr: "verraient", phon: "veh-reh", en: "they would see" }
      }
    }
  },

  {
    id: "savoir",
    rank: "I08",
    type: "irregular",
    group: "irregular",
    english: "to know",
    hint: "a fact, how to do something",
    french: "savoir",
    phonetic: "sah-vwahr",
    conjugations: {
      present: {
        je:   { fr: "sais", phon: "seh", en: "I know" },
        tu:   { fr: "sais", phon: "seh", en: "you know" },
        il:   { fr: "sait", phon: "seh", en: "he/she/one knows" },
        nous: { fr: "savons", phon: "sah-voh(n)", en: "we know" },
        vous: { fr: "savez", phon: "sah-vay", en: "you know" },
        ils:  { fr: "savent", phon: "sahv", en: "they know" }
      },
      passe_compose: {
        je:   { fr: "ai su", phon: "ay sew", en: "I knew / found out" },
        tu:   { fr: "as su", phon: "ah sew", en: "you knew / found out" },
        il:   { fr: "a su", phon: "ah sew", en: "he/she/one knew / found out" },
        nous: { fr: "avons su", phon: "ah-voh(n) sew", en: "we knew / found out" },
        vous: { fr: "avez su", phon: "ah-vay sew", en: "you knew / found out" },
        ils:  { fr: "ont su", phon: "oh(n) sew", en: "they knew / found out" }
      },
      imparfait: {
        je:   { fr: "savais", phon: "sah-veh", en: "I knew / used to know" },
        tu:   { fr: "savais", phon: "sah-veh", en: "you knew / used to know" },
        il:   { fr: "savait", phon: "sah-veh", en: "he/she/one knew / used to know" },
        nous: { fr: "savions", phon: "sah-vyoh(n)", en: "we knew / used to know" },
        vous: { fr: "saviez", phon: "sah-vyay", en: "you knew / used to know" },
        ils:  { fr: "savaient", phon: "sah-veh", en: "they knew / used to know" }
      },
      futur: {
        je:   { fr: "saurai", phon: "soh-ray", en: "I will know" },
        tu:   { fr: "sauras", phon: "soh-rah", en: "you will know" },
        il:   { fr: "saura", phon: "soh-rah", en: "he/she/one will know" },
        nous: { fr: "saurons", phon: "soh-roh(n)", en: "we will know" },
        vous: { fr: "saurez", phon: "soh-ray", en: "you will know" },
        ils:  { fr: "sauront", phon: "soh-roh(n)", en: "they will know" }
      },
      conditionnel: {
        je:   { fr: "saurais", phon: "soh-reh", en: "I would know" },
        tu:   { fr: "saurais", phon: "soh-reh", en: "you would know" },
        il:   { fr: "saurait", phon: "soh-reh", en: "he/she/one would know" },
        nous: { fr: "saurions", phon: "soh-ryoh(n)", en: "we would know" },
        vous: { fr: "sauriez", phon: "soh-ryay", en: "you would know" },
        ils:  { fr: "sauraient", phon: "soh-reh", en: "they would know" }
      }
    }
  },

  {
    id: "vouloir",
    rank: "I09",
    type: "irregular",
    group: "irregular",
    english: "to want",
    french: "vouloir",
    phonetic: "voo-lwahr",
    conjugations: {
      present: {
        je:   { fr: "veux", phon: "vuh", en: "I want" },
        tu:   { fr: "veux", phon: "vuh", en: "you want" },
        il:   { fr: "veut", phon: "vuh", en: "he/she/one wants" },
        nous: { fr: "voulons", phon: "voo-loh(n)", en: "we want" },
        vous: { fr: "voulez", phon: "voo-lay", en: "you want" },
        ils:  { fr: "veulent", phon: "vuhl", en: "they want" }
      },
      passe_compose: {
        je:   { fr: "ai voulu", phon: "ay voo-lew", en: "I wanted / have wanted" },
        tu:   { fr: "as voulu", phon: "ah voo-lew", en: "you wanted / have wanted" },
        il:   { fr: "a voulu", phon: "ah voo-lew", en: "he/she/one wanted / has wanted" },
        nous: { fr: "avons voulu", phon: "ah-voh(n) voo-lew", en: "we wanted / have wanted" },
        vous: { fr: "avez voulu", phon: "ah-vay voo-lew", en: "you wanted / have wanted" },
        ils:  { fr: "ont voulu", phon: "oh(n) voo-lew", en: "they wanted / have wanted" }
      },
      imparfait: {
        je:   { fr: "voulais", phon: "voo-leh", en: "I wanted / used to want" },
        tu:   { fr: "voulais", phon: "voo-leh", en: "you wanted / used to want" },
        il:   { fr: "voulait", phon: "voo-leh", en: "he/she/one wanted / used to want" },
        nous: { fr: "voulions", phon: "voo-lyoh(n)", en: "we wanted / used to want" },
        vous: { fr: "vouliez", phon: "voo-lyay", en: "you wanted / used to want" },
        ils:  { fr: "voulaient", phon: "voo-leh", en: "they wanted / used to want" }
      },
      futur: {
        je:   { fr: "voudrai", phon: "voo-dray", en: "I will want" },
        tu:   { fr: "voudras", phon: "voo-drah", en: "you will want" },
        il:   { fr: "voudra", phon: "voo-drah", en: "he/she/one will want" },
        nous: { fr: "voudrons", phon: "voo-droh(n)", en: "we will want" },
        vous: { fr: "voudrez", phon: "voo-dray", en: "you will want" },
        ils:  { fr: "voudront", phon: "voo-droh(n)", en: "they will want" }
      },
      conditionnel: {
        je:   { fr: "voudrais", phon: "voo-dreh", en: "I would like" },
        tu:   { fr: "voudrais", phon: "voo-dreh", en: "you would like" },
        il:   { fr: "voudrait", phon: "voo-dreh", en: "he/she/one would like" },
        nous: { fr: "voudrions", phon: "voo-dree-yoh(n)", en: "we would like" },
        vous: { fr: "voudriez", phon: "voo-dree-yay", en: "you would like" },
        ils:  { fr: "voudraient", phon: "voo-dreh", en: "they would like" }
      }
    }
  },

  {
    id: "venir",
    rank: "I10",
    type: "irregular",
    group: "irregular",
    english: "to come",
    french: "venir",
    phonetic: "vuh-neer",
    auxiliary: "être",
    conjugations: {
      present: {
        je:   { fr: "viens", phon: "vya(n)", en: "I come / am coming" },
        tu:   { fr: "viens", phon: "vya(n)", en: "you come / are coming" },
        il:   { fr: "vient", phon: "vya(n)", en: "he/she/one comes / is coming" },
        nous: { fr: "venons", phon: "vuh-noh(n)", en: "we come / are coming" },
        vous: { fr: "venez", phon: "vuh-nay", en: "you come / are coming" },
        ils:  { fr: "viennent", phon: "vyen", en: "they come / are coming" }
      },
      passe_compose: {
        je:   { fr: "suis venu(e)", phon: "swee vuh-new", en: "I came / have come" },
        tu:   { fr: "es venu(e)", phon: "eh vuh-new", en: "you came / have come" },
        il:   { fr: "est venu(e)", phon: "eh vuh-new", en: "he/she/one came / has come" },
        nous: { fr: "sommes venu(e)s", phon: "sum vuh-new", en: "we came / have come" },
        vous: { fr: "êtes venu(e)(s)", phon: "et vuh-new", en: "you came / have come" },
        ils:  { fr: "sont venu(e)s", phon: "soh(n) vuh-new", en: "they came / have come" }
      },
      imparfait: {
        je:   { fr: "venais", phon: "vuh-neh", en: "I was coming / used to come" },
        tu:   { fr: "venais", phon: "vuh-neh", en: "you were coming / used to come" },
        il:   { fr: "venait", phon: "vuh-neh", en: "he/she/one was coming / used to come" },
        nous: { fr: "venions", phon: "vuh-nyoh(n)", en: "we were coming / used to come" },
        vous: { fr: "veniez", phon: "vuh-nyay", en: "you were coming / used to come" },
        ils:  { fr: "venaient", phon: "vuh-neh", en: "they were coming / used to come" }
      },
      futur: {
        je:   { fr: "viendrai", phon: "vya(n)-dray", en: "I will come" },
        tu:   { fr: "viendras", phon: "vya(n)-drah", en: "you will come" },
        il:   { fr: "viendra", phon: "vya(n)-drah", en: "he/she/one will come" },
        nous: { fr: "viendrons", phon: "vya(n)-droh(n)", en: "we will come" },
        vous: { fr: "viendrez", phon: "vya(n)-dray", en: "you will come" },
        ils:  { fr: "viendront", phon: "vya(n)-droh(n)", en: "they will come" }
      },
      conditionnel: {
        je:   { fr: "viendrais", phon: "vya(n)-dreh", en: "I would come" },
        tu:   { fr: "viendrais", phon: "vya(n)-dreh", en: "you would come" },
        il:   { fr: "viendrait", phon: "vya(n)-dreh", en: "he/she/one would come" },
        nous: { fr: "viendrions", phon: "vya(n)-dree-yoh(n)", en: "we would come" },
        vous: { fr: "viendriez", phon: "vya(n)-dree-yay", en: "you would come" },
        ils:  { fr: "viendraient", phon: "vya(n)-dreh", en: "they would come" }
      }
    }
  },

  /* ---------- IRREGULAR: the rest of your list (French exactly as given; English and sounds-like generated) ---------- */

  {
    id: "s-en-aller",
    rank: "I37",
    type: "irregular",
    group: "irregular",
    english: "to go away, leave",
    french: "s'en aller",
    phonetic: "sah(n) nah-lay",
    auxiliary: "être",
    conjugations: {
      present: {
        je:   { fr: "m'en vais", phon: "mah(n) veh", en: "I go away" },
        tu:   { fr: "t'en vas", phon: "tah(n) vah", en: "you go away" },
        il:   { fr: "s'en va", phon: "sah(n) vah", en: "he/she/one goes away" },
        nous: { fr: "nous en allons", phon: "noo zah(n) nah-loh(n)", en: "we go away" },
        vous: { fr: "vous en allez", phon: "voo zah(n) nah-lay", en: "you go away" },
        ils:  { fr: "s'en vont", phon: "sah(n) voh(n)", en: "they go away" }
      },
      passe_compose: {
        je:   { fr: "m'en suis allé(e)", phon: "mah(n) swee ah-lay", en: "I went away / have gone away" },
        tu:   { fr: "t'en es allé(e)", phon: "tah(n) neh ah-lay", en: "you went away / have gone away" },
        il:   { fr: "s'en est allé(e)", phon: "sah(n) neh ah-lay", en: "he/she/one went away / has gone away" },
        nous: { fr: "nous en sommes allé(e)s", phon: "noo zah(n) sum ah-lay", en: "we went away / have gone away" },
        vous: { fr: "vous en êtes allé(e)(s)", phon: "voo zah(n) net ah-lay", en: "you went away / have gone away" },
        ils:  { fr: "s'en sont allé(e)s", phon: "sah(n) soh(n) ah-lay", en: "they went away / have gone away" }
      },
      imparfait: {
        je:   { fr: "m'en allais", phon: "mah(n) nah-leh", en: "I was going away / used to go away" },
        tu:   { fr: "t'en allais", phon: "tah(n) nah-leh", en: "you were going away / used to go away" },
        il:   { fr: "s'en allait", phon: "sah(n) nah-leh", en: "he/she/one was going away / used to go away" },
        nous: { fr: "nous en allions", phon: "noo zah(n) nah-lyoh(n)", en: "we were going away / used to go away" },
        vous: { fr: "vous en alliez", phon: "voo zah(n) nah-lyay", en: "you were going away / used to go away" },
        ils:  { fr: "s'en allaient", phon: "sah(n) nah-leh", en: "they were going away / used to go away" }
      },
      futur: {
        je:   { fr: "m'en irai", phon: "mah(n) nee-ray", en: "I will go away" },
        tu:   { fr: "t'en iras", phon: "tah(n) nee-rah", en: "you will go away" },
        il:   { fr: "s'en ira", phon: "sah(n) nee-rah", en: "he/she/one will go away" },
        nous: { fr: "nous en irons", phon: "noo zah(n) nee-roh(n)", en: "we will go away" },
        vous: { fr: "vous en irez", phon: "voo zah(n) nee-ray", en: "you will go away" },
        ils:  { fr: "s'en iront", phon: "sah(n) nee-roh(n)", en: "they will go away" }
      },
      conditionnel: {
        je:   { fr: "m'en irais", phon: "mah(n) nee-reh", en: "I would go away" },
        tu:   { fr: "t'en irais", phon: "tah(n) nee-reh", en: "you would go away" },
        il:   { fr: "s'en irait", phon: "sah(n) nee-reh", en: "he/she/one would go away" },
        nous: { fr: "nous en irions", phon: "noo zah(n) nee-ryoh(n)", en: "we would go away" },
        vous: { fr: "vous en iriez", phon: "voo zah(n) nee-ryay", en: "you would go away" },
        ils:  { fr: "s'en iraient", phon: "sah(n) nee-reh", en: "they would go away" }
      }
    }
  },

  {
    id: "tenir",
    rank: "I24",
    type: "irregular",
    group: "irregular",
    english: "to hold",
    french: "tenir",
    phonetic: "tuh-neer",
    conjugations: {
      present: {
        je:   { fr: "tiens", phon: "tya(n)", en: "I hold" },
        tu:   { fr: "tiens", phon: "tya(n)", en: "you hold" },
        il:   { fr: "tient", phon: "tya(n)", en: "he/she/one holds" },
        nous: { fr: "tenons", phon: "tuh-noh(n)", en: "we hold" },
        vous: { fr: "tenez", phon: "tuh-nay", en: "you hold" },
        ils:  { fr: "tiennent", phon: "tyen", en: "they hold" }
      },
      passe_compose: {
        je:   { fr: "ai tenu", phon: "ay tuh-new", en: "I held / have held" },
        tu:   { fr: "as tenu", phon: "ah tuh-new", en: "you held / have held" },
        il:   { fr: "a tenu", phon: "ah tuh-new", en: "he/she/one held / has held" },
        nous: { fr: "avons tenu", phon: "ah-voh(n) tuh-new", en: "we held / have held" },
        vous: { fr: "avez tenu", phon: "ah-vay tuh-new", en: "you held / have held" },
        ils:  { fr: "ont tenu", phon: "oh(n) tuh-new", en: "they held / have held" }
      },
      imparfait: {
        je:   { fr: "tenais", phon: "tuh-neh", en: "I was holding / used to hold" },
        tu:   { fr: "tenais", phon: "tuh-neh", en: "you were holding / used to hold" },
        il:   { fr: "tenait", phon: "tuh-neh", en: "he/she/one was holding / used to hold" },
        nous: { fr: "tenions", phon: "tuh-nyoh(n)", en: "we were holding / used to hold" },
        vous: { fr: "teniez", phon: "tuh-nyay", en: "you were holding / used to hold" },
        ils:  { fr: "tenaient", phon: "tuh-neh", en: "they were holding / used to hold" }
      },
      futur: {
        je:   { fr: "tiendrai", phon: "tya(n)-dray", en: "I will hold" },
        tu:   { fr: "tiendras", phon: "tya(n)-drah", en: "you will hold" },
        il:   { fr: "tiendra", phon: "tya(n)-drah", en: "he/she/one will hold" },
        nous: { fr: "tiendrons", phon: "tya(n)-droh(n)", en: "we will hold" },
        vous: { fr: "tiendrez", phon: "tya(n)-dray", en: "you will hold" },
        ils:  { fr: "tiendront", phon: "tya(n)-droh(n)", en: "they will hold" }
      },
      conditionnel: {
        je:   { fr: "tiendrais", phon: "tya(n)-dreh", en: "I would hold" },
        tu:   { fr: "tiendrais", phon: "tya(n)-dreh", en: "you would hold" },
        il:   { fr: "tiendrait", phon: "tya(n)-dreh", en: "he/she/one would hold" },
        nous: { fr: "tiendrions", phon: "tya(n)-dree-yoh(n)", en: "we would hold" },
        vous: { fr: "tiendriez", phon: "tya(n)-dree-yay", en: "you would hold" },
        ils:  { fr: "tiendraient", phon: "tya(n)-dreh", en: "they would hold" }
      }
    }
  },

  {
    id: "revenir",
    rank: "I25",
    type: "irregular",
    group: "irregular",
    english: "to come back",
    french: "revenir",
    phonetic: "ruh-vuh-neer",
    family: "like venir",
    auxiliary: "être",
    conjugations: {
      present: {
        je:   { fr: "reviens", phon: "ruh-vya(n)", en: "I come back" },
        tu:   { fr: "reviens", phon: "ruh-vya(n)", en: "you come back" },
        il:   { fr: "revient", phon: "ruh-vya(n)", en: "he/she/one comes back" },
        nous: { fr: "revenons", phon: "ruh-vuh-noh(n)", en: "we come back" },
        vous: { fr: "revenez", phon: "ruh-vuh-nay", en: "you come back" },
        ils:  { fr: "reviennent", phon: "ruh-vyen", en: "they come back" }
      },
      passe_compose: {
        je:   { fr: "suis revenu(e)", phon: "swee ruh-vuh-new", en: "I came back / have come back" },
        tu:   { fr: "es revenu(e)", phon: "eh ruh-vuh-new", en: "you came back / have come back" },
        il:   { fr: "est revenu(e)", phon: "eh ruh-vuh-new", en: "he/she/one came back / has come back" },
        nous: { fr: "sommes revenu(e)s", phon: "sum ruh-vuh-new", en: "we came back / have come back" },
        vous: { fr: "êtes revenu(e)(s)", phon: "et ruh-vuh-new", en: "you came back / have come back" },
        ils:  { fr: "sont revenu(e)s", phon: "soh(n) ruh-vuh-new", en: "they came back / have come back" }
      },
      imparfait: {
        je:   { fr: "revenais", phon: "ruh-vuh-neh", en: "I was coming back / used to come back" },
        tu:   { fr: "revenais", phon: "ruh-vuh-neh", en: "you were coming back / used to come back" },
        il:   { fr: "revenait", phon: "ruh-vuh-neh", en: "he/she/one was coming back / used to come back" },
        nous: { fr: "revenions", phon: "ruh-vuh-nyoh(n)", en: "we were coming back / used to come back" },
        vous: { fr: "reveniez", phon: "ruh-vuh-nyay", en: "you were coming back / used to come back" },
        ils:  { fr: "revenaient", phon: "ruh-vuh-neh", en: "they were coming back / used to come back" }
      },
      futur: {
        je:   { fr: "reviendrai", phon: "ruh-vya(n)-dray", en: "I will come back" },
        tu:   { fr: "reviendras", phon: "ruh-vya(n)-drah", en: "you will come back" },
        il:   { fr: "reviendra", phon: "ruh-vya(n)-drah", en: "he/she/one will come back" },
        nous: { fr: "reviendrons", phon: "ruh-vya(n)-droh(n)", en: "we will come back" },
        vous: { fr: "reviendrez", phon: "ruh-vya(n)-dray", en: "you will come back" },
        ils:  { fr: "reviendront", phon: "ruh-vya(n)-droh(n)", en: "they will come back" }
      },
      conditionnel: {
        je:   { fr: "reviendrais", phon: "ruh-vya(n)-dreh", en: "I would come back" },
        tu:   { fr: "reviendrais", phon: "ruh-vya(n)-dreh", en: "you would come back" },
        il:   { fr: "reviendrait", phon: "ruh-vya(n)-dreh", en: "he/she/one would come back" },
        nous: { fr: "reviendrions", phon: "ruh-vya(n)-dree-yoh(n)", en: "we would come back" },
        vous: { fr: "reviendriez", phon: "ruh-vya(n)-dree-yay", en: "you would come back" },
        ils:  { fr: "reviendraient", phon: "ruh-vya(n)-dreh", en: "they would come back" }
      }
    }
  },

  {
    id: "devenir",
    rank: "I26",
    type: "irregular",
    group: "irregular",
    english: "to become",
    french: "devenir",
    phonetic: "duh-vuh-neer",
    family: "like venir",
    auxiliary: "être",
    conjugations: {
      present: {
        je:   { fr: "deviens", phon: "duh-vya(n)", en: "I become" },
        tu:   { fr: "deviens", phon: "duh-vya(n)", en: "you become" },
        il:   { fr: "devient", phon: "duh-vya(n)", en: "he/she/one becomes" },
        nous: { fr: "devenons", phon: "duh-vuh-noh(n)", en: "we become" },
        vous: { fr: "devenez", phon: "duh-vuh-nay", en: "you become" },
        ils:  { fr: "deviennent", phon: "duh-vyen", en: "they become" }
      },
      passe_compose: {
        je:   { fr: "suis devenu(e)", phon: "swee duh-vuh-new", en: "I became / have become" },
        tu:   { fr: "es devenu(e)", phon: "eh duh-vuh-new", en: "you became / have become" },
        il:   { fr: "est devenu(e)", phon: "eh duh-vuh-new", en: "he/she/one became / has become" },
        nous: { fr: "sommes devenu(e)s", phon: "sum duh-vuh-new", en: "we became / have become" },
        vous: { fr: "êtes devenu(e)(s)", phon: "et duh-vuh-new", en: "you became / have become" },
        ils:  { fr: "sont devenu(e)s", phon: "soh(n) duh-vuh-new", en: "they became / have become" }
      },
      imparfait: {
        je:   { fr: "devenais", phon: "duh-vuh-neh", en: "I was becoming / used to become" },
        tu:   { fr: "devenais", phon: "duh-vuh-neh", en: "you were becoming / used to become" },
        il:   { fr: "devenait", phon: "duh-vuh-neh", en: "he/she/one was becoming / used to become" },
        nous: { fr: "devenions", phon: "duh-vuh-nyoh(n)", en: "we were becoming / used to become" },
        vous: { fr: "deveniez", phon: "duh-vuh-nyay", en: "you were becoming / used to become" },
        ils:  { fr: "devenaient", phon: "duh-vuh-neh", en: "they were becoming / used to become" }
      },
      futur: {
        je:   { fr: "deviendrai", phon: "duh-vya(n)-dray", en: "I will become" },
        tu:   { fr: "deviendras", phon: "duh-vya(n)-drah", en: "you will become" },
        il:   { fr: "deviendra", phon: "duh-vya(n)-drah", en: "he/she/one will become" },
        nous: { fr: "deviendrons", phon: "duh-vya(n)-droh(n)", en: "we will become" },
        vous: { fr: "deviendrez", phon: "duh-vya(n)-dray", en: "you will become" },
        ils:  { fr: "deviendront", phon: "duh-vya(n)-droh(n)", en: "they will become" }
      },
      conditionnel: {
        je:   { fr: "deviendrais", phon: "duh-vya(n)-dreh", en: "I would become" },
        tu:   { fr: "deviendrais", phon: "duh-vya(n)-dreh", en: "you would become" },
        il:   { fr: "deviendrait", phon: "duh-vya(n)-dreh", en: "he/she/one would become" },
        nous: { fr: "deviendrions", phon: "duh-vya(n)-dree-yoh(n)", en: "we would become" },
        vous: { fr: "deviendriez", phon: "duh-vya(n)-dree-yay", en: "you would become" },
        ils:  { fr: "deviendraient", phon: "duh-vya(n)-dreh", en: "they would become" }
      }
    }
  },

  {
    id: "obtenir",
    rank: "I44",
    type: "irregular",
    group: "irregular",
    english: "to obtain, get",
    french: "obtenir",
    phonetic: "ob-tuh-neer",
    family: "like tenir",
    conjugations: {
      present: {
        je:   { fr: "obtiens", phon: "ob-tya(n)", en: "I obtain" },
        tu:   { fr: "obtiens", phon: "ob-tya(n)", en: "you obtain" },
        il:   { fr: "obtient", phon: "ob-tya(n)", en: "he/she/one obtains" },
        nous: { fr: "obtenons", phon: "ob-tuh-noh(n)", en: "we obtain" },
        vous: { fr: "obtenez", phon: "ob-tuh-nay", en: "you obtain" },
        ils:  { fr: "obtiennent", phon: "ob-tyen", en: "they obtain" }
      },
      passe_compose: {
        je:   { fr: "ai obtenu", phon: "ay ob-tuh-new", en: "I obtained / have obtained" },
        tu:   { fr: "as obtenu", phon: "ah ob-tuh-new", en: "you obtained / have obtained" },
        il:   { fr: "a obtenu", phon: "ah ob-tuh-new", en: "he/she/one obtained / has obtained" },
        nous: { fr: "avons obtenu", phon: "ah-voh(n) ob-tuh-new", en: "we obtained / have obtained" },
        vous: { fr: "avez obtenu", phon: "ah-vay ob-tuh-new", en: "you obtained / have obtained" },
        ils:  { fr: "ont obtenu", phon: "oh(n) ob-tuh-new", en: "they obtained / have obtained" }
      },
      imparfait: {
        je:   { fr: "obtenais", phon: "ob-tuh-neh", en: "I was obtaining / used to obtain" },
        tu:   { fr: "obtenais", phon: "ob-tuh-neh", en: "you were obtaining / used to obtain" },
        il:   { fr: "obtenait", phon: "ob-tuh-neh", en: "he/she/one was obtaining / used to obtain" },
        nous: { fr: "obtenions", phon: "ob-tuh-nyoh(n)", en: "we were obtaining / used to obtain" },
        vous: { fr: "obteniez", phon: "ob-tuh-nyay", en: "you were obtaining / used to obtain" },
        ils:  { fr: "obtenaient", phon: "ob-tuh-neh", en: "they were obtaining / used to obtain" }
      },
      futur: {
        je:   { fr: "obtiendrai", phon: "ob-tya(n)-dray", en: "I will obtain" },
        tu:   { fr: "obtiendras", phon: "ob-tya(n)-drah", en: "you will obtain" },
        il:   { fr: "obtiendra", phon: "ob-tya(n)-drah", en: "he/she/one will obtain" },
        nous: { fr: "obtiendrons", phon: "ob-tya(n)-droh(n)", en: "we will obtain" },
        vous: { fr: "obtiendrez", phon: "ob-tya(n)-dray", en: "you will obtain" },
        ils:  { fr: "obtiendront", phon: "ob-tya(n)-droh(n)", en: "they will obtain" }
      },
      conditionnel: {
        je:   { fr: "obtiendrais", phon: "ob-tya(n)-dreh", en: "I would obtain" },
        tu:   { fr: "obtiendrais", phon: "ob-tya(n)-dreh", en: "you would obtain" },
        il:   { fr: "obtiendrait", phon: "ob-tya(n)-dreh", en: "he/she/one would obtain" },
        nous: { fr: "obtiendrions", phon: "ob-tya(n)-dree-yoh(n)", en: "we would obtain" },
        vous: { fr: "obtiendriez", phon: "ob-tya(n)-dree-yay", en: "you would obtain" },
        ils:  { fr: "obtiendraient", phon: "ob-tya(n)-dreh", en: "they would obtain" }
      }
    }
  },

  {
    id: "retenir",
    rank: "I45",
    type: "irregular",
    group: "irregular",
    english: "to hold back; to remember",
    french: "retenir",
    phonetic: "ruh-tuh-neer",
    family: "like tenir",
    conjugations: {
      present: {
        je:   { fr: "retiens", phon: "ruh-tya(n)", en: "I hold back" },
        tu:   { fr: "retiens", phon: "ruh-tya(n)", en: "you hold back" },
        il:   { fr: "retient", phon: "ruh-tya(n)", en: "he/she/one holds back" },
        nous: { fr: "retenons", phon: "ruh-tuh-noh(n)", en: "we hold back" },
        vous: { fr: "retenez", phon: "ruh-tuh-nay", en: "you hold back" },
        ils:  { fr: "retiennent", phon: "ruh-tyen", en: "they hold back" }
      },
      passe_compose: {
        je:   { fr: "ai retenu", phon: "ay ruh-tuh-new", en: "I held back / have held back" },
        tu:   { fr: "as retenu", phon: "ah ruh-tuh-new", en: "you held back / have held back" },
        il:   { fr: "a retenu", phon: "ah ruh-tuh-new", en: "he/she/one held back / has held back" },
        nous: { fr: "avons retenu", phon: "ah-voh(n) ruh-tuh-new", en: "we held back / have held back" },
        vous: { fr: "avez retenu", phon: "ah-vay ruh-tuh-new", en: "you held back / have held back" },
        ils:  { fr: "ont retenu", phon: "oh(n) ruh-tuh-new", en: "they held back / have held back" }
      },
      imparfait: {
        je:   { fr: "retenais", phon: "ruh-tuh-neh", en: "I was holding back / used to hold back" },
        tu:   { fr: "retenais", phon: "ruh-tuh-neh", en: "you were holding back / used to hold back" },
        il:   { fr: "retenait", phon: "ruh-tuh-neh", en: "he/she/one was holding back / used to hold back" },
        nous: { fr: "retenions", phon: "ruh-tuh-nyoh(n)", en: "we were holding back / used to hold back" },
        vous: { fr: "reteniez", phon: "ruh-tuh-nyay", en: "you were holding back / used to hold back" },
        ils:  { fr: "retenaient", phon: "ruh-tuh-neh", en: "they were holding back / used to hold back" }
      },
      futur: {
        je:   { fr: "retiendrai", phon: "ruh-tya(n)-dray", en: "I will hold back" },
        tu:   { fr: "retiendras", phon: "ruh-tya(n)-drah", en: "you will hold back" },
        il:   { fr: "retiendra", phon: "ruh-tya(n)-drah", en: "he/she/one will hold back" },
        nous: { fr: "retiendrons", phon: "ruh-tya(n)-droh(n)", en: "we will hold back" },
        vous: { fr: "retiendrez", phon: "ruh-tya(n)-dray", en: "you will hold back" },
        ils:  { fr: "retiendront", phon: "ruh-tya(n)-droh(n)", en: "they will hold back" }
      },
      conditionnel: {
        je:   { fr: "retiendrais", phon: "ruh-tya(n)-dreh", en: "I would hold back" },
        tu:   { fr: "retiendrais", phon: "ruh-tya(n)-dreh", en: "you would hold back" },
        il:   { fr: "retiendrait", phon: "ruh-tya(n)-dreh", en: "he/she/one would hold back" },
        nous: { fr: "retiendrions", phon: "ruh-tya(n)-dree-yoh(n)", en: "we would hold back" },
        vous: { fr: "retiendriez", phon: "ruh-tya(n)-dree-yay", en: "you would hold back" },
        ils:  { fr: "retiendraient", phon: "ruh-tya(n)-dreh", en: "they would hold back" }
      }
    }
  },

  {
    id: "prevenir",
    rank: "I46",
    type: "irregular",
    group: "irregular",
    english: "to warn, let know",
    french: "prévenir",
    phonetic: "pray-vuh-neer",
    family: "like venir",
    conjugations: {
      present: {
        je:   { fr: "préviens", phon: "pray-vya(n)", en: "I warn" },
        tu:   { fr: "préviens", phon: "pray-vya(n)", en: "you warn" },
        il:   { fr: "prévient", phon: "pray-vya(n)", en: "he/she/one warns" },
        nous: { fr: "prévenons", phon: "pray-vuh-noh(n)", en: "we warn" },
        vous: { fr: "prévenez", phon: "pray-vuh-nay", en: "you warn" },
        ils:  { fr: "préviennent", phon: "pray-vyen", en: "they warn" }
      },
      passe_compose: {
        je:   { fr: "ai prévenu", phon: "ay pray-vuh-new", en: "I warned / have warned" },
        tu:   { fr: "as prévenu", phon: "ah pray-vuh-new", en: "you warned / have warned" },
        il:   { fr: "a prévenu", phon: "ah pray-vuh-new", en: "he/she/one warned / has warned" },
        nous: { fr: "avons prévenu", phon: "ah-voh(n) pray-vuh-new", en: "we warned / have warned" },
        vous: { fr: "avez prévenu", phon: "ah-vay pray-vuh-new", en: "you warned / have warned" },
        ils:  { fr: "ont prévenu", phon: "oh(n) pray-vuh-new", en: "they warned / have warned" }
      },
      imparfait: {
        je:   { fr: "prévenais", phon: "pray-vuh-neh", en: "I was warning / used to warn" },
        tu:   { fr: "prévenais", phon: "pray-vuh-neh", en: "you were warning / used to warn" },
        il:   { fr: "prévenait", phon: "pray-vuh-neh", en: "he/she/one was warning / used to warn" },
        nous: { fr: "prévenions", phon: "pray-vuh-nyoh(n)", en: "we were warning / used to warn" },
        vous: { fr: "préveniez", phon: "pray-vuh-nyay", en: "you were warning / used to warn" },
        ils:  { fr: "prévenaient", phon: "pray-vuh-neh", en: "they were warning / used to warn" }
      },
      futur: {
        je:   { fr: "préviendrai", phon: "pray-vya(n)-dray", en: "I will warn" },
        tu:   { fr: "préviendras", phon: "pray-vya(n)-drah", en: "you will warn" },
        il:   { fr: "préviendra", phon: "pray-vya(n)-drah", en: "he/she/one will warn" },
        nous: { fr: "préviendrons", phon: "pray-vya(n)-droh(n)", en: "we will warn" },
        vous: { fr: "préviendrez", phon: "pray-vya(n)-dray", en: "you will warn" },
        ils:  { fr: "préviendront", phon: "pray-vya(n)-droh(n)", en: "they will warn" }
      },
      conditionnel: {
        je:   { fr: "préviendrais", phon: "pray-vya(n)-dreh", en: "I would warn" },
        tu:   { fr: "préviendrais", phon: "pray-vya(n)-dreh", en: "you would warn" },
        il:   { fr: "préviendrait", phon: "pray-vya(n)-dreh", en: "he/she/one would warn" },
        nous: { fr: "préviendrions", phon: "pray-vya(n)-dree-yoh(n)", en: "we would warn" },
        vous: { fr: "préviendriez", phon: "pray-vya(n)-dree-yay", en: "you would warn" },
        ils:  { fr: "préviendraient", phon: "pray-vya(n)-dreh", en: "they would warn" }
      }
    }
  },

  {
    id: "appartenir",
    rank: "I79",
    type: "irregular",
    group: "irregular",
    english: "to belong to",
    french: "appartenir à",
    phonetic: "ah-par-tuh-neer ah",
    expressions: [
      { fr: "ça m'appartient", phon: "sah mah-par-tya(n)", en: "it belongs to me" }
    ],
    family: "like tenir",
    conjugations: {
      present: {
        je:   { fr: "appartiens", phon: "ah-par-tya(n)", en: "I belong to" },
        tu:   { fr: "appartiens", phon: "ah-par-tya(n)", en: "you belong to" },
        il:   { fr: "appartient", phon: "ah-par-tya(n)", en: "he/she/one belongs to" },
        nous: { fr: "appartenons", phon: "ah-par-tuh-noh(n)", en: "we belong to" },
        vous: { fr: "appartenez", phon: "ah-par-tuh-nay", en: "you belong to" },
        ils:  { fr: "appartiennent", phon: "ah-par-tyen", en: "they belong to" }
      },
      passe_compose: {
        je:   { fr: "ai appartenu", phon: "ay ah-par-tuh-new", en: "I belonged to / have belonged to" },
        tu:   { fr: "as appartenu", phon: "ah ah-par-tuh-new", en: "you belonged to / have belonged to" },
        il:   { fr: "a appartenu", phon: "ah ah-par-tuh-new", en: "he/she/one belonged to / has belonged to" },
        nous: { fr: "avons appartenu", phon: "ah-voh(n) ah-par-tuh-new", en: "we belonged to / have belonged to" },
        vous: { fr: "avez appartenu", phon: "ah-vay ah-par-tuh-new", en: "you belonged to / have belonged to" },
        ils:  { fr: "ont appartenu", phon: "oh(n) ah-par-tuh-new", en: "they belonged to / have belonged to" }
      },
      imparfait: {
        je:   { fr: "appartenais", phon: "ah-par-tuh-neh", en: "I was belonging to / used to belong to" },
        tu:   { fr: "appartenais", phon: "ah-par-tuh-neh", en: "you were belonging to / used to belong to" },
        il:   { fr: "appartenait", phon: "ah-par-tuh-neh", en: "he/she/one was belonging to / used to belong to" },
        nous: { fr: "appartenions", phon: "ah-par-tuh-nyoh(n)", en: "we were belonging to / used to belong to" },
        vous: { fr: "apparteniez", phon: "ah-par-tuh-nyay", en: "you were belonging to / used to belong to" },
        ils:  { fr: "appartenaient", phon: "ah-par-tuh-neh", en: "they were belonging to / used to belong to" }
      },
      futur: {
        je:   { fr: "appartiendrai", phon: "ah-par-tya(n)-dray", en: "I will belong to" },
        tu:   { fr: "appartiendras", phon: "ah-par-tya(n)-drah", en: "you will belong to" },
        il:   { fr: "appartiendra", phon: "ah-par-tya(n)-drah", en: "he/she/one will belong to" },
        nous: { fr: "appartiendrons", phon: "ah-par-tya(n)-droh(n)", en: "we will belong to" },
        vous: { fr: "appartiendrez", phon: "ah-par-tya(n)-dray", en: "you will belong to" },
        ils:  { fr: "appartiendront", phon: "ah-par-tya(n)-droh(n)", en: "they will belong to" }
      },
      conditionnel: {
        je:   { fr: "appartiendrais", phon: "ah-par-tya(n)-dreh", en: "I would belong to" },
        tu:   { fr: "appartiendrais", phon: "ah-par-tya(n)-dreh", en: "you would belong to" },
        il:   { fr: "appartiendrait", phon: "ah-par-tya(n)-dreh", en: "he/she/one would belong to" },
        nous: { fr: "appartiendrions", phon: "ah-par-tya(n)-dree-yoh(n)", en: "we would belong to" },
        vous: { fr: "appartiendriez", phon: "ah-par-tya(n)-dree-yay", en: "you would belong to" },
        ils:  { fr: "appartiendraient", phon: "ah-par-tya(n)-dreh", en: "they would belong to" }
      }
    }
  },

  {
    id: "se-souvenir",
    rank: "I32",
    type: "irregular",
    group: "irregular",
    english: "to remember",
    french: "se souvenir de",
    phonetic: "suh soo-vuh-neer duh",
    family: "like venir",
    auxiliary: "être",
    conjugations: {
      present: {
        je:   { fr: "me souviens", phon: "muh soo-vya(n)", en: "I remember" },
        tu:   { fr: "te souviens", phon: "tuh soo-vya(n)", en: "you remember" },
        il:   { fr: "se souvient", phon: "suh soo-vya(n)", en: "he/she/one remembers" },
        nous: { fr: "nous souvenons", phon: "noo soo-vuh-noh(n)", en: "we remember" },
        vous: { fr: "vous souvenez", phon: "voo soo-vuh-nay", en: "you remember" },
        ils:  { fr: "se souviennent", phon: "suh soo-vyen", en: "they remember" }
      },
      passe_compose: {
        je:   { fr: "me suis souvenu(e)", phon: "muh swee soo-vuh-new", en: "I remembered / have remembered" },
        tu:   { fr: "t'es souvenu(e)", phon: "teh soo-vuh-new", en: "you remembered / have remembered" },
        il:   { fr: "s'est souvenu(e)", phon: "seh soo-vuh-new", en: "he/she/one remembered / has remembered" },
        nous: { fr: "nous sommes souvenu(e)s", phon: "noo sum soo-vuh-new", en: "we remembered / have remembered" },
        vous: { fr: "vous êtes souvenu(e)(s)", phon: "voo zet soo-vuh-new", en: "you remembered / have remembered" },
        ils:  { fr: "se sont souvenu(e)s", phon: "suh soh(n) soo-vuh-new", en: "they remembered / have remembered" }
      },
      imparfait: {
        je:   { fr: "me souvenais", phon: "muh soo-vuh-neh", en: "I was remembering / used to remember" },
        tu:   { fr: "te souvenais", phon: "tuh soo-vuh-neh", en: "you were remembering / used to remember" },
        il:   { fr: "se souvenait", phon: "suh soo-vuh-neh", en: "he/she/one was remembering / used to remember" },
        nous: { fr: "nous souvenions", phon: "noo soo-vuh-nyoh(n)", en: "we were remembering / used to remember" },
        vous: { fr: "vous souveniez", phon: "voo soo-vuh-nyay", en: "you were remembering / used to remember" },
        ils:  { fr: "se souvenaient", phon: "suh soo-vuh-neh", en: "they were remembering / used to remember" }
      },
      futur: {
        je:   { fr: "me souviendrai", phon: "muh soo-vya(n)-dray", en: "I will remember" },
        tu:   { fr: "te souviendras", phon: "tuh soo-vya(n)-drah", en: "you will remember" },
        il:   { fr: "se souviendra", phon: "suh soo-vya(n)-drah", en: "he/she/one will remember" },
        nous: { fr: "nous souviendrons", phon: "noo soo-vya(n)-droh(n)", en: "we will remember" },
        vous: { fr: "vous souviendrez", phon: "voo soo-vya(n)-dray", en: "you will remember" },
        ils:  { fr: "se souviendront", phon: "suh soo-vya(n)-droh(n)", en: "they will remember" }
      },
      conditionnel: {
        je:   { fr: "me souviendrais", phon: "muh soo-vya(n)-dreh", en: "I would remember" },
        tu:   { fr: "te souviendrais", phon: "tuh soo-vya(n)-dreh", en: "you would remember" },
        il:   { fr: "se souviendrait", phon: "suh soo-vya(n)-dreh", en: "he/she/one would remember" },
        nous: { fr: "nous souviendrions", phon: "noo soo-vya(n)-dree-yoh(n)", en: "we would remember" },
        vous: { fr: "vous souviendriez", phon: "voo soo-vya(n)-dree-yay", en: "you would remember" },
        ils:  { fr: "se souviendraient", phon: "suh soo-vya(n)-dreh", en: "they would remember" }
      }
    }
  },

  {
    id: "sortir",
    rank: "I19",
    type: "irregular",
    group: "irregular",
    english: "to go out; to take out",
    french: "sortir",
    phonetic: "sor-teer",
    family: "like partir",
    auxiliary: "être",
    conjugations: {
      present: {
        je:   { fr: "sors", phon: "sor", en: "I go out" },
        tu:   { fr: "sors", phon: "sor", en: "you go out" },
        il:   { fr: "sort", phon: "sor", en: "he/she/one goes out" },
        nous: { fr: "sortons", phon: "sor-toh(n)", en: "we go out" },
        vous: { fr: "sortez", phon: "sor-tay", en: "you go out" },
        ils:  { fr: "sortent", phon: "sort", en: "they go out" }
      },
      passe_compose: {
        je:   { fr: "suis sorti(e)", phon: "swee sor-tee", en: "I went out / have gone out" },
        tu:   { fr: "es sorti(e)", phon: "eh sor-tee", en: "you went out / have gone out" },
        il:   { fr: "est sorti(e)", phon: "eh sor-tee", en: "he/she/one went out / has gone out" },
        nous: { fr: "sommes sorti(e)s", phon: "sum sor-tee", en: "we went out / have gone out" },
        vous: { fr: "êtes sorti(e)(s)", phon: "et sor-tee", en: "you went out / have gone out" },
        ils:  { fr: "sont sorti(e)s", phon: "soh(n) sor-tee", en: "they went out / have gone out" }
      },
      imparfait: {
        je:   { fr: "sortais", phon: "sor-teh", en: "I was going out / used to go out" },
        tu:   { fr: "sortais", phon: "sor-teh", en: "you were going out / used to go out" },
        il:   { fr: "sortait", phon: "sor-teh", en: "he/she/one was going out / used to go out" },
        nous: { fr: "sortions", phon: "sor-tyoh(n)", en: "we were going out / used to go out" },
        vous: { fr: "sortiez", phon: "sor-tyay", en: "you were going out / used to go out" },
        ils:  { fr: "sortaient", phon: "sor-teh", en: "they were going out / used to go out" }
      },
      futur: {
        je:   { fr: "sortirai", phon: "sor-tee-ray", en: "I will go out" },
        tu:   { fr: "sortiras", phon: "sor-tee-rah", en: "you will go out" },
        il:   { fr: "sortira", phon: "sor-tee-rah", en: "he/she/one will go out" },
        nous: { fr: "sortirons", phon: "sor-tee-roh(n)", en: "we will go out" },
        vous: { fr: "sortirez", phon: "sor-tee-ray", en: "you will go out" },
        ils:  { fr: "sortiront", phon: "sor-tee-roh(n)", en: "they will go out" }
      },
      conditionnel: {
        je:   { fr: "sortirais", phon: "sor-tee-reh", en: "I would go out" },
        tu:   { fr: "sortirais", phon: "sor-tee-reh", en: "you would go out" },
        il:   { fr: "sortirait", phon: "sor-tee-reh", en: "he/she/one would go out" },
        nous: { fr: "sortirions", phon: "sor-tee-ryoh(n)", en: "we would go out" },
        vous: { fr: "sortiriez", phon: "sor-tee-ryay", en: "you would go out" },
        ils:  { fr: "sortiraient", phon: "sor-tee-reh", en: "they would go out" }
      }
    }
  },

  {
    id: "partir",
    rank: "I20",
    type: "irregular",
    group: "irregular",
    english: "to leave",
    hint: "go away, set off",
    french: "partir",
    phonetic: "par-teer",
    auxiliary: "être",
    conjugations: {
      present: {
        je:   { fr: "pars", phon: "par", en: "I leave" },
        tu:   { fr: "pars", phon: "par", en: "you leave" },
        il:   { fr: "part", phon: "par", en: "he/she/one leaves" },
        nous: { fr: "partons", phon: "par-toh(n)", en: "we leave" },
        vous: { fr: "partez", phon: "par-tay", en: "you leave" },
        ils:  { fr: "partent", phon: "part", en: "they leave" }
      },
      passe_compose: {
        je:   { fr: "suis parti(e)", phon: "swee par-tee", en: "I left / have left" },
        tu:   { fr: "es parti(e)", phon: "eh par-tee", en: "you left / have left" },
        il:   { fr: "est parti(e)", phon: "eh par-tee", en: "he/she/one left / has left" },
        nous: { fr: "sommes parti(e)s", phon: "sum par-tee", en: "we left / have left" },
        vous: { fr: "êtes parti(e)(s)", phon: "et par-tee", en: "you left / have left" },
        ils:  { fr: "sont parti(e)s", phon: "soh(n) par-tee", en: "they left / have left" }
      },
      imparfait: {
        je:   { fr: "partais", phon: "par-teh", en: "I was leaving / used to leave" },
        tu:   { fr: "partais", phon: "par-teh", en: "you were leaving / used to leave" },
        il:   { fr: "partait", phon: "par-teh", en: "he/she/one was leaving / used to leave" },
        nous: { fr: "partions", phon: "par-tyoh(n)", en: "we were leaving / used to leave" },
        vous: { fr: "partiez", phon: "par-tyay", en: "you were leaving / used to leave" },
        ils:  { fr: "partaient", phon: "par-teh", en: "they were leaving / used to leave" }
      },
      futur: {
        je:   { fr: "partirai", phon: "par-tee-ray", en: "I will leave" },
        tu:   { fr: "partiras", phon: "par-tee-rah", en: "you will leave" },
        il:   { fr: "partira", phon: "par-tee-rah", en: "he/she/one will leave" },
        nous: { fr: "partirons", phon: "par-tee-roh(n)", en: "we will leave" },
        vous: { fr: "partirez", phon: "par-tee-ray", en: "you will leave" },
        ils:  { fr: "partiront", phon: "par-tee-roh(n)", en: "they will leave" }
      },
      conditionnel: {
        je:   { fr: "partirais", phon: "par-tee-reh", en: "I would leave" },
        tu:   { fr: "partirais", phon: "par-tee-reh", en: "you would leave" },
        il:   { fr: "partirait", phon: "par-tee-reh", en: "he/she/one would leave" },
        nous: { fr: "partirions", phon: "par-tee-ryoh(n)", en: "we would leave" },
        vous: { fr: "partiriez", phon: "par-tee-ryay", en: "you would leave" },
        ils:  { fr: "partiraient", phon: "par-tee-reh", en: "they would leave" }
      }
    }
  },

  {
    id: "sentir",
    rank: "I30",
    type: "irregular",
    group: "irregular",
    english: "to smell; to feel (touch)",
    french: "sentir",
    phonetic: "sah(n)-teer",
    family: "like partir",
    conjugations: {
      present: {
        je:   { fr: "sens", phon: "sah(n)", en: "I smell" },
        tu:   { fr: "sens", phon: "sah(n)", en: "you smell" },
        il:   { fr: "sent", phon: "sah(n)", en: "he/she/one smells" },
        nous: { fr: "sentons", phon: "sah(n)-toh(n)", en: "we smell" },
        vous: { fr: "sentez", phon: "sah(n)-tay", en: "you smell" },
        ils:  { fr: "sentent", phon: "sah(n)t", en: "they smell" }
      },
      passe_compose: {
        je:   { fr: "ai senti", phon: "ay sah(n)-tee", en: "I smelled / have smelled" },
        tu:   { fr: "as senti", phon: "ah sah(n)-tee", en: "you smelled / have smelled" },
        il:   { fr: "a senti", phon: "ah sah(n)-tee", en: "he/she/one smelled / has smelled" },
        nous: { fr: "avons senti", phon: "ah-voh(n) sah(n)-tee", en: "we smelled / have smelled" },
        vous: { fr: "avez senti", phon: "ah-vay sah(n)-tee", en: "you smelled / have smelled" },
        ils:  { fr: "ont senti", phon: "oh(n) sah(n)-tee", en: "they smelled / have smelled" }
      },
      imparfait: {
        je:   { fr: "sentais", phon: "sah(n)-teh", en: "I was smelling / used to smell" },
        tu:   { fr: "sentais", phon: "sah(n)-teh", en: "you were smelling / used to smell" },
        il:   { fr: "sentait", phon: "sah(n)-teh", en: "he/she/one was smelling / used to smell" },
        nous: { fr: "sentions", phon: "sah(n)-tyoh(n)", en: "we were smelling / used to smell" },
        vous: { fr: "sentiez", phon: "sah(n)-tyay", en: "you were smelling / used to smell" },
        ils:  { fr: "sentaient", phon: "sah(n)-teh", en: "they were smelling / used to smell" }
      },
      futur: {
        je:   { fr: "sentirai", phon: "sah(n)-tee-ray", en: "I will smell" },
        tu:   { fr: "sentiras", phon: "sah(n)-tee-rah", en: "you will smell" },
        il:   { fr: "sentira", phon: "sah(n)-tee-rah", en: "he/she/one will smell" },
        nous: { fr: "sentirons", phon: "sah(n)-tee-roh(n)", en: "we will smell" },
        vous: { fr: "sentirez", phon: "sah(n)-tee-ray", en: "you will smell" },
        ils:  { fr: "sentiront", phon: "sah(n)-tee-roh(n)", en: "they will smell" }
      },
      conditionnel: {
        je:   { fr: "sentirais", phon: "sah(n)-tee-reh", en: "I would smell" },
        tu:   { fr: "sentirais", phon: "sah(n)-tee-reh", en: "you would smell" },
        il:   { fr: "sentirait", phon: "sah(n)-tee-reh", en: "he/she/one would smell" },
        nous: { fr: "sentirions", phon: "sah(n)-tee-ryoh(n)", en: "we would smell" },
        vous: { fr: "sentiriez", phon: "sah(n)-tee-ryay", en: "you would smell" },
        ils:  { fr: "sentiraient", phon: "sah(n)-tee-reh", en: "they would smell" }
      }
    }
  },

  {
    id: "servir",
    rank: "I86",
    type: "irregular",
    group: "irregular",
    english: "to serve",
    french: "servir",
    phonetic: "sehr-veer",
    family: "like partir",
    conjugations: {
      present: {
        je:   { fr: "sers", phon: "sehr", en: "I serve" },
        tu:   { fr: "sers", phon: "sehr", en: "you serve" },
        il:   { fr: "sert", phon: "sehr", en: "he/she/one serves" },
        nous: { fr: "servons", phon: "sehr-voh(n)", en: "we serve" },
        vous: { fr: "servez", phon: "sehr-vay", en: "you serve" },
        ils:  { fr: "servent", phon: "sehrv", en: "they serve" }
      },
      passe_compose: {
        je:   { fr: "ai servi", phon: "ay sehr-vee", en: "I served / have served" },
        tu:   { fr: "as servi", phon: "ah sehr-vee", en: "you served / have served" },
        il:   { fr: "a servi", phon: "ah sehr-vee", en: "he/she/one served / has served" },
        nous: { fr: "avons servi", phon: "ah-voh(n) sehr-vee", en: "we served / have served" },
        vous: { fr: "avez servi", phon: "ah-vay sehr-vee", en: "you served / have served" },
        ils:  { fr: "ont servi", phon: "oh(n) sehr-vee", en: "they served / have served" }
      },
      imparfait: {
        je:   { fr: "servais", phon: "sehr-veh", en: "I was serving / used to serve" },
        tu:   { fr: "servais", phon: "sehr-veh", en: "you were serving / used to serve" },
        il:   { fr: "servait", phon: "sehr-veh", en: "he/she/one was serving / used to serve" },
        nous: { fr: "servions", phon: "sehr-vyoh(n)", en: "we were serving / used to serve" },
        vous: { fr: "serviez", phon: "sehr-vyay", en: "you were serving / used to serve" },
        ils:  { fr: "servaient", phon: "sehr-veh", en: "they were serving / used to serve" }
      },
      futur: {
        je:   { fr: "servirai", phon: "sehr-vee-ray", en: "I will serve" },
        tu:   { fr: "serviras", phon: "sehr-vee-rah", en: "you will serve" },
        il:   { fr: "servira", phon: "sehr-vee-rah", en: "he/she/one will serve" },
        nous: { fr: "servirons", phon: "sehr-vee-roh(n)", en: "we will serve" },
        vous: { fr: "servirez", phon: "sehr-vee-ray", en: "you will serve" },
        ils:  { fr: "serviront", phon: "sehr-vee-roh(n)", en: "they will serve" }
      },
      conditionnel: {
        je:   { fr: "servirais", phon: "sehr-vee-reh", en: "I would serve" },
        tu:   { fr: "servirais", phon: "sehr-vee-reh", en: "you would serve" },
        il:   { fr: "servirait", phon: "sehr-vee-reh", en: "he/she/one would serve" },
        nous: { fr: "servirions", phon: "sehr-vee-ryoh(n)", en: "we would serve" },
        vous: { fr: "serviriez", phon: "sehr-vee-ryay", en: "you would serve" },
        ils:  { fr: "serviraient", phon: "sehr-vee-reh", en: "they would serve" }
      }
    }
  },

  {
    id: "dormir",
    rank: "I29",
    type: "irregular",
    group: "irregular",
    english: "to sleep",
    french: "dormir",
    phonetic: "dor-meer",
    family: "like partir",
    conjugations: {
      present: {
        je:   { fr: "dors", phon: "dor", en: "I sleep" },
        tu:   { fr: "dors", phon: "dor", en: "you sleep" },
        il:   { fr: "dort", phon: "dor", en: "he/she/one sleeps" },
        nous: { fr: "dormons", phon: "dor-moh(n)", en: "we sleep" },
        vous: { fr: "dormez", phon: "dor-may", en: "you sleep" },
        ils:  { fr: "dorment", phon: "dorm", en: "they sleep" }
      },
      passe_compose: {
        je:   { fr: "ai dormi", phon: "ay dor-mee", en: "I slept / have slept" },
        tu:   { fr: "as dormi", phon: "ah dor-mee", en: "you slept / have slept" },
        il:   { fr: "a dormi", phon: "ah dor-mee", en: "he/she/one slept / has slept" },
        nous: { fr: "avons dormi", phon: "ah-voh(n) dor-mee", en: "we slept / have slept" },
        vous: { fr: "avez dormi", phon: "ah-vay dor-mee", en: "you slept / have slept" },
        ils:  { fr: "ont dormi", phon: "oh(n) dor-mee", en: "they slept / have slept" }
      },
      imparfait: {
        je:   { fr: "dormais", phon: "dor-meh", en: "I was sleeping / used to sleep" },
        tu:   { fr: "dormais", phon: "dor-meh", en: "you were sleeping / used to sleep" },
        il:   { fr: "dormait", phon: "dor-meh", en: "he/she/one was sleeping / used to sleep" },
        nous: { fr: "dormions", phon: "dor-myoh(n)", en: "we were sleeping / used to sleep" },
        vous: { fr: "dormiez", phon: "dor-myay", en: "you were sleeping / used to sleep" },
        ils:  { fr: "dormaient", phon: "dor-meh", en: "they were sleeping / used to sleep" }
      },
      futur: {
        je:   { fr: "dormirai", phon: "dor-mee-ray", en: "I will sleep" },
        tu:   { fr: "dormiras", phon: "dor-mee-rah", en: "you will sleep" },
        il:   { fr: "dormira", phon: "dor-mee-rah", en: "he/she/one will sleep" },
        nous: { fr: "dormirons", phon: "dor-mee-roh(n)", en: "we will sleep" },
        vous: { fr: "dormirez", phon: "dor-mee-ray", en: "you will sleep" },
        ils:  { fr: "dormiront", phon: "dor-mee-roh(n)", en: "they will sleep" }
      },
      conditionnel: {
        je:   { fr: "dormirais", phon: "dor-mee-reh", en: "I would sleep" },
        tu:   { fr: "dormirais", phon: "dor-mee-reh", en: "you would sleep" },
        il:   { fr: "dormirait", phon: "dor-mee-reh", en: "he/she/one would sleep" },
        nous: { fr: "dormirions", phon: "dor-mee-ryoh(n)", en: "we would sleep" },
        vous: { fr: "dormiriez", phon: "dor-mee-ryay", en: "you would sleep" },
        ils:  { fr: "dormiraient", phon: "dor-mee-reh", en: "they would sleep" }
      }
    }
  },

  {
    id: "mentir",
    rank: "I77",
    type: "irregular",
    group: "irregular",
    english: "to lie",
    french: "mentir",
    phonetic: "mah(n)-teer",
    family: "like partir",
    conjugations: {
      present: {
        je:   { fr: "mens", phon: "mah(n)", en: "I lie" },
        tu:   { fr: "mens", phon: "mah(n)", en: "you lie" },
        il:   { fr: "ment", phon: "mah(n)", en: "he/she/one lies" },
        nous: { fr: "mentons", phon: "mah(n)-toh(n)", en: "we lie" },
        vous: { fr: "mentez", phon: "mah(n)-tay", en: "you lie" },
        ils:  { fr: "mentent", phon: "mah(n)t", en: "they lie" }
      },
      passe_compose: {
        je:   { fr: "ai menti", phon: "ay mah(n)-tee", en: "I lied / have lied" },
        tu:   { fr: "as menti", phon: "ah mah(n)-tee", en: "you lied / have lied" },
        il:   { fr: "a menti", phon: "ah mah(n)-tee", en: "he/she/one lied / has lied" },
        nous: { fr: "avons menti", phon: "ah-voh(n) mah(n)-tee", en: "we lied / have lied" },
        vous: { fr: "avez menti", phon: "ah-vay mah(n)-tee", en: "you lied / have lied" },
        ils:  { fr: "ont menti", phon: "oh(n) mah(n)-tee", en: "they lied / have lied" }
      },
      imparfait: {
        je:   { fr: "mentais", phon: "mah(n)-teh", en: "I was lying / used to lie" },
        tu:   { fr: "mentais", phon: "mah(n)-teh", en: "you were lying / used to lie" },
        il:   { fr: "mentait", phon: "mah(n)-teh", en: "he/she/one was lying / used to lie" },
        nous: { fr: "mentions", phon: "mah(n)-tyoh(n)", en: "we were lying / used to lie" },
        vous: { fr: "mentiez", phon: "mah(n)-tyay", en: "you were lying / used to lie" },
        ils:  { fr: "mentaient", phon: "mah(n)-teh", en: "they were lying / used to lie" }
      },
      futur: {
        je:   { fr: "mentirai", phon: "mah(n)-tee-ray", en: "I will lie" },
        tu:   { fr: "mentiras", phon: "mah(n)-tee-rah", en: "you will lie" },
        il:   { fr: "mentira", phon: "mah(n)-tee-rah", en: "he/she/one will lie" },
        nous: { fr: "mentirons", phon: "mah(n)-tee-roh(n)", en: "we will lie" },
        vous: { fr: "mentirez", phon: "mah(n)-tee-ray", en: "you will lie" },
        ils:  { fr: "mentiront", phon: "mah(n)-tee-roh(n)", en: "they will lie" }
      },
      conditionnel: {
        je:   { fr: "mentirais", phon: "mah(n)-tee-reh", en: "I would lie" },
        tu:   { fr: "mentirais", phon: "mah(n)-tee-reh", en: "you would lie" },
        il:   { fr: "mentirait", phon: "mah(n)-tee-reh", en: "he/she/one would lie" },
        nous: { fr: "mentirions", phon: "mah(n)-tee-ryoh(n)", en: "we would lie" },
        vous: { fr: "mentiriez", phon: "mah(n)-tee-ryay", en: "you would lie" },
        ils:  { fr: "mentiraient", phon: "mah(n)-tee-reh", en: "they would lie" }
      }
    }
  },

  {
    id: "se-sentir",
    rank: "I31",
    type: "irregular",
    group: "irregular",
    english: "to feel (well, tired…)",
    french: "se sentir",
    phonetic: "suh sah(n)-teer",
    family: "like partir",
    auxiliary: "être",
    conjugations: {
      present: {
        je:   { fr: "me sens", phon: "muh sah(n)", en: "I feel" },
        tu:   { fr: "te sens", phon: "tuh sah(n)", en: "you feel" },
        il:   { fr: "se sent", phon: "suh sah(n)", en: "he/she/one feels" },
        nous: { fr: "nous sentons", phon: "noo sah(n)-toh(n)", en: "we feel" },
        vous: { fr: "vous sentez", phon: "voo sah(n)-tay", en: "you feel" },
        ils:  { fr: "se sentent", phon: "suh sah(n)t", en: "they feel" }
      },
      passe_compose: {
        je:   { fr: "me suis senti(e)", phon: "muh swee sah(n)-tee", en: "I felt / have felt" },
        tu:   { fr: "t'es senti(e)", phon: "teh sah(n)-tee", en: "you felt / have felt" },
        il:   { fr: "s'est senti(e)", phon: "seh sah(n)-tee", en: "he/she/one felt / has felt" },
        nous: { fr: "nous sommes senti(e)s", phon: "noo sum sah(n)-tee", en: "we felt / have felt" },
        vous: { fr: "vous êtes senti(e)(s)", phon: "voo zet sah(n)-tee", en: "you felt / have felt" },
        ils:  { fr: "se sont senti(e)s", phon: "suh soh(n) sah(n)-tee", en: "they felt / have felt" }
      },
      imparfait: {
        je:   { fr: "me sentais", phon: "muh sah(n)-teh", en: "I was feeling / used to feel" },
        tu:   { fr: "te sentais", phon: "tuh sah(n)-teh", en: "you were feeling / used to feel" },
        il:   { fr: "se sentait", phon: "suh sah(n)-teh", en: "he/she/one was feeling / used to feel" },
        nous: { fr: "nous sentions", phon: "noo sah(n)-tyoh(n)", en: "we were feeling / used to feel" },
        vous: { fr: "vous sentiez", phon: "voo sah(n)-tyay", en: "you were feeling / used to feel" },
        ils:  { fr: "se sentaient", phon: "suh sah(n)-teh", en: "they were feeling / used to feel" }
      },
      futur: {
        je:   { fr: "me sentirai", phon: "muh sah(n)-tee-ray", en: "I will feel" },
        tu:   { fr: "te sentiras", phon: "tuh sah(n)-tee-rah", en: "you will feel" },
        il:   { fr: "se sentira", phon: "suh sah(n)-tee-rah", en: "he/she/one will feel" },
        nous: { fr: "nous sentirons", phon: "noo sah(n)-tee-roh(n)", en: "we will feel" },
        vous: { fr: "vous sentirez", phon: "voo sah(n)-tee-ray", en: "you will feel" },
        ils:  { fr: "se sentiront", phon: "suh sah(n)-tee-roh(n)", en: "they will feel" }
      },
      conditionnel: {
        je:   { fr: "me sentirais", phon: "muh sah(n)-tee-reh", en: "I would feel" },
        tu:   { fr: "te sentirais", phon: "tuh sah(n)-tee-reh", en: "you would feel" },
        il:   { fr: "se sentirait", phon: "suh sah(n)-tee-reh", en: "he/she/one would feel" },
        nous: { fr: "nous sentirions", phon: "noo sah(n)-tee-ryoh(n)", en: "we would feel" },
        vous: { fr: "vous sentiriez", phon: "voo sah(n)-tee-ryay", en: "you would feel" },
        ils:  { fr: "se sentiraient", phon: "suh sah(n)-tee-reh", en: "they would feel" }
      }
    }
  },

  {
    id: "s-endormir",
    rank: "I59",
    type: "irregular",
    group: "irregular",
    english: "to fall asleep",
    french: "s'endormir",
    phonetic: "sah(n)-dor-meer",
    family: "like partir",
    auxiliary: "être",
    conjugations: {
      present: {
        je:   { fr: "m'endors", phon: "mah(n)-dor", en: "I fall asleep" },
        tu:   { fr: "t'endors", phon: "tah(n)-dor", en: "you fall asleep" },
        il:   { fr: "s'endort", phon: "sah(n)-dor", en: "he/she/one falls asleep" },
        nous: { fr: "nous endormons", phon: "noo zah(n)-dor-moh(n)", en: "we fall asleep" },
        vous: { fr: "vous endormez", phon: "voo zah(n)-dor-may", en: "you fall asleep" },
        ils:  { fr: "s'endorment", phon: "sah(n)-dorm", en: "they fall asleep" }
      },
      passe_compose: {
        je:   { fr: "me suis endormi(e)", phon: "muh swee ah(n)-dor-mee", en: "I fell asleep / have fallen asleep" },
        tu:   { fr: "t'es endormi(e)", phon: "teh ah(n)-dor-mee", en: "you fell asleep / have fallen asleep" },
        il:   { fr: "s'est endormi(e)", phon: "seh ah(n)-dor-mee", en: "he/she/one fell asleep / has fallen asleep" },
        nous: { fr: "nous sommes endormi(e)s", phon: "noo sum ah(n)-dor-mee", en: "we fell asleep / have fallen asleep" },
        vous: { fr: "vous êtes endormi(e)(s)", phon: "voo zet ah(n)-dor-mee", en: "you fell asleep / have fallen asleep" },
        ils:  { fr: "se sont endormi(e)s", phon: "suh soh(n) ah(n)-dor-mee", en: "they fell asleep / have fallen asleep" }
      },
      imparfait: {
        je:   { fr: "m'endormais", phon: "mah(n)-dor-meh", en: "I was falling asleep / used to fall asleep" },
        tu:   { fr: "t'endormais", phon: "tah(n)-dor-meh", en: "you were falling asleep / used to fall asleep" },
        il:   { fr: "s'endormait", phon: "sah(n)-dor-meh", en: "he/she/one was falling asleep / used to fall asleep" },
        nous: { fr: "nous endormions", phon: "noo zah(n)-dor-myoh(n)", en: "we were falling asleep / used to fall asleep" },
        vous: { fr: "vous endormiez", phon: "voo zah(n)-dor-myay", en: "you were falling asleep / used to fall asleep" },
        ils:  { fr: "s'endormaient", phon: "sah(n)-dor-meh", en: "they were falling asleep / used to fall asleep" }
      },
      futur: {
        je:   { fr: "m'endormirai", phon: "mah(n)-dor-mee-ray", en: "I will fall asleep" },
        tu:   { fr: "t'endormiras", phon: "tah(n)-dor-mee-rah", en: "you will fall asleep" },
        il:   { fr: "s'endormira", phon: "sah(n)-dor-mee-rah", en: "he/she/one will fall asleep" },
        nous: { fr: "nous endormirons", phon: "noo zah(n)-dor-mee-roh(n)", en: "we will fall asleep" },
        vous: { fr: "vous endormirez", phon: "voo zah(n)-dor-mee-ray", en: "you will fall asleep" },
        ils:  { fr: "s'endormiront", phon: "sah(n)-dor-mee-roh(n)", en: "they will fall asleep" }
      },
      conditionnel: {
        je:   { fr: "m'endormirais", phon: "mah(n)-dor-mee-reh", en: "I would fall asleep" },
        tu:   { fr: "t'endormirais", phon: "tah(n)-dor-mee-reh", en: "you would fall asleep" },
        il:   { fr: "s'endormirait", phon: "sah(n)-dor-mee-reh", en: "he/she/one would fall asleep" },
        nous: { fr: "nous endormirions", phon: "noo zah(n)-dor-mee-ryoh(n)", en: "we would fall asleep" },
        vous: { fr: "vous endormiriez", phon: "voo zah(n)-dor-mee-ryay", en: "you would fall asleep" },
        ils:  { fr: "s'endormiraient", phon: "sah(n)-dor-mee-reh", en: "they would fall asleep" }
      }
    }
  },

  {
    id: "ouvrir",
    rank: "I28",
    type: "irregular",
    group: "irregular",
    english: "to open",
    french: "ouvrir",
    phonetic: "oo-vreer",
    conjugations: {
      present: {
        je:   { fr: "ouvre", phon: "oo-vruh", en: "I open" },
        tu:   { fr: "ouvres", phon: "oo-vruh", en: "you open" },
        il:   { fr: "ouvre", phon: "oo-vruh", en: "he/she/one opens" },
        nous: { fr: "ouvrons", phon: "oo-vroh(n)", en: "we open" },
        vous: { fr: "ouvrez", phon: "oo-vray", en: "you open" },
        ils:  { fr: "ouvrent", phon: "oovr", en: "they open" }
      },
      passe_compose: {
        je:   { fr: "ai ouvert", phon: "ay oo-vehr", en: "I opened / have opened" },
        tu:   { fr: "as ouvert", phon: "ah oo-vehr", en: "you opened / have opened" },
        il:   { fr: "a ouvert", phon: "ah oo-vehr", en: "he/she/one opened / has opened" },
        nous: { fr: "avons ouvert", phon: "ah-voh(n) oo-vehr", en: "we opened / have opened" },
        vous: { fr: "avez ouvert", phon: "ah-vay oo-vehr", en: "you opened / have opened" },
        ils:  { fr: "ont ouvert", phon: "oh(n) oo-vehr", en: "they opened / have opened" }
      },
      imparfait: {
        je:   { fr: "ouvrais", phon: "oo-vreh", en: "I was opening / used to open" },
        tu:   { fr: "ouvrais", phon: "oo-vreh", en: "you were opening / used to open" },
        il:   { fr: "ouvrait", phon: "oo-vreh", en: "he/she/one was opening / used to open" },
        nous: { fr: "ouvrions", phon: "oo-vree-yoh(n)", en: "we were opening / used to open" },
        vous: { fr: "ouvriez", phon: "oo-vree-yay", en: "you were opening / used to open" },
        ils:  { fr: "ouvraient", phon: "oo-vreh", en: "they were opening / used to open" }
      },
      futur: {
        je:   { fr: "ouvrirai", phon: "oo-vree-ray", en: "I will open" },
        tu:   { fr: "ouvriras", phon: "oo-vree-rah", en: "you will open" },
        il:   { fr: "ouvrira", phon: "oo-vree-rah", en: "he/she/one will open" },
        nous: { fr: "ouvrirons", phon: "oo-vree-roh(n)", en: "we will open" },
        vous: { fr: "ouvrirez", phon: "oo-vree-ray", en: "you will open" },
        ils:  { fr: "ouvriront", phon: "oo-vree-roh(n)", en: "they will open" }
      },
      conditionnel: {
        je:   { fr: "ouvrirais", phon: "oo-vree-reh", en: "I would open" },
        tu:   { fr: "ouvrirais", phon: "oo-vree-reh", en: "you would open" },
        il:   { fr: "ouvrirait", phon: "oo-vree-reh", en: "he/she/one would open" },
        nous: { fr: "ouvririons", phon: "oo-vree-ryoh(n)", en: "we would open" },
        vous: { fr: "ouvririez", phon: "oo-vree-ryay", en: "you would open" },
        ils:  { fr: "ouvriraient", phon: "oo-vree-reh", en: "they would open" }
      }
    }
  },

  {
    id: "offrir",
    rank: "I43",
    type: "irregular",
    group: "irregular",
    english: "to offer, give (a gift)",
    french: "offrir",
    phonetic: "oh-freer",
    family: "like ouvrir",
    conjugations: {
      present: {
        je:   { fr: "offre", phon: "oh-fruh", en: "I offer" },
        tu:   { fr: "offres", phon: "oh-fruh", en: "you offer" },
        il:   { fr: "offre", phon: "oh-fruh", en: "he/she/one offers" },
        nous: { fr: "offrons", phon: "oh-froh(n)", en: "we offer" },
        vous: { fr: "offrez", phon: "oh-fray", en: "you offer" },
        ils:  { fr: "offrent", phon: "ofr", en: "they offer" }
      },
      passe_compose: {
        je:   { fr: "ai offert", phon: "ay oh-fehr", en: "I offered / have offered" },
        tu:   { fr: "as offert", phon: "ah oh-fehr", en: "you offered / have offered" },
        il:   { fr: "a offert", phon: "ah oh-fehr", en: "he/she/one offered / has offered" },
        nous: { fr: "avons offert", phon: "ah-voh(n) oh-fehr", en: "we offered / have offered" },
        vous: { fr: "avez offert", phon: "ah-vay oh-fehr", en: "you offered / have offered" },
        ils:  { fr: "ont offert", phon: "oh(n) oh-fehr", en: "they offered / have offered" }
      },
      imparfait: {
        je:   { fr: "offrais", phon: "oh-freh", en: "I was offering / used to offer" },
        tu:   { fr: "offrais", phon: "oh-freh", en: "you were offering / used to offer" },
        il:   { fr: "offrait", phon: "oh-freh", en: "he/she/one was offering / used to offer" },
        nous: { fr: "offrions", phon: "oh-free-yoh(n)", en: "we were offering / used to offer" },
        vous: { fr: "offriez", phon: "oh-free-yay", en: "you were offering / used to offer" },
        ils:  { fr: "offraient", phon: "oh-freh", en: "they were offering / used to offer" }
      },
      futur: {
        je:   { fr: "offrirai", phon: "oh-free-ray", en: "I will offer" },
        tu:   { fr: "offriras", phon: "oh-free-rah", en: "you will offer" },
        il:   { fr: "offrira", phon: "oh-free-rah", en: "he/she/one will offer" },
        nous: { fr: "offrirons", phon: "oh-free-roh(n)", en: "we will offer" },
        vous: { fr: "offrirez", phon: "oh-free-ray", en: "you will offer" },
        ils:  { fr: "offriront", phon: "oh-free-roh(n)", en: "they will offer" }
      },
      conditionnel: {
        je:   { fr: "offrirais", phon: "oh-free-reh", en: "I would offer" },
        tu:   { fr: "offrirais", phon: "oh-free-reh", en: "you would offer" },
        il:   { fr: "offrirait", phon: "oh-free-reh", en: "he/she/one would offer" },
        nous: { fr: "offririons", phon: "oh-free-ryoh(n)", en: "we would offer" },
        vous: { fr: "offririez", phon: "oh-free-ryay", en: "you would offer" },
        ils:  { fr: "offriraient", phon: "oh-free-reh", en: "they would offer" }
      }
    }
  },

  {
    id: "decouvrir",
    rank: "I74",
    type: "irregular",
    group: "irregular",
    english: "to discover",
    french: "découvrir",
    phonetic: "day-koo-vreer",
    family: "like ouvrir",
    conjugations: {
      present: {
        je:   { fr: "découvre", phon: "day-koo-vruh", en: "I discover" },
        tu:   { fr: "découvres", phon: "day-koo-vruh", en: "you discover" },
        il:   { fr: "découvre", phon: "day-koo-vruh", en: "he/she/one discovers" },
        nous: { fr: "découvrons", phon: "day-koo-vroh(n)", en: "we discover" },
        vous: { fr: "découvrez", phon: "day-koo-vray", en: "you discover" },
        ils:  { fr: "découvrent", phon: "day-koovr", en: "they discover" }
      },
      passe_compose: {
        je:   { fr: "ai découvert", phon: "ay day-koo-vehr", en: "I discovered / have discovered" },
        tu:   { fr: "as découvert", phon: "ah day-koo-vehr", en: "you discovered / have discovered" },
        il:   { fr: "a découvert", phon: "ah day-koo-vehr", en: "he/she/one discovered / has discovered" },
        nous: { fr: "avons découvert", phon: "ah-voh(n) day-koo-vehr", en: "we discovered / have discovered" },
        vous: { fr: "avez découvert", phon: "ah-vay day-koo-vehr", en: "you discovered / have discovered" },
        ils:  { fr: "ont découvert", phon: "oh(n) day-koo-vehr", en: "they discovered / have discovered" }
      },
      imparfait: {
        je:   { fr: "découvrais", phon: "day-koo-vreh", en: "I was discovering / used to discover" },
        tu:   { fr: "découvrais", phon: "day-koo-vreh", en: "you were discovering / used to discover" },
        il:   { fr: "découvrait", phon: "day-koo-vreh", en: "he/she/one was discovering / used to discover" },
        nous: { fr: "découvrions", phon: "day-koo-vree-yoh(n)", en: "we were discovering / used to discover" },
        vous: { fr: "découvriez", phon: "day-koo-vree-yay", en: "you were discovering / used to discover" },
        ils:  { fr: "découvraient", phon: "day-koo-vreh", en: "they were discovering / used to discover" }
      },
      futur: {
        je:   { fr: "découvrirai", phon: "day-koo-vree-ray", en: "I will discover" },
        tu:   { fr: "découvriras", phon: "day-koo-vree-rah", en: "you will discover" },
        il:   { fr: "découvrira", phon: "day-koo-vree-rah", en: "he/she/one will discover" },
        nous: { fr: "découvrirons", phon: "day-koo-vree-roh(n)", en: "we will discover" },
        vous: { fr: "découvrirez", phon: "day-koo-vree-ray", en: "you will discover" },
        ils:  { fr: "découvriront", phon: "day-koo-vree-roh(n)", en: "they will discover" }
      },
      conditionnel: {
        je:   { fr: "découvrirais", phon: "day-koo-vree-reh", en: "I would discover" },
        tu:   { fr: "découvrirais", phon: "day-koo-vree-reh", en: "you would discover" },
        il:   { fr: "découvrirait", phon: "day-koo-vree-reh", en: "he/she/one would discover" },
        nous: { fr: "découvririons", phon: "day-koo-vree-ryoh(n)", en: "we would discover" },
        vous: { fr: "découvririez", phon: "day-koo-vree-ryay", en: "you would discover" },
        ils:  { fr: "découvriraient", phon: "day-koo-vree-reh", en: "they would discover" }
      }
    }
  },

  {
    id: "accueillir",
    rank: "I73",
    type: "irregular",
    group: "irregular",
    english: "to welcome",
    french: "accueillir",
    phonetic: "ah-kuh-yeer",
    conjugations: {
      present: {
        je:   { fr: "accueille", phon: "ah-kuhy", en: "I welcome" },
        tu:   { fr: "accueilles", phon: "ah-kuhy", en: "you welcome" },
        il:   { fr: "accueille", phon: "ah-kuhy", en: "he/she/one welcomes" },
        nous: { fr: "accueillons", phon: "ah-kuh-yoh(n)", en: "we welcome" },
        vous: { fr: "accueillez", phon: "ah-kuh-yay", en: "you welcome" },
        ils:  { fr: "accueillent", phon: "ah-kuhy", en: "they welcome" }
      },
      passe_compose: {
        je:   { fr: "ai accueilli", phon: "ay ah-kuh-yee", en: "I welcomed / have welcomed" },
        tu:   { fr: "as accueilli", phon: "ah ah-kuh-yee", en: "you welcomed / have welcomed" },
        il:   { fr: "a accueilli", phon: "ah ah-kuh-yee", en: "he/she/one welcomed / has welcomed" },
        nous: { fr: "avons accueilli", phon: "ah-voh(n) ah-kuh-yee", en: "we welcomed / have welcomed" },
        vous: { fr: "avez accueilli", phon: "ah-vay ah-kuh-yee", en: "you welcomed / have welcomed" },
        ils:  { fr: "ont accueilli", phon: "oh(n) ah-kuh-yee", en: "they welcomed / have welcomed" }
      },
      imparfait: {
        je:   { fr: "accueillais", phon: "ah-kuh-yeh", en: "I was welcoming / used to welcome" },
        tu:   { fr: "accueillais", phon: "ah-kuh-yeh", en: "you were welcoming / used to welcome" },
        il:   { fr: "accueillait", phon: "ah-kuh-yeh", en: "he/she/one was welcoming / used to welcome" },
        nous: { fr: "accueillions", phon: "ah-kuh-yoh(n)", en: "we were welcoming / used to welcome" },
        vous: { fr: "accueilliez", phon: "ah-kuh-yay", en: "you were welcoming / used to welcome" },
        ils:  { fr: "accueillaient", phon: "ah-kuh-yeh", en: "they were welcoming / used to welcome" }
      },
      futur: {
        je:   { fr: "accueillerai", phon: "ah-kuh-yuh-ray", en: "I will welcome" },
        tu:   { fr: "accueilleras", phon: "ah-kuh-yuh-rah", en: "you will welcome" },
        il:   { fr: "accueillera", phon: "ah-kuh-yuh-rah", en: "he/she/one will welcome" },
        nous: { fr: "accueillerons", phon: "ah-kuh-yuh-roh(n)", en: "we will welcome" },
        vous: { fr: "accueillerez", phon: "ah-kuh-yuh-ray", en: "you will welcome" },
        ils:  { fr: "accueilleront", phon: "ah-kuh-yuh-roh(n)", en: "they will welcome" }
      },
      conditionnel: {
        je:   { fr: "accueillerais", phon: "ah-kuh-yuh-reh", en: "I would welcome" },
        tu:   { fr: "accueillerais", phon: "ah-kuh-yuh-reh", en: "you would welcome" },
        il:   { fr: "accueillerait", phon: "ah-kuh-yuh-reh", en: "he/she/one would welcome" },
        nous: { fr: "accueillerions", phon: "ah-kuh-yuh-ryoh(n)", en: "we would welcome" },
        vous: { fr: "accueilleriez", phon: "ah-kuh-yuh-ryay", en: "you would welcome" },
        ils:  { fr: "accueilleraient", phon: "ah-kuh-yuh-reh", en: "they would welcome" }
      }
    }
  },

  {
    id: "cueillir",
    rank: "I78",
    type: "irregular",
    group: "irregular",
    english: "to pick (fruit, mushrooms)",
    french: "cueillir",
    phonetic: "kuh-yeer",
    conjugations: {
      present: {
        je:   { fr: "cueille", phon: "kuhy", en: "I pick" },
        tu:   { fr: "cueilles", phon: "kuhy", en: "you pick" },
        il:   { fr: "cueille", phon: "kuhy", en: "he/she/one picks" },
        nous: { fr: "cueillons", phon: "kuh-yoh(n)", en: "we pick" },
        vous: { fr: "cueillez", phon: "kuh-yay", en: "you pick" },
        ils:  { fr: "cueillent", phon: "kuhy", en: "they pick" }
      },
      passe_compose: {
        je:   { fr: "ai cueilli", phon: "ay kuh-yee", en: "I picked / have picked" },
        tu:   { fr: "as cueilli", phon: "ah kuh-yee", en: "you picked / have picked" },
        il:   { fr: "a cueilli", phon: "ah kuh-yee", en: "he/she/one picked / has picked" },
        nous: { fr: "avons cueilli", phon: "ah-voh(n) kuh-yee", en: "we picked / have picked" },
        vous: { fr: "avez cueilli", phon: "ah-vay kuh-yee", en: "you picked / have picked" },
        ils:  { fr: "ont cueilli", phon: "oh(n) kuh-yee", en: "they picked / have picked" }
      },
      imparfait: {
        je:   { fr: "cueillais", phon: "kuh-yeh", en: "I was picking / used to pick" },
        tu:   { fr: "cueillais", phon: "kuh-yeh", en: "you were picking / used to pick" },
        il:   { fr: "cueillait", phon: "kuh-yeh", en: "he/she/one was picking / used to pick" },
        nous: { fr: "cueillions", phon: "kuh-yoh(n)", en: "we were picking / used to pick" },
        vous: { fr: "cueilliez", phon: "kuh-yay", en: "you were picking / used to pick" },
        ils:  { fr: "cueillaient", phon: "kuh-yeh", en: "they were picking / used to pick" }
      },
      futur: {
        je:   { fr: "cueillerai", phon: "kuh-yuh-ray", en: "I will pick" },
        tu:   { fr: "cueilleras", phon: "kuh-yuh-rah", en: "you will pick" },
        il:   { fr: "cueillera", phon: "kuh-yuh-rah", en: "he/she/one will pick" },
        nous: { fr: "cueillerons", phon: "kuh-yuh-roh(n)", en: "we will pick" },
        vous: { fr: "cueillerez", phon: "kuh-yuh-ray", en: "you will pick" },
        ils:  { fr: "cueilleront", phon: "kuh-yuh-roh(n)", en: "they will pick" }
      },
      conditionnel: {
        je:   { fr: "cueillerais", phon: "kuh-yuh-reh", en: "I would pick" },
        tu:   { fr: "cueillerais", phon: "kuh-yuh-reh", en: "you would pick" },
        il:   { fr: "cueillerait", phon: "kuh-yuh-reh", en: "he/she/one would pick" },
        nous: { fr: "cueillerions", phon: "kuh-yuh-ryoh(n)", en: "we would pick" },
        vous: { fr: "cueilleriez", phon: "kuh-yuh-ryay", en: "you would pick" },
        ils:  { fr: "cueilleraient", phon: "kuh-yuh-reh", en: "they would pick" }
      }
    }
  },

  {
    id: "couvrir",
    rank: "I75",
    type: "irregular",
    group: "irregular",
    english: "to cover",
    french: "couvrir",
    phonetic: "koo-vreer",
    family: "like ouvrir",
    conjugations: {
      present: {
        je:   { fr: "couvre", phon: "koo-vruh", en: "I cover" },
        tu:   { fr: "couvres", phon: "koo-vruh", en: "you cover" },
        il:   { fr: "couvre", phon: "koo-vruh", en: "he/she/one covers" },
        nous: { fr: "couvrons", phon: "koo-vroh(n)", en: "we cover" },
        vous: { fr: "couvrez", phon: "koo-vray", en: "you cover" },
        ils:  { fr: "couvrent", phon: "koovr", en: "they cover" }
      },
      passe_compose: {
        je:   { fr: "ai couvert", phon: "ay koo-vehr", en: "I covered / have covered" },
        tu:   { fr: "as couvert", phon: "ah koo-vehr", en: "you covered / have covered" },
        il:   { fr: "a couvert", phon: "ah koo-vehr", en: "he/she/one covered / has covered" },
        nous: { fr: "avons couvert", phon: "ah-voh(n) koo-vehr", en: "we covered / have covered" },
        vous: { fr: "avez couvert", phon: "ah-vay koo-vehr", en: "you covered / have covered" },
        ils:  { fr: "ont couvert", phon: "oh(n) koo-vehr", en: "they covered / have covered" }
      },
      imparfait: {
        je:   { fr: "couvrais", phon: "koo-vreh", en: "I was covering / used to cover" },
        tu:   { fr: "couvrais", phon: "koo-vreh", en: "you were covering / used to cover" },
        il:   { fr: "couvrait", phon: "koo-vreh", en: "he/she/one was covering / used to cover" },
        nous: { fr: "couvrions", phon: "koo-vree-yoh(n)", en: "we were covering / used to cover" },
        vous: { fr: "couvriez", phon: "koo-vree-yay", en: "you were covering / used to cover" },
        ils:  { fr: "couvraient", phon: "koo-vreh", en: "they were covering / used to cover" }
      },
      futur: {
        je:   { fr: "couvrirai", phon: "koo-vree-ray", en: "I will cover" },
        tu:   { fr: "couvriras", phon: "koo-vree-rah", en: "you will cover" },
        il:   { fr: "couvrira", phon: "koo-vree-rah", en: "he/she/one will cover" },
        nous: { fr: "couvrirons", phon: "koo-vree-roh(n)", en: "we will cover" },
        vous: { fr: "couvrirez", phon: "koo-vree-ray", en: "you will cover" },
        ils:  { fr: "couvriront", phon: "koo-vree-roh(n)", en: "they will cover" }
      },
      conditionnel: {
        je:   { fr: "couvrirais", phon: "koo-vree-reh", en: "I would cover" },
        tu:   { fr: "couvrirais", phon: "koo-vree-reh", en: "you would cover" },
        il:   { fr: "couvrirait", phon: "koo-vree-reh", en: "he/she/one would cover" },
        nous: { fr: "couvririons", phon: "koo-vree-ryoh(n)", en: "we would cover" },
        vous: { fr: "couvririez", phon: "koo-vree-ryay", en: "you would cover" },
        ils:  { fr: "couvriraient", phon: "koo-vree-reh", en: "they would cover" }
      }
    }
  },

  {
    id: "souffrir",
    rank: "I76",
    type: "irregular",
    group: "irregular",
    english: "to suffer",
    french: "souffrir",
    phonetic: "soo-freer",
    family: "like ouvrir",
    conjugations: {
      present: {
        je:   { fr: "souffre", phon: "soo-fruh", en: "I suffer" },
        tu:   { fr: "souffres", phon: "soo-fruh", en: "you suffer" },
        il:   { fr: "souffre", phon: "soo-fruh", en: "he/she/one suffers" },
        nous: { fr: "souffrons", phon: "soo-froh(n)", en: "we suffer" },
        vous: { fr: "souffrez", phon: "soo-fray", en: "you suffer" },
        ils:  { fr: "souffrent", phon: "soofr", en: "they suffer" }
      },
      passe_compose: {
        je:   { fr: "ai souffert", phon: "ay soo-fehr", en: "I suffered / have suffered" },
        tu:   { fr: "as souffert", phon: "ah soo-fehr", en: "you suffered / have suffered" },
        il:   { fr: "a souffert", phon: "ah soo-fehr", en: "he/she/one suffered / has suffered" },
        nous: { fr: "avons souffert", phon: "ah-voh(n) soo-fehr", en: "we suffered / have suffered" },
        vous: { fr: "avez souffert", phon: "ah-vay soo-fehr", en: "you suffered / have suffered" },
        ils:  { fr: "ont souffert", phon: "oh(n) soo-fehr", en: "they suffered / have suffered" }
      },
      imparfait: {
        je:   { fr: "souffrais", phon: "soo-freh", en: "I was suffering / used to suffer" },
        tu:   { fr: "souffrais", phon: "soo-freh", en: "you were suffering / used to suffer" },
        il:   { fr: "souffrait", phon: "soo-freh", en: "he/she/one was suffering / used to suffer" },
        nous: { fr: "souffrions", phon: "soo-free-yoh(n)", en: "we were suffering / used to suffer" },
        vous: { fr: "souffriez", phon: "soo-free-yay", en: "you were suffering / used to suffer" },
        ils:  { fr: "souffraient", phon: "soo-freh", en: "they were suffering / used to suffer" }
      },
      futur: {
        je:   { fr: "souffrirai", phon: "soo-free-ray", en: "I will suffer" },
        tu:   { fr: "souffriras", phon: "soo-free-rah", en: "you will suffer" },
        il:   { fr: "souffrira", phon: "soo-free-rah", en: "he/she/one will suffer" },
        nous: { fr: "souffrirons", phon: "soo-free-roh(n)", en: "we will suffer" },
        vous: { fr: "souffrirez", phon: "soo-free-ray", en: "you will suffer" },
        ils:  { fr: "souffriront", phon: "soo-free-roh(n)", en: "they will suffer" }
      },
      conditionnel: {
        je:   { fr: "souffrirais", phon: "soo-free-reh", en: "I would suffer" },
        tu:   { fr: "souffrirais", phon: "soo-free-reh", en: "you would suffer" },
        il:   { fr: "souffrirait", phon: "soo-free-reh", en: "he/she/one would suffer" },
        nous: { fr: "souffririons", phon: "soo-free-ryoh(n)", en: "we would suffer" },
        vous: { fr: "souffririez", phon: "soo-free-ryay", en: "you would suffer" },
        ils:  { fr: "souffriraient", phon: "soo-free-reh", en: "they would suffer" }
      }
    }
  },

  {
    id: "courir",
    rank: "I40",
    type: "irregular",
    group: "irregular",
    english: "to run",
    french: "courir",
    phonetic: "koo-reer",
    conjugations: {
      present: {
        je:   { fr: "cours", phon: "koor", en: "I run" },
        tu:   { fr: "cours", phon: "koor", en: "you run" },
        il:   { fr: "court", phon: "koor", en: "he/she/one runs" },
        nous: { fr: "courons", phon: "koo-roh(n)", en: "we run" },
        vous: { fr: "courez", phon: "koo-ray", en: "you run" },
        ils:  { fr: "courent", phon: "koor", en: "they run" }
      },
      passe_compose: {
        je:   { fr: "ai couru", phon: "ay koo-rew", en: "I ran / have run" },
        tu:   { fr: "as couru", phon: "ah koo-rew", en: "you ran / have run" },
        il:   { fr: "a couru", phon: "ah koo-rew", en: "he/she/one ran / has run" },
        nous: { fr: "avons couru", phon: "ah-voh(n) koo-rew", en: "we ran / have run" },
        vous: { fr: "avez couru", phon: "ah-vay koo-rew", en: "you ran / have run" },
        ils:  { fr: "ont couru", phon: "oh(n) koo-rew", en: "they ran / have run" }
      },
      imparfait: {
        je:   { fr: "courais", phon: "koo-reh", en: "I was running / used to run" },
        tu:   { fr: "courais", phon: "koo-reh", en: "you were running / used to run" },
        il:   { fr: "courait", phon: "koo-reh", en: "he/she/one was running / used to run" },
        nous: { fr: "courions", phon: "koo-ryoh(n)", en: "we were running / used to run" },
        vous: { fr: "couriez", phon: "koo-ryay", en: "you were running / used to run" },
        ils:  { fr: "couraient", phon: "koo-reh", en: "they were running / used to run" }
      },
      futur: {
        je:   { fr: "courrai", phon: "koo-ray", en: "I will run" },
        tu:   { fr: "courras", phon: "koo-rah", en: "you will run" },
        il:   { fr: "courra", phon: "koo-rah", en: "he/she/one will run" },
        nous: { fr: "courrons", phon: "koo-roh(n)", en: "we will run" },
        vous: { fr: "courrez", phon: "koo-ray", en: "you will run" },
        ils:  { fr: "courront", phon: "koo-roh(n)", en: "they will run" }
      },
      conditionnel: {
        je:   { fr: "courrais", phon: "koo-reh", en: "I would run" },
        tu:   { fr: "courrais", phon: "koo-reh", en: "you would run" },
        il:   { fr: "courrait", phon: "koo-reh", en: "he/she/one would run" },
        nous: { fr: "courrions", phon: "koo-ryoh(n)", en: "we would run" },
        vous: { fr: "courriez", phon: "koo-ryay", en: "you would run" },
        ils:  { fr: "courraient", phon: "koo-reh", en: "they would run" }
      }
    }
  },

  {
    id: "mourir",
    rank: "I49",
    type: "irregular",
    group: "irregular",
    english: "to die",
    french: "mourir",
    phonetic: "moo-reer",
    auxiliary: "être",
    conjugations: {
      present: {
        je:   { fr: "meurs", phon: "muhr", en: "I die" },
        tu:   { fr: "meurs", phon: "muhr", en: "you die" },
        il:   { fr: "meurt", phon: "muhr", en: "he/she/one dies" },
        nous: { fr: "mourons", phon: "moo-roh(n)", en: "we die" },
        vous: { fr: "mourez", phon: "moo-ray", en: "you die" },
        ils:  { fr: "meurent", phon: "muhr", en: "they die" }
      },
      passe_compose: {
        je:   { fr: "suis mort(e)", phon: "swee mor", en: "I died / have died" },
        tu:   { fr: "es mort(e)", phon: "eh mor", en: "you died / have died" },
        il:   { fr: "est mort(e)", phon: "eh mor", en: "he/she/one died / has died" },
        nous: { fr: "sommes mort(e)s", phon: "sum mor", en: "we died / have died" },
        vous: { fr: "êtes mort(e)(s)", phon: "et mor", en: "you died / have died" },
        ils:  { fr: "sont mort(e)s", phon: "soh(n) mor", en: "they died / have died" }
      },
      imparfait: {
        je:   { fr: "mourais", phon: "moo-reh", en: "I was dying / used to die" },
        tu:   { fr: "mourais", phon: "moo-reh", en: "you were dying / used to die" },
        il:   { fr: "mourait", phon: "moo-reh", en: "he/she/one was dying / used to die" },
        nous: { fr: "mourions", phon: "moo-ryoh(n)", en: "we were dying / used to die" },
        vous: { fr: "mouriez", phon: "moo-ryay", en: "you were dying / used to die" },
        ils:  { fr: "mouraient", phon: "moo-reh", en: "they were dying / used to die" }
      },
      futur: {
        je:   { fr: "mourrai", phon: "moo-ray", en: "I will die" },
        tu:   { fr: "mourras", phon: "moo-rah", en: "you will die" },
        il:   { fr: "mourra", phon: "moo-rah", en: "he/she/one will die" },
        nous: { fr: "mourrons", phon: "moo-roh(n)", en: "we will die" },
        vous: { fr: "mourrez", phon: "moo-ray", en: "you will die" },
        ils:  { fr: "mourront", phon: "moo-roh(n)", en: "they will die" }
      },
      conditionnel: {
        je:   { fr: "mourrais", phon: "moo-reh", en: "I would die" },
        tu:   { fr: "mourrais", phon: "moo-reh", en: "you would die" },
        il:   { fr: "mourrait", phon: "moo-reh", en: "he/she/one would die" },
        nous: { fr: "mourrions", phon: "moo-ryoh(n)", en: "we would die" },
        vous: { fr: "mourriez", phon: "moo-ryay", en: "you would die" },
        ils:  { fr: "mourraient", phon: "moo-reh", en: "they would die" }
      }
    }
  },

  {
    id: "se-faire",
    rank: "I35",
    type: "irregular",
    group: "irregular",
    english: "to make yourself (a coffee)",
    french: "se faire (un café)",
    phonetic: "suh fehr uh(n) kah-fay",
    auxiliary: "être",
    conjugations: {
      present: {
        je:   { fr: "me fais", phon: "muh feh", en: "I make myself a coffee" },
        tu:   { fr: "te fais", phon: "tuh feh", en: "you make yourself a coffee" },
        il:   { fr: "se fait", phon: "suh feh", en: "he/she/one makes himself/herself a coffee" },
        nous: { fr: "nous faisons", phon: "noo fuh-zoh(n)", en: "we make ourselves a coffee" },
        vous: { fr: "vous faites", phon: "voo fet", en: "you make yourselves a coffee" },
        ils:  { fr: "se font", phon: "suh foh(n)", en: "they make themselves a coffee" }
      },
      passe_compose: {
        je:   { fr: "me suis fait", phon: "muh swee feh", en: "I made myself a coffee / have made myself a coffee" },
        tu:   { fr: "t'es fait", phon: "teh feh", en: "you made yourself a coffee / have made yourself a coffee" },
        il:   { fr: "s'est fait", phon: "seh feh", en: "he/she/one made himself/herself a coffee / has made himself/herself a coffee" },
        nous: { fr: "nous sommes fait", phon: "noo sum feh", en: "we made ourselves a coffee / have made ourselves a coffee" },
        vous: { fr: "vous êtes fait", phon: "voo zet feh", en: "you made yourselves a coffee / have made yourselves a coffee" },
        ils:  { fr: "se sont fait", phon: "suh soh(n) feh", en: "they made themselves a coffee / have made themselves a coffee" }
      },
      imparfait: {
        je:   { fr: "me faisais", phon: "muh fuh-zeh", en: "I was making myself a coffee / used to make myself a coffee" },
        tu:   { fr: "te faisais", phon: "tuh fuh-zeh", en: "you were making yourself a coffee / used to make yourself a coffee" },
        il:   { fr: "se faisait", phon: "suh fuh-zeh", en: "he/she/one was making himself/herself a coffee / used to make himself/herself a coffee" },
        nous: { fr: "nous faisions", phon: "noo fuh-zyoh(n)", en: "we were making ourselves a coffee / used to make ourselves a coffee" },
        vous: { fr: "vous faisiez", phon: "voo fuh-zyay", en: "you were making yourselves a coffee / used to make yourselves a coffee" },
        ils:  { fr: "se faisaient", phon: "suh fuh-zeh", en: "they were making themselves a coffee / used to make themselves a coffee" }
      },
      futur: {
        je:   { fr: "me ferai", phon: "muh fuh-ray", en: "I will make myself a coffee" },
        tu:   { fr: "te feras", phon: "tuh fuh-rah", en: "you will make yourself a coffee" },
        il:   { fr: "se fera", phon: "suh fuh-rah", en: "he/she/one will make himself/herself a coffee" },
        nous: { fr: "nous ferons", phon: "noo fuh-roh(n)", en: "we will make ourselves a coffee" },
        vous: { fr: "vous ferez", phon: "voo fuh-ray", en: "you will make yourselves a coffee" },
        ils:  { fr: "se feront", phon: "suh fuh-roh(n)", en: "they will make themselves a coffee" }
      },
      conditionnel: {
        je:   { fr: "me ferais", phon: "muh fuh-reh", en: "I would make myself a coffee" },
        tu:   { fr: "te ferais", phon: "tuh fuh-reh", en: "you would make yourself a coffee" },
        il:   { fr: "se ferait", phon: "suh fuh-reh", en: "he/she/one would make himself/herself a coffee" },
        nous: { fr: "nous ferions", phon: "noo fuh-ryoh(n)", en: "we would make ourselves a coffee" },
        vous: { fr: "vous feriez", phon: "voo fuh-ryay", en: "you would make yourselves a coffee" },
        ils:  { fr: "se feraient", phon: "suh fuh-reh", en: "they would make themselves a coffee" }
      }
    }
  },

  {
    id: "interdire",
    rank: "I57",
    type: "irregular",
    group: "irregular",
    english: "to forbid",
    french: "interdire",
    phonetic: "a(n)-tehr-deer",
    conjugations: {
      present: {
        je:   { fr: "interdis", phon: "a(n)-tehr-dee", en: "I forbid" },
        tu:   { fr: "interdis", phon: "a(n)-tehr-dee", en: "you forbid" },
        il:   { fr: "interdit", phon: "a(n)-tehr-dee", en: "he/she/one forbids" },
        nous: { fr: "interdisons", phon: "a(n)-tehr-dee-zoh(n)", en: "we forbid" },
        vous: { fr: "interdisez", phon: "a(n)-tehr-dee-zay", en: "you forbid" },
        ils:  { fr: "interdisent", phon: "a(n)-tehr-deez", en: "they forbid" }
      },
      passe_compose: {
        je:   { fr: "ai interdit", phon: "ay a(n)-tehr-dee", en: "I forbade / have forbidden" },
        tu:   { fr: "as interdit", phon: "ah a(n)-tehr-dee", en: "you forbade / have forbidden" },
        il:   { fr: "a interdit", phon: "ah a(n)-tehr-dee", en: "he/she/one forbade / has forbidden" },
        nous: { fr: "avons interdit", phon: "ah-voh(n) a(n)-tehr-dee", en: "we forbade / have forbidden" },
        vous: { fr: "avez interdit", phon: "ah-vay a(n)-tehr-dee", en: "you forbade / have forbidden" },
        ils:  { fr: "ont interdit", phon: "oh(n) a(n)-tehr-dee", en: "they forbade / have forbidden" }
      },
      imparfait: {
        je:   { fr: "interdisais", phon: "a(n)-tehr-dee-zeh", en: "I was forbidding / used to forbid" },
        tu:   { fr: "interdisais", phon: "a(n)-tehr-dee-zeh", en: "you were forbidding / used to forbid" },
        il:   { fr: "interdisait", phon: "a(n)-tehr-dee-zeh", en: "he/she/one was forbidding / used to forbid" },
        nous: { fr: "interdisions", phon: "a(n)-tehr-dee-zyoh(n)", en: "we were forbidding / used to forbid" },
        vous: { fr: "interdisiez", phon: "a(n)-tehr-dee-zyay", en: "you were forbidding / used to forbid" },
        ils:  { fr: "interdisaient", phon: "a(n)-tehr-dee-zeh", en: "they were forbidding / used to forbid" }
      },
      futur: {
        je:   { fr: "interdirai", phon: "a(n)-tehr-dee-ray", en: "I will forbid" },
        tu:   { fr: "interdiras", phon: "a(n)-tehr-dee-rah", en: "you will forbid" },
        il:   { fr: "interdira", phon: "a(n)-tehr-dee-rah", en: "he/she/one will forbid" },
        nous: { fr: "interdirons", phon: "a(n)-tehr-dee-roh(n)", en: "we will forbid" },
        vous: { fr: "interdirez", phon: "a(n)-tehr-dee-ray", en: "you will forbid" },
        ils:  { fr: "interdiront", phon: "a(n)-tehr-dee-roh(n)", en: "they will forbid" }
      },
      conditionnel: {
        je:   { fr: "interdirais", phon: "a(n)-tehr-dee-reh", en: "I would forbid" },
        tu:   { fr: "interdirais", phon: "a(n)-tehr-dee-reh", en: "you would forbid" },
        il:   { fr: "interdirait", phon: "a(n)-tehr-dee-reh", en: "he/she/one would forbid" },
        nous: { fr: "interdirions", phon: "a(n)-tehr-dee-ryoh(n)", en: "we would forbid" },
        vous: { fr: "interdiriez", phon: "a(n)-tehr-dee-ryay", en: "you would forbid" },
        ils:  { fr: "interdiraient", phon: "a(n)-tehr-dee-reh", en: "they would forbid" }
      }
    }
  },

  {
    id: "comprendre",
    rank: "I13",
    type: "irregular",
    group: "irregular",
    english: "to understand",
    french: "comprendre",
    phonetic: "koh(n)-prah(n)-druh",
    family: "like prendre",
    conjugations: {
      present: {
        je:   { fr: "comprends", phon: "koh(n)-prah(n)", en: "I understand" },
        tu:   { fr: "comprends", phon: "koh(n)-prah(n)", en: "you understand" },
        il:   { fr: "comprend", phon: "koh(n)-prah(n)", en: "he/she/one understands" },
        nous: { fr: "comprenons", phon: "koh(n)-pruh-noh(n)", en: "we understand" },
        vous: { fr: "comprenez", phon: "koh(n)-pruh-nay", en: "you understand" },
        ils:  { fr: "comprennent", phon: "koh(n)-pren", en: "they understand" }
      },
      passe_compose: {
        je:   { fr: "ai compris", phon: "ay koh(n)-pree", en: "I understood / have understood" },
        tu:   { fr: "as compris", phon: "ah koh(n)-pree", en: "you understood / have understood" },
        il:   { fr: "a compris", phon: "ah koh(n)-pree", en: "he/she/one understood / has understood" },
        nous: { fr: "avons compris", phon: "ah-voh(n) koh(n)-pree", en: "we understood / have understood" },
        vous: { fr: "avez compris", phon: "ah-vay koh(n)-pree", en: "you understood / have understood" },
        ils:  { fr: "ont compris", phon: "oh(n) koh(n)-pree", en: "they understood / have understood" }
      },
      imparfait: {
        je:   { fr: "comprenais", phon: "koh(n)-pruh-neh", en: "I was understanding / used to understand" },
        tu:   { fr: "comprenais", phon: "koh(n)-pruh-neh", en: "you were understanding / used to understand" },
        il:   { fr: "comprenait", phon: "koh(n)-pruh-neh", en: "he/she/one was understanding / used to understand" },
        nous: { fr: "comprenions", phon: "koh(n)-pruh-nyoh(n)", en: "we were understanding / used to understand" },
        vous: { fr: "compreniez", phon: "koh(n)-pruh-nyay", en: "you were understanding / used to understand" },
        ils:  { fr: "comprenaient", phon: "koh(n)-pruh-neh", en: "they were understanding / used to understand" }
      },
      futur: {
        je:   { fr: "comprendrai", phon: "koh(n)-prah(n)-dray", en: "I will understand" },
        tu:   { fr: "comprendras", phon: "koh(n)-prah(n)-drah", en: "you will understand" },
        il:   { fr: "comprendra", phon: "koh(n)-prah(n)-drah", en: "he/she/one will understand" },
        nous: { fr: "comprendrons", phon: "koh(n)-prah(n)-droh(n)", en: "we will understand" },
        vous: { fr: "comprendrez", phon: "koh(n)-prah(n)-dray", en: "you will understand" },
        ils:  { fr: "comprendront", phon: "koh(n)-prah(n)-droh(n)", en: "they will understand" }
      },
      conditionnel: {
        je:   { fr: "comprendrais", phon: "koh(n)-prah(n)-dreh", en: "I would understand" },
        tu:   { fr: "comprendrais", phon: "koh(n)-prah(n)-dreh", en: "you would understand" },
        il:   { fr: "comprendrait", phon: "koh(n)-prah(n)-dreh", en: "he/she/one would understand" },
        nous: { fr: "comprendrions", phon: "koh(n)-prah(n)-dree-yoh(n)", en: "we would understand" },
        vous: { fr: "comprendriez", phon: "koh(n)-prah(n)-dree-yay", en: "you would understand" },
        ils:  { fr: "comprendraient", phon: "koh(n)-prah(n)-dreh", en: "they would understand" }
      }
    }
  },

  {
    id: "apprendre",
    rank: "I27",
    type: "irregular",
    group: "irregular",
    english: "to learn",
    french: "apprendre",
    phonetic: "ah-prah(n)-druh",
    family: "like prendre",
    conjugations: {
      present: {
        je:   { fr: "apprends", phon: "ah-prah(n)", en: "I learn" },
        tu:   { fr: "apprends", phon: "ah-prah(n)", en: "you learn" },
        il:   { fr: "apprend", phon: "ah-prah(n)", en: "he/she/one learns" },
        nous: { fr: "apprenons", phon: "ah-pruh-noh(n)", en: "we learn" },
        vous: { fr: "apprenez", phon: "ah-pruh-nay", en: "you learn" },
        ils:  { fr: "apprennent", phon: "ah-pren", en: "they learn" }
      },
      passe_compose: {
        je:   { fr: "ai appris", phon: "ay ah-pree", en: "I learned / have learned" },
        tu:   { fr: "as appris", phon: "ah ah-pree", en: "you learned / have learned" },
        il:   { fr: "a appris", phon: "ah ah-pree", en: "he/she/one learned / has learned" },
        nous: { fr: "avons appris", phon: "ah-voh(n) ah-pree", en: "we learned / have learned" },
        vous: { fr: "avez appris", phon: "ah-vay ah-pree", en: "you learned / have learned" },
        ils:  { fr: "ont appris", phon: "oh(n) ah-pree", en: "they learned / have learned" }
      },
      imparfait: {
        je:   { fr: "apprenais", phon: "ah-pruh-neh", en: "I was learning / used to learn" },
        tu:   { fr: "apprenais", phon: "ah-pruh-neh", en: "you were learning / used to learn" },
        il:   { fr: "apprenait", phon: "ah-pruh-neh", en: "he/she/one was learning / used to learn" },
        nous: { fr: "apprenions", phon: "ah-pruh-nyoh(n)", en: "we were learning / used to learn" },
        vous: { fr: "appreniez", phon: "ah-pruh-nyay", en: "you were learning / used to learn" },
        ils:  { fr: "apprenaient", phon: "ah-pruh-neh", en: "they were learning / used to learn" }
      },
      futur: {
        je:   { fr: "apprendrai", phon: "ah-prah(n)-dray", en: "I will learn" },
        tu:   { fr: "apprendras", phon: "ah-prah(n)-drah", en: "you will learn" },
        il:   { fr: "apprendra", phon: "ah-prah(n)-drah", en: "he/she/one will learn" },
        nous: { fr: "apprendrons", phon: "ah-prah(n)-droh(n)", en: "we will learn" },
        vous: { fr: "apprendrez", phon: "ah-prah(n)-dray", en: "you will learn" },
        ils:  { fr: "apprendront", phon: "ah-prah(n)-droh(n)", en: "they will learn" }
      },
      conditionnel: {
        je:   { fr: "apprendrais", phon: "ah-prah(n)-dreh", en: "I would learn" },
        tu:   { fr: "apprendrais", phon: "ah-prah(n)-dreh", en: "you would learn" },
        il:   { fr: "apprendrait", phon: "ah-prah(n)-dreh", en: "he/she/one would learn" },
        nous: { fr: "apprendrions", phon: "ah-prah(n)-dree-yoh(n)", en: "we would learn" },
        vous: { fr: "apprendriez", phon: "ah-prah(n)-dree-yay", en: "you would learn" },
        ils:  { fr: "apprendraient", phon: "ah-prah(n)-dreh", en: "they would learn" }
      }
    }
  },

  {
    id: "reprendre",
    rank: "I55",
    type: "irregular",
    group: "irregular",
    english: "to take again, resume",
    french: "reprendre",
    phonetic: "ruh-prah(n)-druh",
    family: "like prendre",
    conjugations: {
      present: {
        je:   { fr: "reprends", phon: "ruh-prah(n)", en: "I take again" },
        tu:   { fr: "reprends", phon: "ruh-prah(n)", en: "you take again" },
        il:   { fr: "reprend", phon: "ruh-prah(n)", en: "he/she/one takes again" },
        nous: { fr: "reprenons", phon: "ruh-pruh-noh(n)", en: "we take again" },
        vous: { fr: "reprenez", phon: "ruh-pruh-nay", en: "you take again" },
        ils:  { fr: "reprennent", phon: "ruh-pren", en: "they take again" }
      },
      passe_compose: {
        je:   { fr: "ai repris", phon: "ay ruh-pree", en: "I took again / have taken again" },
        tu:   { fr: "as repris", phon: "ah ruh-pree", en: "you took again / have taken again" },
        il:   { fr: "a repris", phon: "ah ruh-pree", en: "he/she/one took again / has taken again" },
        nous: { fr: "avons repris", phon: "ah-voh(n) ruh-pree", en: "we took again / have taken again" },
        vous: { fr: "avez repris", phon: "ah-vay ruh-pree", en: "you took again / have taken again" },
        ils:  { fr: "ont repris", phon: "oh(n) ruh-pree", en: "they took again / have taken again" }
      },
      imparfait: {
        je:   { fr: "reprenais", phon: "ruh-pruh-neh", en: "I was taking again / used to take again" },
        tu:   { fr: "reprenais", phon: "ruh-pruh-neh", en: "you were taking again / used to take again" },
        il:   { fr: "reprenait", phon: "ruh-pruh-neh", en: "he/she/one was taking again / used to take again" },
        nous: { fr: "reprenions", phon: "ruh-pruh-nyoh(n)", en: "we were taking again / used to take again" },
        vous: { fr: "repreniez", phon: "ruh-pruh-nyay", en: "you were taking again / used to take again" },
        ils:  { fr: "reprenaient", phon: "ruh-pruh-neh", en: "they were taking again / used to take again" }
      },
      futur: {
        je:   { fr: "reprendrai", phon: "ruh-prah(n)-dray", en: "I will take again" },
        tu:   { fr: "reprendras", phon: "ruh-prah(n)-drah", en: "you will take again" },
        il:   { fr: "reprendra", phon: "ruh-prah(n)-drah", en: "he/she/one will take again" },
        nous: { fr: "reprendrons", phon: "ruh-prah(n)-droh(n)", en: "we will take again" },
        vous: { fr: "reprendrez", phon: "ruh-prah(n)-dray", en: "you will take again" },
        ils:  { fr: "reprendront", phon: "ruh-prah(n)-droh(n)", en: "they will take again" }
      },
      conditionnel: {
        je:   { fr: "reprendrais", phon: "ruh-prah(n)-dreh", en: "I would take again" },
        tu:   { fr: "reprendrais", phon: "ruh-prah(n)-dreh", en: "you would take again" },
        il:   { fr: "reprendrait", phon: "ruh-prah(n)-dreh", en: "he/she/one would take again" },
        nous: { fr: "reprendrions", phon: "ruh-prah(n)-dree-yoh(n)", en: "we would take again" },
        vous: { fr: "reprendriez", phon: "ruh-prah(n)-dree-yay", en: "you would take again" },
        ils:  { fr: "reprendraient", phon: "ruh-prah(n)-dreh", en: "they would take again" }
      }
    }
  },

  {
    id: "surprendre",
    rank: "I87",
    type: "irregular",
    group: "irregular",
    english: "to surprise",
    french: "surprendre",
    phonetic: "sewr-prah(n)-druh",
    family: "like prendre",
    conjugations: {
      present: {
        je:   { fr: "surprends", phon: "sewr-prah(n)", en: "I surprise" },
        tu:   { fr: "surprends", phon: "sewr-prah(n)", en: "you surprise" },
        il:   { fr: "surprend", phon: "sewr-prah(n)", en: "he/she/one surprises" },
        nous: { fr: "surprenons", phon: "sewr-pruh-noh(n)", en: "we surprise" },
        vous: { fr: "surprenez", phon: "sewr-pruh-nay", en: "you surprise" },
        ils:  { fr: "surprennent", phon: "sewr-pren", en: "they surprise" }
      },
      passe_compose: {
        je:   { fr: "ai surpris", phon: "ay sewr-pree", en: "I surprised / have surprised" },
        tu:   { fr: "as surpris", phon: "ah sewr-pree", en: "you surprised / have surprised" },
        il:   { fr: "a surpris", phon: "ah sewr-pree", en: "he/she/one surprised / has surprised" },
        nous: { fr: "avons surpris", phon: "ah-voh(n) sewr-pree", en: "we surprised / have surprised" },
        vous: { fr: "avez surpris", phon: "ah-vay sewr-pree", en: "you surprised / have surprised" },
        ils:  { fr: "ont surpris", phon: "oh(n) sewr-pree", en: "they surprised / have surprised" }
      },
      imparfait: {
        je:   { fr: "surprenais", phon: "sewr-pruh-neh", en: "I was surprising / used to surprise" },
        tu:   { fr: "surprenais", phon: "sewr-pruh-neh", en: "you were surprising / used to surprise" },
        il:   { fr: "surprenait", phon: "sewr-pruh-neh", en: "he/she/one was surprising / used to surprise" },
        nous: { fr: "surprenions", phon: "sewr-pruh-nyoh(n)", en: "we were surprising / used to surprise" },
        vous: { fr: "surpreniez", phon: "sewr-pruh-nyay", en: "you were surprising / used to surprise" },
        ils:  { fr: "surprenaient", phon: "sewr-pruh-neh", en: "they were surprising / used to surprise" }
      },
      futur: {
        je:   { fr: "surprendrai", phon: "sewr-prah(n)-dray", en: "I will surprise" },
        tu:   { fr: "surprendras", phon: "sewr-prah(n)-drah", en: "you will surprise" },
        il:   { fr: "surprendra", phon: "sewr-prah(n)-drah", en: "he/she/one will surprise" },
        nous: { fr: "surprendrons", phon: "sewr-prah(n)-droh(n)", en: "we will surprise" },
        vous: { fr: "surprendrez", phon: "sewr-prah(n)-dray", en: "you will surprise" },
        ils:  { fr: "surprendront", phon: "sewr-prah(n)-droh(n)", en: "they will surprise" }
      },
      conditionnel: {
        je:   { fr: "surprendrais", phon: "sewr-prah(n)-dreh", en: "I would surprise" },
        tu:   { fr: "surprendrais", phon: "sewr-prah(n)-dreh", en: "you would surprise" },
        il:   { fr: "surprendrait", phon: "sewr-prah(n)-dreh", en: "he/she/one would surprise" },
        nous: { fr: "surprendrions", phon: "sewr-prah(n)-dree-yoh(n)", en: "we would surprise" },
        vous: { fr: "surprendriez", phon: "sewr-prah(n)-dree-yay", en: "you would surprise" },
        ils:  { fr: "surprendraient", phon: "sewr-prah(n)-dreh", en: "they would surprise" }
      }
    }
  },

  {
    id: "croire",
    rank: "I15",
    type: "irregular",
    group: "irregular",
    english: "to believe, think",
    french: "croire",
    phonetic: "krwahr",
    conjugations: {
      present: {
        je:   { fr: "crois", phon: "krwah", en: "I believe" },
        tu:   { fr: "crois", phon: "krwah", en: "you believe" },
        il:   { fr: "croit", phon: "krwah", en: "he/she/one believes" },
        nous: { fr: "croyons", phon: "krwah-yoh(n)", en: "we believe" },
        vous: { fr: "croyez", phon: "krwah-yay", en: "you believe" },
        ils:  { fr: "croient", phon: "krwah", en: "they believe" }
      },
      passe_compose: {
        je:   { fr: "ai cru", phon: "ay krew", en: "I believed / have believed" },
        tu:   { fr: "as cru", phon: "ah krew", en: "you believed / have believed" },
        il:   { fr: "a cru", phon: "ah krew", en: "he/she/one believed / has believed" },
        nous: { fr: "avons cru", phon: "ah-voh(n) krew", en: "we believed / have believed" },
        vous: { fr: "avez cru", phon: "ah-vay krew", en: "you believed / have believed" },
        ils:  { fr: "ont cru", phon: "oh(n) krew", en: "they believed / have believed" }
      },
      imparfait: {
        je:   { fr: "croyais", phon: "krwah-yeh", en: "I was believing / used to believe" },
        tu:   { fr: "croyais", phon: "krwah-yeh", en: "you were believing / used to believe" },
        il:   { fr: "croyait", phon: "krwah-yeh", en: "he/she/one was believing / used to believe" },
        nous: { fr: "croyions", phon: "krwah-yoh(n)", en: "we were believing / used to believe" },
        vous: { fr: "croyiez", phon: "krwah-yay", en: "you were believing / used to believe" },
        ils:  { fr: "croyaient", phon: "krwah-yeh", en: "they were believing / used to believe" }
      },
      futur: {
        je:   { fr: "croirai", phon: "krwah-ray", en: "I will believe" },
        tu:   { fr: "croiras", phon: "krwah-rah", en: "you will believe" },
        il:   { fr: "croira", phon: "krwah-rah", en: "he/she/one will believe" },
        nous: { fr: "croirons", phon: "krwah-roh(n)", en: "we will believe" },
        vous: { fr: "croirez", phon: "krwah-ray", en: "you will believe" },
        ils:  { fr: "croiront", phon: "krwah-roh(n)", en: "they will believe" }
      },
      conditionnel: {
        je:   { fr: "croirais", phon: "krwah-reh", en: "I would believe" },
        tu:   { fr: "croirais", phon: "krwah-reh", en: "you would believe" },
        il:   { fr: "croirait", phon: "krwah-reh", en: "he/she/one would believe" },
        nous: { fr: "croirions", phon: "krwah-ryoh(n)", en: "we would believe" },
        vous: { fr: "croiriez", phon: "krwah-ryay", en: "you would believe" },
        ils:  { fr: "croiraient", phon: "krwah-reh", en: "they would believe" }
      }
    }
  },

  {
    id: "mettre",
    rank: "I12",
    type: "irregular",
    group: "irregular",
    english: "to put, put on",
    french: "mettre",
    phonetic: "meh-truh",
    conjugations: {
      present: {
        je:   { fr: "mets", phon: "m", en: "I put" },
        tu:   { fr: "mets", phon: "m", en: "you put" },
        il:   { fr: "met", phon: "m", en: "he/she/one puts" },
        nous: { fr: "mettons", phon: "meh-toh(n)", en: "we put" },
        vous: { fr: "mettez", phon: "meh-tay", en: "you put" },
        ils:  { fr: "mettent", phon: "met", en: "they put" }
      },
      passe_compose: {
        je:   { fr: "ai mis", phon: "ay mee", en: "I put / have put" },
        tu:   { fr: "as mis", phon: "ah mee", en: "you put / have put" },
        il:   { fr: "a mis", phon: "ah mee", en: "he/she/one put / has put" },
        nous: { fr: "avons mis", phon: "ah-voh(n) mee", en: "we put / have put" },
        vous: { fr: "avez mis", phon: "ah-vay mee", en: "you put / have put" },
        ils:  { fr: "ont mis", phon: "oh(n) mee", en: "they put / have put" }
      },
      imparfait: {
        je:   { fr: "mettais", phon: "meh-teh", en: "I was putting / used to put" },
        tu:   { fr: "mettais", phon: "meh-teh", en: "you were putting / used to put" },
        il:   { fr: "mettait", phon: "meh-teh", en: "he/she/one was putting / used to put" },
        nous: { fr: "mettions", phon: "meh-tyoh(n)", en: "we were putting / used to put" },
        vous: { fr: "mettiez", phon: "meh-tyay", en: "you were putting / used to put" },
        ils:  { fr: "mettaient", phon: "meh-teh", en: "they were putting / used to put" }
      },
      futur: {
        je:   { fr: "mettrai", phon: "meh-tray", en: "I will put" },
        tu:   { fr: "mettras", phon: "meh-trah", en: "you will put" },
        il:   { fr: "mettra", phon: "meh-trah", en: "he/she/one will put" },
        nous: { fr: "mettrons", phon: "meh-troh(n)", en: "we will put" },
        vous: { fr: "mettrez", phon: "meh-tray", en: "you will put" },
        ils:  { fr: "mettront", phon: "meh-troh(n)", en: "they will put" }
      },
      conditionnel: {
        je:   { fr: "mettrais", phon: "meh-treh", en: "I would put" },
        tu:   { fr: "mettrais", phon: "meh-treh", en: "you would put" },
        il:   { fr: "mettrait", phon: "meh-treh", en: "he/she/one would put" },
        nous: { fr: "mettrions", phon: "meh-tree-yoh(n)", en: "we would put" },
        vous: { fr: "mettriez", phon: "meh-tree-yay", en: "you would put" },
        ils:  { fr: "mettraient", phon: "meh-treh", en: "they would put" }
      }
    }
  },

  {
    id: "permettre",
    rank: "I53",
    type: "irregular",
    group: "irregular",
    english: "to allow",
    french: "permettre",
    phonetic: "pehr-meh-truh",
    family: "like mettre",
    conjugations: {
      present: {
        je:   { fr: "permets", phon: "pehrm", en: "I allow" },
        tu:   { fr: "permets", phon: "pehrm", en: "you allow" },
        il:   { fr: "permet", phon: "pehrm", en: "he/she/one allows" },
        nous: { fr: "permettons", phon: "pehr-meh-toh(n)", en: "we allow" },
        vous: { fr: "permettez", phon: "pehr-meh-tay", en: "you allow" },
        ils:  { fr: "permettent", phon: "pehr-met", en: "they allow" }
      },
      passe_compose: {
        je:   { fr: "ai permis", phon: "ay pehr-mee", en: "I allowed / have allowed" },
        tu:   { fr: "as permis", phon: "ah pehr-mee", en: "you allowed / have allowed" },
        il:   { fr: "a permis", phon: "ah pehr-mee", en: "he/she/one allowed / has allowed" },
        nous: { fr: "avons permis", phon: "ah-voh(n) pehr-mee", en: "we allowed / have allowed" },
        vous: { fr: "avez permis", phon: "ah-vay pehr-mee", en: "you allowed / have allowed" },
        ils:  { fr: "ont permis", phon: "oh(n) pehr-mee", en: "they allowed / have allowed" }
      },
      imparfait: {
        je:   { fr: "permettais", phon: "pehr-meh-teh", en: "I was allowing / used to allow" },
        tu:   { fr: "permettais", phon: "pehr-meh-teh", en: "you were allowing / used to allow" },
        il:   { fr: "permettait", phon: "pehr-meh-teh", en: "he/she/one was allowing / used to allow" },
        nous: { fr: "permettions", phon: "pehr-meh-tyoh(n)", en: "we were allowing / used to allow" },
        vous: { fr: "permettiez", phon: "pehr-meh-tyay", en: "you were allowing / used to allow" },
        ils:  { fr: "permettaient", phon: "pehr-meh-teh", en: "they were allowing / used to allow" }
      },
      futur: {
        je:   { fr: "permettrai", phon: "pehr-meh-tray", en: "I will allow" },
        tu:   { fr: "permettras", phon: "pehr-meh-trah", en: "you will allow" },
        il:   { fr: "permettra", phon: "pehr-meh-trah", en: "he/she/one will allow" },
        nous: { fr: "permettrons", phon: "pehr-meh-troh(n)", en: "we will allow" },
        vous: { fr: "permettrez", phon: "pehr-meh-tray", en: "you will allow" },
        ils:  { fr: "permettront", phon: "pehr-meh-troh(n)", en: "they will allow" }
      },
      conditionnel: {
        je:   { fr: "permettrais", phon: "pehr-meh-treh", en: "I would allow" },
        tu:   { fr: "permettrais", phon: "pehr-meh-treh", en: "you would allow" },
        il:   { fr: "permettrait", phon: "pehr-meh-treh", en: "he/she/one would allow" },
        nous: { fr: "permettrions", phon: "pehr-meh-tree-yoh(n)", en: "we would allow" },
        vous: { fr: "permettriez", phon: "pehr-meh-tree-yay", en: "you would allow" },
        ils:  { fr: "permettraient", phon: "pehr-meh-treh", en: "they would allow" }
      }
    }
  },

  {
    id: "promettre",
    rank: "I54",
    type: "irregular",
    group: "irregular",
    english: "to promise",
    french: "promettre",
    phonetic: "proh-meh-truh",
    family: "like mettre",
    conjugations: {
      present: {
        je:   { fr: "promets", phon: "proh(n)", en: "I promise" },
        tu:   { fr: "promets", phon: "proh(n)", en: "you promise" },
        il:   { fr: "promet", phon: "proh(n)", en: "he/she/one promises" },
        nous: { fr: "promettons", phon: "proh-meh-toh(n)", en: "we promise" },
        vous: { fr: "promettez", phon: "proh-meh-tay", en: "you promise" },
        ils:  { fr: "promettent", phon: "proh-met", en: "they promise" }
      },
      passe_compose: {
        je:   { fr: "ai promis", phon: "ay proh-mee", en: "I promised / have promised" },
        tu:   { fr: "as promis", phon: "ah proh-mee", en: "you promised / have promised" },
        il:   { fr: "a promis", phon: "ah proh-mee", en: "he/she/one promised / has promised" },
        nous: { fr: "avons promis", phon: "ah-voh(n) proh-mee", en: "we promised / have promised" },
        vous: { fr: "avez promis", phon: "ah-vay proh-mee", en: "you promised / have promised" },
        ils:  { fr: "ont promis", phon: "oh(n) proh-mee", en: "they promised / have promised" }
      },
      imparfait: {
        je:   { fr: "promettais", phon: "proh-meh-teh", en: "I was promising / used to promise" },
        tu:   { fr: "promettais", phon: "proh-meh-teh", en: "you were promising / used to promise" },
        il:   { fr: "promettait", phon: "proh-meh-teh", en: "he/she/one was promising / used to promise" },
        nous: { fr: "promettions", phon: "proh-meh-tyoh(n)", en: "we were promising / used to promise" },
        vous: { fr: "promettiez", phon: "proh-meh-tyay", en: "you were promising / used to promise" },
        ils:  { fr: "promettaient", phon: "proh-meh-teh", en: "they were promising / used to promise" }
      },
      futur: {
        je:   { fr: "promettrai", phon: "proh-meh-tray", en: "I will promise" },
        tu:   { fr: "promettras", phon: "proh-meh-trah", en: "you will promise" },
        il:   { fr: "promettra", phon: "proh-meh-trah", en: "he/she/one will promise" },
        nous: { fr: "promettrons", phon: "proh-meh-troh(n)", en: "we will promise" },
        vous: { fr: "promettrez", phon: "proh-meh-tray", en: "you will promise" },
        ils:  { fr: "promettront", phon: "proh-meh-troh(n)", en: "they will promise" }
      },
      conditionnel: {
        je:   { fr: "promettrais", phon: "proh-meh-treh", en: "I would promise" },
        tu:   { fr: "promettrais", phon: "proh-meh-treh", en: "you would promise" },
        il:   { fr: "promettrait", phon: "proh-meh-treh", en: "he/she/one would promise" },
        nous: { fr: "promettrions", phon: "proh-meh-tree-yoh(n)", en: "we would promise" },
        vous: { fr: "promettriez", phon: "proh-meh-tree-yay", en: "you would promise" },
        ils:  { fr: "promettraient", phon: "proh-meh-treh", en: "they would promise" }
      }
    }
  },

  {
    id: "remettre",
    rank: "I56",
    type: "irregular",
    group: "irregular",
    english: "to put back; to hand in",
    french: "remettre",
    phonetic: "ruh-meh-truh",
    family: "like mettre",
    conjugations: {
      present: {
        je:   { fr: "remets", phon: "rah(n)", en: "I put back" },
        tu:   { fr: "remets", phon: "rah(n)", en: "you put back" },
        il:   { fr: "remet", phon: "rah(n)", en: "he/she/one puts back" },
        nous: { fr: "remettons", phon: "ruh-meh-toh(n)", en: "we put back" },
        vous: { fr: "remettez", phon: "ruh-meh-tay", en: "you put back" },
        ils:  { fr: "remettent", phon: "ruh-met", en: "they put back" }
      },
      passe_compose: {
        je:   { fr: "ai remis", phon: "ay ruh-mee", en: "I put back / have put back" },
        tu:   { fr: "as remis", phon: "ah ruh-mee", en: "you put back / have put back" },
        il:   { fr: "a remis", phon: "ah ruh-mee", en: "he/she/one put back / has put back" },
        nous: { fr: "avons remis", phon: "ah-voh(n) ruh-mee", en: "we put back / have put back" },
        vous: { fr: "avez remis", phon: "ah-vay ruh-mee", en: "you put back / have put back" },
        ils:  { fr: "ont remis", phon: "oh(n) ruh-mee", en: "they put back / have put back" }
      },
      imparfait: {
        je:   { fr: "remettais", phon: "ruh-meh-teh", en: "I was putting back / used to put back" },
        tu:   { fr: "remettais", phon: "ruh-meh-teh", en: "you were putting back / used to put back" },
        il:   { fr: "remettait", phon: "ruh-meh-teh", en: "he/she/one was putting back / used to put back" },
        nous: { fr: "remettions", phon: "ruh-meh-tyoh(n)", en: "we were putting back / used to put back" },
        vous: { fr: "remettiez", phon: "ruh-meh-tyay", en: "you were putting back / used to put back" },
        ils:  { fr: "remettaient", phon: "ruh-meh-teh", en: "they were putting back / used to put back" }
      },
      futur: {
        je:   { fr: "remettrai", phon: "ruh-meh-tray", en: "I will put back" },
        tu:   { fr: "remettras", phon: "ruh-meh-trah", en: "you will put back" },
        il:   { fr: "remettra", phon: "ruh-meh-trah", en: "he/she/one will put back" },
        nous: { fr: "remettrons", phon: "ruh-meh-troh(n)", en: "we will put back" },
        vous: { fr: "remettrez", phon: "ruh-meh-tray", en: "you will put back" },
        ils:  { fr: "remettront", phon: "ruh-meh-troh(n)", en: "they will put back" }
      },
      conditionnel: {
        je:   { fr: "remettrais", phon: "ruh-meh-treh", en: "I would put back" },
        tu:   { fr: "remettrais", phon: "ruh-meh-treh", en: "you would put back" },
        il:   { fr: "remettrait", phon: "ruh-meh-treh", en: "he/she/one would put back" },
        nous: { fr: "remettrions", phon: "ruh-meh-tree-yoh(n)", en: "we would put back" },
        vous: { fr: "remettriez", phon: "ruh-meh-tree-yay", en: "you would put back" },
        ils:  { fr: "remettraient", phon: "ruh-meh-treh", en: "they would put back" }
      }
    }
  },

  {
    id: "se-mettre",
    rank: "I34",
    type: "irregular",
    group: "irregular",
    english: "to start (doing)",
    french: "se mettre à",
    phonetic: "suh meh-truh ah",
    family: "like mettre",
    auxiliary: "être",
    conjugations: {
      present: {
        je:   { fr: "me mets", phon: "muh m", en: "I start" },
        tu:   { fr: "te mets", phon: "tuh m", en: "you start" },
        il:   { fr: "se met", phon: "suh m", en: "he/she/one starts" },
        nous: { fr: "nous mettons", phon: "noo meh-toh(n)", en: "we start" },
        vous: { fr: "vous mettez", phon: "voo meh-tay", en: "you start" },
        ils:  { fr: "se mettent", phon: "suh met", en: "they start" }
      },
      passe_compose: {
        je:   { fr: "me suis mis(e)", phon: "muh swee mee", en: "I started / have started" },
        tu:   { fr: "t'es mis(e)", phon: "teh mee", en: "you started / have started" },
        il:   { fr: "s'est mis(e)", phon: "seh mee", en: "he/she/one started / has started" },
        nous: { fr: "nous sommes mis(e)s", phon: "noo sum mee", en: "we started / have started" },
        vous: { fr: "vous êtes mis(e)(s)", phon: "voo zet mee", en: "you started / have started" },
        ils:  { fr: "se sont mis(e)s", phon: "suh soh(n) mee", en: "they started / have started" }
      },
      imparfait: {
        je:   { fr: "me mettais", phon: "muh meh-teh", en: "I was starting / used to start" },
        tu:   { fr: "te mettais", phon: "tuh meh-teh", en: "you were starting / used to start" },
        il:   { fr: "se mettait", phon: "suh meh-teh", en: "he/she/one was starting / used to start" },
        nous: { fr: "nous mettions", phon: "noo meh-tyoh(n)", en: "we were starting / used to start" },
        vous: { fr: "vous mettiez", phon: "voo meh-tyay", en: "you were starting / used to start" },
        ils:  { fr: "se mettaient", phon: "suh meh-teh", en: "they were starting / used to start" }
      },
      futur: {
        je:   { fr: "me mettrai", phon: "muh meh-tray", en: "I will start" },
        tu:   { fr: "te mettras", phon: "tuh meh-trah", en: "you will start" },
        il:   { fr: "se mettra", phon: "suh meh-trah", en: "he/she/one will start" },
        nous: { fr: "nous mettrons", phon: "noo meh-troh(n)", en: "we will start" },
        vous: { fr: "vous mettrez", phon: "voo meh-tray", en: "you will start" },
        ils:  { fr: "se mettront", phon: "suh meh-troh(n)", en: "they will start" }
      },
      conditionnel: {
        je:   { fr: "me mettrais", phon: "muh meh-treh", en: "I would start" },
        tu:   { fr: "te mettrais", phon: "tuh meh-treh", en: "you would start" },
        il:   { fr: "se mettrait", phon: "suh meh-treh", en: "he/she/one would start" },
        nous: { fr: "nous mettrions", phon: "noo meh-tree-yoh(n)", en: "we would start" },
        vous: { fr: "vous mettriez", phon: "voo meh-tree-yay", en: "you would start" },
        ils:  { fr: "se mettraient", phon: "suh meh-treh", en: "they would start" }
      }
    }
  },

  {
    id: "connaitre",
    rank: "I14",
    type: "irregular",
    group: "irregular",
    english: "to know",
    hint: "a person, a place",
    french: "connaître",
    phonetic: "koh-neh-truh",
    conjugations: {
      present: {
        je:   { fr: "connais", phon: "koh-neh", en: "I know" },
        tu:   { fr: "connais", phon: "koh-neh", en: "you know" },
        il:   { fr: "connaît", phon: "koh-neh", en: "he/she/one knows" },
        nous: { fr: "connaissons", phon: "koh-neh-soh(n)", en: "we know" },
        vous: { fr: "connaissez", phon: "koh-neh-say", en: "you know" },
        ils:  { fr: "connaissent", phon: "koh-nes", en: "they know" }
      },
      passe_compose: {
        je:   { fr: "ai connu", phon: "ay koh-new", en: "I knew / have known" },
        tu:   { fr: "as connu", phon: "ah koh-new", en: "you knew / have known" },
        il:   { fr: "a connu", phon: "ah koh-new", en: "he/she/one knew / has known" },
        nous: { fr: "avons connu", phon: "ah-voh(n) koh-new", en: "we knew / have known" },
        vous: { fr: "avez connu", phon: "ah-vay koh-new", en: "you knew / have known" },
        ils:  { fr: "ont connu", phon: "oh(n) koh-new", en: "they knew / have known" }
      },
      imparfait: {
        je:   { fr: "connaissais", phon: "koh-neh-seh", en: "I was knowing / used to know" },
        tu:   { fr: "connaissais", phon: "koh-neh-seh", en: "you were knowing / used to know" },
        il:   { fr: "connaissait", phon: "koh-neh-seh", en: "he/she/one was knowing / used to know" },
        nous: { fr: "connaissions", phon: "koh-neh-syoh(n)", en: "we were knowing / used to know" },
        vous: { fr: "connaissiez", phon: "koh-neh-syay", en: "you were knowing / used to know" },
        ils:  { fr: "connaissaient", phon: "koh-neh-seh", en: "they were knowing / used to know" }
      },
      futur: {
        je:   { fr: "connaîtrai", phon: "koh-neh-tray", en: "I will know" },
        tu:   { fr: "connaîtras", phon: "koh-neh-trah", en: "you will know" },
        il:   { fr: "connaîtra", phon: "koh-neh-trah", en: "he/she/one will know" },
        nous: { fr: "connaîtrons", phon: "koh-neh-troh(n)", en: "we will know" },
        vous: { fr: "connaîtrez", phon: "koh-neh-tray", en: "you will know" },
        ils:  { fr: "connaîtront", phon: "koh-neh-troh(n)", en: "they will know" }
      },
      conditionnel: {
        je:   { fr: "connaîtrais", phon: "koh-neh-treh", en: "I would know" },
        tu:   { fr: "connaîtrais", phon: "koh-neh-treh", en: "you would know" },
        il:   { fr: "connaîtrait", phon: "koh-neh-treh", en: "he/she/one would know" },
        nous: { fr: "connaîtrions", phon: "koh-neh-tree-yoh(n)", en: "we would know" },
        vous: { fr: "connaîtriez", phon: "koh-neh-tree-yay", en: "you would know" },
        ils:  { fr: "connaîtraient", phon: "koh-neh-treh", en: "they would know" }
      }
    }
  },

  {
    id: "reconnaitre",
    rank: "I47",
    type: "irregular",
    group: "irregular",
    english: "to recognise",
    french: "reconnaître",
    phonetic: "ruh-koh-neh-truh",
    family: "like connaître",
    conjugations: {
      present: {
        je:   { fr: "reconnais", phon: "ruh-koh-neh", en: "I recognise" },
        tu:   { fr: "reconnais", phon: "ruh-koh-neh", en: "you recognise" },
        il:   { fr: "reconnaît", phon: "ruh-koh-neh", en: "he/she/one recognises" },
        nous: { fr: "reconnaissons", phon: "ruh-koh-neh-soh(n)", en: "we recognise" },
        vous: { fr: "reconnaissez", phon: "ruh-koh-neh-say", en: "you recognise" },
        ils:  { fr: "reconnaissent", phon: "ruh-koh-nes", en: "they recognise" }
      },
      passe_compose: {
        je:   { fr: "ai reconnu", phon: "ay ruh-koh-new", en: "I recognised / have recognised" },
        tu:   { fr: "as reconnu", phon: "ah ruh-koh-new", en: "you recognised / have recognised" },
        il:   { fr: "a reconnu", phon: "ah ruh-koh-new", en: "he/she/one recognised / has recognised" },
        nous: { fr: "avons reconnu", phon: "ah-voh(n) ruh-koh-new", en: "we recognised / have recognised" },
        vous: { fr: "avez reconnu", phon: "ah-vay ruh-koh-new", en: "you recognised / have recognised" },
        ils:  { fr: "ont reconnu", phon: "oh(n) ruh-koh-new", en: "they recognised / have recognised" }
      },
      imparfait: {
        je:   { fr: "reconnaissais", phon: "ruh-koh-neh-seh", en: "I was recognising / used to recognise" },
        tu:   { fr: "reconnaissais", phon: "ruh-koh-neh-seh", en: "you were recognising / used to recognise" },
        il:   { fr: "reconnaissait", phon: "ruh-koh-neh-seh", en: "he/she/one was recognising / used to recognise" },
        nous: { fr: "reconnaissions", phon: "ruh-koh-neh-syoh(n)", en: "we were recognising / used to recognise" },
        vous: { fr: "reconnaissiez", phon: "ruh-koh-neh-syay", en: "you were recognising / used to recognise" },
        ils:  { fr: "reconnaissaient", phon: "ruh-koh-neh-seh", en: "they were recognising / used to recognise" }
      },
      futur: {
        je:   { fr: "reconnaîtrai", phon: "ruh-koh-neh-tray", en: "I will recognise" },
        tu:   { fr: "reconnaîtras", phon: "ruh-koh-neh-trah", en: "you will recognise" },
        il:   { fr: "reconnaîtra", phon: "ruh-koh-neh-trah", en: "he/she/one will recognise" },
        nous: { fr: "reconnaîtrons", phon: "ruh-koh-neh-troh(n)", en: "we will recognise" },
        vous: { fr: "reconnaîtrez", phon: "ruh-koh-neh-tray", en: "you will recognise" },
        ils:  { fr: "reconnaîtront", phon: "ruh-koh-neh-troh(n)", en: "they will recognise" }
      },
      conditionnel: {
        je:   { fr: "reconnaîtrais", phon: "ruh-koh-neh-treh", en: "I would recognise" },
        tu:   { fr: "reconnaîtrais", phon: "ruh-koh-neh-treh", en: "you would recognise" },
        il:   { fr: "reconnaîtrait", phon: "ruh-koh-neh-treh", en: "he/she/one would recognise" },
        nous: { fr: "reconnaîtrions", phon: "ruh-koh-neh-tree-yoh(n)", en: "we would recognise" },
        vous: { fr: "reconnaîtriez", phon: "ruh-koh-neh-tree-yay", en: "you would recognise" },
        ils:  { fr: "reconnaîtraient", phon: "ruh-koh-neh-treh", en: "they would recognise" }
      }
    }
  },

  {
    id: "paraitre",
    rank: "I48",
    type: "irregular",
    group: "irregular",
    english: "to seem",
    hint: "to appear, more formal",
    french: "paraître",
    phonetic: "pah-reh-truh",
    expressions: [
      { fr: "il paraît que", phon: "eel pah-reh kuh", en: "apparently, people say that" }
    ],
    family: "like connaître",
    conjugations: {
      present: {
        je:   { fr: "parais", phon: "pah-reh", en: "I seem" },
        tu:   { fr: "parais", phon: "pah-reh", en: "you seem" },
        il:   { fr: "paraît", phon: "pah-reh", en: "he/she/one seems" },
        nous: { fr: "paraissons", phon: "pah-reh-soh(n)", en: "we seem" },
        vous: { fr: "paraissez", phon: "pah-reh-say", en: "you seem" },
        ils:  { fr: "paraissent", phon: "pah-res", en: "they seem" }
      },
      passe_compose: {
        je:   { fr: "ai paru", phon: "ay pah-rew", en: "I seemed / have seemed" },
        tu:   { fr: "as paru", phon: "ah pah-rew", en: "you seemed / have seemed" },
        il:   { fr: "a paru", phon: "ah pah-rew", en: "he/she/one seemed / has seemed" },
        nous: { fr: "avons paru", phon: "ah-voh(n) pah-rew", en: "we seemed / have seemed" },
        vous: { fr: "avez paru", phon: "ah-vay pah-rew", en: "you seemed / have seemed" },
        ils:  { fr: "ont paru", phon: "oh(n) pah-rew", en: "they seemed / have seemed" }
      },
      imparfait: {
        je:   { fr: "paraissais", phon: "pah-reh-seh", en: "I was seeming / used to seem" },
        tu:   { fr: "paraissais", phon: "pah-reh-seh", en: "you were seeming / used to seem" },
        il:   { fr: "paraissait", phon: "pah-reh-seh", en: "he/she/one was seeming / used to seem" },
        nous: { fr: "paraissions", phon: "pah-reh-syoh(n)", en: "we were seeming / used to seem" },
        vous: { fr: "paraissiez", phon: "pah-reh-syay", en: "you were seeming / used to seem" },
        ils:  { fr: "paraissaient", phon: "pah-reh-seh", en: "they were seeming / used to seem" }
      },
      futur: {
        je:   { fr: "paraîtrai", phon: "pah-reh-tray", en: "I will seem" },
        tu:   { fr: "paraîtras", phon: "pah-reh-trah", en: "you will seem" },
        il:   { fr: "paraîtra", phon: "pah-reh-trah", en: "he/she/one will seem" },
        nous: { fr: "paraîtrons", phon: "pah-reh-troh(n)", en: "we will seem" },
        vous: { fr: "paraîtrez", phon: "pah-reh-tray", en: "you will seem" },
        ils:  { fr: "paraîtront", phon: "pah-reh-troh(n)", en: "they will seem" }
      },
      conditionnel: {
        je:   { fr: "paraîtrais", phon: "pah-reh-treh", en: "I would seem" },
        tu:   { fr: "paraîtrais", phon: "pah-reh-treh", en: "you would seem" },
        il:   { fr: "paraîtrait", phon: "pah-reh-treh", en: "he/she/one would seem" },
        nous: { fr: "paraîtrions", phon: "pah-reh-tree-yoh(n)", en: "we would seem" },
        vous: { fr: "paraîtriez", phon: "pah-reh-tree-yay", en: "you would seem" },
        ils:  { fr: "paraîtraient", phon: "pah-reh-treh", en: "they would seem" }
      }
    }
  },

  {
    id: "naitre",
    rank: "I50",
    type: "irregular",
    group: "irregular",
    english: "to be born",
    french: "naître",
    phonetic: "neh-truh",
    auxiliary: "être",
    conjugations: {
      present: {
        je:   { fr: "nais", phon: "neh", en: "I am born" },
        tu:   { fr: "nais", phon: "neh", en: "you are born" },
        il:   { fr: "naît", phon: "neh", en: "he/she/one is born" },
        nous: { fr: "naissons", phon: "neh-soh(n)", en: "we are born" },
        vous: { fr: "naissez", phon: "neh-say", en: "you are born" },
        ils:  { fr: "naissent", phon: "nes", en: "they are born" }
      },
      passe_compose: {
        je:   { fr: "suis né(e)", phon: "swee nay", en: "I was born" },
        tu:   { fr: "es né(e)", phon: "eh nay", en: "you were born" },
        il:   { fr: "est né(e)", phon: "eh nay", en: "he/she/one was born" },
        nous: { fr: "sommes né(e)s", phon: "sum nay", en: "we were born" },
        vous: { fr: "êtes né(e)(s)", phon: "et nay", en: "you were born" },
        ils:  { fr: "sont né(e)s", phon: "soh(n) nay", en: "they were born" }
      },
      imparfait: {
        je:   { fr: "naissais", phon: "neh-seh", en: "I was being born" },
        tu:   { fr: "naissais", phon: "neh-seh", en: "you were being born" },
        il:   { fr: "naissait", phon: "neh-seh", en: "he/she/one was being born" },
        nous: { fr: "naissions", phon: "neh-syoh(n)", en: "we were being born" },
        vous: { fr: "naissiez", phon: "neh-syay", en: "you were being born" },
        ils:  { fr: "naissaient", phon: "neh-seh", en: "they were being born" }
      },
      futur: {
        je:   { fr: "naîtrai", phon: "neh-tray", en: "I will be born" },
        tu:   { fr: "naîtras", phon: "neh-trah", en: "you will be born" },
        il:   { fr: "naîtra", phon: "neh-trah", en: "he/she/one will be born" },
        nous: { fr: "naîtrons", phon: "neh-troh(n)", en: "we will be born" },
        vous: { fr: "naîtrez", phon: "neh-tray", en: "you will be born" },
        ils:  { fr: "naîtront", phon: "neh-troh(n)", en: "they will be born" }
      },
      conditionnel: {
        je:   { fr: "naîtrais", phon: "neh-treh", en: "I would be born" },
        tu:   { fr: "naîtrais", phon: "neh-treh", en: "you would be born" },
        il:   { fr: "naîtrait", phon: "neh-treh", en: "he/she/one would be born" },
        nous: { fr: "naîtrions", phon: "neh-tree-yoh(n)", en: "we would be born" },
        vous: { fr: "naîtriez", phon: "neh-tree-yay", en: "you would be born" },
        ils:  { fr: "naîtraient", phon: "neh-treh", en: "they would be born" }
      }
    }
  },

  {
    id: "disparaitre",
    rank: "I80",
    type: "irregular",
    group: "irregular",
    english: "to disappear",
    french: "disparaître",
    phonetic: "dees-pah-reh-truh",
    family: "like connaître",
    conjugations: {
      present: {
        je:   { fr: "disparais", phon: "dees-pah-reh", en: "I disappear" },
        tu:   { fr: "disparais", phon: "dees-pah-reh", en: "you disappear" },
        il:   { fr: "disparaît", phon: "dees-pah-reh", en: "he/she/one disappears" },
        nous: { fr: "disparaissons", phon: "dees-pah-reh-soh(n)", en: "we disappear" },
        vous: { fr: "disparaissez", phon: "dees-pah-reh-say", en: "you disappear" },
        ils:  { fr: "disparaissent", phon: "dees-pah-res", en: "they disappear" }
      },
      passe_compose: {
        je:   { fr: "ai disparu", phon: "ay dees-pah-rew", en: "I disappeared / have disappeared" },
        tu:   { fr: "as disparu", phon: "ah dees-pah-rew", en: "you disappeared / have disappeared" },
        il:   { fr: "a disparu", phon: "ah dees-pah-rew", en: "he/she/one disappeared / has disappeared" },
        nous: { fr: "avons disparu", phon: "ah-voh(n) dees-pah-rew", en: "we disappeared / have disappeared" },
        vous: { fr: "avez disparu", phon: "ah-vay dees-pah-rew", en: "you disappeared / have disappeared" },
        ils:  { fr: "ont disparu", phon: "oh(n) dees-pah-rew", en: "they disappeared / have disappeared" }
      },
      imparfait: {
        je:   { fr: "disparaissais", phon: "dees-pah-reh-seh", en: "I was disappearing / used to disappear" },
        tu:   { fr: "disparaissais", phon: "dees-pah-reh-seh", en: "you were disappearing / used to disappear" },
        il:   { fr: "disparaissait", phon: "dees-pah-reh-seh", en: "he/she/one was disappearing / used to disappear" },
        nous: { fr: "disparaissions", phon: "dees-pah-reh-syoh(n)", en: "we were disappearing / used to disappear" },
        vous: { fr: "disparaissiez", phon: "dees-pah-reh-syay", en: "you were disappearing / used to disappear" },
        ils:  { fr: "disparaissaient", phon: "dees-pah-reh-seh", en: "they were disappearing / used to disappear" }
      },
      futur: {
        je:   { fr: "disparaîtrai", phon: "dees-pah-reh-tray", en: "I will disappear" },
        tu:   { fr: "disparaîtras", phon: "dees-pah-reh-trah", en: "you will disappear" },
        il:   { fr: "disparaîtra", phon: "dees-pah-reh-trah", en: "he/she/one will disappear" },
        nous: { fr: "disparaîtrons", phon: "dees-pah-reh-troh(n)", en: "we will disappear" },
        vous: { fr: "disparaîtrez", phon: "dees-pah-reh-tray", en: "you will disappear" },
        ils:  { fr: "disparaîtront", phon: "dees-pah-reh-troh(n)", en: "they will disappear" }
      },
      conditionnel: {
        je:   { fr: "disparaîtrais", phon: "dees-pah-reh-treh", en: "I would disappear" },
        tu:   { fr: "disparaîtrais", phon: "dees-pah-reh-treh", en: "you would disappear" },
        il:   { fr: "disparaîtrait", phon: "dees-pah-reh-treh", en: "he/she/one would disappear" },
        nous: { fr: "disparaîtrions", phon: "dees-pah-reh-tree-yoh(n)", en: "we would disappear" },
        vous: { fr: "disparaîtriez", phon: "dees-pah-reh-tree-yay", en: "you would disappear" },
        ils:  { fr: "disparaîtraient", phon: "dees-pah-reh-treh", en: "they would disappear" }
      }
    }
  },

  {
    id: "suivre",
    rank: "I22",
    type: "irregular",
    group: "irregular",
    english: "to follow; to take (a course)",
    french: "suivre",
    phonetic: "swee-vruh",
    conjugations: {
      present: {
        je:   { fr: "suis", phon: "swee", en: "I follow" },
        tu:   { fr: "suis", phon: "swee", en: "you follow" },
        il:   { fr: "suit", phon: "swee", en: "he/she/one follows" },
        nous: { fr: "suivons", phon: "swee-voh(n)", en: "we follow" },
        vous: { fr: "suivez", phon: "swee-vay", en: "you follow" },
        ils:  { fr: "suivent", phon: "sweev", en: "they follow" }
      },
      passe_compose: {
        je:   { fr: "ai suivi", phon: "ay swee-vee", en: "I followed / have followed" },
        tu:   { fr: "as suivi", phon: "ah swee-vee", en: "you followed / have followed" },
        il:   { fr: "a suivi", phon: "ah swee-vee", en: "he/she/one followed / has followed" },
        nous: { fr: "avons suivi", phon: "ah-voh(n) swee-vee", en: "we followed / have followed" },
        vous: { fr: "avez suivi", phon: "ah-vay swee-vee", en: "you followed / have followed" },
        ils:  { fr: "ont suivi", phon: "oh(n) swee-vee", en: "they followed / have followed" }
      },
      imparfait: {
        je:   { fr: "suivais", phon: "swee-veh", en: "I was following / used to follow" },
        tu:   { fr: "suivais", phon: "swee-veh", en: "you were following / used to follow" },
        il:   { fr: "suivait", phon: "swee-veh", en: "he/she/one was following / used to follow" },
        nous: { fr: "suivions", phon: "swee-vyoh(n)", en: "we were following / used to follow" },
        vous: { fr: "suiviez", phon: "swee-vyay", en: "you were following / used to follow" },
        ils:  { fr: "suivaient", phon: "swee-veh", en: "they were following / used to follow" }
      },
      futur: {
        je:   { fr: "suivrai", phon: "swee-vray", en: "I will follow" },
        tu:   { fr: "suivras", phon: "swee-vrah", en: "you will follow" },
        il:   { fr: "suivra", phon: "swee-vrah", en: "he/she/one will follow" },
        nous: { fr: "suivrons", phon: "swee-vroh(n)", en: "we will follow" },
        vous: { fr: "suivrez", phon: "swee-vray", en: "you will follow" },
        ils:  { fr: "suivront", phon: "swee-vroh(n)", en: "they will follow" }
      },
      conditionnel: {
        je:   { fr: "suivrais", phon: "swee-vreh", en: "I would follow" },
        tu:   { fr: "suivrais", phon: "swee-vreh", en: "you would follow" },
        il:   { fr: "suivrait", phon: "swee-vreh", en: "he/she/one would follow" },
        nous: { fr: "suivrions", phon: "swee-vree-yoh(n)", en: "we would follow" },
        vous: { fr: "suivriez", phon: "swee-vree-yay", en: "you would follow" },
        ils:  { fr: "suivraient", phon: "swee-vreh", en: "they would follow" }
      }
    }
  },

  {
    id: "vivre",
    rank: "I21",
    type: "irregular",
    group: "irregular",
    english: "to live",
    hint: "be alive, live a life",
    french: "vivre",
    phonetic: "vee-vruh",
    conjugations: {
      present: {
        je:   { fr: "vis", phon: "vee", en: "I live" },
        tu:   { fr: "vis", phon: "vee", en: "you live" },
        il:   { fr: "vit", phon: "vee", en: "he/she/one lives" },
        nous: { fr: "vivons", phon: "vee-voh(n)", en: "we live" },
        vous: { fr: "vivez", phon: "vee-vay", en: "you live" },
        ils:  { fr: "vivent", phon: "veev", en: "they live" }
      },
      passe_compose: {
        je:   { fr: "ai vécu", phon: "ay vay-kew", en: "I lived / have lived" },
        tu:   { fr: "as vécu", phon: "ah vay-kew", en: "you lived / have lived" },
        il:   { fr: "a vécu", phon: "ah vay-kew", en: "he/she/one lived / has lived" },
        nous: { fr: "avons vécu", phon: "ah-voh(n) vay-kew", en: "we lived / have lived" },
        vous: { fr: "avez vécu", phon: "ah-vay vay-kew", en: "you lived / have lived" },
        ils:  { fr: "ont vécu", phon: "oh(n) vay-kew", en: "they lived / have lived" }
      },
      imparfait: {
        je:   { fr: "vivais", phon: "vee-veh", en: "I was living / used to live" },
        tu:   { fr: "vivais", phon: "vee-veh", en: "you were living / used to live" },
        il:   { fr: "vivait", phon: "vee-veh", en: "he/she/one was living / used to live" },
        nous: { fr: "vivions", phon: "vee-vyoh(n)", en: "we were living / used to live" },
        vous: { fr: "viviez", phon: "vee-vyay", en: "you were living / used to live" },
        ils:  { fr: "vivaient", phon: "vee-veh", en: "they were living / used to live" }
      },
      futur: {
        je:   { fr: "vivrai", phon: "vee-vray", en: "I will live" },
        tu:   { fr: "vivras", phon: "vee-vrah", en: "you will live" },
        il:   { fr: "vivra", phon: "vee-vrah", en: "he/she/one will live" },
        nous: { fr: "vivrons", phon: "vee-vroh(n)", en: "we will live" },
        vous: { fr: "vivrez", phon: "vee-vray", en: "you will live" },
        ils:  { fr: "vivront", phon: "vee-vroh(n)", en: "they will live" }
      },
      conditionnel: {
        je:   { fr: "vivrais", phon: "vee-vreh", en: "I would live" },
        tu:   { fr: "vivrais", phon: "vee-vreh", en: "you would live" },
        il:   { fr: "vivrait", phon: "vee-vreh", en: "he/she/one would live" },
        nous: { fr: "vivrions", phon: "vee-vree-yoh(n)", en: "we would live" },
        vous: { fr: "vivriez", phon: "vee-vree-yay", en: "you would live" },
        ils:  { fr: "vivraient", phon: "vee-vreh", en: "they would live" }
      }
    }
  },

  {
    id: "ecrire",
    rank: "I18",
    type: "irregular",
    group: "irregular",
    english: "to write",
    french: "écrire",
    phonetic: "ay-kreer",
    conjugations: {
      present: {
        je:   { fr: "écris", phon: "ay-kree", en: "I write" },
        tu:   { fr: "écris", phon: "ay-kree", en: "you write" },
        il:   { fr: "écrit", phon: "ay-kree", en: "he/she/one writes" },
        nous: { fr: "écrivons", phon: "ay-kree-voh(n)", en: "we write" },
        vous: { fr: "écrivez", phon: "ay-kree-vay", en: "you write" },
        ils:  { fr: "écrivent", phon: "ay-kreev", en: "they write" }
      },
      passe_compose: {
        je:   { fr: "ai écrit", phon: "ay ay-kree", en: "I wrote / have written" },
        tu:   { fr: "as écrit", phon: "ah ay-kree", en: "you wrote / have written" },
        il:   { fr: "a écrit", phon: "ah ay-kree", en: "he/she/one wrote / has written" },
        nous: { fr: "avons écrit", phon: "ah-voh(n) ay-kree", en: "we wrote / have written" },
        vous: { fr: "avez écrit", phon: "ah-vay ay-kree", en: "you wrote / have written" },
        ils:  { fr: "ont écrit", phon: "oh(n) ay-kree", en: "they wrote / have written" }
      },
      imparfait: {
        je:   { fr: "écrivais", phon: "ay-kree-veh", en: "I was writing / used to write" },
        tu:   { fr: "écrivais", phon: "ay-kree-veh", en: "you were writing / used to write" },
        il:   { fr: "écrivait", phon: "ay-kree-veh", en: "he/she/one was writing / used to write" },
        nous: { fr: "écrivions", phon: "ay-kree-vyoh(n)", en: "we were writing / used to write" },
        vous: { fr: "écriviez", phon: "ay-kree-vyay", en: "you were writing / used to write" },
        ils:  { fr: "écrivaient", phon: "ay-kree-veh", en: "they were writing / used to write" }
      },
      futur: {
        je:   { fr: "écrirai", phon: "ay-kree-ray", en: "I will write" },
        tu:   { fr: "écriras", phon: "ay-kree-rah", en: "you will write" },
        il:   { fr: "écrira", phon: "ay-kree-rah", en: "he/she/one will write" },
        nous: { fr: "écrirons", phon: "ay-kree-roh(n)", en: "we will write" },
        vous: { fr: "écrirez", phon: "ay-kree-ray", en: "you will write" },
        ils:  { fr: "écriront", phon: "ay-kree-roh(n)", en: "they will write" }
      },
      conditionnel: {
        je:   { fr: "écrirais", phon: "ay-kree-reh", en: "I would write" },
        tu:   { fr: "écrirais", phon: "ay-kree-reh", en: "you would write" },
        il:   { fr: "écrirait", phon: "ay-kree-reh", en: "he/she/one would write" },
        nous: { fr: "écririons", phon: "ay-kree-ryoh(n)", en: "we would write" },
        vous: { fr: "écririez", phon: "ay-kree-ryay", en: "you would write" },
        ils:  { fr: "écriraient", phon: "ay-kree-reh", en: "they would write" }
      }
    }
  },

  {
    id: "decrire",
    rank: "I63",
    type: "irregular",
    group: "irregular",
    english: "to describe",
    french: "décrire",
    phonetic: "day-kreer",
    family: "like écrire",
    conjugations: {
      present: {
        je:   { fr: "décris", phon: "day-kree", en: "I describe" },
        tu:   { fr: "décris", phon: "day-kree", en: "you describe" },
        il:   { fr: "décrit", phon: "day-kree", en: "he/she/one describes" },
        nous: { fr: "décrivons", phon: "day-kree-voh(n)", en: "we describe" },
        vous: { fr: "décrivez", phon: "day-kree-vay", en: "you describe" },
        ils:  { fr: "décrivent", phon: "day-kreev", en: "they describe" }
      },
      passe_compose: {
        je:   { fr: "ai décrit", phon: "ay day-kree", en: "I described / have described" },
        tu:   { fr: "as décrit", phon: "ah day-kree", en: "you described / have described" },
        il:   { fr: "a décrit", phon: "ah day-kree", en: "he/she/one described / has described" },
        nous: { fr: "avons décrit", phon: "ah-voh(n) day-kree", en: "we described / have described" },
        vous: { fr: "avez décrit", phon: "ah-vay day-kree", en: "you described / have described" },
        ils:  { fr: "ont décrit", phon: "oh(n) day-kree", en: "they described / have described" }
      },
      imparfait: {
        je:   { fr: "décrivais", phon: "day-kree-veh", en: "I was describing / used to describe" },
        tu:   { fr: "décrivais", phon: "day-kree-veh", en: "you were describing / used to describe" },
        il:   { fr: "décrivait", phon: "day-kree-veh", en: "he/she/one was describing / used to describe" },
        nous: { fr: "décrivions", phon: "day-kree-vyoh(n)", en: "we were describing / used to describe" },
        vous: { fr: "décriviez", phon: "day-kree-vyay", en: "you were describing / used to describe" },
        ils:  { fr: "décrivaient", phon: "day-kree-veh", en: "they were describing / used to describe" }
      },
      futur: {
        je:   { fr: "décrirai", phon: "day-kree-ray", en: "I will describe" },
        tu:   { fr: "décriras", phon: "day-kree-rah", en: "you will describe" },
        il:   { fr: "décrira", phon: "day-kree-rah", en: "he/she/one will describe" },
        nous: { fr: "décrirons", phon: "day-kree-roh(n)", en: "we will describe" },
        vous: { fr: "décrirez", phon: "day-kree-ray", en: "you will describe" },
        ils:  { fr: "décriront", phon: "day-kree-roh(n)", en: "they will describe" }
      },
      conditionnel: {
        je:   { fr: "décrirais", phon: "day-kree-reh", en: "I would describe" },
        tu:   { fr: "décrirais", phon: "day-kree-reh", en: "you would describe" },
        il:   { fr: "décrirait", phon: "day-kree-reh", en: "he/she/one would describe" },
        nous: { fr: "décririons", phon: "day-kree-ryoh(n)", en: "we would describe" },
        vous: { fr: "décririez", phon: "day-kree-ryay", en: "you would describe" },
        ils:  { fr: "décriraient", phon: "day-kree-reh", en: "they would describe" }
      }
    }
  },

  {
    id: "s-inscrire",
    rank: "I62",
    type: "irregular",
    group: "irregular",
    english: "to sign up, enrol",
    french: "s'inscrire",
    phonetic: "sa(n)s-kreer",
    family: "like écrire",
    auxiliary: "être",
    conjugations: {
      present: {
        je:   { fr: "m'inscris", phon: "ma(n)s-kree", en: "I sign up" },
        tu:   { fr: "t'inscris", phon: "ta(n)s-kree", en: "you sign up" },
        il:   { fr: "s'inscrit", phon: "sa(n)s-kree", en: "he/she/one signs up" },
        nous: { fr: "nous inscrivons", phon: "noo za(n)s-kree-voh(n)", en: "we sign up" },
        vous: { fr: "vous inscrivez", phon: "voo za(n)s-kree-vay", en: "you sign up" },
        ils:  { fr: "s'inscrivent", phon: "sa(n)s-kreev", en: "they sign up" }
      },
      passe_compose: {
        je:   { fr: "me suis inscrit(e)", phon: "muh swee a(n)s-kree", en: "I signed up / have signed up" },
        tu:   { fr: "t'es inscrit(e)", phon: "teh a(n)s-kree", en: "you signed up / have signed up" },
        il:   { fr: "s'est inscrit(e)", phon: "seh a(n)s-kree", en: "he/she/one signed up / has signed up" },
        nous: { fr: "nous sommes inscrit(e)s", phon: "noo sum a(n)s-kree", en: "we signed up / have signed up" },
        vous: { fr: "vous êtes inscrit(e)(s)", phon: "voo zet a(n)s-kree", en: "you signed up / have signed up" },
        ils:  { fr: "se sont inscrit(e)s", phon: "suh soh(n) a(n)s-kree", en: "they signed up / have signed up" }
      },
      imparfait: {
        je:   { fr: "m'inscrivais", phon: "ma(n)s-kree-veh", en: "I was signing up / used to sign up" },
        tu:   { fr: "t'inscrivais", phon: "ta(n)s-kree-veh", en: "you were signing up / used to sign up" },
        il:   { fr: "s'inscrivait", phon: "sa(n)s-kree-veh", en: "he/she/one was signing up / used to sign up" },
        nous: { fr: "nous inscrivions", phon: "noo za(n)s-kree-vyoh(n)", en: "we were signing up / used to sign up" },
        vous: { fr: "vous inscriviez", phon: "voo za(n)s-kree-vyay", en: "you were signing up / used to sign up" },
        ils:  { fr: "s'inscrivaient", phon: "sa(n)s-kree-veh", en: "they were signing up / used to sign up" }
      },
      futur: {
        je:   { fr: "m'inscrirai", phon: "ma(n)s-kree-ray", en: "I will sign up" },
        tu:   { fr: "t'inscriras", phon: "ta(n)s-kree-rah", en: "you will sign up" },
        il:   { fr: "s'inscrira", phon: "sa(n)s-kree-rah", en: "he/she/one will sign up" },
        nous: { fr: "nous inscrirons", phon: "noo za(n)s-kree-roh(n)", en: "we will sign up" },
        vous: { fr: "vous inscrirez", phon: "voo za(n)s-kree-ray", en: "you will sign up" },
        ils:  { fr: "s'inscriront", phon: "sa(n)s-kree-roh(n)", en: "they will sign up" }
      },
      conditionnel: {
        je:   { fr: "m'inscrirais", phon: "ma(n)s-kree-reh", en: "I would sign up" },
        tu:   { fr: "t'inscrirais", phon: "ta(n)s-kree-reh", en: "you would sign up" },
        il:   { fr: "s'inscrirait", phon: "sa(n)s-kree-reh", en: "he/she/one would sign up" },
        nous: { fr: "nous inscririons", phon: "noo za(n)s-kree-ryoh(n)", en: "we would sign up" },
        vous: { fr: "vous inscririez", phon: "voo za(n)s-kree-ryay", en: "you would sign up" },
        ils:  { fr: "s'inscriraient", phon: "sa(n)s-kree-reh", en: "they would sign up" }
      }
    }
  },

  {
    id: "s-ecrire",
    rank: "I85",
    type: "irregular",
    group: "irregular",
    english: "to write to each other",
    french: "s'écrire",
    phonetic: "say-kreer",
    family: "like écrire",
    auxiliary: "être",
    conjugations: {
      present: {
        je:   { fr: "m'écris", phon: "may-kree", en: "I write to each other" },
        tu:   { fr: "t'écris", phon: "tay-kree", en: "you write to each other" },
        il:   { fr: "s'écrit", phon: "say-kree", en: "he/she/one write to each other" },
        nous: { fr: "nous écrivons", phon: "noo zay-kree-voh(n)", en: "we write to each other" },
        vous: { fr: "vous écrivez", phon: "voo zay-kree-vay", en: "you write to each other" },
        ils:  { fr: "s'écrivent", phon: "say-kreev", en: "they write to each other" }
      },
      passe_compose: {
        je:   { fr: "me suis écrit", phon: "muh swee ay-kree", en: "I wrote to each other / have written to each other" },
        tu:   { fr: "t'es écrit", phon: "teh ay-kree", en: "you wrote to each other / have written to each other" },
        il:   { fr: "s'est écrit", phon: "seh ay-kree", en: "he/she/one wrote to each other / has written to each other" },
        nous: { fr: "nous sommes écrit", phon: "noo sum ay-kree", en: "we wrote to each other / have written to each other" },
        vous: { fr: "vous êtes écrit", phon: "voo zet ay-kree", en: "you wrote to each other / have written to each other" },
        ils:  { fr: "se sont écrit", phon: "suh soh(n) ay-kree", en: "they wrote to each other / have written to each other" }
      },
      imparfait: {
        je:   { fr: "m'écrivais", phon: "may-kree-veh", en: "I was writing to each other / used to write to each other" },
        tu:   { fr: "t'écrivais", phon: "tay-kree-veh", en: "you were writing to each other / used to write to each other" },
        il:   { fr: "s'écrivait", phon: "say-kree-veh", en: "he/she/one was writing to each other / used to write to each other" },
        nous: { fr: "nous écrivions", phon: "noo zay-kree-vyoh(n)", en: "we were writing to each other / used to write to each other" },
        vous: { fr: "vous écriviez", phon: "voo zay-kree-vyay", en: "you were writing to each other / used to write to each other" },
        ils:  { fr: "s'écrivaient", phon: "say-kree-veh", en: "they were writing to each other / used to write to each other" }
      },
      futur: {
        je:   { fr: "m'écrirai", phon: "may-kree-ray", en: "I will write to each other" },
        tu:   { fr: "t'écriras", phon: "tay-kree-rah", en: "you will write to each other" },
        il:   { fr: "s'écrira", phon: "say-kree-rah", en: "he/she/one will write to each other" },
        nous: { fr: "nous écrirons", phon: "noo zay-kree-roh(n)", en: "we will write to each other" },
        vous: { fr: "vous écrirez", phon: "voo zay-kree-ray", en: "you will write to each other" },
        ils:  { fr: "s'écriront", phon: "say-kree-roh(n)", en: "they will write to each other" }
      },
      conditionnel: {
        je:   { fr: "m'écrirais", phon: "may-kree-reh", en: "I would write to each other" },
        tu:   { fr: "t'écrirais", phon: "tay-kree-reh", en: "you would write to each other" },
        il:   { fr: "s'écrirait", phon: "say-kree-reh", en: "he/she/one would write to each other" },
        nous: { fr: "nous écririons", phon: "noo zay-kree-ryoh(n)", en: "we would write to each other" },
        vous: { fr: "vous écririez", phon: "voo zay-kree-ryay", en: "you would write to each other" },
        ils:  { fr: "s'écriraient", phon: "say-kree-reh", en: "they would write to each other" }
      }
    }
  },

  {
    id: "lire",
    rank: "I17",
    type: "irregular",
    group: "irregular",
    english: "to read",
    french: "lire",
    phonetic: "leer",
    conjugations: {
      present: {
        je:   { fr: "lis", phon: "lee", en: "I read" },
        tu:   { fr: "lis", phon: "lee", en: "you read" },
        il:   { fr: "lit", phon: "lee", en: "he/she/one reads" },
        nous: { fr: "lisons", phon: "lee-zoh(n)", en: "we read" },
        vous: { fr: "lisez", phon: "lee-zay", en: "you read" },
        ils:  { fr: "lisent", phon: "leez", en: "they read" }
      },
      passe_compose: {
        je:   { fr: "ai lu", phon: "ay lew", en: "I read / have read" },
        tu:   { fr: "as lu", phon: "ah lew", en: "you read / have read" },
        il:   { fr: "a lu", phon: "ah lew", en: "he/she/one read / has read" },
        nous: { fr: "avons lu", phon: "ah-voh(n) lew", en: "we read / have read" },
        vous: { fr: "avez lu", phon: "ah-vay lew", en: "you read / have read" },
        ils:  { fr: "ont lu", phon: "oh(n) lew", en: "they read / have read" }
      },
      imparfait: {
        je:   { fr: "lisais", phon: "lee-zeh", en: "I was reading / used to read" },
        tu:   { fr: "lisais", phon: "lee-zeh", en: "you were reading / used to read" },
        il:   { fr: "lisait", phon: "lee-zeh", en: "he/she/one was reading / used to read" },
        nous: { fr: "lisions", phon: "lee-zyoh(n)", en: "we were reading / used to read" },
        vous: { fr: "lisiez", phon: "lee-zyay", en: "you were reading / used to read" },
        ils:  { fr: "lisaient", phon: "lee-zeh", en: "they were reading / used to read" }
      },
      futur: {
        je:   { fr: "lirai", phon: "lee-ray", en: "I will read" },
        tu:   { fr: "liras", phon: "lee-rah", en: "you will read" },
        il:   { fr: "lira", phon: "lee-rah", en: "he/she/one will read" },
        nous: { fr: "lirons", phon: "lee-roh(n)", en: "we will read" },
        vous: { fr: "lirez", phon: "lee-ray", en: "you will read" },
        ils:  { fr: "liront", phon: "lee-roh(n)", en: "they will read" }
      },
      conditionnel: {
        je:   { fr: "lirais", phon: "lee-reh", en: "I would read" },
        tu:   { fr: "lirais", phon: "lee-reh", en: "you would read" },
        il:   { fr: "lirait", phon: "lee-reh", en: "he/she/one would read" },
        nous: { fr: "lirions", phon: "lee-ryoh(n)", en: "we would read" },
        vous: { fr: "liriez", phon: "lee-ryay", en: "you would read" },
        ils:  { fr: "liraient", phon: "lee-reh", en: "they would read" }
      }
    }
  },

  {
    id: "conduire",
    rank: "I39",
    type: "irregular",
    group: "irregular",
    english: "to drive",
    french: "conduire",
    phonetic: "koh(n)-dweer",
    conjugations: {
      present: {
        je:   { fr: "conduis", phon: "koh(n)-dwee", en: "I drive" },
        tu:   { fr: "conduis", phon: "koh(n)-dwee", en: "you drive" },
        il:   { fr: "conduit", phon: "koh(n)-dwee", en: "he/she/one drives" },
        nous: { fr: "conduisons", phon: "koh(n)-dwee-zoh(n)", en: "we drive" },
        vous: { fr: "conduisez", phon: "koh(n)-dwee-zay", en: "you drive" },
        ils:  { fr: "conduisent", phon: "koh(n)-dweez", en: "they drive" }
      },
      passe_compose: {
        je:   { fr: "ai conduit", phon: "ay koh(n)-dwee", en: "I drove / have driven" },
        tu:   { fr: "as conduit", phon: "ah koh(n)-dwee", en: "you drove / have driven" },
        il:   { fr: "a conduit", phon: "ah koh(n)-dwee", en: "he/she/one drove / has driven" },
        nous: { fr: "avons conduit", phon: "ah-voh(n) koh(n)-dwee", en: "we drove / have driven" },
        vous: { fr: "avez conduit", phon: "ah-vay koh(n)-dwee", en: "you drove / have driven" },
        ils:  { fr: "ont conduit", phon: "oh(n) koh(n)-dwee", en: "they drove / have driven" }
      },
      imparfait: {
        je:   { fr: "conduisais", phon: "koh(n)-dwee-zeh", en: "I was driving / used to drive" },
        tu:   { fr: "conduisais", phon: "koh(n)-dwee-zeh", en: "you were driving / used to drive" },
        il:   { fr: "conduisait", phon: "koh(n)-dwee-zeh", en: "he/she/one was driving / used to drive" },
        nous: { fr: "conduisions", phon: "koh(n)-dwee-zyoh(n)", en: "we were driving / used to drive" },
        vous: { fr: "conduisiez", phon: "koh(n)-dwee-zyay", en: "you were driving / used to drive" },
        ils:  { fr: "conduisaient", phon: "koh(n)-dwee-zeh", en: "they were driving / used to drive" }
      },
      futur: {
        je:   { fr: "conduirai", phon: "koh(n)-dwee-ray", en: "I will drive" },
        tu:   { fr: "conduiras", phon: "koh(n)-dwee-rah", en: "you will drive" },
        il:   { fr: "conduira", phon: "koh(n)-dwee-rah", en: "he/she/one will drive" },
        nous: { fr: "conduirons", phon: "koh(n)-dwee-roh(n)", en: "we will drive" },
        vous: { fr: "conduirez", phon: "koh(n)-dwee-ray", en: "you will drive" },
        ils:  { fr: "conduiront", phon: "koh(n)-dwee-roh(n)", en: "they will drive" }
      },
      conditionnel: {
        je:   { fr: "conduirais", phon: "koh(n)-dwee-reh", en: "I would drive" },
        tu:   { fr: "conduirais", phon: "koh(n)-dwee-reh", en: "you would drive" },
        il:   { fr: "conduirait", phon: "koh(n)-dwee-reh", en: "he/she/one would drive" },
        nous: { fr: "conduirions", phon: "koh(n)-dwee-ryoh(n)", en: "we would drive" },
        vous: { fr: "conduiriez", phon: "koh(n)-dwee-ryay", en: "you would drive" },
        ils:  { fr: "conduiraient", phon: "koh(n)-dwee-reh", en: "they would drive" }
      }
    }
  },

  {
    id: "construire",
    rank: "I65",
    type: "irregular",
    group: "irregular",
    english: "to build",
    french: "construire",
    phonetic: "koh(n)st-rweer",
    family: "like conduire",
    conjugations: {
      present: {
        je:   { fr: "construis", phon: "koh(n)st-rwee", en: "I build" },
        tu:   { fr: "construis", phon: "koh(n)st-rwee", en: "you build" },
        il:   { fr: "construit", phon: "koh(n)st-rwee", en: "he/she/one builds" },
        nous: { fr: "construisons", phon: "koh(n)st-rwee-zoh(n)", en: "we build" },
        vous: { fr: "construisez", phon: "koh(n)st-rwee-zay", en: "you build" },
        ils:  { fr: "construisent", phon: "koh(n)st-rweez", en: "they build" }
      },
      passe_compose: {
        je:   { fr: "ai construit", phon: "ay koh(n)st-rwee", en: "I built / have built" },
        tu:   { fr: "as construit", phon: "ah koh(n)st-rwee", en: "you built / have built" },
        il:   { fr: "a construit", phon: "ah koh(n)st-rwee", en: "he/she/one built / has built" },
        nous: { fr: "avons construit", phon: "ah-voh(n) koh(n)st-rwee", en: "we built / have built" },
        vous: { fr: "avez construit", phon: "ah-vay koh(n)st-rwee", en: "you built / have built" },
        ils:  { fr: "ont construit", phon: "oh(n) koh(n)st-rwee", en: "they built / have built" }
      },
      imparfait: {
        je:   { fr: "construisais", phon: "koh(n)st-rwee-zeh", en: "I was building / used to build" },
        tu:   { fr: "construisais", phon: "koh(n)st-rwee-zeh", en: "you were building / used to build" },
        il:   { fr: "construisait", phon: "koh(n)st-rwee-zeh", en: "he/she/one was building / used to build" },
        nous: { fr: "construisions", phon: "koh(n)st-rwee-zyoh(n)", en: "we were building / used to build" },
        vous: { fr: "construisiez", phon: "koh(n)st-rwee-zyay", en: "you were building / used to build" },
        ils:  { fr: "construisaient", phon: "koh(n)st-rwee-zeh", en: "they were building / used to build" }
      },
      futur: {
        je:   { fr: "construirai", phon: "koh(n)st-rwee-ray", en: "I will build" },
        tu:   { fr: "construiras", phon: "koh(n)st-rwee-rah", en: "you will build" },
        il:   { fr: "construira", phon: "koh(n)st-rwee-rah", en: "he/she/one will build" },
        nous: { fr: "construirons", phon: "koh(n)st-rwee-roh(n)", en: "we will build" },
        vous: { fr: "construirez", phon: "koh(n)st-rwee-ray", en: "you will build" },
        ils:  { fr: "construiront", phon: "koh(n)st-rwee-roh(n)", en: "they will build" }
      },
      conditionnel: {
        je:   { fr: "construirais", phon: "koh(n)st-rwee-reh", en: "I would build" },
        tu:   { fr: "construirais", phon: "koh(n)st-rwee-reh", en: "you would build" },
        il:   { fr: "construirait", phon: "koh(n)st-rwee-reh", en: "he/she/one would build" },
        nous: { fr: "construirions", phon: "koh(n)st-rwee-ryoh(n)", en: "we would build" },
        vous: { fr: "construiriez", phon: "koh(n)st-rwee-ryay", en: "you would build" },
        ils:  { fr: "construiraient", phon: "koh(n)st-rwee-reh", en: "they would build" }
      }
    }
  },

  {
    id: "produire",
    rank: "I66",
    type: "irregular",
    group: "irregular",
    english: "to produce",
    french: "produire",
    phonetic: "proh-dweer",
    family: "like conduire",
    conjugations: {
      present: {
        je:   { fr: "produis", phon: "proh-dwee", en: "I produce" },
        tu:   { fr: "produis", phon: "proh-dwee", en: "you produce" },
        il:   { fr: "produit", phon: "proh-dwee", en: "he/she/one produces" },
        nous: { fr: "produisons", phon: "proh-dwee-zoh(n)", en: "we produce" },
        vous: { fr: "produisez", phon: "proh-dwee-zay", en: "you produce" },
        ils:  { fr: "produisent", phon: "proh-dweez", en: "they produce" }
      },
      passe_compose: {
        je:   { fr: "ai produit", phon: "ay proh-dwee", en: "I produced / have produced" },
        tu:   { fr: "as produit", phon: "ah proh-dwee", en: "you produced / have produced" },
        il:   { fr: "a produit", phon: "ah proh-dwee", en: "he/she/one produced / has produced" },
        nous: { fr: "avons produit", phon: "ah-voh(n) proh-dwee", en: "we produced / have produced" },
        vous: { fr: "avez produit", phon: "ah-vay proh-dwee", en: "you produced / have produced" },
        ils:  { fr: "ont produit", phon: "oh(n) proh-dwee", en: "they produced / have produced" }
      },
      imparfait: {
        je:   { fr: "produisais", phon: "proh-dwee-zeh", en: "I was producing / used to produce" },
        tu:   { fr: "produisais", phon: "proh-dwee-zeh", en: "you were producing / used to produce" },
        il:   { fr: "produisait", phon: "proh-dwee-zeh", en: "he/she/one was producing / used to produce" },
        nous: { fr: "produisions", phon: "proh-dwee-zyoh(n)", en: "we were producing / used to produce" },
        vous: { fr: "produisiez", phon: "proh-dwee-zyay", en: "you were producing / used to produce" },
        ils:  { fr: "produisaient", phon: "proh-dwee-zeh", en: "they were producing / used to produce" }
      },
      futur: {
        je:   { fr: "produirai", phon: "proh-dwee-ray", en: "I will produce" },
        tu:   { fr: "produiras", phon: "proh-dwee-rah", en: "you will produce" },
        il:   { fr: "produira", phon: "proh-dwee-rah", en: "he/she/one will produce" },
        nous: { fr: "produirons", phon: "proh-dwee-roh(n)", en: "we will produce" },
        vous: { fr: "produirez", phon: "proh-dwee-ray", en: "you will produce" },
        ils:  { fr: "produiront", phon: "proh-dwee-roh(n)", en: "they will produce" }
      },
      conditionnel: {
        je:   { fr: "produirais", phon: "proh-dwee-reh", en: "I would produce" },
        tu:   { fr: "produirais", phon: "proh-dwee-reh", en: "you would produce" },
        il:   { fr: "produirait", phon: "proh-dwee-reh", en: "he/she/one would produce" },
        nous: { fr: "produirions", phon: "proh-dwee-ryoh(n)", en: "we would produce" },
        vous: { fr: "produiriez", phon: "proh-dwee-ryay", en: "you would produce" },
        ils:  { fr: "produiraient", phon: "proh-dwee-reh", en: "they would produce" }
      }
    }
  },

  {
    id: "traduire",
    rank: "I64",
    type: "irregular",
    group: "irregular",
    english: "to translate",
    french: "traduire",
    phonetic: "trah-dweer",
    family: "like conduire",
    conjugations: {
      present: {
        je:   { fr: "traduis", phon: "trah-dwee", en: "I translate" },
        tu:   { fr: "traduis", phon: "trah-dwee", en: "you translate" },
        il:   { fr: "traduit", phon: "trah-dwee", en: "he/she/one translates" },
        nous: { fr: "traduisons", phon: "trah-dwee-zoh(n)", en: "we translate" },
        vous: { fr: "traduisez", phon: "trah-dwee-zay", en: "you translate" },
        ils:  { fr: "traduisent", phon: "trah-dweez", en: "they translate" }
      },
      passe_compose: {
        je:   { fr: "ai traduit", phon: "ay trah-dwee", en: "I translated / have translated" },
        tu:   { fr: "as traduit", phon: "ah trah-dwee", en: "you translated / have translated" },
        il:   { fr: "a traduit", phon: "ah trah-dwee", en: "he/she/one translated / has translated" },
        nous: { fr: "avons traduit", phon: "ah-voh(n) trah-dwee", en: "we translated / have translated" },
        vous: { fr: "avez traduit", phon: "ah-vay trah-dwee", en: "you translated / have translated" },
        ils:  { fr: "ont traduit", phon: "oh(n) trah-dwee", en: "they translated / have translated" }
      },
      imparfait: {
        je:   { fr: "traduisais", phon: "trah-dwee-zeh", en: "I was translating / used to translate" },
        tu:   { fr: "traduisais", phon: "trah-dwee-zeh", en: "you were translating / used to translate" },
        il:   { fr: "traduisait", phon: "trah-dwee-zeh", en: "he/she/one was translating / used to translate" },
        nous: { fr: "traduisions", phon: "trah-dwee-zyoh(n)", en: "we were translating / used to translate" },
        vous: { fr: "traduisiez", phon: "trah-dwee-zyay", en: "you were translating / used to translate" },
        ils:  { fr: "traduisaient", phon: "trah-dwee-zeh", en: "they were translating / used to translate" }
      },
      futur: {
        je:   { fr: "traduirai", phon: "trah-dwee-ray", en: "I will translate" },
        tu:   { fr: "traduiras", phon: "trah-dwee-rah", en: "you will translate" },
        il:   { fr: "traduira", phon: "trah-dwee-rah", en: "he/she/one will translate" },
        nous: { fr: "traduirons", phon: "trah-dwee-roh(n)", en: "we will translate" },
        vous: { fr: "traduirez", phon: "trah-dwee-ray", en: "you will translate" },
        ils:  { fr: "traduiront", phon: "trah-dwee-roh(n)", en: "they will translate" }
      },
      conditionnel: {
        je:   { fr: "traduirais", phon: "trah-dwee-reh", en: "I would translate" },
        tu:   { fr: "traduirais", phon: "trah-dwee-reh", en: "you would translate" },
        il:   { fr: "traduirait", phon: "trah-dwee-reh", en: "he/she/one would translate" },
        nous: { fr: "traduirions", phon: "trah-dwee-ryoh(n)", en: "we would translate" },
        vous: { fr: "traduiriez", phon: "trah-dwee-ryay", en: "you would translate" },
        ils:  { fr: "traduiraient", phon: "trah-dwee-reh", en: "they would translate" }
      }
    }
  },

  {
    id: "reduire",
    rank: "I67",
    type: "irregular",
    group: "irregular",
    english: "to reduce",
    french: "réduire",
    phonetic: "ray-dweer",
    family: "like conduire",
    conjugations: {
      present: {
        je:   { fr: "réduis", phon: "ray-dwee", en: "I reduce" },
        tu:   { fr: "réduis", phon: "ray-dwee", en: "you reduce" },
        il:   { fr: "réduit", phon: "ray-dwee", en: "he/she/one reduces" },
        nous: { fr: "réduisons", phon: "ray-dwee-zoh(n)", en: "we reduce" },
        vous: { fr: "réduisez", phon: "ray-dwee-zay", en: "you reduce" },
        ils:  { fr: "réduisent", phon: "ray-dweez", en: "they reduce" }
      },
      passe_compose: {
        je:   { fr: "ai réduit", phon: "ay ray-dwee", en: "I reduced / have reduced" },
        tu:   { fr: "as réduit", phon: "ah ray-dwee", en: "you reduced / have reduced" },
        il:   { fr: "a réduit", phon: "ah ray-dwee", en: "he/she/one reduced / has reduced" },
        nous: { fr: "avons réduit", phon: "ah-voh(n) ray-dwee", en: "we reduced / have reduced" },
        vous: { fr: "avez réduit", phon: "ah-vay ray-dwee", en: "you reduced / have reduced" },
        ils:  { fr: "ont réduit", phon: "oh(n) ray-dwee", en: "they reduced / have reduced" }
      },
      imparfait: {
        je:   { fr: "réduisais", phon: "ray-dwee-zeh", en: "I was reducing / used to reduce" },
        tu:   { fr: "réduisais", phon: "ray-dwee-zeh", en: "you were reducing / used to reduce" },
        il:   { fr: "réduisait", phon: "ray-dwee-zeh", en: "he/she/one was reducing / used to reduce" },
        nous: { fr: "réduisions", phon: "ray-dwee-zyoh(n)", en: "we were reducing / used to reduce" },
        vous: { fr: "réduisiez", phon: "ray-dwee-zyay", en: "you were reducing / used to reduce" },
        ils:  { fr: "réduisaient", phon: "ray-dwee-zeh", en: "they were reducing / used to reduce" }
      },
      futur: {
        je:   { fr: "réduirai", phon: "ray-dwee-ray", en: "I will reduce" },
        tu:   { fr: "réduiras", phon: "ray-dwee-rah", en: "you will reduce" },
        il:   { fr: "réduira", phon: "ray-dwee-rah", en: "he/she/one will reduce" },
        nous: { fr: "réduirons", phon: "ray-dwee-roh(n)", en: "we will reduce" },
        vous: { fr: "réduirez", phon: "ray-dwee-ray", en: "you will reduce" },
        ils:  { fr: "réduiront", phon: "ray-dwee-roh(n)", en: "they will reduce" }
      },
      conditionnel: {
        je:   { fr: "réduirais", phon: "ray-dwee-reh", en: "I would reduce" },
        tu:   { fr: "réduirais", phon: "ray-dwee-reh", en: "you would reduce" },
        il:   { fr: "réduirait", phon: "ray-dwee-reh", en: "he/she/one would reduce" },
        nous: { fr: "réduirions", phon: "ray-dwee-ryoh(n)", en: "we would reduce" },
        vous: { fr: "réduiriez", phon: "ray-dwee-ryay", en: "you would reduce" },
        ils:  { fr: "réduiraient", phon: "ray-dwee-reh", en: "they would reduce" }
      }
    }
  },

  {
    id: "detruire",
    rank: "I68",
    type: "irregular",
    group: "irregular",
    english: "to destroy",
    french: "détruire",
    phonetic: "dayt-rweer",
    family: "like conduire",
    conjugations: {
      present: {
        je:   { fr: "détruis", phon: "dayt-rwee", en: "I destroy" },
        tu:   { fr: "détruis", phon: "dayt-rwee", en: "you destroy" },
        il:   { fr: "détruit", phon: "dayt-rwee", en: "he/she/one destroys" },
        nous: { fr: "détruisons", phon: "dayt-rwee-zoh(n)", en: "we destroy" },
        vous: { fr: "détruisez", phon: "dayt-rwee-zay", en: "you destroy" },
        ils:  { fr: "détruisent", phon: "dayt-rweez", en: "they destroy" }
      },
      passe_compose: {
        je:   { fr: "ai détruit", phon: "ay dayt-rwee", en: "I destroyed / have destroyed" },
        tu:   { fr: "as détruit", phon: "ah dayt-rwee", en: "you destroyed / have destroyed" },
        il:   { fr: "a détruit", phon: "ah dayt-rwee", en: "he/she/one destroyed / has destroyed" },
        nous: { fr: "avons détruit", phon: "ah-voh(n) dayt-rwee", en: "we destroyed / have destroyed" },
        vous: { fr: "avez détruit", phon: "ah-vay dayt-rwee", en: "you destroyed / have destroyed" },
        ils:  { fr: "ont détruit", phon: "oh(n) dayt-rwee", en: "they destroyed / have destroyed" }
      },
      imparfait: {
        je:   { fr: "détruisais", phon: "dayt-rwee-zeh", en: "I was destroying / used to destroy" },
        tu:   { fr: "détruisais", phon: "dayt-rwee-zeh", en: "you were destroying / used to destroy" },
        il:   { fr: "détruisait", phon: "dayt-rwee-zeh", en: "he/she/one was destroying / used to destroy" },
        nous: { fr: "détruisions", phon: "dayt-rwee-zyoh(n)", en: "we were destroying / used to destroy" },
        vous: { fr: "détruisiez", phon: "dayt-rwee-zyay", en: "you were destroying / used to destroy" },
        ils:  { fr: "détruisaient", phon: "dayt-rwee-zeh", en: "they were destroying / used to destroy" }
      },
      futur: {
        je:   { fr: "détruirai", phon: "dayt-rwee-ray", en: "I will destroy" },
        tu:   { fr: "détruiras", phon: "dayt-rwee-rah", en: "you will destroy" },
        il:   { fr: "détruira", phon: "dayt-rwee-rah", en: "he/she/one will destroy" },
        nous: { fr: "détruirons", phon: "dayt-rwee-roh(n)", en: "we will destroy" },
        vous: { fr: "détruirez", phon: "dayt-rwee-ray", en: "you will destroy" },
        ils:  { fr: "détruiront", phon: "dayt-rwee-roh(n)", en: "they will destroy" }
      },
      conditionnel: {
        je:   { fr: "détruirais", phon: "dayt-rwee-reh", en: "I would destroy" },
        tu:   { fr: "détruirais", phon: "dayt-rwee-reh", en: "you would destroy" },
        il:   { fr: "détruirait", phon: "dayt-rwee-reh", en: "he/she/one would destroy" },
        nous: { fr: "détruirions", phon: "dayt-rwee-ryoh(n)", en: "we would destroy" },
        vous: { fr: "détruiriez", phon: "dayt-rwee-ryay", en: "you would destroy" },
        ils:  { fr: "détruiraient", phon: "dayt-rwee-reh", en: "they would destroy" }
      }
    }
  },

  {
    id: "boire",
    rank: "I16",
    type: "irregular",
    group: "irregular",
    english: "to drink",
    french: "boire",
    phonetic: "bwahr",
    conjugations: {
      present: {
        je:   { fr: "bois", phon: "bwah", en: "I drink" },
        tu:   { fr: "bois", phon: "bwah", en: "you drink" },
        il:   { fr: "boit", phon: "bwah", en: "he/she/one drinks" },
        nous: { fr: "buvons", phon: "bew-voh(n)", en: "we drink" },
        vous: { fr: "buvez", phon: "bew-vay", en: "you drink" },
        ils:  { fr: "boivent", phon: "bwahv", en: "they drink" }
      },
      passe_compose: {
        je:   { fr: "ai bu", phon: "ay bew", en: "I drank / have drunk" },
        tu:   { fr: "as bu", phon: "ah bew", en: "you drank / have drunk" },
        il:   { fr: "a bu", phon: "ah bew", en: "he/she/one drank / has drunk" },
        nous: { fr: "avons bu", phon: "ah-voh(n) bew", en: "we drank / have drunk" },
        vous: { fr: "avez bu", phon: "ah-vay bew", en: "you drank / have drunk" },
        ils:  { fr: "ont bu", phon: "oh(n) bew", en: "they drank / have drunk" }
      },
      imparfait: {
        je:   { fr: "buvais", phon: "bew-veh", en: "I was drinking / used to drink" },
        tu:   { fr: "buvais", phon: "bew-veh", en: "you were drinking / used to drink" },
        il:   { fr: "buvait", phon: "bew-veh", en: "he/she/one was drinking / used to drink" },
        nous: { fr: "buvions", phon: "bew-vyoh(n)", en: "we were drinking / used to drink" },
        vous: { fr: "buviez", phon: "bew-vyay", en: "you were drinking / used to drink" },
        ils:  { fr: "buvaient", phon: "bew-veh", en: "they were drinking / used to drink" }
      },
      futur: {
        je:   { fr: "boirai", phon: "bwah-ray", en: "I will drink" },
        tu:   { fr: "boiras", phon: "bwah-rah", en: "you will drink" },
        il:   { fr: "boira", phon: "bwah-rah", en: "he/she/one will drink" },
        nous: { fr: "boirons", phon: "bwah-roh(n)", en: "we will drink" },
        vous: { fr: "boirez", phon: "bwah-ray", en: "you will drink" },
        ils:  { fr: "boiront", phon: "bwah-roh(n)", en: "they will drink" }
      },
      conditionnel: {
        je:   { fr: "boirais", phon: "bwah-reh", en: "I would drink" },
        tu:   { fr: "boirais", phon: "bwah-reh", en: "you would drink" },
        il:   { fr: "boirait", phon: "bwah-reh", en: "he/she/one would drink" },
        nous: { fr: "boirions", phon: "bwah-ryoh(n)", en: "we would drink" },
        vous: { fr: "boiriez", phon: "bwah-ryay", en: "you would drink" },
        ils:  { fr: "boiraient", phon: "bwah-reh", en: "they would drink" }
      }
    }
  },

  {
    id: "plaire",
    rank: "I61",
    type: "irregular",
    group: "irregular",
    english: "to please",
    french: "plaire",
    phonetic: "plehr",
    expressions: [
      { fr: "ça me plaît", phon: "sah muh pleh", en: "I like it" },
      { fr: "s'il vous plaît", phon: "seel voo pleh", en: "please (formal)" },
      { fr: "s'il te plaît", phon: "seel tuh pleh", en: "please (informal)" }
    ],
    conjugations: {
      present: {
        je:   { fr: "plais", phon: "pleh", en: "I please" },
        tu:   { fr: "plais", phon: "pleh", en: "you please" },
        il:   { fr: "plaît", phon: "pleh", en: "he/she/one pleases" },
        nous: { fr: "plaisons", phon: "pleh-zoh(n)", en: "we please" },
        vous: { fr: "plaisez", phon: "pleh-zay", en: "you please" },
        ils:  { fr: "plaisent", phon: "plez", en: "they please" }
      },
      passe_compose: {
        je:   { fr: "ai plu", phon: "ay plew", en: "I pleased / have pleased" },
        tu:   { fr: "as plu", phon: "ah plew", en: "you pleased / have pleased" },
        il:   { fr: "a plu", phon: "ah plew", en: "he/she/one pleased / has pleased" },
        nous: { fr: "avons plu", phon: "ah-voh(n) plew", en: "we pleased / have pleased" },
        vous: { fr: "avez plu", phon: "ah-vay plew", en: "you pleased / have pleased" },
        ils:  { fr: "ont plu", phon: "oh(n) plew", en: "they pleased / have pleased" }
      },
      imparfait: {
        je:   { fr: "plaisais", phon: "pleh-zeh", en: "I was pleasing / used to please" },
        tu:   { fr: "plaisais", phon: "pleh-zeh", en: "you were pleasing / used to please" },
        il:   { fr: "plaisait", phon: "pleh-zeh", en: "he/she/one was pleasing / used to please" },
        nous: { fr: "plaisions", phon: "pleh-zyoh(n)", en: "we were pleasing / used to please" },
        vous: { fr: "plaisiez", phon: "pleh-zyay", en: "you were pleasing / used to please" },
        ils:  { fr: "plaisaient", phon: "pleh-zeh", en: "they were pleasing / used to please" }
      },
      futur: {
        je:   { fr: "plairai", phon: "pleh-ray", en: "I will please" },
        tu:   { fr: "plairas", phon: "pleh-rah", en: "you will please" },
        il:   { fr: "plaira", phon: "pleh-rah", en: "he/she/one will please" },
        nous: { fr: "plairons", phon: "pleh-roh(n)", en: "we will please" },
        vous: { fr: "plairez", phon: "pleh-ray", en: "you will please" },
        ils:  { fr: "plairont", phon: "pleh-roh(n)", en: "they will please" }
      },
      conditionnel: {
        je:   { fr: "plairais", phon: "pleh-reh", en: "I would please" },
        tu:   { fr: "plairais", phon: "pleh-reh", en: "you would please" },
        il:   { fr: "plairait", phon: "pleh-reh", en: "he/she/one would please" },
        nous: { fr: "plairions", phon: "pleh-ryoh(n)", en: "we would please" },
        vous: { fr: "plairiez", phon: "pleh-ryay", en: "you would please" },
        ils:  { fr: "plairaient", phon: "pleh-reh", en: "they would please" }
      }
    }
  },

  {
    id: "se-taire",
    rank: "I58",
    type: "irregular",
    group: "irregular",
    english: "to be quiet",
    french: "se taire",
    phonetic: "suh tehr",
    auxiliary: "être",
    conjugations: {
      present: {
        je:   { fr: "me tais", phon: "muh teh", en: "I am quiet" },
        tu:   { fr: "te tais", phon: "tuh teh", en: "you are quiet" },
        il:   { fr: "se tait", phon: "suh teh", en: "he/she/one is quiet" },
        nous: { fr: "nous taisons", phon: "noo teh-zoh(n)", en: "we are quiet" },
        vous: { fr: "vous taisez", phon: "voo teh-zay", en: "you are quiet" },
        ils:  { fr: "se taisent", phon: "suh tez", en: "they are quiet" }
      },
      passe_compose: {
        je:   { fr: "me suis tu(e)", phon: "muh swee tew", en: "I was quiet / have been quiet" },
        tu:   { fr: "t'es tu(e)", phon: "teh tew", en: "you were quiet / have been quiet" },
        il:   { fr: "s'est tu(e)", phon: "seh tew", en: "he/she/one was quiet / has been quiet" },
        nous: { fr: "nous sommes tu(e)s", phon: "noo sum tew", en: "we were quiet / have been quiet" },
        vous: { fr: "vous êtes tu(e)(s)", phon: "voo zet tew", en: "you were quiet / have been quiet" },
        ils:  { fr: "se sont tu(e)s", phon: "suh soh(n) tew", en: "they were quiet / have been quiet" }
      },
      imparfait: {
        je:   { fr: "me taisais", phon: "muh teh-zeh", en: "I was quiet / used to be quiet" },
        tu:   { fr: "te taisais", phon: "tuh teh-zeh", en: "you were quiet / used to be quiet" },
        il:   { fr: "se taisait", phon: "suh teh-zeh", en: "he/she/one was quiet / used to be quiet" },
        nous: { fr: "nous taisions", phon: "noo teh-zyoh(n)", en: "we were quiet / used to be quiet" },
        vous: { fr: "vous taisiez", phon: "voo teh-zyay", en: "you were quiet / used to be quiet" },
        ils:  { fr: "se taisaient", phon: "suh teh-zeh", en: "they were quiet / used to be quiet" }
      },
      futur: {
        je:   { fr: "me tairai", phon: "muh teh-ray", en: "I will be quiet" },
        tu:   { fr: "te tairas", phon: "tuh teh-rah", en: "you will be quiet" },
        il:   { fr: "se taira", phon: "suh teh-rah", en: "he/she/one will be quiet" },
        nous: { fr: "nous tairons", phon: "noo teh-roh(n)", en: "we will be quiet" },
        vous: { fr: "vous tairez", phon: "voo teh-ray", en: "you will be quiet" },
        ils:  { fr: "se tairont", phon: "suh teh-roh(n)", en: "they will be quiet" }
      },
      conditionnel: {
        je:   { fr: "me tairais", phon: "muh teh-reh", en: "I would be quiet" },
        tu:   { fr: "te tairais", phon: "tuh teh-reh", en: "you would be quiet" },
        il:   { fr: "se tairait", phon: "suh teh-reh", en: "he/she/one would be quiet" },
        nous: { fr: "nous tairions", phon: "noo teh-ryoh(n)", en: "we would be quiet" },
        vous: { fr: "vous tairiez", phon: "voo teh-ryay", en: "you would be quiet" },
        ils:  { fr: "se tairaient", phon: "suh teh-reh", en: "they would be quiet" }
      }
    }
  },

  {
    id: "rire",
    rank: "I41",
    type: "irregular",
    group: "irregular",
    english: "to laugh",
    french: "rire",
    phonetic: "reer",
    conjugations: {
      present: {
        je:   { fr: "ris", phon: "ree", en: "I laugh" },
        tu:   { fr: "ris", phon: "ree", en: "you laugh" },
        il:   { fr: "rit", phon: "ree", en: "he/she/one laughs" },
        nous: { fr: "rions", phon: "ree-yoh(n)", en: "we laugh" },
        vous: { fr: "riez", phon: "ree-yay", en: "you laugh" },
        ils:  { fr: "rient", phon: "ree", en: "they laugh" }
      },
      passe_compose: {
        je:   { fr: "ai ri", phon: "ay ree", en: "I laughed / have laughed" },
        tu:   { fr: "as ri", phon: "ah ree", en: "you laughed / have laughed" },
        il:   { fr: "a ri", phon: "ah ree", en: "he/she/one laughed / has laughed" },
        nous: { fr: "avons ri", phon: "ah-voh(n) ree", en: "we laughed / have laughed" },
        vous: { fr: "avez ri", phon: "ah-vay ree", en: "you laughed / have laughed" },
        ils:  { fr: "ont ri", phon: "oh(n) ree", en: "they laughed / have laughed" }
      },
      imparfait: {
        je:   { fr: "riais", phon: "ree-yeh", en: "I was laughing / used to laugh" },
        tu:   { fr: "riais", phon: "ree-yeh", en: "you were laughing / used to laugh" },
        il:   { fr: "riait", phon: "ree-yeh", en: "he/she/one was laughing / used to laugh" },
        nous: { fr: "riions", phon: "ree-yoh(n)", en: "we were laughing / used to laugh" },
        vous: { fr: "riiez", phon: "ree-yay", en: "you were laughing / used to laugh" },
        ils:  { fr: "riaient", phon: "ree-yeh", en: "they were laughing / used to laugh" }
      },
      futur: {
        je:   { fr: "rirai", phon: "ree-ray", en: "I will laugh" },
        tu:   { fr: "riras", phon: "ree-rah", en: "you will laugh" },
        il:   { fr: "rira", phon: "ree-rah", en: "he/she/one will laugh" },
        nous: { fr: "rirons", phon: "ree-roh(n)", en: "we will laugh" },
        vous: { fr: "rirez", phon: "ree-ray", en: "you will laugh" },
        ils:  { fr: "riront", phon: "ree-roh(n)", en: "they will laugh" }
      },
      conditionnel: {
        je:   { fr: "rirais", phon: "ree-reh", en: "I would laugh" },
        tu:   { fr: "rirais", phon: "ree-reh", en: "you would laugh" },
        il:   { fr: "rirait", phon: "ree-reh", en: "he/she/one would laugh" },
        nous: { fr: "ririons", phon: "ree-ryoh(n)", en: "we would laugh" },
        vous: { fr: "ririez", phon: "ree-ryay", en: "you would laugh" },
        ils:  { fr: "riraient", phon: "ree-reh", en: "they would laugh" }
      }
    }
  },

  {
    id: "sourire",
    rank: "I42",
    type: "irregular",
    group: "irregular",
    english: "to smile",
    french: "sourire",
    phonetic: "soo-reer",
    conjugations: {
      present: {
        je:   { fr: "souris", phon: "soo-ree", en: "I smile" },
        tu:   { fr: "souris", phon: "soo-ree", en: "you smile" },
        il:   { fr: "sourit", phon: "soo-ree", en: "he/she/one smiles" },
        nous: { fr: "sourions", phon: "soo-ryoh(n)", en: "we smile" },
        vous: { fr: "souriez", phon: "soo-ryay", en: "you smile" },
        ils:  { fr: "sourient", phon: "soo-ree", en: "they smile" }
      },
      passe_compose: {
        je:   { fr: "ai souri", phon: "ay soo-ree", en: "I smiled / have smiled" },
        tu:   { fr: "as souri", phon: "ah soo-ree", en: "you smiled / have smiled" },
        il:   { fr: "a souri", phon: "ah soo-ree", en: "he/she/one smiled / has smiled" },
        nous: { fr: "avons souri", phon: "ah-voh(n) soo-ree", en: "we smiled / have smiled" },
        vous: { fr: "avez souri", phon: "ah-vay soo-ree", en: "you smiled / have smiled" },
        ils:  { fr: "ont souri", phon: "oh(n) soo-ree", en: "they smiled / have smiled" }
      },
      imparfait: {
        je:   { fr: "souriais", phon: "soo-ryeh", en: "I was smiling / used to smile" },
        tu:   { fr: "souriais", phon: "soo-ryeh", en: "you were smiling / used to smile" },
        il:   { fr: "souriait", phon: "soo-ryeh", en: "he/she/one was smiling / used to smile" },
        nous: { fr: "souriions", phon: "soo-ree-yoh(n)", en: "we were smiling / used to smile" },
        vous: { fr: "souriiez", phon: "soo-ree-yay", en: "you were smiling / used to smile" },
        ils:  { fr: "souriaient", phon: "soo-ryeh", en: "they were smiling / used to smile" }
      },
      futur: {
        je:   { fr: "sourirai", phon: "soo-ree-ray", en: "I will smile" },
        tu:   { fr: "souriras", phon: "soo-ree-rah", en: "you will smile" },
        il:   { fr: "sourira", phon: "soo-ree-rah", en: "he/she/one will smile" },
        nous: { fr: "sourirons", phon: "soo-ree-roh(n)", en: "we will smile" },
        vous: { fr: "sourirez", phon: "soo-ree-ray", en: "you will smile" },
        ils:  { fr: "souriront", phon: "soo-ree-roh(n)", en: "they will smile" }
      },
      conditionnel: {
        je:   { fr: "sourirais", phon: "soo-ree-reh", en: "I would smile" },
        tu:   { fr: "sourirais", phon: "soo-ree-reh", en: "you would smile" },
        il:   { fr: "sourirait", phon: "soo-ree-reh", en: "he/she/one would smile" },
        nous: { fr: "souririons", phon: "soo-ree-ryoh(n)", en: "we would smile" },
        vous: { fr: "souririez", phon: "soo-ree-ryay", en: "you would smile" },
        ils:  { fr: "souriraient", phon: "soo-ree-reh", en: "they would smile" }
      }
    }
  },

  {
    id: "eteindre",
    rank: "I69",
    type: "irregular",
    group: "irregular",
    english: "to switch off",
    french: "éteindre",
    phonetic: "ay-ta(n)-druh",
    family: "like peindre",
    conjugations: {
      present: {
        je:   { fr: "éteins", phon: "ay-ta(n)", en: "I switch off" },
        tu:   { fr: "éteins", phon: "ay-ta(n)", en: "you switch off" },
        il:   { fr: "éteint", phon: "ay-ta(n)", en: "he/she/one switches off" },
        nous: { fr: "éteignons", phon: "ay-teh-nyoh(n)", en: "we switch off" },
        vous: { fr: "éteignez", phon: "ay-teh-nyay", en: "you switch off" },
        ils:  { fr: "éteignent", phon: "ay-teny", en: "they switch off" }
      },
      passe_compose: {
        je:   { fr: "ai éteint", phon: "ay ay-ta(n)", en: "I switched off / have switched off" },
        tu:   { fr: "as éteint", phon: "ah ay-ta(n)", en: "you switched off / have switched off" },
        il:   { fr: "a éteint", phon: "ah ay-ta(n)", en: "he/she/one switched off / has switched off" },
        nous: { fr: "avons éteint", phon: "ah-voh(n) ay-ta(n)", en: "we switched off / have switched off" },
        vous: { fr: "avez éteint", phon: "ah-vay ay-ta(n)", en: "you switched off / have switched off" },
        ils:  { fr: "ont éteint", phon: "oh(n) ay-ta(n)", en: "they switched off / have switched off" }
      },
      imparfait: {
        je:   { fr: "éteignais", phon: "ay-teh-nyeh", en: "I was switching off / used to switch off" },
        tu:   { fr: "éteignais", phon: "ay-teh-nyeh", en: "you were switching off / used to switch off" },
        il:   { fr: "éteignait", phon: "ay-teh-nyeh", en: "he/she/one was switching off / used to switch off" },
        nous: { fr: "éteignions", phon: "ay-teh-nyoh(n)", en: "we were switching off / used to switch off" },
        vous: { fr: "éteigniez", phon: "ay-teh-nyay", en: "you were switching off / used to switch off" },
        ils:  { fr: "éteignaient", phon: "ay-teh-nyeh", en: "they were switching off / used to switch off" }
      },
      futur: {
        je:   { fr: "éteindrai", phon: "ay-ta(n)-dray", en: "I will switch off" },
        tu:   { fr: "éteindras", phon: "ay-ta(n)-drah", en: "you will switch off" },
        il:   { fr: "éteindra", phon: "ay-ta(n)-drah", en: "he/she/one will switch off" },
        nous: { fr: "éteindrons", phon: "ay-ta(n)-droh(n)", en: "we will switch off" },
        vous: { fr: "éteindrez", phon: "ay-ta(n)-dray", en: "you will switch off" },
        ils:  { fr: "éteindront", phon: "ay-ta(n)-droh(n)", en: "they will switch off" }
      },
      conditionnel: {
        je:   { fr: "éteindrais", phon: "ay-ta(n)-dreh", en: "I would switch off" },
        tu:   { fr: "éteindrais", phon: "ay-ta(n)-dreh", en: "you would switch off" },
        il:   { fr: "éteindrait", phon: "ay-ta(n)-dreh", en: "he/she/one would switch off" },
        nous: { fr: "éteindrions", phon: "ay-ta(n)-dree-yoh(n)", en: "we would switch off" },
        vous: { fr: "éteindriez", phon: "ay-ta(n)-dree-yay", en: "you would switch off" },
        ils:  { fr: "éteindraient", phon: "ay-ta(n)-dreh", en: "they would switch off" }
      }
    }
  },

  {
    id: "peindre",
    rank: "I88",
    type: "irregular",
    group: "irregular",
    english: "to paint",
    french: "peindre",
    phonetic: "pa(n)-druh",
    conjugations: {
      present: {
        je:   { fr: "peins", phon: "pa(n)", en: "I paint" },
        tu:   { fr: "peins", phon: "pa(n)", en: "you paint" },
        il:   { fr: "peint", phon: "pa(n)", en: "he/she/one paints" },
        nous: { fr: "peignons", phon: "peh-nyoh(n)", en: "we paint" },
        vous: { fr: "peignez", phon: "peh-nyay", en: "you paint" },
        ils:  { fr: "peignent", phon: "peny", en: "they paint" }
      },
      passe_compose: {
        je:   { fr: "ai peint", phon: "ay pa(n)", en: "I painted / have painted" },
        tu:   { fr: "as peint", phon: "ah pa(n)", en: "you painted / have painted" },
        il:   { fr: "a peint", phon: "ah pa(n)", en: "he/she/one painted / has painted" },
        nous: { fr: "avons peint", phon: "ah-voh(n) pa(n)", en: "we painted / have painted" },
        vous: { fr: "avez peint", phon: "ah-vay pa(n)", en: "you painted / have painted" },
        ils:  { fr: "ont peint", phon: "oh(n) pa(n)", en: "they painted / have painted" }
      },
      imparfait: {
        je:   { fr: "peignais", phon: "peh-nyeh", en: "I was painting / used to paint" },
        tu:   { fr: "peignais", phon: "peh-nyeh", en: "you were painting / used to paint" },
        il:   { fr: "peignait", phon: "peh-nyeh", en: "he/she/one was painting / used to paint" },
        nous: { fr: "peignions", phon: "peh-nyoh(n)", en: "we were painting / used to paint" },
        vous: { fr: "peigniez", phon: "peh-nyay", en: "you were painting / used to paint" },
        ils:  { fr: "peignaient", phon: "peh-nyeh", en: "they were painting / used to paint" }
      },
      futur: {
        je:   { fr: "peindrai", phon: "pa(n)-dray", en: "I will paint" },
        tu:   { fr: "peindras", phon: "pa(n)-drah", en: "you will paint" },
        il:   { fr: "peindra", phon: "pa(n)-drah", en: "he/she/one will paint" },
        nous: { fr: "peindrons", phon: "pa(n)-droh(n)", en: "we will paint" },
        vous: { fr: "peindrez", phon: "pa(n)-dray", en: "you will paint" },
        ils:  { fr: "peindront", phon: "pa(n)-droh(n)", en: "they will paint" }
      },
      conditionnel: {
        je:   { fr: "peindrais", phon: "pa(n)-dreh", en: "I would paint" },
        tu:   { fr: "peindrais", phon: "pa(n)-dreh", en: "you would paint" },
        il:   { fr: "peindrait", phon: "pa(n)-dreh", en: "he/she/one would paint" },
        nous: { fr: "peindrions", phon: "pa(n)-dree-yoh(n)", en: "we would paint" },
        vous: { fr: "peindriez", phon: "pa(n)-dree-yay", en: "you would paint" },
        ils:  { fr: "peindraient", phon: "pa(n)-dreh", en: "they would paint" }
      }
    }
  },

  {
    id: "craindre",
    rank: "I89",
    type: "irregular",
    group: "irregular",
    english: "to fear",
    french: "craindre",
    phonetic: "kra(n)-druh",
    family: "like peindre",
    conjugations: {
      present: {
        je:   { fr: "crains", phon: "kra(n)", en: "I fear" },
        tu:   { fr: "crains", phon: "kra(n)", en: "you fear" },
        il:   { fr: "craint", phon: "kra(n)", en: "he/she/one fears" },
        nous: { fr: "craignons", phon: "kreh-nyoh(n)", en: "we fear" },
        vous: { fr: "craignez", phon: "kreh-nyay", en: "you fear" },
        ils:  { fr: "craignent", phon: "kreny", en: "they fear" }
      },
      passe_compose: {
        je:   { fr: "ai craint", phon: "ay kra(n)", en: "I feared / have feared" },
        tu:   { fr: "as craint", phon: "ah kra(n)", en: "you feared / have feared" },
        il:   { fr: "a craint", phon: "ah kra(n)", en: "he/she/one feared / has feared" },
        nous: { fr: "avons craint", phon: "ah-voh(n) kra(n)", en: "we feared / have feared" },
        vous: { fr: "avez craint", phon: "ah-vay kra(n)", en: "you feared / have feared" },
        ils:  { fr: "ont craint", phon: "oh(n) kra(n)", en: "they feared / have feared" }
      },
      imparfait: {
        je:   { fr: "craignais", phon: "kreh-nyeh", en: "I was fearing / used to fear" },
        tu:   { fr: "craignais", phon: "kreh-nyeh", en: "you were fearing / used to fear" },
        il:   { fr: "craignait", phon: "kreh-nyeh", en: "he/she/one was fearing / used to fear" },
        nous: { fr: "craignions", phon: "kreh-nyoh(n)", en: "we were fearing / used to fear" },
        vous: { fr: "craigniez", phon: "kreh-nyay", en: "you were fearing / used to fear" },
        ils:  { fr: "craignaient", phon: "kreh-nyeh", en: "they were fearing / used to fear" }
      },
      futur: {
        je:   { fr: "craindrai", phon: "kra(n)-dray", en: "I will fear" },
        tu:   { fr: "craindras", phon: "kra(n)-drah", en: "you will fear" },
        il:   { fr: "craindra", phon: "kra(n)-drah", en: "he/she/one will fear" },
        nous: { fr: "craindrons", phon: "kra(n)-droh(n)", en: "we will fear" },
        vous: { fr: "craindrez", phon: "kra(n)-dray", en: "you will fear" },
        ils:  { fr: "craindront", phon: "kra(n)-droh(n)", en: "they will fear" }
      },
      conditionnel: {
        je:   { fr: "craindrais", phon: "kra(n)-dreh", en: "I would fear" },
        tu:   { fr: "craindrais", phon: "kra(n)-dreh", en: "you would fear" },
        il:   { fr: "craindrait", phon: "kra(n)-dreh", en: "he/she/one would fear" },
        nous: { fr: "craindrions", phon: "kra(n)-dree-yoh(n)", en: "we would fear" },
        vous: { fr: "craindriez", phon: "kra(n)-dree-yay", en: "you would fear" },
        ils:  { fr: "craindraient", phon: "kra(n)-dreh", en: "they would fear" }
      }
    }
  },

  {
    id: "rejoindre",
    rank: "I38",
    type: "irregular",
    group: "irregular",
    english: "to join",
    hint: "meet up with someone",
    french: "rejoindre",
    phonetic: "ruh-zhwa(n)-druh",
    family: "like peindre",
    conjugations: {
      present: {
        je:   { fr: "rejoins", phon: "ruh-zhwa(n)", en: "I join" },
        tu:   { fr: "rejoins", phon: "ruh-zhwa(n)", en: "you join" },
        il:   { fr: "rejoint", phon: "ruh-zhwa(n)", en: "he/she/one joins" },
        nous: { fr: "rejoignons", phon: "ruh-zhwah-nyoh(n)", en: "we join" },
        vous: { fr: "rejoignez", phon: "ruh-zhwah-nyay", en: "you join" },
        ils:  { fr: "rejoignent", phon: "ruh-zhwahny", en: "they join" }
      },
      passe_compose: {
        je:   { fr: "ai rejoint", phon: "ay ruh-zhwa(n)", en: "I joined / have joined" },
        tu:   { fr: "as rejoint", phon: "ah ruh-zhwa(n)", en: "you joined / have joined" },
        il:   { fr: "a rejoint", phon: "ah ruh-zhwa(n)", en: "he/she/one joined / has joined" },
        nous: { fr: "avons rejoint", phon: "ah-voh(n) ruh-zhwa(n)", en: "we joined / have joined" },
        vous: { fr: "avez rejoint", phon: "ah-vay ruh-zhwa(n)", en: "you joined / have joined" },
        ils:  { fr: "ont rejoint", phon: "oh(n) ruh-zhwa(n)", en: "they joined / have joined" }
      },
      imparfait: {
        je:   { fr: "rejoignais", phon: "ruh-zhwah-nyeh", en: "I was joining / used to join" },
        tu:   { fr: "rejoignais", phon: "ruh-zhwah-nyeh", en: "you were joining / used to join" },
        il:   { fr: "rejoignait", phon: "ruh-zhwah-nyeh", en: "he/she/one was joining / used to join" },
        nous: { fr: "rejoignions", phon: "ruh-zhwah-nyoh(n)", en: "we were joining / used to join" },
        vous: { fr: "rejoigniez", phon: "ruh-zhwah-nyay", en: "you were joining / used to join" },
        ils:  { fr: "rejoignaient", phon: "ruh-zhwah-nyeh", en: "they were joining / used to join" }
      },
      futur: {
        je:   { fr: "rejoindrai", phon: "ruh-zhwa(n)-dray", en: "I will join" },
        tu:   { fr: "rejoindras", phon: "ruh-zhwa(n)-drah", en: "you will join" },
        il:   { fr: "rejoindra", phon: "ruh-zhwa(n)-drah", en: "he/she/one will join" },
        nous: { fr: "rejoindrons", phon: "ruh-zhwa(n)-droh(n)", en: "we will join" },
        vous: { fr: "rejoindrez", phon: "ruh-zhwa(n)-dray", en: "you will join" },
        ils:  { fr: "rejoindront", phon: "ruh-zhwa(n)-droh(n)", en: "they will join" }
      },
      conditionnel: {
        je:   { fr: "rejoindrais", phon: "ruh-zhwa(n)-dreh", en: "I would join" },
        tu:   { fr: "rejoindrais", phon: "ruh-zhwa(n)-dreh", en: "you would join" },
        il:   { fr: "rejoindrait", phon: "ruh-zhwa(n)-dreh", en: "he/she/one would join" },
        nous: { fr: "rejoindrions", phon: "ruh-zhwa(n)-dree-yoh(n)", en: "we would join" },
        vous: { fr: "rejoindriez", phon: "ruh-zhwa(n)-dree-yay", en: "you would join" },
        ils:  { fr: "rejoindraient", phon: "ruh-zhwa(n)-dreh", en: "they would join" }
      }
    }
  },

  {
    id: "joindre",
    rank: "I70",
    type: "irregular",
    group: "irregular",
    english: "to join",
    hint: "attach; get hold of someone",
    french: "joindre",
    phonetic: "zhwa(n)-druh",
    family: "like peindre",
    conjugations: {
      present: {
        je:   { fr: "joins", phon: "zhwa(n)", en: "I join" },
        tu:   { fr: "joins", phon: "zhwa(n)", en: "you join" },
        il:   { fr: "joint", phon: "zhwa(n)", en: "he/she/one joins" },
        nous: { fr: "joignons", phon: "zhwah-nyoh(n)", en: "we join" },
        vous: { fr: "joignez", phon: "zhwah-nyay", en: "you join" },
        ils:  { fr: "joignent", phon: "zhwahny", en: "they join" }
      },
      passe_compose: {
        je:   { fr: "ai joint", phon: "ay zhwa(n)", en: "I joined / have joined" },
        tu:   { fr: "as joint", phon: "ah zhwa(n)", en: "you joined / have joined" },
        il:   { fr: "a joint", phon: "ah zhwa(n)", en: "he/she/one joined / has joined" },
        nous: { fr: "avons joint", phon: "ah-voh(n) zhwa(n)", en: "we joined / have joined" },
        vous: { fr: "avez joint", phon: "ah-vay zhwa(n)", en: "you joined / have joined" },
        ils:  { fr: "ont joint", phon: "oh(n) zhwa(n)", en: "they joined / have joined" }
      },
      imparfait: {
        je:   { fr: "joignais", phon: "zhwah-nyeh", en: "I was joining / used to join" },
        tu:   { fr: "joignais", phon: "zhwah-nyeh", en: "you were joining / used to join" },
        il:   { fr: "joignait", phon: "zhwah-nyeh", en: "he/she/one was joining / used to join" },
        nous: { fr: "joignions", phon: "zhwah-nyoh(n)", en: "we were joining / used to join" },
        vous: { fr: "joigniez", phon: "zhwah-nyay", en: "you were joining / used to join" },
        ils:  { fr: "joignaient", phon: "zhwah-nyeh", en: "they were joining / used to join" }
      },
      futur: {
        je:   { fr: "joindrai", phon: "zhwa(n)-dray", en: "I will join" },
        tu:   { fr: "joindras", phon: "zhwa(n)-drah", en: "you will join" },
        il:   { fr: "joindra", phon: "zhwa(n)-drah", en: "he/she/one will join" },
        nous: { fr: "joindrons", phon: "zhwa(n)-droh(n)", en: "we will join" },
        vous: { fr: "joindrez", phon: "zhwa(n)-dray", en: "you will join" },
        ils:  { fr: "joindront", phon: "zhwa(n)-droh(n)", en: "they will join" }
      },
      conditionnel: {
        je:   { fr: "joindrais", phon: "zhwa(n)-dreh", en: "I would join" },
        tu:   { fr: "joindrais", phon: "zhwa(n)-dreh", en: "you would join" },
        il:   { fr: "joindrait", phon: "zhwa(n)-dreh", en: "he/she/one would join" },
        nous: { fr: "joindrions", phon: "zhwa(n)-dree-yoh(n)", en: "we would join" },
        vous: { fr: "joindriez", phon: "zhwa(n)-dree-yay", en: "you would join" },
        ils:  { fr: "joindraient", phon: "zhwa(n)-dreh", en: "they would join" }
      }
    }
  },

  {
    id: "se-plaindre",
    rank: "I60",
    type: "irregular",
    group: "irregular",
    english: "to complain",
    french: "se plaindre",
    phonetic: "suh pla(n)-druh",
    family: "like peindre",
    auxiliary: "être",
    conjugations: {
      present: {
        je:   { fr: "me plains", phon: "muh pla(n)", en: "I complain" },
        tu:   { fr: "te plains", phon: "tuh pla(n)", en: "you complain" },
        il:   { fr: "se plaint", phon: "suh pla(n)", en: "he/she/one complains" },
        nous: { fr: "nous plaignons", phon: "noo pleh-nyoh(n)", en: "we complain" },
        vous: { fr: "vous plaignez", phon: "voo pleh-nyay", en: "you complain" },
        ils:  { fr: "se plaignent", phon: "suh pleny", en: "they complain" }
      },
      passe_compose: {
        je:   { fr: "me suis plaint(e)", phon: "muh swee pla(n)", en: "I complained / have complained" },
        tu:   { fr: "t'es plaint(e)", phon: "teh pla(n)", en: "you complained / have complained" },
        il:   { fr: "s'est plaint(e)", phon: "seh pla(n)", en: "he/she/one complained / has complained" },
        nous: { fr: "nous sommes plaint(e)s", phon: "noo sum pla(n)", en: "we complained / have complained" },
        vous: { fr: "vous êtes plaint(e)(s)", phon: "voo zet pla(n)", en: "you complained / have complained" },
        ils:  { fr: "se sont plaint(e)s", phon: "suh soh(n) pla(n)", en: "they complained / have complained" }
      },
      imparfait: {
        je:   { fr: "me plaignais", phon: "muh pleh-nyeh", en: "I was complaining / used to complain" },
        tu:   { fr: "te plaignais", phon: "tuh pleh-nyeh", en: "you were complaining / used to complain" },
        il:   { fr: "se plaignait", phon: "suh pleh-nyeh", en: "he/she/one was complaining / used to complain" },
        nous: { fr: "nous plaignions", phon: "noo pleh-nyoh(n)", en: "we were complaining / used to complain" },
        vous: { fr: "vous plaigniez", phon: "voo pleh-nyay", en: "you were complaining / used to complain" },
        ils:  { fr: "se plaignaient", phon: "suh pleh-nyeh", en: "they were complaining / used to complain" }
      },
      futur: {
        je:   { fr: "me plaindrai", phon: "muh pla(n)-dray", en: "I will complain" },
        tu:   { fr: "te plaindras", phon: "tuh pla(n)-drah", en: "you will complain" },
        il:   { fr: "se plaindra", phon: "suh pla(n)-drah", en: "he/she/one will complain" },
        nous: { fr: "nous plaindrons", phon: "noo pla(n)-droh(n)", en: "we will complain" },
        vous: { fr: "vous plaindrez", phon: "voo pla(n)-dray", en: "you will complain" },
        ils:  { fr: "se plaindront", phon: "suh pla(n)-droh(n)", en: "they will complain" }
      },
      conditionnel: {
        je:   { fr: "me plaindrais", phon: "muh pla(n)-dreh", en: "I would complain" },
        tu:   { fr: "te plaindrais", phon: "tuh pla(n)-dreh", en: "you would complain" },
        il:   { fr: "se plaindrait", phon: "suh pla(n)-dreh", en: "he/she/one would complain" },
        nous: { fr: "nous plaindrions", phon: "noo pla(n)-dree-yoh(n)", en: "we would complain" },
        vous: { fr: "vous plaindriez", phon: "voo pla(n)-dree-yay", en: "you would complain" },
        ils:  { fr: "se plaindraient", phon: "suh pla(n)-dreh", en: "they would complain" }
      }
    }
  },

  {
    id: "interrompre",
    rank: "I71",
    type: "irregular",
    group: "irregular",
    english: "to interrupt",
    french: "interrompre",
    phonetic: "a(n)-teh-roh(n)-pruh",
    conjugations: {
      present: {
        je:   { fr: "interromps", phon: "a(n)-teh-roh(n)", en: "I interrupt" },
        tu:   { fr: "interromps", phon: "a(n)-teh-roh(n)", en: "you interrupt" },
        il:   { fr: "interrompt", phon: "a(n)-teh-roh(n)", en: "he/she/one interrupts" },
        nous: { fr: "interrompons", phon: "a(n)-teh-roh(n)-poh(n)", en: "we interrupt" },
        vous: { fr: "interrompez", phon: "a(n)-teh-roh(n)-pay", en: "you interrupt" },
        ils:  { fr: "interrompent", phon: "a(n)-teh-roh(n)p", en: "they interrupt" }
      },
      passe_compose: {
        je:   { fr: "ai interrompu", phon: "ay a(n)-teh-roh(n)-pew", en: "I interrupted / have interrupted" },
        tu:   { fr: "as interrompu", phon: "ah a(n)-teh-roh(n)-pew", en: "you interrupted / have interrupted" },
        il:   { fr: "a interrompu", phon: "ah a(n)-teh-roh(n)-pew", en: "he/she/one interrupted / has interrupted" },
        nous: { fr: "avons interrompu", phon: "ah-voh(n) a(n)-teh-roh(n)-pew", en: "we interrupted / have interrupted" },
        vous: { fr: "avez interrompu", phon: "ah-vay a(n)-teh-roh(n)-pew", en: "you interrupted / have interrupted" },
        ils:  { fr: "ont interrompu", phon: "oh(n) a(n)-teh-roh(n)-pew", en: "they interrupted / have interrupted" }
      },
      imparfait: {
        je:   { fr: "interrompais", phon: "a(n)-teh-roh(n)-peh", en: "I was interrupting / used to interrupt" },
        tu:   { fr: "interrompais", phon: "a(n)-teh-roh(n)-peh", en: "you were interrupting / used to interrupt" },
        il:   { fr: "interrompait", phon: "a(n)-teh-roh(n)-peh", en: "he/she/one was interrupting / used to interrupt" },
        nous: { fr: "interrompions", phon: "a(n)-teh-roh(n)-pyoh(n)", en: "we were interrupting / used to interrupt" },
        vous: { fr: "interrompiez", phon: "a(n)-teh-roh(n)-pyay", en: "you were interrupting / used to interrupt" },
        ils:  { fr: "interrompaient", phon: "a(n)-teh-roh(n)-peh", en: "they were interrupting / used to interrupt" }
      },
      futur: {
        je:   { fr: "interromprai", phon: "a(n)-teh-roh(n)-pray", en: "I will interrupt" },
        tu:   { fr: "interrompras", phon: "a(n)-teh-roh(n)-prah", en: "you will interrupt" },
        il:   { fr: "interrompra", phon: "a(n)-teh-roh(n)-prah", en: "he/she/one will interrupt" },
        nous: { fr: "interromprons", phon: "a(n)-teh-roh(n)-proh(n)", en: "we will interrupt" },
        vous: { fr: "interromprez", phon: "a(n)-teh-roh(n)-pray", en: "you will interrupt" },
        ils:  { fr: "interrompront", phon: "a(n)-teh-roh(n)-proh(n)", en: "they will interrupt" }
      },
      conditionnel: {
        je:   { fr: "interromprais", phon: "a(n)-teh-roh(n)-preh", en: "I would interrupt" },
        tu:   { fr: "interromprais", phon: "a(n)-teh-roh(n)-preh", en: "you would interrupt" },
        il:   { fr: "interromprait", phon: "a(n)-teh-roh(n)-preh", en: "he/she/one would interrupt" },
        nous: { fr: "interromprions", phon: "a(n)-teh-roh(n)-pree-yoh(n)", en: "we would interrupt" },
        vous: { fr: "interrompriez", phon: "a(n)-teh-roh(n)-pree-yay", en: "you would interrupt" },
        ils:  { fr: "interrompraient", phon: "a(n)-teh-roh(n)-preh", en: "they would interrupt" }
      }
    }
  },

  {
    id: "suffire",
    rank: "I72",
    type: "irregular",
    group: "irregular",
    english: "to be enough",
    french: "suffire",
    phonetic: "sew-feer",
    expressions: [
      { fr: "ça suffit", phon: "sah sew-fee", en: "that's enough" },
      { fr: "il suffit de", phon: "eel sew-fee duh", en: "all you need to do is" }
    ],
    conjugations: {
      present: {
        je:   { fr: "suffis", phon: "sew-fee", en: "I am enough" },
        tu:   { fr: "suffis", phon: "sew-fee", en: "you are enough" },
        il:   { fr: "suffit", phon: "sew-fee", en: "he/she/one is enough" },
        nous: { fr: "suffisons", phon: "sew-fee-zoh(n)", en: "we are enough" },
        vous: { fr: "suffisez", phon: "sew-fee-zay", en: "you are enough" },
        ils:  { fr: "suffisent", phon: "sew-feez", en: "they are enough" }
      },
      passe_compose: {
        je:   { fr: "ai suffi", phon: "ay sew-fee", en: "I was enough / have been enough" },
        tu:   { fr: "as suffi", phon: "ah sew-fee", en: "you were enough / have been enough" },
        il:   { fr: "a suffi", phon: "ah sew-fee", en: "he/she/one was enough / has been enough" },
        nous: { fr: "avons suffi", phon: "ah-voh(n) sew-fee", en: "we were enough / have been enough" },
        vous: { fr: "avez suffi", phon: "ah-vay sew-fee", en: "you were enough / have been enough" },
        ils:  { fr: "ont suffi", phon: "oh(n) sew-fee", en: "they were enough / have been enough" }
      },
      imparfait: {
        je:   { fr: "suffisais", phon: "sew-fee-zeh", en: "I was enough / used to be enough" },
        tu:   { fr: "suffisais", phon: "sew-fee-zeh", en: "you were enough / used to be enough" },
        il:   { fr: "suffisait", phon: "sew-fee-zeh", en: "he/she/one was enough / used to be enough" },
        nous: { fr: "suffisions", phon: "sew-fee-zyoh(n)", en: "we were enough / used to be enough" },
        vous: { fr: "suffisiez", phon: "sew-fee-zyay", en: "you were enough / used to be enough" },
        ils:  { fr: "suffisaient", phon: "sew-fee-zeh", en: "they were enough / used to be enough" }
      },
      futur: {
        je:   { fr: "suffirai", phon: "sew-fee-ray", en: "I will be enough" },
        tu:   { fr: "suffiras", phon: "sew-fee-rah", en: "you will be enough" },
        il:   { fr: "suffira", phon: "sew-fee-rah", en: "he/she/one will be enough" },
        nous: { fr: "suffirons", phon: "sew-fee-roh(n)", en: "we will be enough" },
        vous: { fr: "suffirez", phon: "sew-fee-ray", en: "you will be enough" },
        ils:  { fr: "suffiront", phon: "sew-fee-roh(n)", en: "they will be enough" }
      },
      conditionnel: {
        je:   { fr: "suffirais", phon: "sew-fee-reh", en: "I would be enough" },
        tu:   { fr: "suffirais", phon: "sew-fee-reh", en: "you would be enough" },
        il:   { fr: "suffirait", phon: "sew-fee-reh", en: "he/she/one would be enough" },
        nous: { fr: "suffirions", phon: "sew-fee-ryoh(n)", en: "we would be enough" },
        vous: { fr: "suffiriez", phon: "sew-fee-ryay", en: "you would be enough" },
        ils:  { fr: "suffiraient", phon: "sew-fee-reh", en: "they would be enough" }
      }
    }
  },

  {
    id: "pouvoir",
    rank: "I05.5",
    type: "irregular",
    group: "irregular",
    english: "can, to be able",
    french: "pouvoir",
    phonetic: "poo-vwahr",
    conjugations: {
      present: {
        je:   { fr: "peux", phon: "puh", en: "I can" },
        tu:   { fr: "peux", phon: "puh", en: "you can" },
        il:   { fr: "peut", phon: "puh", en: "he/she/one can" },
        nous: { fr: "pouvons", phon: "poo-voh(n)", en: "we can" },
        vous: { fr: "pouvez", phon: "poo-vay", en: "you can" },
        ils:  { fr: "peuvent", phon: "puhv", en: "they can" }
      },
      passe_compose: {
        je:   { fr: "ai pu", phon: "ay pew", en: "I could / have been able to" },
        tu:   { fr: "as pu", phon: "ah pew", en: "you could / have been able to" },
        il:   { fr: "a pu", phon: "ah pew", en: "he/she/one could / has been able to" },
        nous: { fr: "avons pu", phon: "ah-voh(n) pew", en: "we could / have been able to" },
        vous: { fr: "avez pu", phon: "ah-vay pew", en: "you could / have been able to" },
        ils:  { fr: "ont pu", phon: "oh(n) pew", en: "they could / have been able to" }
      },
      imparfait: {
        je:   { fr: "pouvais", phon: "poo-veh", en: "I could / used to be able to" },
        tu:   { fr: "pouvais", phon: "poo-veh", en: "you could / used to be able to" },
        il:   { fr: "pouvait", phon: "poo-veh", en: "he/she/one could / used to be able to" },
        nous: { fr: "pouvions", phon: "poo-vyoh(n)", en: "we could / used to be able to" },
        vous: { fr: "pouviez", phon: "poo-vyay", en: "you could / used to be able to" },
        ils:  { fr: "pouvaient", phon: "poo-veh", en: "they could / used to be able to" }
      },
      futur: {
        je:   { fr: "pourrai", phon: "poo-ray", en: "I will be able to" },
        tu:   { fr: "pourras", phon: "poo-rah", en: "you will be able to" },
        il:   { fr: "pourra", phon: "poo-rah", en: "he/she/one will be able to" },
        nous: { fr: "pourrons", phon: "poo-roh(n)", en: "we will be able to" },
        vous: { fr: "pourrez", phon: "poo-ray", en: "you will be able to" },
        ils:  { fr: "pourront", phon: "poo-roh(n)", en: "they will be able to" }
      },
      conditionnel: {
        je:   { fr: "pourrais", phon: "poo-reh", en: "I could / would be able to" },
        tu:   { fr: "pourrais", phon: "poo-reh", en: "you could / would be able to" },
        il:   { fr: "pourrait", phon: "poo-reh", en: "he/she/one could / would be able to" },
        nous: { fr: "pourrions", phon: "poo-ryoh(n)", en: "we could / would be able to" },
        vous: { fr: "pourriez", phon: "poo-ryay", en: "you could / would be able to" },
        ils:  { fr: "pourraient", phon: "poo-reh", en: "they could / would be able to" }
      }
    }
  },

  {
    id: "devoir",
    rank: "I10.5",
    type: "irregular",
    group: "irregular",
    english: "must, to have to; to owe",
    french: "devoir",
    phonetic: "duh-vwahr",
    conjugations: {
      present: {
        je:   { fr: "dois", phon: "dwah", en: "I must / have to" },
        tu:   { fr: "dois", phon: "dwah", en: "you must / have to" },
        il:   { fr: "doit", phon: "dwah", en: "he/she/one must / has to" },
        nous: { fr: "devons", phon: "duh-voh(n)", en: "we must / have to" },
        vous: { fr: "devez", phon: "duh-vay", en: "you must / have to" },
        ils:  { fr: "doivent", phon: "dwahv", en: "they must / have to" }
      },
      passe_compose: {
        je:   { fr: "ai dû", phon: "ay dew", en: "I had to / must have" },
        tu:   { fr: "as dû", phon: "ah dew", en: "you had to / must have" },
        il:   { fr: "a dû", phon: "ah dew", en: "he/she/one had to / must have" },
        nous: { fr: "avons dû", phon: "ah-voh(n) dew", en: "we had to / must have" },
        vous: { fr: "avez dû", phon: "ah-vay dew", en: "you had to / must have" },
        ils:  { fr: "ont dû", phon: "oh(n) dew", en: "they had to / must have" }
      },
      imparfait: {
        je:   { fr: "devais", phon: "duh-veh", en: "I had to / was supposed to" },
        tu:   { fr: "devais", phon: "duh-veh", en: "you had to / were supposed to" },
        il:   { fr: "devait", phon: "duh-veh", en: "he/she/one had to / was supposed to" },
        nous: { fr: "devions", phon: "duh-vyoh(n)", en: "we had to / were supposed to" },
        vous: { fr: "deviez", phon: "duh-vyay", en: "you had to / were supposed to" },
        ils:  { fr: "devaient", phon: "duh-veh", en: "they had to / were supposed to" }
      },
      futur: {
        je:   { fr: "devrai", phon: "duh-vray", en: "I will have to" },
        tu:   { fr: "devras", phon: "duh-vrah", en: "you will have to" },
        il:   { fr: "devra", phon: "duh-vrah", en: "he/she/one will have to" },
        nous: { fr: "devrons", phon: "duh-vroh(n)", en: "we will have to" },
        vous: { fr: "devrez", phon: "duh-vray", en: "you will have to" },
        ils:  { fr: "devront", phon: "duh-vroh(n)", en: "they will have to" }
      },
      conditionnel: {
        je:   { fr: "devrais", phon: "duh-vreh", en: "I should / ought to" },
        tu:   { fr: "devrais", phon: "duh-vreh", en: "you should / ought to" },
        il:   { fr: "devrait", phon: "duh-vreh", en: "he/she/one should / ought to" },
        nous: { fr: "devrions", phon: "duh-vree-yoh(n)", en: "we should / ought to" },
        vous: { fr: "devriez", phon: "duh-vree-yay", en: "you should / ought to" },
        ils:  { fr: "devraient", phon: "duh-vreh", en: "they should / ought to" }
      }
    }
  },

  {
    id: "revoir",
    rank: "I36",
    type: "irregular",
    group: "irregular",
    english: "to see again",
    french: "revoir",
    phonetic: "ruh-vwahr",
    conjugations: {
      present: {
        je:   { fr: "revois", phon: "ruh-vwah", en: "I see again" },
        tu:   { fr: "revois", phon: "ruh-vwah", en: "you see again" },
        il:   { fr: "revoit", phon: "ruh-vwah", en: "he/she/one sees again" },
        nous: { fr: "revoyons", phon: "ruh-vwah-yoh(n)", en: "we see again" },
        vous: { fr: "revoyez", phon: "ruh-vwah-yay", en: "you see again" },
        ils:  { fr: "revoient", phon: "ruh-vwah", en: "they see again" }
      },
      passe_compose: {
        je:   { fr: "ai revu", phon: "ay ruh-vew", en: "I saw again / have seen again" },
        tu:   { fr: "as revu", phon: "ah ruh-vew", en: "you saw again / have seen again" },
        il:   { fr: "a revu", phon: "ah ruh-vew", en: "he/she/one saw again / has seen again" },
        nous: { fr: "avons revu", phon: "ah-voh(n) ruh-vew", en: "we saw again / have seen again" },
        vous: { fr: "avez revu", phon: "ah-vay ruh-vew", en: "you saw again / have seen again" },
        ils:  { fr: "ont revu", phon: "oh(n) ruh-vew", en: "they saw again / have seen again" }
      },
      imparfait: {
        je:   { fr: "revoyais", phon: "ruh-vwah-yeh", en: "I was seeing again / used to see again" },
        tu:   { fr: "revoyais", phon: "ruh-vwah-yeh", en: "you were seeing again / used to see again" },
        il:   { fr: "revoyait", phon: "ruh-vwah-yeh", en: "he/she/one was seeing again / used to see again" },
        nous: { fr: "revoyions", phon: "ruh-vwah-yoh(n)", en: "we were seeing again / used to see again" },
        vous: { fr: "revoyiez", phon: "ruh-vwah-yay", en: "you were seeing again / used to see again" },
        ils:  { fr: "revoyaient", phon: "ruh-vwah-yeh", en: "they were seeing again / used to see again" }
      },
      futur: {
        je:   { fr: "reverrai", phon: "ruh-veh-ray", en: "I will see again" },
        tu:   { fr: "reverras", phon: "ruh-veh-rah", en: "you will see again" },
        il:   { fr: "reverra", phon: "ruh-veh-rah", en: "he/she/one will see again" },
        nous: { fr: "reverrons", phon: "ruh-veh-roh(n)", en: "we will see again" },
        vous: { fr: "reverrez", phon: "ruh-veh-ray", en: "you will see again" },
        ils:  { fr: "reverront", phon: "ruh-veh-roh(n)", en: "they will see again" }
      },
      conditionnel: {
        je:   { fr: "reverrais", phon: "ruh-veh-reh", en: "I would see again" },
        tu:   { fr: "reverrais", phon: "ruh-veh-reh", en: "you would see again" },
        il:   { fr: "reverrait", phon: "ruh-veh-reh", en: "he/she/one would see again" },
        nous: { fr: "reverrions", phon: "ruh-veh-ryoh(n)", en: "we would see again" },
        vous: { fr: "reverriez", phon: "ruh-veh-ryay", en: "you would see again" },
        ils:  { fr: "reverraient", phon: "ruh-veh-reh", en: "they would see again" }
      }
    }
  },

  {
    id: "prevoir",
    rank: "I83",
    type: "irregular",
    group: "irregular",
    english: "to plan, forecast",
    french: "prévoir",
    phonetic: "pray-vwahr",
    conjugations: {
      present: {
        je:   { fr: "prévois", phon: "pray-vwah", en: "I plan" },
        tu:   { fr: "prévois", phon: "pray-vwah", en: "you plan" },
        il:   { fr: "prévoit", phon: "pray-vwah", en: "he/she/one plans" },
        nous: { fr: "prévoyons", phon: "pray-vwah-yoh(n)", en: "we plan" },
        vous: { fr: "prévoyez", phon: "pray-vwah-yay", en: "you plan" },
        ils:  { fr: "prévoient", phon: "pray-vwah", en: "they plan" }
      },
      passe_compose: {
        je:   { fr: "ai prévu", phon: "ay pray-vew", en: "I planned / have planned" },
        tu:   { fr: "as prévu", phon: "ah pray-vew", en: "you planned / have planned" },
        il:   { fr: "a prévu", phon: "ah pray-vew", en: "he/she/one planned / has planned" },
        nous: { fr: "avons prévu", phon: "ah-voh(n) pray-vew", en: "we planned / have planned" },
        vous: { fr: "avez prévu", phon: "ah-vay pray-vew", en: "you planned / have planned" },
        ils:  { fr: "ont prévu", phon: "oh(n) pray-vew", en: "they planned / have planned" }
      },
      imparfait: {
        je:   { fr: "prévoyais", phon: "pray-vwah-yeh", en: "I was planning / used to plan" },
        tu:   { fr: "prévoyais", phon: "pray-vwah-yeh", en: "you were planning / used to plan" },
        il:   { fr: "prévoyait", phon: "pray-vwah-yeh", en: "he/she/one was planning / used to plan" },
        nous: { fr: "prévoyions", phon: "pray-vwah-yoh(n)", en: "we were planning / used to plan" },
        vous: { fr: "prévoyiez", phon: "pray-vwah-yay", en: "you were planning / used to plan" },
        ils:  { fr: "prévoyaient", phon: "pray-vwah-yeh", en: "they were planning / used to plan" }
      },
      futur: {
        je:   { fr: "prévoirai", phon: "pray-vwah-ray", en: "I will plan" },
        tu:   { fr: "prévoiras", phon: "pray-vwah-rah", en: "you will plan" },
        il:   { fr: "prévoira", phon: "pray-vwah-rah", en: "he/she/one will plan" },
        nous: { fr: "prévoirons", phon: "pray-vwah-roh(n)", en: "we will plan" },
        vous: { fr: "prévoirez", phon: "pray-vwah-ray", en: "you will plan" },
        ils:  { fr: "prévoiront", phon: "pray-vwah-roh(n)", en: "they will plan" }
      },
      conditionnel: {
        je:   { fr: "prévoirais", phon: "pray-vwah-reh", en: "I would plan" },
        tu:   { fr: "prévoirais", phon: "pray-vwah-reh", en: "you would plan" },
        il:   { fr: "prévoirait", phon: "pray-vwah-reh", en: "he/she/one would plan" },
        nous: { fr: "prévoirions", phon: "pray-vwah-ryoh(n)", en: "we would plan" },
        vous: { fr: "prévoiriez", phon: "pray-vwah-ryay", en: "you would plan" },
        ils:  { fr: "prévoiraient", phon: "pray-vwah-reh", en: "they would plan" }
      }
    }
  },

  {
    id: "se-voir",
    rank: "I84",
    type: "irregular",
    group: "irregular",
    english: "to see each other",
    french: "se voir",
    phonetic: "suh vwahr",
    auxiliary: "être",
    conjugations: {
      present: {
        je:   { fr: "me vois", phon: "muh vwah", en: "I see each other" },
        tu:   { fr: "te vois", phon: "tuh vwah", en: "you see each other" },
        il:   { fr: "se voit", phon: "suh vwah", en: "he/she/one see each other" },
        nous: { fr: "nous voyons", phon: "noo vwah-yoh(n)", en: "we see each other" },
        vous: { fr: "vous voyez", phon: "voo vwah-yay", en: "you see each other" },
        ils:  { fr: "se voient", phon: "suh vwah", en: "they see each other" }
      },
      passe_compose: {
        je:   { fr: "me suis vu(e)", phon: "muh swee vew", en: "I saw each other / have seen each other" },
        tu:   { fr: "t'es vu(e)", phon: "teh vew", en: "you saw each other / have seen each other" },
        il:   { fr: "s'est vu(e)", phon: "seh vew", en: "he/she/one saw each other / has seen each other" },
        nous: { fr: "nous sommes vu(e)s", phon: "noo sum vew", en: "we saw each other / have seen each other" },
        vous: { fr: "vous êtes vu(e)(s)", phon: "voo zet vew", en: "you saw each other / have seen each other" },
        ils:  { fr: "se sont vu(e)s", phon: "suh soh(n) vew", en: "they saw each other / have seen each other" }
      },
      imparfait: {
        je:   { fr: "me voyais", phon: "muh vwah-yeh", en: "I was seeing each other / used to see each other" },
        tu:   { fr: "te voyais", phon: "tuh vwah-yeh", en: "you were seeing each other / used to see each other" },
        il:   { fr: "se voyait", phon: "suh vwah-yeh", en: "he/she/one was seeing each other / used to see each other" },
        nous: { fr: "nous voyions", phon: "noo vwah-yoh(n)", en: "we were seeing each other / used to see each other" },
        vous: { fr: "vous voyiez", phon: "voo vwah-yay", en: "you were seeing each other / used to see each other" },
        ils:  { fr: "se voyaient", phon: "suh vwah-yeh", en: "they were seeing each other / used to see each other" }
      },
      futur: {
        je:   { fr: "me verrai", phon: "muh veh-ray", en: "I will see each other" },
        tu:   { fr: "te verras", phon: "tuh veh-rah", en: "you will see each other" },
        il:   { fr: "se verra", phon: "suh veh-rah", en: "he/she/one will see each other" },
        nous: { fr: "nous verrons", phon: "noo veh-roh(n)", en: "we will see each other" },
        vous: { fr: "vous verrez", phon: "voo veh-ray", en: "you will see each other" },
        ils:  { fr: "se verront", phon: "suh veh-roh(n)", en: "they will see each other" }
      },
      conditionnel: {
        je:   { fr: "me verrais", phon: "muh veh-reh", en: "I would see each other" },
        tu:   { fr: "te verrais", phon: "tuh veh-reh", en: "you would see each other" },
        il:   { fr: "se verrait", phon: "suh veh-reh", en: "he/she/one would see each other" },
        nous: { fr: "nous verrions", phon: "noo veh-ryoh(n)", en: "we would see each other" },
        vous: { fr: "vous verriez", phon: "voo veh-ryay", en: "you would see each other" },
        ils:  { fr: "se verraient", phon: "suh veh-reh", en: "they would see each other" }
      }
    }
  },

  {
    id: "valoir",
    rank: "I52",
    type: "irregular",
    group: "irregular",
    english: "to be worth",
    french: "valoir",
    phonetic: "vah-lwahr",
    expressions: [
      { fr: "il vaut mieux", phon: "eel voh myuh", en: "it's better to" },
      { fr: "ça vaut la peine", phon: "sah voh lah pen", en: "it's worth it" }
    ],
    conjugations: {
      present: {
        je:   { fr: "vaux", phon: "voh", en: "I am worth" },
        tu:   { fr: "vaux", phon: "voh", en: "you are worth" },
        il:   { fr: "vaut", phon: "voh", en: "he/she/one is worth" },
        nous: { fr: "valons", phon: "vah-loh(n)", en: "we are worth" },
        vous: { fr: "valez", phon: "vah-lay", en: "you are worth" },
        ils:  { fr: "valent", phon: "vahl", en: "they are worth" }
      },
      passe_compose: {
        je:   { fr: "ai valu", phon: "ay vah-lew", en: "I was worth / have been worth" },
        tu:   { fr: "as valu", phon: "ah vah-lew", en: "you were worth / have been worth" },
        il:   { fr: "a valu", phon: "ah vah-lew", en: "he/she/one was worth / has been worth" },
        nous: { fr: "avons valu", phon: "ah-voh(n) vah-lew", en: "we were worth / have been worth" },
        vous: { fr: "avez valu", phon: "ah-vay vah-lew", en: "you were worth / have been worth" },
        ils:  { fr: "ont valu", phon: "oh(n) vah-lew", en: "they were worth / have been worth" }
      },
      imparfait: {
        je:   { fr: "valais", phon: "vah-leh", en: "I was worth / used to be worth" },
        tu:   { fr: "valais", phon: "vah-leh", en: "you were worth / used to be worth" },
        il:   { fr: "valait", phon: "vah-leh", en: "he/she/one was worth / used to be worth" },
        nous: { fr: "valions", phon: "vah-lyoh(n)", en: "we were worth / used to be worth" },
        vous: { fr: "valiez", phon: "vah-lyay", en: "you were worth / used to be worth" },
        ils:  { fr: "valaient", phon: "vah-leh", en: "they were worth / used to be worth" }
      },
      futur: {
        je:   { fr: "vaudrai", phon: "voh-dray", en: "I will be worth" },
        tu:   { fr: "vaudras", phon: "voh-drah", en: "you will be worth" },
        il:   { fr: "vaudra", phon: "voh-drah", en: "he/she/one will be worth" },
        nous: { fr: "vaudrons", phon: "voh-droh(n)", en: "we will be worth" },
        vous: { fr: "vaudrez", phon: "voh-dray", en: "you will be worth" },
        ils:  { fr: "vaudront", phon: "voh-droh(n)", en: "they will be worth" }
      },
      conditionnel: {
        je:   { fr: "vaudrais", phon: "voh-dreh", en: "I would be worth" },
        tu:   { fr: "vaudrais", phon: "voh-dreh", en: "you would be worth" },
        il:   { fr: "vaudrait", phon: "voh-dreh", en: "he/she/one would be worth" },
        nous: { fr: "vaudrions", phon: "voh-dree-yoh(n)", en: "we would be worth" },
        vous: { fr: "vaudriez", phon: "voh-dree-yay", en: "you would be worth" },
        ils:  { fr: "vaudraient", phon: "voh-dreh", en: "they would be worth" }
      }
    }
  },

  {
    id: "recevoir",
    rank: "I23",
    type: "irregular",
    group: "irregular",
    english: "to receive",
    french: "recevoir",
    phonetic: "ruh-suh-vwahr",
    conjugations: {
      present: {
        je:   { fr: "reçois", phon: "ruh-swah", en: "I receive" },
        tu:   { fr: "reçois", phon: "ruh-swah", en: "you receive" },
        il:   { fr: "reçoit", phon: "ruh-swah", en: "he/she/one receives" },
        nous: { fr: "recevons", phon: "ruh-suh-voh(n)", en: "we receive" },
        vous: { fr: "recevez", phon: "ruh-suh-vay", en: "you receive" },
        ils:  { fr: "reçoivent", phon: "ruh-swahv", en: "they receive" }
      },
      passe_compose: {
        je:   { fr: "ai reçu", phon: "ay ruh-sew", en: "I received / have received" },
        tu:   { fr: "as reçu", phon: "ah ruh-sew", en: "you received / have received" },
        il:   { fr: "a reçu", phon: "ah ruh-sew", en: "he/she/one received / has received" },
        nous: { fr: "avons reçu", phon: "ah-voh(n) ruh-sew", en: "we received / have received" },
        vous: { fr: "avez reçu", phon: "ah-vay ruh-sew", en: "you received / have received" },
        ils:  { fr: "ont reçu", phon: "oh(n) ruh-sew", en: "they received / have received" }
      },
      imparfait: {
        je:   { fr: "recevais", phon: "ruh-suh-veh", en: "I was receiving / used to receive" },
        tu:   { fr: "recevais", phon: "ruh-suh-veh", en: "you were receiving / used to receive" },
        il:   { fr: "recevait", phon: "ruh-suh-veh", en: "he/she/one was receiving / used to receive" },
        nous: { fr: "recevions", phon: "ruh-suh-vyoh(n)", en: "we were receiving / used to receive" },
        vous: { fr: "receviez", phon: "ruh-suh-vyay", en: "you were receiving / used to receive" },
        ils:  { fr: "recevaient", phon: "ruh-suh-veh", en: "they were receiving / used to receive" }
      },
      futur: {
        je:   { fr: "recevrai", phon: "ruh-suh-vray", en: "I will receive" },
        tu:   { fr: "recevras", phon: "ruh-suh-vrah", en: "you will receive" },
        il:   { fr: "recevra", phon: "ruh-suh-vrah", en: "he/she/one will receive" },
        nous: { fr: "recevrons", phon: "ruh-suh-vroh(n)", en: "we will receive" },
        vous: { fr: "recevrez", phon: "ruh-suh-vray", en: "you will receive" },
        ils:  { fr: "recevront", phon: "ruh-suh-vroh(n)", en: "they will receive" }
      },
      conditionnel: {
        je:   { fr: "recevrais", phon: "ruh-suh-vreh", en: "I would receive" },
        tu:   { fr: "recevrais", phon: "ruh-suh-vreh", en: "you would receive" },
        il:   { fr: "recevrait", phon: "ruh-suh-vreh", en: "he/she/one would receive" },
        nous: { fr: "recevrions", phon: "ruh-suh-vree-yoh(n)", en: "we would receive" },
        vous: { fr: "recevriez", phon: "ruh-suh-vree-yay", en: "you would receive" },
        ils:  { fr: "recevraient", phon: "ruh-suh-vreh", en: "they would receive" }
      }
    }
  },

  {
    id: "decevoir",
    rank: "I81",
    type: "irregular",
    group: "irregular",
    english: "to disappoint",
    french: "décevoir",
    phonetic: "day-suh-vwahr",
    family: "like recevoir",
    conjugations: {
      present: {
        je:   { fr: "déçois", phon: "day-swah", en: "I disappoint" },
        tu:   { fr: "déçois", phon: "day-swah", en: "you disappoint" },
        il:   { fr: "déçoit", phon: "day-swah", en: "he/she/one disappoints" },
        nous: { fr: "décevons", phon: "day-suh-voh(n)", en: "we disappoint" },
        vous: { fr: "décevez", phon: "day-suh-vay", en: "you disappoint" },
        ils:  { fr: "déçoivent", phon: "day-swahv", en: "they disappoint" }
      },
      passe_compose: {
        je:   { fr: "ai déçu", phon: "ay day-sew", en: "I disappointed / have disappointed" },
        tu:   { fr: "as déçu", phon: "ah day-sew", en: "you disappointed / have disappointed" },
        il:   { fr: "a déçu", phon: "ah day-sew", en: "he/she/one disappointed / has disappointed" },
        nous: { fr: "avons déçu", phon: "ah-voh(n) day-sew", en: "we disappointed / have disappointed" },
        vous: { fr: "avez déçu", phon: "ah-vay day-sew", en: "you disappointed / have disappointed" },
        ils:  { fr: "ont déçu", phon: "oh(n) day-sew", en: "they disappointed / have disappointed" }
      },
      imparfait: {
        je:   { fr: "décevais", phon: "day-suh-veh", en: "I was disappointing / used to disappoint" },
        tu:   { fr: "décevais", phon: "day-suh-veh", en: "you were disappointing / used to disappoint" },
        il:   { fr: "décevait", phon: "day-suh-veh", en: "he/she/one was disappointing / used to disappoint" },
        nous: { fr: "décevions", phon: "day-suh-vyoh(n)", en: "we were disappointing / used to disappoint" },
        vous: { fr: "déceviez", phon: "day-suh-vyay", en: "you were disappointing / used to disappoint" },
        ils:  { fr: "décevaient", phon: "day-suh-veh", en: "they were disappointing / used to disappoint" }
      },
      futur: {
        je:   { fr: "décevrai", phon: "day-suh-vray", en: "I will disappoint" },
        tu:   { fr: "décevras", phon: "day-suh-vrah", en: "you will disappoint" },
        il:   { fr: "décevra", phon: "day-suh-vrah", en: "he/she/one will disappoint" },
        nous: { fr: "décevrons", phon: "day-suh-vroh(n)", en: "we will disappoint" },
        vous: { fr: "décevrez", phon: "day-suh-vray", en: "you will disappoint" },
        ils:  { fr: "décevront", phon: "day-suh-vroh(n)", en: "they will disappoint" }
      },
      conditionnel: {
        je:   { fr: "décevrais", phon: "day-suh-vreh", en: "I would disappoint" },
        tu:   { fr: "décevrais", phon: "day-suh-vreh", en: "you would disappoint" },
        il:   { fr: "décevrait", phon: "day-suh-vreh", en: "he/she/one would disappoint" },
        nous: { fr: "décevrions", phon: "day-suh-vree-yoh(n)", en: "we would disappoint" },
        vous: { fr: "décevriez", phon: "day-suh-vree-yay", en: "you would disappoint" },
        ils:  { fr: "décevraient", phon: "day-suh-vreh", en: "they would disappoint" }
      }
    }
  },

  {
    id: "apercevoir",
    rank: "I82",
    type: "irregular",
    group: "irregular",
    english: "to notice, catch sight of",
    french: "apercevoir",
    phonetic: "ah-pehr-suh-vwahr",
    family: "like recevoir",
    conjugations: {
      present: {
        je:   { fr: "aperçois", phon: "ah-pehr-swah", en: "I notice" },
        tu:   { fr: "aperçois", phon: "ah-pehr-swah", en: "you notice" },
        il:   { fr: "aperçoit", phon: "ah-pehr-swah", en: "he/she/one notices" },
        nous: { fr: "apercevons", phon: "ah-pehr-suh-voh(n)", en: "we notice" },
        vous: { fr: "apercevez", phon: "ah-pehr-suh-vay", en: "you notice" },
        ils:  { fr: "aperçoivent", phon: "ah-pehr-swahv", en: "they notice" }
      },
      passe_compose: {
        je:   { fr: "ai aperçu", phon: "ay ah-pehr-sew", en: "I noticed / have noticed" },
        tu:   { fr: "as aperçu", phon: "ah ah-pehr-sew", en: "you noticed / have noticed" },
        il:   { fr: "a aperçu", phon: "ah ah-pehr-sew", en: "he/she/one noticed / has noticed" },
        nous: { fr: "avons aperçu", phon: "ah-voh(n) ah-pehr-sew", en: "we noticed / have noticed" },
        vous: { fr: "avez aperçu", phon: "ah-vay ah-pehr-sew", en: "you noticed / have noticed" },
        ils:  { fr: "ont aperçu", phon: "oh(n) ah-pehr-sew", en: "they noticed / have noticed" }
      },
      imparfait: {
        je:   { fr: "apercevais", phon: "ah-pehr-suh-veh", en: "I was noticing / used to notice" },
        tu:   { fr: "apercevais", phon: "ah-pehr-suh-veh", en: "you were noticing / used to notice" },
        il:   { fr: "apercevait", phon: "ah-pehr-suh-veh", en: "he/she/one was noticing / used to notice" },
        nous: { fr: "apercevions", phon: "ah-pehr-suh-vyoh(n)", en: "we were noticing / used to notice" },
        vous: { fr: "aperceviez", phon: "ah-pehr-suh-vyay", en: "you were noticing / used to notice" },
        ils:  { fr: "apercevaient", phon: "ah-pehr-suh-veh", en: "they were noticing / used to notice" }
      },
      futur: {
        je:   { fr: "apercevrai", phon: "ah-pehr-suh-vray", en: "I will notice" },
        tu:   { fr: "apercevras", phon: "ah-pehr-suh-vrah", en: "you will notice" },
        il:   { fr: "apercevra", phon: "ah-pehr-suh-vrah", en: "he/she/one will notice" },
        nous: { fr: "apercevrons", phon: "ah-pehr-suh-vroh(n)", en: "we will notice" },
        vous: { fr: "apercevrez", phon: "ah-pehr-suh-vray", en: "you will notice" },
        ils:  { fr: "apercevront", phon: "ah-pehr-suh-vroh(n)", en: "they will notice" }
      },
      conditionnel: {
        je:   { fr: "apercevrais", phon: "ah-pehr-suh-vreh", en: "I would notice" },
        tu:   { fr: "apercevrais", phon: "ah-pehr-suh-vreh", en: "you would notice" },
        il:   { fr: "apercevrait", phon: "ah-pehr-suh-vreh", en: "he/she/one would notice" },
        nous: { fr: "apercevrions", phon: "ah-pehr-suh-vree-yoh(n)", en: "we would notice" },
        vous: { fr: "apercevriez", phon: "ah-pehr-suh-vree-yay", en: "you would notice" },
        ils:  { fr: "apercevraient", phon: "ah-pehr-suh-vreh", en: "they would notice" }
      }
    }
  },

  {
    id: "s-asseoir",
    rank: "I33",
    type: "irregular",
    group: "irregular",
    english: "to sit down",
    french: "s'asseoir",
    phonetic: "sah-suh-wahr",
    auxiliary: "être",
    conjugations: {
      present: {
        je:   { fr: "m'assieds", phon: "mah-syay", en: "I sit down" },
        tu:   { fr: "t'assieds", phon: "tah-syay", en: "you sit down" },
        il:   { fr: "s'assied", phon: "sah-syay", en: "he/she/one sits down" },
        nous: { fr: "nous asseyons", phon: "noo zah-seh-yoh(n)", en: "we sit down" },
        vous: { fr: "vous asseyez", phon: "voo zah-seh-yay", en: "you sit down" },
        ils:  { fr: "s'asseyent", phon: "sah-sehy", en: "they sit down" }
      },
      passe_compose: {
        je:   { fr: "me suis assis(e)", phon: "muh swee ah-see", en: "I sat down / have sat down" },
        tu:   { fr: "t'es assis(e)", phon: "teh ah-see", en: "you sat down / have sat down" },
        il:   { fr: "s'est assis(e)", phon: "seh ah-see", en: "he/she/one sat down / has sat down" },
        nous: { fr: "nous sommes assis(e)s", phon: "noo sum ah-see", en: "we sat down / have sat down" },
        vous: { fr: "vous êtes assis(e)(s)", phon: "voo zet ah-see", en: "you sat down / have sat down" },
        ils:  { fr: "se sont assis(e)s", phon: "suh soh(n) ah-see", en: "they sat down / have sat down" }
      },
      imparfait: {
        je:   { fr: "m'asseyais", phon: "mah-seh-yeh", en: "I was sitting down / used to sit down" },
        tu:   { fr: "t'asseyais", phon: "tah-seh-yeh", en: "you were sitting down / used to sit down" },
        il:   { fr: "s'asseyait", phon: "sah-seh-yeh", en: "he/she/one was sitting down / used to sit down" },
        nous: { fr: "nous asseyions", phon: "noo zah-seh-yoh(n)", en: "we were sitting down / used to sit down" },
        vous: { fr: "vous asseyiez", phon: "voo zah-seh-yay", en: "you were sitting down / used to sit down" },
        ils:  { fr: "s'asseyaient", phon: "sah-seh-yeh", en: "they were sitting down / used to sit down" }
      },
      futur: {
        je:   { fr: "m'assiérai", phon: "mah-syay-ray", en: "I will sit down" },
        tu:   { fr: "t'assiéras", phon: "tah-syay-rah", en: "you will sit down" },
        il:   { fr: "s'assiéra", phon: "sah-syay-rah", en: "he/she/one will sit down" },
        nous: { fr: "nous assiérons", phon: "noo zah-syay-roh(n)", en: "we will sit down" },
        vous: { fr: "vous assiérez", phon: "voo zah-syay-ray", en: "you will sit down" },
        ils:  { fr: "s'assiéront", phon: "sah-syay-roh(n)", en: "they will sit down" }
      },
      conditionnel: {
        je:   { fr: "m'assiérais", phon: "mah-syay-reh", en: "I would sit down" },
        tu:   { fr: "t'assiérais", phon: "tah-syay-reh", en: "you would sit down" },
        il:   { fr: "s'assiérait", phon: "sah-syay-reh", en: "he/she/one would sit down" },
        nous: { fr: "nous assiérions", phon: "noo zah-syay-ryoh(n)", en: "we would sit down" },
        vous: { fr: "vous assiériez", phon: "voo zah-syay-ryay", en: "you would sit down" },
        ils:  { fr: "s'assiéraient", phon: "sah-syay-reh", en: "they would sit down" }
      }
    }
  },

  /* ---------- IRREGULAR: added in v6.5 (ranks provisional, from spoken-frequency sources) ---------- */

  {
    id: "falloir",
    rank: "I10.7",
    type: "irregular",
    group: "irregular",
    english: "to be necessary, to have to",
    french: "falloir",
    phonetic: "fah-lwahr",
    persons: ["il"],
    conjugations: {
      present: {
        il:   { fr: "faut", phon: "foh", en: "it is necessary / one must" }
      },
      passe_compose: {
        il:   { fr: "a fallu", phon: "ah fah-lew", en: "it was necessary / it has been necessary" }
      },
      imparfait: {
        il:   { fr: "fallait", phon: "fah-leh", en: "it was necessary / it used to be necessary" }
      },
      futur: {
        il:   { fr: "faudra", phon: "foh-drah", en: "it will be necessary" }
      },
      conditionnel: {
        il:   { fr: "faudrait", phon: "foh-dreh", en: "it would be necessary" }
      }
    }
  },

  {
    id: "envoyer",
    rank: "I23.5",
    type: "irregular",
    group: "irregular",
    english: "to send",
    french: "envoyer",
    phonetic: "ah(n)-vwah-yay",
    conjugations: {
      present: {
        je:   { fr: "envoie", phon: "ah(n)-vwah", en: "I send" },
        tu:   { fr: "envoies", phon: "ah(n)-vwah", en: "you send" },
        il:   { fr: "envoie", phon: "ah(n)-vwah", en: "he/she/one sends" },
        nous: { fr: "envoyons", phon: "ah(n)-vwah-yoh(n)", en: "we send" },
        vous: { fr: "envoyez", phon: "ah(n)-vwah-yay", en: "you send" },
        ils:  { fr: "envoient", phon: "ah(n)-vwah", en: "they send" }
      },
      passe_compose: {
        je:   { fr: "ai envoyé", phon: "ay ah(n)-vwah-yay", en: "I sent / have sent" },
        tu:   { fr: "as envoyé", phon: "ah ah(n)-vwah-yay", en: "you sent / have sent" },
        il:   { fr: "a envoyé", phon: "ah ah(n)-vwah-yay", en: "he/she/one sent / has sent" },
        nous: { fr: "avons envoyé", phon: "ah-voh(n) ah(n)-vwah-yay", en: "we sent / have sent" },
        vous: { fr: "avez envoyé", phon: "ah-vay ah(n)-vwah-yay", en: "you sent / have sent" },
        ils:  { fr: "ont envoyé", phon: "oh(n) ah(n)-vwah-yay", en: "they sent / have sent" }
      },
      imparfait: {
        je:   { fr: "envoyais", phon: "ah(n)-vwah-yeh", en: "I was sending / used to send" },
        tu:   { fr: "envoyais", phon: "ah(n)-vwah-yeh", en: "you were sending / used to send" },
        il:   { fr: "envoyait", phon: "ah(n)-vwah-yeh", en: "he/she/one was sending / used to send" },
        nous: { fr: "envoyions", phon: "ah(n)-vwah-yyoh(n)", en: "we were sending / used to send" },
        vous: { fr: "envoyiez", phon: "ah(n)-vwah-yyay", en: "you were sending / used to send" },
        ils:  { fr: "envoyaient", phon: "ah(n)-vwah-yeh", en: "they were sending / used to send" }
      },
      futur: {
        je:   { fr: "enverrai", phon: "ah(n)-veh-ray", en: "I will send" },
        tu:   { fr: "enverras", phon: "ah(n)-veh-rah", en: "you will send" },
        il:   { fr: "enverra", phon: "ah(n)-veh-rah", en: "he/she/one will send" },
        nous: { fr: "enverrons", phon: "ah(n)-veh-roh(n)", en: "we will send" },
        vous: { fr: "enverrez", phon: "ah(n)-veh-ray", en: "you will send" },
        ils:  { fr: "enverront", phon: "ah(n)-veh-roh(n)", en: "they will send" }
      },
      conditionnel: {
        je:   { fr: "enverrais", phon: "ah(n)-veh-reh", en: "I would send" },
        tu:   { fr: "enverrais", phon: "ah(n)-veh-reh", en: "you would send" },
        il:   { fr: "enverrait", phon: "ah(n)-veh-reh", en: "he/she/one would send" },
        nous: { fr: "enverrions", phon: "ah(n)-veh-ryoh(n)", en: "we would send" },
        vous: { fr: "enverriez", phon: "ah(n)-veh-ryay", en: "you would send" },
        ils:  { fr: "enverraient", phon: "ah(n)-veh-reh", en: "they would send" }
      }
    }
  },

  {
    id: "pleuvoir",
    rank: "I36.5",
    type: "irregular",
    group: "irregular",
    english: "to rain",
    french: "pleuvoir",
    phonetic: "pluh-vwahr",
    persons: ["il"],
    conjugations: {
      present: {
        il:   { fr: "pleut", phon: "pluh", en: "it rains / it is raining" }
      },
      passe_compose: {
        il:   { fr: "a plu", phon: "ah plew", en: "it rained / it has rained" }
      },
      imparfait: {
        il:   { fr: "pleuvait", phon: "pluh-veh", en: "it was raining / it used to rain" }
      },
      futur: {
        il:   { fr: "pleuvra", phon: "pluh-vrah", en: "it will rain" }
      },
      conditionnel: {
        il:   { fr: "pleuvrait", phon: "pluh-vreh", en: "it would rain" }
      }
    }
  },

  /* ---------- REGULAR -ER (plain) ---------- */

  {
    id: "passer",
    rank: "R007",
    type: "regular",
    group: "er",
    english: "to spend",
    hint: "time; also: to pass, go via",
    french: "passer",
    phonetic: "pah-say",
    stemPhon: "pahs"
  },

  {
    id: "donner",
    rank: "R003",
    type: "regular",
    group: "er",
    english: "to give",
    french: "donner",
    phonetic: "doh-nay",
    stemPhon: "don"
  },

  {
    id: "trouver",
    rank: "R005",
    type: "regular",
    group: "er",
    english: "to find; to think (opinion)",
    french: "trouver",
    phonetic: "troo-vay",
    stemPhon: "troov"
  },

  {
    id: "parler",
    rank: "R001",
    type: "regular",
    group: "er",
    english: "to speak",
    french: "parler",
    phonetic: "par-lay",
    stemPhon: "parl"
  },

  {
    id: "aimer",
    rank: "R002",
    type: "regular",
    group: "er",
    english: "to like, love",
    french: "aimer",
    phonetic: "eh-may",
    stemPhon: "a(n)"
  },

  {
    id: "penser",
    rank: "R004",
    type: "regular",
    group: "er",
    english: "to think",
    hint: "have an opinion, think of",
    french: "penser",
    phonetic: "pah(n)-say",
    stemPhon: "pah(n)s"
  },

  {
    id: "demander",
    rank: "R006",
    type: "regular",
    group: "er",
    english: "to ask (for)",
    french: "demander",
    phonetic: "duh-mah(n)-day",
    stemPhon: "duh-mah(n)d"
  },

  {
    id: "regarder",
    rank: "R008",
    type: "regular",
    group: "er",
    english: "to watch, look at",
    french: "regarder",
    phonetic: "ruh-gar-day",
    stemPhon: "ruh-gard"
  },

  {
    id: "rester",
    rank: "R012",
    type: "regular",
    group: "er",
    english: "to stay",
    french: "rester",
    phonetic: "res-tay",
    stemPhon: "rest",
    auxiliary: "être"
  },

  {
    id: "arriver",
    rank: "R009",
    type: "regular",
    group: "er",
    english: "to arrive; to happen",
    french: "arriver",
    phonetic: "ah-ree-vay",
    stemPhon: "ah-reev",
    auxiliary: "être"
  },

  {
    id: "sembler",
    rank: "R085",
    type: "regular",
    group: "er",
    english: "to seem",
    hint: "the everyday word",
    french: "sembler",
    phonetic: "sah(n)-blay",
    stemPhon: "sah(n)-bluh"
  },

  {
    id: "laisser",
    rank: "R010",
    type: "regular",
    group: "er",
    english: "to leave",
    hint: "something behind; also: to let",
    french: "laisser",
    phonetic: "leh-say",
    stemPhon: "les"
  },

  {
    id: "travailler",
    rank: "R021",
    type: "regular",
    group: "er",
    english: "to work",
    hint: "standard word",
    french: "travailler",
    phonetic: "trah-vah-yay",
    stemPhon: "trah-vahy"
  },

  {
    id: "porter",
    rank: "R013",
    type: "regular",
    group: "er",
    english: "to wear; to carry",
    french: "porter",
    phonetic: "por-tay",
    stemPhon: "port"
  },

  {
    id: "jouer",
    rank: "R020",
    type: "regular",
    group: "er",
    english: "to play",
    french: "jouer",
    phonetic: "zhoo-ay",
    stemPhon: "zhoo"
  },

  {
    id: "chercher",
    rank: "R014",
    type: "regular",
    group: "er",
    english: "to look for",
    french: "chercher",
    phonetic: "shehr-shay",
    stemPhon: "shehrsh"
  },

  {
    id: "utiliser",
    rank: "R032",
    type: "regular",
    group: "er",
    english: "to use",
    french: "utiliser",
    phonetic: "ew-tee-lee-zay",
    stemPhon: "ew-tee-lees"
  },

  {
    id: "ecouter",
    rank: "R037",
    type: "regular",
    group: "er",
    english: "to listen to",
    french: "écouter",
    phonetic: "ay-koo-tay",
    stemPhon: "ay-koot"
  },

  {
    id: "rencontrer",
    rank: "R086",
    type: "regular",
    group: "er",
    english: "to meet",
    french: "rencontrer",
    phonetic: "rah(n)-koh(n)-tray",
    stemPhon: "rah(n)-koh(n)-truh"
  },

  {
    id: "aider",
    rank: "R036",
    type: "regular",
    group: "er",
    english: "to help",
    french: "aider",
    phonetic: "eh-day",
    stemPhon: "ed"
  },

  {
    id: "expliquer",
    rank: "R044",
    type: "regular",
    group: "er",
    english: "to explain",
    french: "expliquer",
    phonetic: "eks-plee-kay",
    stemPhon: "eks-pleek"
  },

  {
    id: "continuer",
    rank: "R034",
    type: "regular",
    group: "er",
    english: "to continue",
    french: "continuer",
    phonetic: "koh(n)-tee-new-ay",
    stemPhon: "koh(n)-tee-new"
  },

  {
    id: "oublier",
    rank: "R046",
    type: "regular",
    group: "er",
    english: "to forget",
    french: "oublier",
    phonetic: "oo-blee-yay",
    stemPhon: "oo-blee"
  },

  {
    id: "tomber",
    rank: "R043",
    type: "regular",
    group: "er",
    english: "to fall",
    french: "tomber",
    phonetic: "toh(n)-bay",
    stemPhon: "toh(n)b",
    auxiliary: "être"
  },

  {
    id: "rentrer",
    rank: "R040",
    type: "regular",
    group: "er",
    english: "to go / come home",
    french: "rentrer",
    phonetic: "rah(n)-tray",
    stemPhon: "rah(n)-truh",
    auxiliary: "être"
  },

  {
    id: "entrer",
    rank: "R019",
    type: "regular",
    group: "er",
    english: "to go in",
    french: "entrer",
    phonetic: "ah(n)-tray",
    stemPhon: "ah(n)-truh",
    auxiliary: "être"
  },

  {
    id: "monter",
    rank: "R041",
    type: "regular",
    group: "er",
    english: "to go up; to get on",
    french: "monter",
    phonetic: "moh(n)-tay",
    stemPhon: "moh(n)t",
    auxiliary: "être"
  },

  {
    id: "retourner",
    rank: "R087",
    type: "regular",
    group: "er",
    english: "to go back",
    french: "retourner",
    phonetic: "ruh-toor-nay",
    stemPhon: "ruh-toorn",
    auxiliary: "être"
  },

  {
    id: "marcher",
    rank: "R038",
    type: "regular",
    group: "er",
    english: "to walk; to work (machine)",
    french: "marcher",
    phonetic: "mar-shay",
    stemPhon: "marsh"
  },

  {
    id: "tourner",
    rank: "R088",
    type: "regular",
    group: "er",
    english: "to turn",
    french: "tourner",
    phonetic: "toor-nay",
    stemPhon: "toorn"
  },

  {
    id: "retrouver",
    rank: "R089",
    type: "regular",
    group: "er",
    english: "to find again; to meet up with",
    french: "retrouver",
    phonetic: "ruh-troo-vay",
    stemPhon: "ruh-troov"
  },

  {
    id: "proposer",
    rank: "R090",
    type: "regular",
    group: "er",
    english: "to suggest, propose",
    french: "proposer",
    phonetic: "proh-poh-zay",
    stemPhon: "proh-pos"
  },

  {
    id: "accepter",
    rank: "R091",
    type: "regular",
    group: "er",
    english: "to accept",
    french: "accepter",
    phonetic: "ahk-sep-tay",
    stemPhon: "ahk-sept"
  },

  {
    id: "refuser",
    rank: "R092",
    type: "regular",
    group: "er",
    english: "to refuse",
    french: "refuser",
    phonetic: "ruh-few-zay",
    stemPhon: "ruh-fews"
  },

  {
    id: "decider",
    rank: "R093",
    type: "regular",
    group: "er",
    english: "to decide",
    french: "décider",
    phonetic: "day-see-day",
    stemPhon: "day-seed"
  },

  {
    id: "organiser",
    rank: "R094",
    type: "regular",
    group: "er",
    english: "to organise",
    french: "organiser",
    phonetic: "or-gah-nee-zay",
    stemPhon: "or-gah-nees"
  },

  {
    id: "preparer",
    rank: "R095",
    type: "regular",
    group: "er",
    english: "to prepare, make",
    french: "préparer",
    phonetic: "pray-pah-ray",
    stemPhon: "pray-par"
  },

  {
    id: "presenter",
    rank: "R096",
    type: "regular",
    group: "er",
    english: "to present, introduce",
    french: "présenter",
    phonetic: "pray-zah(n)-tay",
    stemPhon: "pray-zah(n)t"
  },

  {
    id: "inviter",
    rank: "R097",
    type: "regular",
    group: "er",
    english: "to invite",
    french: "inviter",
    phonetic: "a(n)-vee-tay",
    stemPhon: "a(n)-veet"
  },

  {
    id: "apporter",
    rank: "R098",
    type: "regular",
    group: "er",
    english: "to bring (a thing)",
    french: "apporter",
    phonetic: "ah-por-tay",
    stemPhon: "ah-port"
  },

  {
    id: "montrer",
    rank: "R099",
    type: "regular",
    group: "er",
    english: "to show",
    french: "montrer",
    phonetic: "moh(n)-tray",
    stemPhon: "moh(n)-truh"
  },

  {
    id: "raconter",
    rank: "R045",
    type: "regular",
    group: "er",
    english: "to tell (a story)",
    french: "raconter",
    phonetic: "rah-koh(n)-tay",
    stemPhon: "rah-koh(n)t"
  },

  {
    id: "discuter",
    rank: "R100",
    type: "regular",
    group: "er",
    english: "to talk, discuss",
    french: "discuter",
    phonetic: "dees-kew-tay",
    stemPhon: "dees-kewt"
  },

  {
    id: "poser",
    rank: "R101",
    type: "regular",
    group: "er",
    english: "to put down; to ask (a question)",
    french: "poser",
    phonetic: "poh-zay",
    stemPhon: "pos"
  },

  {
    id: "quitter",
    rank: "R102",
    type: "regular",
    group: "er",
    english: "to leave",
    hint: "a place or a person",
    french: "quitter",
    phonetic: "kee-tay",
    stemPhon: "keet"
  },

  {
    id: "fermer",
    rank: "R031",
    type: "regular",
    group: "er",
    english: "to close",
    french: "fermer",
    phonetic: "fehr-may",
    stemPhon: "fehrm"
  },

  {
    id: "garder",
    rank: "R103",
    type: "regular",
    group: "er",
    english: "to keep",
    french: "garder",
    phonetic: "gar-day",
    stemPhon: "gard"
  },

  {
    id: "compter",
    rank: "R104",
    type: "regular",
    group: "er",
    english: "to count; to intend",
    french: "compter",
    phonetic: "koh(n)p-tay",
    stemPhon: "koh(n)pt"
  },

  {
    id: "gagner",
    rank: "R105",
    type: "regular",
    group: "er",
    english: "to earn; to win",
    french: "gagner",
    phonetic: "gah-nyay",
    stemPhon: "gahny"
  },

  {
    id: "couter",
    rank: "R106",
    type: "regular",
    group: "er",
    english: "to cost",
    french: "coûter",
    phonetic: "koo-tay",
    stemPhon: "koot"
  },

  {
    id: "imaginer",
    rank: "R107",
    type: "regular",
    group: "er",
    english: "to imagine",
    french: "imaginer",
    phonetic: "ee-mah-zhee-nay",
    stemPhon: "ee-mah-zha(n)"
  },

  {
    id: "adorer",
    rank: "R108",
    type: "regular",
    group: "er",
    english: "to love",
    french: "adorer",
    phonetic: "ah-doh-ray",
    stemPhon: "ah-dor"
  },

  {
    id: "detester",
    rank: "R109",
    type: "regular",
    group: "er",
    english: "to hate",
    french: "détester",
    phonetic: "day-tes-tay",
    stemPhon: "day-test"
  },

  {
    id: "etudier",
    rank: "R110",
    type: "regular",
    group: "er",
    english: "to study",
    french: "étudier",
    phonetic: "ay-tew-dyay",
    stemPhon: "ay-tew-dee"
  },

  {
    id: "habiter",
    rank: "R111",
    type: "regular",
    group: "er",
    english: "to live",
    hint: "reside somewhere",
    french: "habiter",
    phonetic: "ah-bee-tay",
    stemPhon: "ah-beet"
  },

  {
    id: "visiter",
    rank: "R112",
    type: "regular",
    group: "er",
    english: "to visit (a place)",
    french: "visiter",
    phonetic: "vee-zee-tay",
    stemPhon: "vee-zeet"
  },

  {
    id: "diner",
    rank: "R113",
    type: "regular",
    group: "er",
    english: "to have dinner",
    french: "dîner",
    phonetic: "dee-nay",
    stemPhon: "deen"
  },

  {
    id: "dejeuner",
    rank: "R114",
    type: "regular",
    group: "er",
    english: "to have lunch",
    french: "déjeuner",
    phonetic: "day-zhuh-nay",
    stemPhon: "day-zhuhn"
  },

  {
    id: "cuisiner",
    rank: "R115",
    type: "regular",
    group: "er",
    english: "to cook",
    french: "cuisiner",
    phonetic: "kwee-zee-nay",
    stemPhon: "kwee-za(n)"
  },

  {
    id: "chanter",
    rank: "R116",
    type: "regular",
    group: "er",
    english: "to sing",
    french: "chanter",
    phonetic: "shah(n)-tay",
    stemPhon: "shah(n)t"
  },

  {
    id: "danser",
    rank: "R117",
    type: "regular",
    group: "er",
    english: "to dance",
    french: "danser",
    phonetic: "dah(n)-say",
    stemPhon: "dah(n)s"
  },

  {
    id: "dessiner",
    rank: "R118",
    type: "regular",
    group: "er",
    english: "to draw",
    french: "dessiner",
    phonetic: "deh-see-nay",
    stemPhon: "deh-sa(n)"
  },

  {
    id: "jardiner",
    rank: "R119",
    type: "regular",
    group: "er",
    english: "to garden",
    french: "jardiner",
    phonetic: "zhar-dee-nay",
    stemPhon: "zhar-da(n)"
  },

  {
    id: "bricoler",
    rank: "R120",
    type: "regular",
    group: "er",
    english: "to do DIY",
    french: "bricoler",
    phonetic: "bree-koh-lay",
    stemPhon: "bree-kol"
  },

  {
    id: "pecher",
    rank: "R121",
    type: "regular",
    group: "er",
    english: "to fish",
    french: "pêcher",
    phonetic: "peh-shay",
    stemPhon: "pesh"
  },

  {
    id: "laver",
    rank: "R122",
    type: "regular",
    group: "er",
    english: "to wash",
    french: "laver",
    phonetic: "lah-vay",
    stemPhon: "lahv"
  },

  {
    id: "arreter",
    rank: "R035",
    type: "regular",
    group: "er",
    english: "to stop",
    french: "arrêter",
    phonetic: "ah-reh-tay",
    stemPhon: "ah-ret"
  },

  {
    id: "feter",
    rank: "R123",
    type: "regular",
    group: "er",
    english: "to celebrate",
    french: "fêter",
    phonetic: "feh-tay",
    stemPhon: "fet"
  },

  {
    id: "louer",
    rank: "R124",
    type: "regular",
    group: "er",
    english: "to rent, hire",
    french: "louer",
    phonetic: "loo-ay",
    stemPhon: "loo"
  },

  {
    id: "reserver",
    rank: "R125",
    type: "regular",
    group: "er",
    english: "to book",
    french: "réserver",
    phonetic: "ray-zehr-vay",
    stemPhon: "ray-zehrv"
  },

  {
    id: "commander",
    rank: "R126",
    type: "regular",
    group: "er",
    english: "to order",
    french: "commander",
    phonetic: "koh-mah(n)-day",
    stemPhon: "koh-mah(n)d"
  },

  {
    id: "depenser",
    rank: "R127",
    type: "regular",
    group: "er",
    english: "to spend",
    hint: "money",
    french: "dépenser",
    phonetic: "day-pah(n)-say",
    stemPhon: "day-pah(n)s"
  },

  {
    id: "economiser",
    rank: "R128",
    type: "regular",
    group: "er",
    english: "to save (money)",
    french: "économiser",
    phonetic: "ay-koh-noh-mee-zay",
    stemPhon: "ay-koh-noh-mees"
  },

  {
    id: "rembourser",
    rank: "R129",
    type: "regular",
    group: "er",
    english: "to refund, repay",
    french: "rembourser",
    phonetic: "rah(n)-boor-say",
    stemPhon: "rah(n)-boors"
  },

  {
    id: "emprunter",
    rank: "R130",
    type: "regular",
    group: "er",
    english: "to borrow",
    french: "emprunter",
    phonetic: "ah(n)-pruh(n)-tay",
    stemPhon: "ah(n)-pruh(n)t"
  },

  {
    id: "preter",
    rank: "R131",
    type: "regular",
    group: "er",
    english: "to lend",
    french: "prêter",
    phonetic: "preh-tay",
    stemPhon: "pret"
  },

  {
    id: "traverser",
    rank: "R132",
    type: "regular",
    group: "er",
    english: "to cross",
    french: "traverser",
    phonetic: "trah-vehr-say",
    stemPhon: "trah-vehrs"
  },

  {
    id: "rater",
    rank: "R133",
    type: "regular",
    group: "er",
    english: "to miss (a train); to fail",
    french: "rater",
    phonetic: "rah-tay",
    stemPhon: "raht"
  },

  {
    id: "fumer",
    rank: "R134",
    type: "regular",
    group: "er",
    english: "to smoke",
    french: "fumer",
    phonetic: "few-may",
    stemPhon: "fuh(n)"
  },

  {
    id: "reparer",
    rank: "R135",
    type: "regular",
    group: "er",
    english: "to repair",
    french: "réparer",
    phonetic: "ray-pah-ray",
    stemPhon: "ray-par"
  },

  {
    id: "allumer",
    rank: "R136",
    type: "regular",
    group: "er",
    english: "to switch on",
    french: "allumer",
    phonetic: "ah-lew-may",
    stemPhon: "ah-luh(n)"
  },

  {
    id: "arroser",
    rank: "R137",
    type: "regular",
    group: "er",
    english: "to water",
    french: "arroser",
    phonetic: "ah-roh-zay",
    stemPhon: "ah-ros"
  },

  {
    id: "durer",
    rank: "R138",
    type: "regular",
    group: "er",
    english: "to last",
    french: "durer",
    phonetic: "dew-ray",
    stemPhon: "dewr"
  },

  {
    id: "gouter",
    rank: "R139",
    type: "regular",
    group: "er",
    english: "to taste; to have an afternoon snack",
    french: "goûter",
    phonetic: "goo-tay",
    stemPhon: "goot"
  },

  {
    id: "grignoter",
    rank: "R140",
    type: "regular",
    group: "er",
    english: "to snack",
    french: "grignoter",
    phonetic: "gree-nyoh-tay",
    stemPhon: "gree-nyot"
  },

  {
    id: "sauter",
    rank: "R141",
    type: "regular",
    group: "er",
    english: "to skip; to jump",
    french: "sauter",
    phonetic: "soh-tay",
    stemPhon: "sot"
  },

  {
    id: "enchainer",
    rank: "R142",
    type: "regular",
    group: "er",
    english: "to binge (episodes); to link",
    french: "enchaîner",
    phonetic: "ah(n)-sheh-nay",
    stemPhon: "ah(n)-shen"
  },

  {
    id: "trainer",
    rank: "R143",
    type: "regular",
    group: "er",
    english: "to hang around, laze",
    french: "traîner",
    phonetic: "treh-nay",
    stemPhon: "tren"
  },

  {
    id: "consulter",
    rank: "R144",
    type: "regular",
    group: "er",
    english: "to check, consult",
    french: "consulter",
    phonetic: "koh(n)-sewl-tay",
    stemPhon: "koh(n)-sewlt"
  },

  {
    id: "publier",
    rank: "R145",
    type: "regular",
    group: "er",
    english: "to post, publish",
    french: "publier",
    phonetic: "pew-blee-yay",
    stemPhon: "pew-blee"
  },

  {
    id: "bavarder",
    rank: "R146",
    type: "regular",
    group: "er",
    english: "to chat",
    french: "bavarder",
    phonetic: "bah-var-day",
    stemPhon: "bah-vard"
  },

  {
    id: "bosser",
    rank: "R147",
    type: "regular",
    group: "er",
    english: "to work",
    hint: "informal",
    french: "bosser",
    phonetic: "boh-say",
    stemPhon: "bos"
  },

  {
    id: "consacrer",
    rank: "R148",
    type: "regular",
    group: "er",
    english: "to devote (time)",
    french: "consacrer",
    phonetic: "koh(n)-sah-kray",
    stemPhon: "koh(n)-sah-kruh"
  },

  {
    id: "manquer",
    rank: "R149",
    type: "regular",
    group: "er",
    english: "to lack; to miss (someone)",
    french: "manquer",
    phonetic: "mah(n)-kay",
    stemPhon: "mah(n)k"
  },

  {
    id: "interesser",
    rank: "R150",
    type: "regular",
    group: "er",
    english: "to interest",
    french: "intéresser",
    phonetic: "a(n)-tay-reh-say",
    stemPhon: "a(n)-tay-res"
  },

  {
    id: "remercier",
    rank: "R151",
    type: "regular",
    group: "er",
    english: "to thank",
    french: "remercier",
    phonetic: "ruh-mehr-syay",
    stemPhon: "ruh-mehr-see"
  },

  {
    id: "telephoner",
    rank: "R152",
    type: "regular",
    group: "er",
    english: "to phone",
    french: "téléphoner",
    phonetic: "tay-lay-foh-nay",
    stemPhon: "tay-lay-foh(n)"
  },

  {
    id: "enseigner",
    rank: "R153",
    type: "regular",
    group: "er",
    english: "to teach",
    french: "enseigner",
    phonetic: "ah(n)-seh-nyay",
    stemPhon: "ah(n)-seny"
  },

  {
    id: "signer",
    rank: "R154",
    type: "regular",
    group: "er",
    english: "to sign",
    french: "signer",
    phonetic: "see-nyay",
    stemPhon: "seeny"
  },

  {
    id: "imprimer",
    rank: "R155",
    type: "regular",
    group: "er",
    english: "to print",
    french: "imprimer",
    phonetic: "a(n)-pree-may",
    stemPhon: "a(n)-pra(n)"
  },

  {
    id: "postuler",
    rank: "R156",
    type: "regular",
    group: "er",
    english: "to apply (for a job)",
    french: "postuler",
    phonetic: "pos-tew-lay",
    stemPhon: "pos-tewl"
  },

  {
    id: "embaucher",
    rank: "R157",
    type: "regular",
    group: "er",
    english: "to hire",
    french: "embaucher",
    phonetic: "ah(n)-boh-shay",
    stemPhon: "ah(n)-bosh"
  },

  {
    id: "resumer",
    rank: "R158",
    type: "regular",
    group: "er",
    english: "to summarise",
    french: "résumer",
    phonetic: "ray-zew-may",
    stemPhon: "ray-zuh(n)"
  },

  {
    id: "terminer",
    rank: "R159",
    type: "regular",
    group: "er",
    english: "to finish",
    hint: "-er verb; also: to end",
    french: "terminer",
    phonetic: "tehr-mee-nay",
    stemPhon: "tehr-ma(n)"
  },

  {
    id: "participer",
    rank: "R160",
    type: "regular",
    group: "er",
    english: "to take part",
    french: "participer",
    phonetic: "par-tee-see-pay",
    stemPhon: "par-tee-seep"
  },

  {
    id: "ressembler",
    rank: "R161",
    type: "regular",
    group: "er",
    english: "to look like",
    french: "ressembler",
    phonetic: "reh-sah(n)-blay",
    stemPhon: "reh-sah(n)-bluh"
  },

  {
    id: "souhaiter",
    rank: "R162",
    type: "regular",
    group: "er",
    english: "to wish",
    french: "souhaiter",
    phonetic: "soo-eh-tay",
    stemPhon: "soo-et"
  },

  {
    id: "regretter",
    rank: "R163",
    type: "regular",
    group: "er",
    english: "to regret, be sorry",
    french: "regretter",
    phonetic: "ruh-greh-tay",
    stemPhon: "ruh-gret"
  },

  {
    id: "hesiter",
    rank: "R164",
    type: "regular",
    group: "er",
    english: "to hesitate",
    french: "hésiter",
    phonetic: "ay-zee-tay",
    stemPhon: "ay-zeet"
  },

  {
    id: "rever",
    rank: "R165",
    type: "regular",
    group: "er",
    english: "to dream",
    french: "rêver",
    phonetic: "reh-vay",
    stemPhon: "rev"
  },

  {
    id: "respirer",
    rank: "R166",
    type: "regular",
    group: "er",
    english: "to breathe",
    french: "respirer",
    phonetic: "res-pee-ray",
    stemPhon: "res-peer"
  },

  {
    id: "soigner",
    rank: "R167",
    type: "regular",
    group: "er",
    english: "to treat, look after",
    french: "soigner",
    phonetic: "swah-nyay",
    stemPhon: "swahny"
  },

  {
    id: "skier",
    rank: "R168",
    type: "regular",
    group: "er",
    english: "to ski",
    french: "skier",
    phonetic: "skyay",
    stemPhon: "skee"
  },

  {
    id: "crier",
    rank: "R169",
    type: "regular",
    group: "er",
    english: "to shout",
    french: "crier",
    phonetic: "kree-yay",
    stemPhon: "kree"
  },

  {
    id: "eviter",
    rank: "R170",
    type: "regular",
    group: "er",
    english: "to avoid",
    french: "éviter",
    phonetic: "ay-vee-tay",
    stemPhon: "ay-veet"
  },

  {
    id: "conseiller",
    rank: "R171",
    type: "regular",
    group: "er",
    english: "to advise",
    french: "conseiller",
    phonetic: "koh(n)-seh-yay",
    stemPhon: "koh(n)-sehy"
  },

  {
    id: "recommander",
    rank: "R172",
    type: "regular",
    group: "er",
    english: "to recommend",
    french: "recommander",
    phonetic: "ruh-koh-mah(n)-day",
    stemPhon: "ruh-koh-mah(n)d"
  },

  {
    id: "apprecier",
    rank: "R173",
    type: "regular",
    group: "er",
    english: "to appreciate, enjoy",
    french: "apprécier",
    phonetic: "ah-pray-syay",
    stemPhon: "ah-pray-see"
  },

  {
    id: "profiter",
    rank: "R174",
    type: "regular",
    group: "er",
    english: "to take advantage, enjoy",
    french: "profiter",
    phonetic: "proh-fee-tay",
    stemPhon: "proh-feet"
  },

  {
    id: "echouer",
    rank: "R175",
    type: "regular",
    group: "er",
    english: "to fail",
    french: "échouer",
    phonetic: "ay-shoo-ay",
    stemPhon: "ay-shoo"
  },

  /* ---------- REGULAR -IR (finir family) ---------- */

  {
    id: "finir",
    rank: "R028",
    type: "regular",
    group: "ir",
    english: "to finish",
    hint: "-ir verb, the everyday word",
    french: "finir",
    phonetic: "fee-neer",
    stemPhon: "fee-n"
  },

  {
    id: "choisir",
    rank: "R029",
    type: "regular",
    group: "ir",
    english: "to choose",
    french: "choisir",
    phonetic: "shwah-zeer",
    stemPhon: "shwah-z"
  },

  {
    id: "reussir",
    rank: "R030",
    type: "regular",
    group: "ir",
    english: "to succeed; to pass (an exam)",
    french: "réussir",
    phonetic: "ray-ew-seer",
    stemPhon: "ray-ew-s"
  },

  {
    id: "reflechir",
    rank: "R232",
    type: "regular",
    group: "ir",
    english: "to think",
    hint: "reflect, think it over",
    french: "réfléchir",
    phonetic: "ray-flay-sheer",
    stemPhon: "ray-flay-sh"
  },

  {
    id: "remplir",
    rank: "R233",
    type: "regular",
    group: "ir",
    english: "to fill (in)",
    french: "remplir",
    phonetic: "rah(n)-pleer",
    stemPhon: "rah(n)-pl"
  },

  {
    id: "ralentir",
    rank: "R234",
    type: "regular",
    group: "ir",
    english: "to slow down",
    french: "ralentir",
    phonetic: "rah-lah(n)-teer",
    stemPhon: "rah-lah(n)-t"
  },

  {
    id: "grossir",
    rank: "R235",
    type: "regular",
    group: "ir",
    english: "to put on weight",
    french: "grossir",
    phonetic: "groh-seer",
    stemPhon: "groh-s"
  },

  {
    id: "maigrir",
    rank: "R236",
    type: "regular",
    group: "ir",
    english: "to lose weight",
    french: "maigrir",
    phonetic: "meh-greer",
    stemPhon: "meh-gr"
  },

  {
    id: "vieillir",
    rank: "R237",
    type: "regular",
    group: "ir",
    english: "to get older",
    french: "vieillir",
    phonetic: "vee-yeh-yeer",
    stemPhon: "vee-yeh-y"
  },

  {
    id: "rougir",
    rank: "R238",
    type: "regular",
    group: "ir",
    english: "to blush",
    french: "rougir",
    phonetic: "roo-zheer",
    stemPhon: "roo-zh"
  },

  {
    id: "grandir",
    rank: "R239",
    type: "regular",
    group: "ir",
    english: "to grow up",
    french: "grandir",
    phonetic: "grah(n)-deer",
    stemPhon: "grah(n)-d"
  },

  {
    id: "agir",
    rank: "R240",
    type: "regular",
    group: "ir",
    english: "to act",
    french: "agir",
    phonetic: "ah-zheer",
    stemPhon: "ah-zh"
  },

  {
    id: "reagir",
    rank: "R241",
    type: "regular",
    group: "ir",
    english: "to react",
    french: "réagir",
    phonetic: "ray-ah-zheer",
    stemPhon: "ray-ah-zh"
  },

  {
    id: "obeir",
    rank: "R242",
    type: "regular",
    group: "ir",
    english: "to obey",
    french: "obéir",
    phonetic: "oh-bay-eer",
    stemPhon: "oh-bay-"
  },

  {
    id: "saisir",
    rank: "R243",
    type: "regular",
    group: "ir",
    english: "to seize; to enter (data)",
    french: "saisir",
    phonetic: "seh-zeer",
    stemPhon: "seh-z"
  },

  {
    id: "nourrir",
    rank: "R244",
    type: "regular",
    group: "ir",
    english: "to feed",
    french: "nourrir",
    phonetic: "noo-reer",
    stemPhon: "noo-r"
  },

  {
    id: "fournir",
    rank: "R245",
    type: "regular",
    group: "ir",
    english: "to supply, provide",
    french: "fournir",
    phonetic: "foor-neer",
    stemPhon: "foor-n"
  },

  {
    id: "guerir",
    rank: "R246",
    type: "regular",
    group: "ir",
    english: "to cure, recover",
    french: "guérir",
    phonetic: "gay-reer",
    stemPhon: "gay-r"
  },

  {
    id: "punir",
    rank: "R247",
    type: "regular",
    group: "ir",
    english: "to punish",
    french: "punir",
    phonetic: "pew-neer",
    stemPhon: "pew-n"
  },

  {
    id: "investir",
    rank: "R248",
    type: "regular",
    group: "ir",
    english: "to invest",
    french: "investir",
    phonetic: "a(n)-ves-teer",
    stemPhon: "a(n)-ves-t"
  },

  {
    id: "applaudir",
    rank: "R249",
    type: "regular",
    group: "ir",
    english: "to applaud",
    french: "applaudir",
    phonetic: "ah-ploh-deer",
    stemPhon: "ah-ploh-d"
  },

  {
    id: "atterrir",
    rank: "R250",
    type: "regular",
    group: "ir",
    english: "to land (plane)",
    french: "atterrir",
    phonetic: "ah-teh-reer",
    stemPhon: "ah-teh-r"
  },

  {
    id: "rajeunir",
    rank: "R251",
    type: "regular",
    group: "ir",
    english: "to get younger, look younger",
    french: "rajeunir",
    phonetic: "rah-zhuh-neer",
    stemPhon: "rah-zhuh-n"
  },

  /* ---------- REGULAR -RE (attendre family) ---------- */

  {
    id: "attendre",
    rank: "R015",
    type: "regular",
    group: "re",
    english: "to wait for",
    french: "attendre",
    phonetic: "ah-tah(n)-druh",
    stemPhon: "ah-tah(n)"
  },

  {
    id: "entendre",
    rank: "R016",
    type: "regular",
    group: "re",
    english: "to hear",
    french: "entendre",
    phonetic: "ah(n)-tah(n)-druh",
    stemPhon: "ah(n)-tah(n)"
  },

  {
    id: "repondre",
    rank: "R017",
    type: "regular",
    group: "re",
    english: "to reply, answer",
    french: "répondre",
    phonetic: "ray-poh(n)-druh",
    stemPhon: "ray-poh(n)"
  },

  {
    id: "rendre",
    rank: "R018",
    type: "regular",
    group: "re",
    english: "to give back",
    french: "rendre",
    phonetic: "rah(n)-druh",
    stemPhon: "rah(n)"
  },

  {
    id: "perdre",
    rank: "R252",
    type: "regular",
    group: "re",
    english: "to lose",
    french: "perdre",
    phonetic: "pehr-druh",
    stemPhon: "pehr"
  },

  {
    id: "vendre",
    rank: "R253",
    type: "regular",
    group: "re",
    english: "to sell",
    french: "vendre",
    phonetic: "vah(n)-druh",
    stemPhon: "vah(n)"
  },

  {
    id: "descendre",
    rank: "R042",
    type: "regular",
    group: "re",
    english: "to go down; to get off",
    french: "descendre",
    phonetic: "des-sah(n)-druh",
    stemPhon: "des-sah(n)",
    auxiliary: "être"
  },

  {
    id: "dependre",
    rank: "R254",
    type: "regular",
    group: "re",
    english: "to depend",
    french: "dépendre",
    phonetic: "day-pah(n)-druh",
    stemPhon: "day-pah(n)"
  },

  {
    id: "defendre",
    rank: "R255",
    type: "regular",
    group: "re",
    english: "to defend; to forbid",
    french: "défendre",
    phonetic: "day-fah(n)-druh",
    stemPhon: "day-fah(n)"
  },

  {
    id: "confondre",
    rank: "R256",
    type: "regular",
    group: "re",
    english: "to confuse, mix up",
    french: "confondre",
    phonetic: "koh(n)-foh(n)-druh",
    stemPhon: "koh(n)-foh(n)"
  },

  /* ---------- REGULAR: added in v6.5 (ranks provisional, from spoken-frequency sources) ---------- */

  {
    id: "s-appeler",
    rank: "R011",
    type: "regular",
    group: "er",
    english: "to be called",
    french: "s'appeler",
    phonetic: "sah-puh-lay",
    stemPhon: "ah-puhl",
    reflexive: true,
    family: "like appeler",
    conjugations: {
      present: {
        je:   { fr: "appelle", phon: "ah-pel" },
        tu:   { fr: "appelles", phon: "ah-pel" },
        il:   { fr: "appelle", phon: "ah-pel" },
        nous: { fr: "appelons", phon: "ah-puh-loh(n)" },
        vous: { fr: "appelez", phon: "ah-puh-lay" },
        ils:  { fr: "appellent", phon: "ah-pel" }
      },
      futur: {
        je:   { fr: "appellerai", phon: "ah-pel-ray" },
        tu:   { fr: "appelleras", phon: "ah-pel-rah" },
        il:   { fr: "appellera", phon: "ah-pel-rah" },
        nous: { fr: "appellerons", phon: "ah-pel-roh(n)" },
        vous: { fr: "appellerez", phon: "ah-pel-ray" },
        ils:  { fr: "appelleront", phon: "ah-pel-roh(n)" }
      },
      conditionnel: {
        je:   { fr: "appellerais", phon: "ah-pel-reh" },
        tu:   { fr: "appellerais", phon: "ah-pel-reh" },
        il:   { fr: "appellerait", phon: "ah-pel-reh" },
        nous: { fr: "appellerions", phon: "ah-pel-ryoh(n)" },
        vous: { fr: "appelleriez", phon: "ah-pel-ryay" },
        ils:  { fr: "appelleraient", phon: "ah-pel-reh" }
      }
    }
  },

  {
    id: "se-passer",
    rank: "R022",
    type: "regular",
    group: "er",
    english: "to happen",
    french: "se passer",
    phonetic: "suh pah-say",
    stemPhon: "pahs",
    reflexive: true,
    persons: ["il"]
  },

  {
    id: "manger",
    rank: "R023",
    type: "regular",
    group: "ger",
    english: "to eat",
    french: "manger",
    phonetic: "mah(n)-zhay",
    stemPhon: "mah(n)"
  },

  {
    id: "appeler",
    rank: "R024",
    type: "regular",
    group: "er",
    english: "to call",
    french: "appeler",
    phonetic: "ah-puh-lay",
    stemPhon: "ah-puhl",
    conjugations: {
      present: {
        je:   { fr: "appelle", phon: "ah-pel" },
        tu:   { fr: "appelles", phon: "ah-pel" },
        il:   { fr: "appelle", phon: "ah-pel" },
        nous: { fr: "appelons", phon: "ah-puh-loh(n)" },
        vous: { fr: "appelez", phon: "ah-puh-lay" },
        ils:  { fr: "appellent", phon: "ah-pel" }
      },
      futur: {
        je:   { fr: "appellerai", phon: "ah-pel-ray" },
        tu:   { fr: "appelleras", phon: "ah-pel-rah" },
        il:   { fr: "appellera", phon: "ah-pel-rah" },
        nous: { fr: "appellerons", phon: "ah-pel-roh(n)" },
        vous: { fr: "appellerez", phon: "ah-pel-ray" },
        ils:  { fr: "appelleront", phon: "ah-pel-roh(n)" }
      },
      conditionnel: {
        je:   { fr: "appellerais", phon: "ah-pel-reh" },
        tu:   { fr: "appellerais", phon: "ah-pel-reh" },
        il:   { fr: "appellerait", phon: "ah-pel-reh" },
        nous: { fr: "appellerions", phon: "ah-pel-ryoh(n)" },
        vous: { fr: "appelleriez", phon: "ah-pel-ryay" },
        ils:  { fr: "appelleraient", phon: "ah-pel-reh" }
      }
    }
  },

  {
    id: "commencer",
    rank: "R025",
    type: "regular",
    group: "cer",
    english: "to begin, start",
    french: "commencer",
    phonetic: "koh-mah(n)-say",
    stemPhon: "koh-mah(n)"
  },

  {
    id: "essayer",
    rank: "R026",
    type: "regular",
    group: "er",
    english: "to try; to try on",
    french: "essayer",
    phonetic: "eh-seh-yay",
    stemPhon: "eh-sey",
    family: "like payer",
    conjugations: {
      present: {
        je:   { fr: "essaie", phon: "eh-seh" },
        tu:   { fr: "essaies", phon: "eh-seh" },
        il:   { fr: "essaie", phon: "eh-seh" },
        nous: { fr: "essayons", phon: "eh-seh-yoh(n)" },
        vous: { fr: "essayez", phon: "eh-seh-yay" },
        ils:  { fr: "essaient", phon: "eh-seh" }
      },
      futur: {
        je:   { fr: "essaierai", phon: "eh-seh-ray" },
        tu:   { fr: "essaieras", phon: "eh-seh-rah" },
        il:   { fr: "essaiera", phon: "eh-seh-rah" },
        nous: { fr: "essaierons", phon: "eh-seh-roh(n)" },
        vous: { fr: "essaierez", phon: "eh-seh-ray" },
        ils:  { fr: "essaieront", phon: "eh-seh-roh(n)" }
      },
      conditionnel: {
        je:   { fr: "essaierais", phon: "eh-seh-reh" },
        tu:   { fr: "essaierais", phon: "eh-seh-reh" },
        il:   { fr: "essaierait", phon: "eh-seh-reh" },
        nous: { fr: "essaierions", phon: "eh-seh-ryoh(n)" },
        vous: { fr: "essaieriez", phon: "eh-seh-ryay" },
        ils:  { fr: "essaieraient", phon: "eh-seh-reh" }
      }
    }
  },

  {
    id: "changer",
    rank: "R027",
    type: "regular",
    group: "ger",
    english: "to change",
    french: "changer",
    phonetic: "shah(n)-zhay",
    stemPhon: "shah(n)"
  },

  {
    id: "acheter",
    rank: "R033",
    type: "regular",
    group: "er",
    english: "to buy",
    french: "acheter",
    phonetic: "ash-tay",
    stemPhon: "asht",
    conjugations: {
      present: {
        je:   { fr: "achète", phon: "ah-shet" },
        tu:   { fr: "achètes", phon: "ah-shet" },
        il:   { fr: "achète", phon: "ah-shet" },
        nous: { fr: "achetons", phon: "ash-toh(n)" },
        vous: { fr: "achetez", phon: "ash-tay" },
        ils:  { fr: "achètent", phon: "ah-shet" }
      },
      futur: {
        je:   { fr: "achèterai", phon: "ah-shet-ray" },
        tu:   { fr: "achèteras", phon: "ah-shet-rah" },
        il:   { fr: "achètera", phon: "ah-shet-rah" },
        nous: { fr: "achèterons", phon: "ah-shet-roh(n)" },
        vous: { fr: "achèterez", phon: "ah-shet-ray" },
        ils:  { fr: "achèteront", phon: "ah-shet-roh(n)" }
      },
      conditionnel: {
        je:   { fr: "achèterais", phon: "ah-shet-reh" },
        tu:   { fr: "achèterais", phon: "ah-shet-reh" },
        il:   { fr: "achèterait", phon: "ah-shet-reh" },
        nous: { fr: "achèterions", phon: "ah-shet-ryoh(n)" },
        vous: { fr: "achèteriez", phon: "ah-shet-ryay" },
        ils:  { fr: "achèteraient", phon: "ah-shet-reh" }
      }
    }
  },

  {
    id: "payer",
    rank: "R039",
    type: "regular",
    group: "er",
    english: "to pay (for)",
    french: "payer",
    phonetic: "peh-yay",
    stemPhon: "pey",
    conjugations: {
      present: {
        je:   { fr: "paie", phon: "peh" },
        tu:   { fr: "paies", phon: "peh" },
        il:   { fr: "paie", phon: "peh" },
        nous: { fr: "payons", phon: "peh-yoh(n)" },
        vous: { fr: "payez", phon: "peh-yay" },
        ils:  { fr: "paient", phon: "peh" }
      },
      futur: {
        je:   { fr: "paierai", phon: "peh-ray" },
        tu:   { fr: "paieras", phon: "peh-rah" },
        il:   { fr: "paiera", phon: "peh-rah" },
        nous: { fr: "paierons", phon: "peh-roh(n)" },
        vous: { fr: "paierez", phon: "peh-ray" },
        ils:  { fr: "paieront", phon: "peh-roh(n)" }
      },
      conditionnel: {
        je:   { fr: "paierais", phon: "peh-reh" },
        tu:   { fr: "paierais", phon: "peh-reh" },
        il:   { fr: "paierait", phon: "peh-reh" },
        nous: { fr: "paierions", phon: "peh-ryoh(n)" },
        vous: { fr: "paieriez", phon: "peh-ryay" },
        ils:  { fr: "paieraient", phon: "peh-reh" }
      }
    }
  },

  {
    id: "esperer",
    rank: "R047",
    type: "regular",
    group: "er",
    english: "to hope",
    french: "espérer",
    phonetic: "es-pay-ray",
    stemPhon: "es-payr",
    family: "like préférer",
    conjugations: {
      present: {
        je:   { fr: "espère", phon: "es-per" },
        tu:   { fr: "espères", phon: "es-per" },
        il:   { fr: "espère", phon: "es-per" },
        nous: { fr: "espérons", phon: "es-pay-roh(n)" },
        vous: { fr: "espérez", phon: "es-pay-ray" },
        ils:  { fr: "espèrent", phon: "es-per" }
      }
    }
  },

  {
    id: "se-lever",
    rank: "R048",
    type: "regular",
    group: "er",
    english: "to get up",
    french: "se lever",
    phonetic: "suh luh-vay",
    stemPhon: "luhv",
    reflexive: true,
    family: "like acheter",
    conjugations: {
      present: {
        je:   { fr: "lève", phon: "lev" },
        tu:   { fr: "lèves", phon: "lev" },
        il:   { fr: "lève", phon: "lev" },
        nous: { fr: "levons", phon: "luh-voh(n)" },
        vous: { fr: "levez", phon: "luh-vay" },
        ils:  { fr: "lèvent", phon: "lev" }
      },
      futur: {
        je:   { fr: "lèverai", phon: "lev-ray" },
        tu:   { fr: "lèveras", phon: "lev-rah" },
        il:   { fr: "lèvera", phon: "lev-rah" },
        nous: { fr: "lèverons", phon: "lev-roh(n)" },
        vous: { fr: "lèverez", phon: "lev-ray" },
        ils:  { fr: "lèveront", phon: "lev-roh(n)" }
      },
      conditionnel: {
        je:   { fr: "lèverais", phon: "lev-reh" },
        tu:   { fr: "lèverais", phon: "lev-reh" },
        il:   { fr: "lèverait", phon: "lev-reh" },
        nous: { fr: "lèverions", phon: "lev-ryoh(n)" },
        vous: { fr: "lèveriez", phon: "lev-ryay" },
        ils:  { fr: "lèveraient", phon: "lev-reh" }
      }
    }
  },

  {
    id: "jeter",
    rank: "R049",
    type: "regular",
    group: "er",
    english: "to throw (away)",
    french: "jeter",
    phonetic: "zhuh-tay",
    stemPhon: "zhuht",
    family: "like appeler",
    conjugations: {
      present: {
        je:   { fr: "jette", phon: "zhet" },
        tu:   { fr: "jettes", phon: "zhet" },
        il:   { fr: "jette", phon: "zhet" },
        nous: { fr: "jetons", phon: "zhuh-toh(n)" },
        vous: { fr: "jetez", phon: "zhuh-tay" },
        ils:  { fr: "jettent", phon: "zhet" }
      },
      futur: {
        je:   { fr: "jetterai", phon: "zhet-ray" },
        tu:   { fr: "jetteras", phon: "zhet-rah" },
        il:   { fr: "jettera", phon: "zhet-rah" },
        nous: { fr: "jetterons", phon: "zhet-roh(n)" },
        vous: { fr: "jetterez", phon: "zhet-ray" },
        ils:  { fr: "jetteront", phon: "zhet-roh(n)" }
      },
      conditionnel: {
        je:   { fr: "jetterais", phon: "zhet-reh" },
        tu:   { fr: "jetterais", phon: "zhet-reh" },
        il:   { fr: "jetterait", phon: "zhet-reh" },
        nous: { fr: "jetterions", phon: "zhet-ryoh(n)" },
        vous: { fr: "jetteriez", phon: "zhet-ryay" },
        ils:  { fr: "jetteraient", phon: "zhet-reh" }
      }
    }
  },

  {
    id: "preferer",
    rank: "R050",
    type: "regular",
    group: "er",
    english: "to prefer",
    french: "préférer",
    phonetic: "pray-fay-ray",
    stemPhon: "pray-fayr",
    conjugations: {
      present: {
        je:   { fr: "préfère", phon: "pray-fer" },
        tu:   { fr: "préfères", phon: "pray-fer" },
        il:   { fr: "préfère", phon: "pray-fer" },
        nous: { fr: "préférons", phon: "pray-fay-roh(n)" },
        vous: { fr: "préférez", phon: "pray-fay-ray" },
        ils:  { fr: "préfèrent", phon: "pray-fer" }
      }
    }
  },

  {
    id: "se-coucher",
    rank: "R051",
    type: "regular",
    group: "er",
    english: "to go to bed",
    french: "se coucher",
    phonetic: "suh koo-shay",
    stemPhon: "koosh",
    reflexive: true
  },

  {
    id: "se-reveiller",
    rank: "R052",
    type: "regular",
    group: "er",
    english: "to wake up",
    french: "se réveiller",
    phonetic: "suh ray-veh-yay",
    stemPhon: "ray-vey",
    reflexive: true
  },

  {
    id: "s-habiller",
    rank: "R053",
    type: "regular",
    group: "er",
    english: "to get dressed",
    french: "s'habiller",
    phonetic: "sah-bee-yay",
    stemPhon: "ah-beey",
    reflexive: true
  },

  {
    id: "repeter",
    rank: "R054",
    type: "regular",
    group: "er",
    english: "to repeat; to rehearse",
    french: "répéter",
    phonetic: "ray-pay-tay",
    stemPhon: "ray-payt",
    family: "like préférer",
    conjugations: {
      present: {
        je:   { fr: "répète", phon: "ray-pet" },
        tu:   { fr: "répètes", phon: "ray-pet" },
        il:   { fr: "répète", phon: "ray-pet" },
        nous: { fr: "répétons", phon: "ray-pay-toh(n)" },
        vous: { fr: "répétez", phon: "ray-pay-tay" },
        ils:  { fr: "répètent", phon: "ray-pet" }
      }
    }
  },

  {
    id: "lever",
    rank: "R055",
    type: "regular",
    group: "er",
    english: "to raise, lift",
    french: "lever",
    phonetic: "luh-vay",
    stemPhon: "luhv",
    family: "like acheter",
    conjugations: {
      present: {
        je:   { fr: "lève", phon: "lev" },
        tu:   { fr: "lèves", phon: "lev" },
        il:   { fr: "lève", phon: "lev" },
        nous: { fr: "levons", phon: "luh-voh(n)" },
        vous: { fr: "levez", phon: "luh-vay" },
        ils:  { fr: "lèvent", phon: "lev" }
      },
      futur: {
        je:   { fr: "lèverai", phon: "lev-ray" },
        tu:   { fr: "lèveras", phon: "lev-rah" },
        il:   { fr: "lèvera", phon: "lev-rah" },
        nous: { fr: "lèverons", phon: "lev-roh(n)" },
        vous: { fr: "lèverez", phon: "lev-ray" },
        ils:  { fr: "lèveront", phon: "lev-roh(n)" }
      },
      conditionnel: {
        je:   { fr: "lèverais", phon: "lev-reh" },
        tu:   { fr: "lèverais", phon: "lev-reh" },
        il:   { fr: "lèverait", phon: "lev-reh" },
        nous: { fr: "lèverions", phon: "lev-ryoh(n)" },
        vous: { fr: "lèveriez", phon: "lev-ryay" },
        ils:  { fr: "lèveraient", phon: "lev-reh" }
      }
    }
  },

  {
    id: "partager",
    rank: "R056",
    type: "regular",
    group: "ger",
    english: "to share",
    french: "partager",
    phonetic: "par-tah-zhay",
    stemPhon: "par-tah"
  },

  {
    id: "voyager",
    rank: "R057",
    type: "regular",
    group: "ger",
    english: "to travel",
    french: "voyager",
    phonetic: "vwah-yah-zhay",
    stemPhon: "vwah-yah"
  },

  {
    id: "ranger",
    rank: "R058",
    type: "regular",
    group: "ger",
    english: "to tidy, put away",
    french: "ranger",
    phonetic: "rah(n)-zhay",
    stemPhon: "rah(n)"
  },

  {
    id: "nager",
    rank: "R059",
    type: "regular",
    group: "ger",
    english: "to swim",
    french: "nager",
    phonetic: "nah-zhay",
    stemPhon: "nah"
  },

  // END OF VERBS
];
