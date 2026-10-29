// Phase 9 (v6.6): pre-generated audio (decision D2). No speech-service call or API key in the app; clips come from
// audio/ on this site with the browser voice as fallback; "Sounded wrong?" builds a regeneration list for the script.
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { loadApp, readApp, plain } = require("./lib/load-app");
const audio = require("../tools/make-audio");

const HTML = readApp();   // index.html with every script it loads (js/*.js since v6.10)

test("the app has no OpenAI address, key field or live speech call", () => {
  assert.doesNotMatch(HTML, /api\.openai\.com/i);
  assert.doesNotMatch(HTML, /aiKeyIn|openai/i);
});

test("start-up removes an OpenAI key left on the device", async () => {
  const app = await loadApp({ localStorage: { "frverbs.aikey": "sk-test", "frverbs.aistats": "{}" } });
  try { const st = app.storage(); assert.equal(st["frverbs.aikey"], undefined); assert.equal(st["frverbs.aistats"], undefined); }
  finally { app.close(); }
});

// A fake site: the manifest the script would write for every card line in two voices, and a small mp3 per clip.
async function siteFor(lines, voices) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "verbes-audio-"));
  const fake = async () => ({ ok: true, status: 200, arrayBuffer: async () => new Uint8Array([73, 68, 51]).buffer });
  await audio.run(["--dir", dir, "--voices", voices.join(","), "--yes"], { fetch: fake, log: () => {}, lines: { cards: lines, full: lines } });
  return dir;
}
function fakeFetch(dir, calls) {
  return async url => {
    calls.push(String(url));
    const f = path.join(dir, String(url).replace(/^audio\//, ""));
    if (!/^audio\//.test(String(url)) || !fs.existsSync(f)) return { ok: false, status: 404 };
    const buf = fs.readFileSync(f);
    return { ok: true, status: 200, json: async () => JSON.parse(buf.toString("utf8")), blob: async () => new (require("buffer").Blob)([buf]) };
  };
}

test("acceptance: every card of a session has a recorded clip, fetched only from this site, then kept on the device", async () => {
  const probe = await loadApp();
  const lines = plain(probe.internals.allClipLines("cards"));
  probe.close();
  const dir = await siteFor(lines, ["marin", "cedar"]), calls = [];
  const app = await loadApp({ fetch: fakeFetch(dir, calls) });
  try {
    const I = app.internals;
    await I.loadManifest();
    // Every card the scheduler can put in a session (1,136 since v6.8), speaking or listening, has a clip in both
    // voices; a key card in every person it can ask. Pattern cards (regular tables) use the browser voice.
    const keys = new Set();
    app.verbes.verbs.forEach(v => (v.type === "irregular" ? I.verbUnits(v) : [v.id]).forEach(k => keys.add(k)));
    assert.equal(keys.size, 1136);
    for (const k of keys) {
      const sp = I.unitSpec(k), v = app.verbes.verbs.find(x => x.id === sp.verbId);
      for (const person of sp.key ? v.tables[sp.tense].rows.map(r => r.key) : [sp.person]) {
        const t = I.speakText(I.newItem(Object.assign({}, sp, { person })));
        assert.deepEqual(plain(I.voicesFor("fr", t)), ["marin", "cedar"], k + " " + person);
      }
    }
    const t = I.speakText(I.newItem({ verbId: "etre", kind: "form", tense: "present", person: "je" }));
    const blob = await I.aiClip("marin", "fr", t);
    assert.ok(blob, "clip played");
    const n = calls.length;
    assert.ok(await I.aiClip("marin", "fr", t), "second play");
    assert.equal(calls.length, n, "the second play comes from the device, with no network call");
    assert.ok(calls.every(u => /^audio\//.test(u)), calls.join("\n"));
    assert.equal(I.pickVoice([{ t: "pas enregistré", lang: "fr" }]), "", "a line with no clip uses the browser voice");
  } finally { app.close(); fs.rmSync(dir, { recursive: true, force: true }); }
});

test("Sounded wrong? flags the clip, the other voice takes over, and the exported list feeds the script", async () => {
  const lines = [{ t: "je suis", lang: "fr" }, { t: "tu es", lang: "fr" }];
  const dir = await siteFor(lines, ["marin", "cedar"]), calls = [];
  const app = await loadApp({ fetch: fakeFetch(dir, calls) });
  try {
    const I = app.internals;
    await I.loadManifest();
    assert.ok(I.flagClip("marin", "fr", "je suis"));
    assert.deepEqual(plain(I.voicesFor("fr", "je suis")), ["cedar"]);
    const f = plain(I.regenFile());
    assert.equal(f.type, "regenerate"); assert.equal(f.items.length, 1); assert.equal(f.items[0].voice, "marin");
    // Run the script on the exported list: only that clip is recorded again, under a new file id.
    const listFile = path.join(dir, "regen.json"); fs.writeFileSync(listFile, JSON.stringify(f));
    let recorded = 0;
    const fake = async () => { recorded++; return { ok: true, status: 200, arrayBuffer: async () => new Uint8Array([1]).buffer }; };
    await audio.run(["--dir", dir, "--yes", "--regen", listFile], { fetch: fake, log: () => {}, lines: { cards: lines, full: lines } });
    assert.equal(recorded, 1);
    const m = JSON.parse(fs.readFileSync(path.join(dir, "manifest.json"), "utf8"));
    assert.notEqual(m.clips["fr|je suis"].marin, f.items[0].id);
    assert.equal(fs.existsSync(path.join(dir, "marin", f.items[0].id + ".mp3")), false, "the old file is deleted");
  } finally { app.close(); fs.rmSync(dir, { recursive: true, force: true }); }
});

test("make-audio is resumable, estimates before spending, and needs a yes", async () => {
  const lines = [{ t: "je suis", lang: "fr" }, { t: "il faut", lang: "fr" }, { t: "nous sommes", lang: "fr" }];
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "verbes-audio-"));
  let calls = 0; const fake = async () => { calls++; return { ok: true, status: 200, arrayBuffer: async () => new Uint8Array([1]).buffer }; };
  const L = { cards: lines, full: lines }, log = [];
  try {
    let r = await audio.run(["--dir", dir, "--dry-run"], { fetch: fake, log: x => log.push(x), lines: L });
    assert.equal(calls, 0); assert.equal(r.todo, 6); assert.match(log.join("\n"), /Estimated cost: about \$/);
    r = await audio.run(["--dir", dir], { fetch: fake, ask: async () => "no", log: () => {}, lines: L });
    assert.equal(calls, 0, "no spending without yes");
    await audio.run(["--dir", dir], { fetch: fake, ask: async () => "yes", log: () => {}, lines: L });
    assert.equal(calls, 6);
    fs.unlinkSync(path.join(dir, "cedar", audio.fileId("cedar", lines[1]) + ".mp3"));   // as if stopped part-way
    r = await audio.run(["--dir", dir, "--yes"], { fetch: fake, log: () => {}, lines: L });
    assert.equal(r.todo, 1); assert.equal(calls, 7);
    assert.deepEqual(audio.parseArgs([]).voices, ["marin", "cedar"]);
    assert.throws(() => audio.parseArgs(["--voices", "alloy"]), /must be from/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
