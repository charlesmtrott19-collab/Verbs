#!/usr/bin/env python3
"""Compare the app's forms with an independent conjugator (mlconjug3, built on Verbiste data).

Optional, run when verbs are added or corrected:
    pip install mlconjug3
    npm run export-forms
    python3 tests/reference_check.py

Checks the présent, imparfait, futur and conditionnel for every person, plus the past participle.
Prints each mismatch and exits 1 if there are any. A mismatch is not automatically an app error:
the reference has gaps (it returned nothing for être's participle in October 2026), and some verbs
have two accepted conjugations (s'asseoir). Check each one by hand.
"""
import json, os, re, sys, warnings

warnings.filterwarnings("ignore")
try:
    import mlconjug3
except ImportError:
    sys.exit("mlconjug3 is not installed: pip install mlconjug3")

HERE = os.path.dirname(os.path.abspath(__file__))
FORMS = os.path.join(HERE, "out", "forms.json")
if not os.path.exists(FORMS):
    sys.exit("tests/out/forms.json not found: run `npm run export-forms` first")

PERSONS = ["je", "tu", "il", "nous", "vous", "ils"]
KEYS = ["1s", "2s", "3s", "1p", "2p", "3p"]
TENSES = {"present": ("Indicatif", "Présent"), "imparfait": ("Indicatif", "Imparfait"),
          "futur": ("Indicatif", "Futur"), "conditionnel": ("Conditionnel", "Présent")}
REFL = {"je": ["me ", "m'"], "tu": ["te ", "t'"], "il": ["se ", "s'"], "nous": ["nous "], "vous": ["vous "], "ils": ["se ", "s'"]}
# Known reference gaps, checked by hand on 27 Oct 2026. Keep the reason.
KNOWN_OK = {
    ("être", "participle"): "reference returns no participle; été is correct",
    ("devoir", "participle"): "reference returns 'dues'; dû is correct",
    ("falloir", "participle"): "reference returns no participle; fallu is correct (checked 29 Oct 2026)",
}

conj = mlconjug3.Conjugator(language="fr")
verbs = json.load(open(FORMS, encoding="utf-8"))
checked, bad = 0, []

for v in verbs:
    inf = v["french"]
    base = re.sub(r"^(se |s')(en )?", "", inf)
    base = re.sub(r" (de|à|\(.*\))$", "", base).strip()
    reflexive = inf.startswith("se ") or inf.startswith("s'")

    def body(form, p):
        if reflexive:
            for r in REFL[p]:
                if form.startswith(r):
                    form = form[len(r):]
                    break
            if form.startswith("en "):
                form = form[3:]
        return form

    try:
        info = conj.conjugate(base).conjug_info
    except Exception as e:
        bad.append((inf, "no reference", str(e)))
        continue
    for t, (mood, tense) in TENSES.items():
        for p, k in zip(PERSONS, KEYS):
            if p not in v["forms"][t]:
                continue  # persons limited (impersonal verbs: il only)
            mine = body(v["forms"][t][p], p)
            ref = info[mood][tense][k]
            checked += 1
            if mine != ref:
                bad.append((inf, t, p, mine, ref))
    p0 = next(p for p in PERSONS if p in v["forms"]["passe_compose"])
    part = body(v["forms"]["passe_compose"][p0], p0).split(" ")[-1].replace("(e)", "")
    pp = info["Participe"]["Participe Passé"]
    vals = [x for x in (pp.values() if hasattr(pp, "values") else [pp]) if isinstance(x, str)]
    cands = set()
    for x in vals:
        cands |= {x, re.sub("es$", "", x), re.sub("s$", "", x), re.sub("e$", "", x)}
    checked += 1
    if part not in cands and (inf, "participle") not in KNOWN_OK:
        bad.append((inf, "participle", part, vals))

print(f"Compared {checked} forms across {len(verbs)} verbs: {len(bad)} mismatch(es).")
for b in bad:
    print("  ", b)
sys.exit(1 if bad else 0)
