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
   Add one object to VERBS. The ORDER of VERBS matters: it is the order in which
   verbs are introduced to the learner.

     id           REQUIRED. Unique. Lowercase a-z, 0-9, "-" or "_" only, no accents.
                  NEVER change an id once it exists: saved progress is keyed by it.
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
     conjugations REQUIRED for irregular verbs, with a table for EVERY tense in TENSES.
                  Optional for regular verbs: a table here REPLACES the generated forms for
                  that tense only (use it for spelling changes, e.g. manger: nous mangeons).
                  Each table lists all six persons:

                    present: {
                      je:   { fr: "suis",   phon: "swee",  en: "I am" },
                      tu:   { fr: "es",     phon: "eh",    en: "you are" },
                      il:   { fr: "est",    phon: "eh",    en: "he/she is" },
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
  il:   { label: "il/elle",   fr: "il/elle",                    speak: "il",   phon: "eel/el" },
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

  /* ---------- IRREGULAR (test data) ---------- */

  {
    id: "etre",
    type: "irregular",
    group: "irregular",
    english: "to be",
    french: "être",
    phonetic: "eh-truh",
    test: true,
    conjugations: {
      present: {
        je:   { fr: "suis",       phon: "swee",        en: "I am" },
        tu:   { fr: "es",         phon: "eh",          en: "you are" },
        il:   { fr: "est",        phon: "eh",          en: "he/she is" },
        nous: { fr: "sommes",     phon: "sum",         en: "we are" },
        vous: { fr: "êtes",       phon: "et",          en: "you are" },
        ils:  { fr: "sont",       phon: "soh(n)",      en: "they are" }
      },
      passe_compose: {
        je:   { fr: "ai été",     phon: "ay ay-tay",        en: "I was / have been" },
        tu:   { fr: "as été",     phon: "ah ay-tay",        en: "you were / have been" },
        il:   { fr: "a été",      phon: "ah ay-tay",        en: "he/she was / has been" },
        nous: { fr: "avons été",  phon: "ah-voh(n) ay-tay", en: "we were / have been" },
        vous: { fr: "avez été",   phon: "ah-vay ay-tay",    en: "you were / have been" },
        ils:  { fr: "ont été",    phon: "oh(n) ay-tay",     en: "they were / have been" }
      },
      imparfait: {
        je:   { fr: "étais",      phon: "ay-teh",      en: "I was / used to be" },
        tu:   { fr: "étais",      phon: "ay-teh",      en: "you were / used to be" },
        il:   { fr: "était",      phon: "ay-teh",      en: "he/she was / used to be" },
        nous: { fr: "étions",     phon: "ay-tyoh(n)",  en: "we were / used to be" },
        vous: { fr: "étiez",      phon: "ay-tyay",     en: "you were / used to be" },
        ils:  { fr: "étaient",    phon: "ay-teh",      en: "they were / used to be" }
      },
      futur: {
        je:   { fr: "serai",      phon: "suh-ray",     en: "I will be" },
        tu:   { fr: "seras",      phon: "suh-rah",     en: "you will be" },
        il:   { fr: "sera",       phon: "suh-rah",     en: "he/she will be" },
        nous: { fr: "serons",     phon: "suh-roh(n)",  en: "we will be" },
        vous: { fr: "serez",      phon: "suh-ray",     en: "you will be" },
        ils:  { fr: "seront",     phon: "suh-roh(n)",  en: "they will be" }
      },
      conditionnel: {
        je:   { fr: "serais",     phon: "suh-reh",     en: "I would be" },
        tu:   { fr: "serais",     phon: "suh-reh",     en: "you would be" },
        il:   { fr: "serait",     phon: "suh-reh",     en: "he/she would be" },
        nous: { fr: "serions",    phon: "suh-ryoh(n)", en: "we would be" },
        vous: { fr: "seriez",     phon: "suh-ryay",    en: "you would be" },
        ils:  { fr: "seraient",   phon: "suh-reh",     en: "they would be" }
      }
    }
  },

  {
    id: "avoir",
    type: "irregular",
    group: "irregular",
    english: "to have",
    french: "avoir",
    phonetic: "ah-vwahr",
    test: true,
    conjugations: {
      present: {
        je:   { fr: "ai",         phon: "ay",          en: "I have" },
        tu:   { fr: "as",         phon: "ah",          en: "you have" },
        il:   { fr: "a",          phon: "ah",          en: "he/she has" },
        nous: { fr: "avons",      phon: "ah-voh(n)",   en: "we have" },
        vous: { fr: "avez",       phon: "ah-vay",      en: "you have" },
        ils:  { fr: "ont",        phon: "oh(n)",       en: "they have" }
      },
      passe_compose: {
        je:   { fr: "ai eu",      phon: "ay ew",          en: "I had / have had" },
        tu:   { fr: "as eu",      phon: "ah ew",          en: "you had / have had" },
        il:   { fr: "a eu",       phon: "ah ew",          en: "he/she had / has had" },
        nous: { fr: "avons eu",   phon: "ah-voh(n) ew",   en: "we had / have had" },
        vous: { fr: "avez eu",    phon: "ah-vay ew",      en: "you had / have had" },
        ils:  { fr: "ont eu",     phon: "oh(n) ew",       en: "they had / have had" }
      },
      imparfait: {
        je:   { fr: "avais",      phon: "ah-veh",      en: "I had / used to have" },
        tu:   { fr: "avais",      phon: "ah-veh",      en: "you had / used to have" },
        il:   { fr: "avait",      phon: "ah-veh",      en: "he/she had / used to have" },
        nous: { fr: "avions",     phon: "ah-vyoh(n)",  en: "we had / used to have" },
        vous: { fr: "aviez",      phon: "ah-vyay",     en: "you had / used to have" },
        ils:  { fr: "avaient",    phon: "ah-veh",      en: "they had / used to have" }
      },
      futur: {
        je:   { fr: "aurai",      phon: "oh-ray",      en: "I will have" },
        tu:   { fr: "auras",      phon: "oh-rah",      en: "you will have" },
        il:   { fr: "aura",       phon: "oh-rah",      en: "he/she will have" },
        nous: { fr: "aurons",     phon: "oh-roh(n)",   en: "we will have" },
        vous: { fr: "aurez",      phon: "oh-ray",      en: "you will have" },
        ils:  { fr: "auront",     phon: "oh-roh(n)",   en: "they will have" }
      },
      conditionnel: {
        je:   { fr: "aurais",     phon: "oh-reh",      en: "I would have" },
        tu:   { fr: "aurais",     phon: "oh-reh",      en: "you would have" },
        il:   { fr: "aurait",     phon: "oh-reh",      en: "he/she would have" },
        nous: { fr: "aurions",    phon: "oh-ryoh(n)",  en: "we would have" },
        vous: { fr: "auriez",     phon: "oh-ryay",     en: "you would have" },
        ils:  { fr: "auraient",   phon: "oh-reh",      en: "they would have" }
      }
    }
  },

  {
    id: "aller",
    type: "irregular",
    group: "irregular",
    english: "to go",
    french: "aller",
    phonetic: "ah-lay",
    auxiliary: "être",
    test: true,
    conjugations: {
      present: {
        je:   { fr: "vais",       phon: "veh",         en: "I go / am going" },
        tu:   { fr: "vas",        phon: "vah",         en: "you go / are going" },
        il:   { fr: "va",         phon: "vah",         en: "he/she goes / is going" },
        nous: { fr: "allons",     phon: "ah-loh(n)",   en: "we go / are going" },
        vous: { fr: "allez",      phon: "ah-lay",      en: "you go / are going" },
        ils:  { fr: "vont",       phon: "voh(n)",      en: "they go / are going" }
      },
      passe_compose: {
        je:   { fr: "suis allé(e)",       phon: "swee ah-lay",    en: "I went / have gone" },
        tu:   { fr: "es allé(e)",         phon: "eh ah-lay",      en: "you went / have gone" },
        il:   { fr: "est allé(e)",        phon: "eh ah-lay",      en: "he/she went / has gone" },
        nous: { fr: "sommes allé(e)s",    phon: "sum ah-lay",     en: "we went / have gone" },
        vous: { fr: "êtes allé(e)(s)",    phon: "et ah-lay",      en: "you went / have gone" },
        ils:  { fr: "sont allé(e)s",      phon: "soh(n) ah-lay",  en: "they went / have gone" }
      },
      imparfait: {
        je:   { fr: "allais",     phon: "ah-leh",      en: "I was going / used to go" },
        tu:   { fr: "allais",     phon: "ah-leh",      en: "you were going / used to go" },
        il:   { fr: "allait",     phon: "ah-leh",      en: "he/she was going / used to go" },
        nous: { fr: "allions",    phon: "ah-lyoh(n)",  en: "we were going / used to go" },
        vous: { fr: "alliez",     phon: "ah-lyay",     en: "you were going / used to go" },
        ils:  { fr: "allaient",   phon: "ah-leh",      en: "they were going / used to go" }
      },
      futur: {
        je:   { fr: "irai",       phon: "ee-ray",      en: "I will go" },
        tu:   { fr: "iras",       phon: "ee-rah",      en: "you will go" },
        il:   { fr: "ira",        phon: "ee-rah",      en: "he/she will go" },
        nous: { fr: "irons",      phon: "ee-roh(n)",   en: "we will go" },
        vous: { fr: "irez",       phon: "ee-ray",      en: "you will go" },
        ils:  { fr: "iront",      phon: "ee-roh(n)",   en: "they will go" }
      },
      conditionnel: {
        je:   { fr: "irais",      phon: "ee-reh",      en: "I would go" },
        tu:   { fr: "irais",      phon: "ee-reh",      en: "you would go" },
        il:   { fr: "irait",      phon: "ee-reh",      en: "he/she would go" },
        nous: { fr: "irions",     phon: "ee-ryoh(n)",  en: "we would go" },
        vous: { fr: "iriez",      phon: "ee-ryay",     en: "you would go" },
        ils:  { fr: "iraient",    phon: "ee-reh",      en: "they would go" }
      }
    }
  },

  /* ---------- REGULAR (test data) ---------- */

  {
    id: "parler",
    type: "regular",
    group: "er",
    english: "to speak",
    french: "parler",
    phonetic: "par-lay",
    stemPhon: "parl",
    test: true
  },

  {
    id: "finir",
    type: "regular",
    group: "ir",
    english: "to finish",
    french: "finir",
    phonetic: "fee-neer",
    stemPhon: "fee-n",
    test: true
  },

  {
    id: "vendre",
    type: "regular",
    group: "re",
    english: "to sell",
    french: "vendre",
    phonetic: "vah(n)-druh",
    stemPhon: "vah(n)",
    test: true
  },

  {
    id: "arriver",
    type: "regular",
    group: "er",
    english: "to arrive",
    french: "arriver",
    phonetic: "ah-ree-vay",
    stemPhon: "ah-reev",
    auxiliary: "être",
    test: true
  }

  // END OF VERBS
];
