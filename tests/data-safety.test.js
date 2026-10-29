// Safe data (Phase 2, v6.2): backup bundles, no double-advance after a crash, the review log, and audio-cache eviction.
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadApp, plain } = require("./lib/load-app");

const STORES = ["settings", "progress", "schedule", "formsched", "review", "timing", "session", "history"].map(n => "frverbs." + n);
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Drives the app like a person: start the irregular section, pass the Learn step, then grade cards.
function driver(app) {
  const w = app.window, d = w.document; let clock = 1e6;
  w.performance.now = () => clock;
  app.verbes.settings.animations = false;
  const S = () => app.verbes.session;
  const cur = () => S().queue[S().idx];
  const press = act => { clock += 1000; d.querySelector(`#actions [data-act="${act}"]`).click(); };
  return {
    w, d, S, cur,
    unit: it => it.kind === "main" ? `${it.verbId}|inf` : `${it.verbId}|${it.tense}|${it.person}`,   // the app's card keys
    start() {
      const go = d.querySelector('[data-sec^="start:"]') || d.querySelector('[data-today="continue"]');   // Continue when a session is open
      go.click();
      const r = d.querySelector('[data-today="ready"]'); if (r) r.click();
    },
    know() { if (!cur().revealed) press("flip"); press("know"); },
    dont() { if (!cur().revealed) press("flip"); press("dont"); },
    // Click OK on the next confirm dialog the app opens.
    async confirmNext() { for (let i = 0; i < 200; i++) { const dl = d.querySelector("#confirmDlg"); if (dl && dl.open) { d.querySelector("#cOk").click(); return; } await sleep(5); } throw new Error("no dialog"); },
    async exportJSON() {
      let blob = null;
      w.URL.createObjectURL = b => { blob = b; return "blob:test"; };
      w.URL.revokeObjectURL = () => {};
      await app.internals.exportData();
      assert.ok(blob, "export produced a file");
      const text = await new Promise((res, rej) => { const fr = new w.FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsText(blob); });
      return JSON.parse(text);
    },
    async importJSON(obj) {
      const done = app.internals.importData({ text: async () => JSON.stringify(obj) });
      await this.confirmNext();
      await done;
    }
  };
}

test("bundles: two imports in a row leave the original data fully restorable", async () => {
  const app = await loadApp(); const D = driver(app);
  try {
    D.start(); D.know(); D.know();                                 // some real progress
    const original = app.storage();
    const backup = await D.exportJSON();
    await D.importJSON(backup);
    await D.importJSON(backup);
    const bundles = app.internals.listBundles();
    assert.equal(bundles.length, 2);
    assert.ok(bundles.every(b => b.label === "before-import"));
    const oldest = JSON.parse(app.window.localStorage.getItem(bundles[1].key));
    STORES.forEach(k => assert.equal(oldest.stores[k.slice(8)], original[k] ?? null, `${k} kept in the first bundle`));
    app.window.localStorage.setItem("frverbs.schedule", "{}");     // damage something, then restore
    assert.equal(app.internals.restoreBundle(oldest), true);
    STORES.forEach(k => assert.equal(app.window.localStorage.getItem(k), original[k] ?? null, `${k} restored`));
  } finally { app.close(); }
});

test("bundles: the newest 3 are kept, and single-store copies are pruned separately", async () => {
  const app = await loadApp(); const I = app.internals, ls = app.window.localStorage;
  try {
    for (let i = 1; i <= 5; i++) { assert.ok(I.makeBundle("test-" + i)); await sleep(3); }
    for (let i = 1; i <= 4; i++) { ls.setItem(`frverbs.backup.settings-damaged.2026-01-0${i}T00-00-00-000Z`, "{}"); }
    I.pruneBackups();
    assert.deepEqual(plain(I.listBundles().map(b => b.label)), ["test-5", "test-4", "test-3"]);
    const singles = Object.keys(app.storage()).filter(k => k.startsWith("frverbs.backup.") && !k.startsWith("frverbs.backup.bundle."));
    assert.equal(singles.length, 3);
  } finally { app.close(); }
});

test("bundles: if no copy can be kept, Import changes nothing", async () => {
  const app = await loadApp(); const D = driver(app);
  try {
    D.start(); D.know();
    const backup = await D.exportJSON();
    backup.formsched = { forms: {}, newLog: {} };                     // an import that would wipe progress
    const before = app.window.localStorage.getItem("frverbs.formsched");
    // Simulate a full store for bundles only. (Assigning setItem on the Storage object would just store an item
    // called "setItem", so the method is replaced on the prototype.)
    const proto = app.window.Storage.prototype, real = proto.setItem;
    proto.setItem = function (k, v) { if (String(k).startsWith("frverbs.backup.bundle.")) throw new Error("quota"); return real.call(this, k, v); };
    const done = app.internals.importData({ text: async () => JSON.stringify(backup) });
    await D.confirmNext();                                            // "Replace your data?"
    await D.confirmNext();                                            // "Import stopped"
    await done;
    assert.equal(app.window.localStorage.getItem("frverbs.formsched"), before);
    assert.equal(plain(app.internals.listBundles()).length, 0);
  } finally { app.close(); }
});

