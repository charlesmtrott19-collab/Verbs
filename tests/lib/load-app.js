// Loads index.html with verbs.js into jsdom, the way a browser would, and returns the page's window.
// The app files are never modified on disk. In memory only, two things are changed:
//   1. verbs.js is inlined (jsdom can't fetch a relative file from a string), with its top-level
//      `const` declarations turned into `var` so the page's script can see them, as in a browser.
//   2. One line is added after `window.__verbes = …` to expose scheduler internals as
//      window.__verbesTest. Nothing in the app reads it.
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");
const { IDBFactory, IDBKeyRange } = require("fake-indexeddb");

const ROOT = path.resolve(__dirname, "..", "..");
const VERBS_TAG = '<script src="verbs.js" onerror="window.__verbsMissing = true"></script>';
const HOOK_ANCHOR = "window.__verbes = {";
// Each name is looked up with a direct eval inside the app's closure, so older versions of index.html (which lack
// some of these functions) still load: missing names are simply left out.
const HOOK_NAMES = ["applyResult", "lapseStep", "relapse", "addDays", "dayDiff", "verbUnits", "OFFSETS", "GAPS", "LT_GAP",
  "logDB", "aiDB", "makeBundle", "listBundles", "restoreBundle", "pruneBackups", "exportData", "importData",
  "LADDER", "GOOD_FACTOR", "HARD_FACTOR", "MAX_GAP", "LAPSE_TO", "REVIEW_CAP", "capReviews", "riskOf", "migrateSched", "curState", "soundAlike", "reviewRecall", "REG_MIN",
  "verbDetailHTML", "mainHTML", "newItem", "schedSections", "sectionVerbs", "familyText",
  "allClipLines", "loadManifest", "aiClip", "pickVoice", "voicesFor", "flagClip", "regenOpen", "regenFile", "speakText", "playLine",
  "cardStatus", "verbStatus", "progressMetrics", "progressHTML", "libVerbHTML", "libList", "loadLog", "paceText", "undo"];
const HOOK = "\nwindow.__verbesTest = { setSetting(k, v) { settings[k] = v; } };\n" +
  JSON.stringify(HOOK_NAMES) + ".forEach(n => { try { window.__verbesTest[n] = eval(n); } catch (e) {} });\n";

function readApp({ indexPath = path.join(ROOT, "index.html"), verbsSource } = {}) {
  let html = fs.readFileSync(indexPath, "utf8");
  const verbs = verbsSource !== undefined ? verbsSource : fs.readFileSync(path.join(ROOT, "verbs.js"), "utf8");
  if (!html.includes(VERBS_TAG)) throw new Error("load-app: the verbs.js <script> tag in index.html has changed; update VERBS_TAG in tests/lib/load-app.js");
  const inlined = verbs.replace(/^const (TENSES|PRONOUNS|RULES|AUXILIARIES|VERBS)\s*=/gm, "var $1 =");
  html = html.replace(VERBS_TAG, () => "<script>" + inlined + "\n</script>");
  // Add the hook after the line that defines window.__verbes (the line ends with "};").
  const at = html.indexOf(HOOK_ANCHOR);
  if (at < 0) throw new Error("load-app: window.__verbes was not found in index.html; update HOOK_ANCHOR in tests/lib/load-app.js");
  const end = html.indexOf("};", at);
  html = html.slice(0, end + 2) + HOOK + html.slice(end + 2);
  return html;
}

// Returns a Promise of { window, verbes, internals, errors }.
// `errors` collects uncaught page errors and console.error output, so tests can assert there are none.
function loadApp(opts = {}) {
  const html = readApp(opts);
  const errors = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", e => { if (!/Not implemented/.test(String(e && e.message))) errors.push(String(e && (e.stack || e.message))); });
  vc.on("error", (...a) => errors.push(a.map(String).join(" ")));
  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    url: "https://verbes.test/",
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(w) {
      w.HTMLElement.prototype.scrollIntoView = function () {};
      w.scrollTo = () => {};
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
      if (w.HTMLDialogElement) {
        w.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
        w.HTMLDialogElement.prototype.close = function () { this.open = false; };
      }
      // jsdom has no IndexedDB; each page gets its own in-memory one (or the one passed in, to survive a "reload").
      w.indexedDB = opts.indexedDB || new IDBFactory(); w.IDBKeyRange = IDBKeyRange;
      if (opts.fetch) w.fetch = opts.fetch; // jsdom has no fetch; tests pass a fake one to serve audio/ and record requests
      if (opts.localStorage) Object.entries(opts.localStorage).forEach(([k, v]) => w.localStorage.setItem(k, v));
    }
  });
  return new Promise((resolve, reject) => {
    const started = Date.now();
    (function wait() {
      const w = dom.window;
      if (w.__verbes && w.__verbesTest && !w.__verbesSettled) {
        // Let the app's own start-up work on IndexedDB (audio cache scan, review log) finish before tests run,
        // so nothing touches the page after a test closes it.
        w.__verbesSettled = true;
        Promise.all([w.__verbesTest.aiDB && w.__verbesTest.aiDB.ready, w.__verbesTest.logDB && w.__verbesTest.logDB.open()].filter(Boolean))
          .then(() => new Promise(r => setTimeout(r, 30))).then(wait);
        return;
      }
      if (w.__verbesSettled === true && w.__verbesTest) return resolve({ window: w, verbes: w.__verbes, internals: w.__verbesTest, errors, close: () => w.close(),
        indexedDB: w.indexedDB, storage: () => { const o = {}; for (let i = 0; i < w.localStorage.length; i++) { const k = w.localStorage.key(i); o[k] = w.localStorage.getItem(k); } return o; } });
      const fatal = w.document && w.document.getElementById("fatal");
      if (fatal && fatal.textContent.trim()) return reject(new Error("App showed its fatal screen: " + fatal.textContent.trim().slice(0, 300)));
      if (w.__verbesSettled) return;  // waiting for start-up to settle
      if (Date.now() - started > 10000) return reject(new Error("App did not finish loading within 10 s. Page errors: " + errors.join(" | ")));
      setTimeout(wait, 20);
    })();
  });
}

// Loads verbs.js in plain Node (no page), for data-only checks.
function loadVerbsData(source) {
  const src = (source !== undefined ? source : fs.readFileSync(path.join(ROOT, "verbs.js"), "utf8")) +
    "\n;module.exports = { TENSES, PRONOUNS, RULES, AUXILIARIES, VERBS };";
  const m = { exports: {} };
  new Function("module", src)(m);
  return m.exports;
}

// Values from the page live in another JavaScript realm, so assert.deepEqual sees different prototypes.
// plain() turns them into ordinary Node values before comparing.
const plain = x => JSON.parse(JSON.stringify(x));

module.exports = { loadApp, loadVerbsData, readApp, plain, ROOT };