test("crash between saving the schedule and the session never double-advances a card", async () => {
  const a = await loadApp(); const A = driver(a);
  let k, crashed;
  try {
    A.start();
    const sessionBefore = a.window.localStorage.getItem("frverbs.session");
    k = A.unit(A.cur());
    A.know();                                                         // schedule saved: step 0 -> 1
    assert.equal(a.verbes.formsched.forms[k].step, 1);
    crashed = a.storage();
    crashed["frverbs.session"] = sessionBefore;                       // ...but the session save never happened
  } finally { a.close(); }
  const b = await loadApp({ localStorage: crashed }); const B = driver(b);
  try {
    B.start();                                                        // Start resumes the open session
    assert.equal(B.unit(B.cur()), k, "the same card is shown again");
    B.know();
    const e = b.verbes.formsched.forms[k];
    assert.deepEqual({ step: e.step, enc: e.enc }, { step: 1, enc: 1 }, "applied once, not twice");
  } finally { b.close(); }
});

test("review log: one record per first try, none for retries, removed by Undo", async () => {
  const app = await loadApp(); const D = driver(app); const L = app.internals.logDB;
  try {
    D.start();
    const k0 = D.unit(D.cur()); D.know();
    await sleep(20);
    assert.equal((await L.all()).length, 1);
    app.window.document.querySelector("#undoBtn").click();            // undo a first try: its record goes
    await sleep(20);
    assert.equal((await L.all()).length, 0);
    assert.equal(D.unit(D.cur()), k0, "back on the same card");
    const k1 = D.unit(D.cur()); D.know();
    const k2 = D.unit(D.cur()); D.dont();
    await sleep(20);
    let log = plain(await L.all());
    const date = D.S().date;
    assert.equal(log.length, 2);
    const r1 = log.find(r => r.k === k1), r2 = log.find(r => r.k === k2);
    assert.deepEqual({ id: r1.id, d: r1.d, g: r1.g, step: r1.step, gap: r1.gap, late: r1.late, m: r1.m, kind: r1.kind },
      { id: date + "|" + k1, d: date, g: "pass", step: 0, gap: null, late: 0, m: "speak", kind: r1.k.endsWith("|inf") ? "main" : "form" });
    assert.equal(typeof r1.s, "number");
    assert.equal(r2.g, "miss");
    // Answer until the missed card's retry comes round and is right: still one record for it.
    for (let i = 0; i < 400 && !D.S().vs[k2].final && D.S().part === "test"; i++) D.know();
    await sleep(20);
    log = plain(await L.all());
    assert.equal(log.filter(r => r.k === k2).length, 1);
    assert.equal(log.find(r => r.k === k2).g, "miss", "the retry did not overwrite the first try");
  } finally { app.close(); }
});

test("review log: survives an export and import round trip, merged with what is already there", async () => {
  const a = await loadApp(); const A = driver(a);
  let exported;
  try { A.start(); A.know(); A.know(); A.dont(); await sleep(20); exported = await A.exportJSON(); }
  finally { a.close(); }
  assert.equal(exported.log.length, 3);
  const b = await loadApp(); const B = driver(b);
  try {
    await b.internals.logDB.put({ id: "2026-01-01|avoir|inf", d: "2026-01-01", k: "avoir|inf", g: "pass" });
    await B.importJSON(exported);
    const ids = plain(await b.internals.logDB.all()).map(r => r.id).sort();
    assert.deepEqual(ids, [...exported.log.map(r => r.id), "2026-01-01|avoir|inf"].sort());
  } finally { b.close(); }
});

test("review log: Reset keeps the log and adds a marker", async () => {
  const app = await loadApp(); const D = driver(app);
  try {
    D.start(); D.know(); await sleep(20);
    D.d.querySelector("#tabs [data-tab=settings]").click();
    D.d.querySelector('[data-reset="progress"]').click();
    await D.confirmNext(); await sleep(30);
    const log = plain(await app.internals.logDB.all());
    assert.equal(log.filter(r => !r.type).length, 1, "the review record is still there");
    assert.equal(log.filter(r => r.type === "reset-progress").length, 1);
    assert.equal(app.internals.listBundles()[0].label, "before-reset-progress");
  } finally { app.close(); }
});

test("audio cache: playing a clip refreshes its last-played time, so eviction is least-recently-played", async () => {
  const app = await loadApp(); const C = app.internals.aiDB;
  try {
    const old = Date.now() - 10 * 864e5;
    await C.put({ k: "a", blob: "x", size: 10, t: old });
    await C.put({ k: "b", blob: "y", size: 10, t: old + 864e5 });
    await C.get("a");                                                 // "a" is played
    await sleep(20);
    await C.scan();                                                   // as after a reload
    assert.ok(C.keys.get("a").t > Date.now() - 60000, "a's time was saved");
    const order = [...C.keys.entries()].sort((x, y) => x[1].t - y[1].t).map(([k]) => k);
    assert.deepEqual(order, ["b", "a"], "b would be evicted first");
  } finally { app.close(); }
});
