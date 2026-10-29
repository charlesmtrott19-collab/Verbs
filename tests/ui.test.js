// Phase 8 (v6.9) visual redesign: what can be checked without a browser (Section 4F). Layout, contrast and Lighthouse
// need the phone or a real browser.
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs"), path = require("path");
const { loadApp } = require("./lib/load-app");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const css = html.slice(html.indexOf("<style>"), html.indexOf("</style>"));

test("type scale: every font size in the CSS is one of the 5 tokens (14/16/20/28/40 px)", () => {
  const sizes = [...css.matchAll(/font(?:-size)?:\s*(?:\d{3}\s+)?([^;}\s]+)/g)].map(m => m[1]).filter(v => /\d/.test(v) && !/^var\(--fs-[1-5]\)$/.test(v) && v !== "calc(16px");   // the root size (text-size setting)
  assert.deepEqual(sizes, []);
  assert.match(css, /--fs-1:\.875rem; --fs-2:1rem; --fs-3:1\.25rem; --fs-4:1\.75rem; --fs-5:2\.5rem;/);
});

test("tap targets: buttons, play, sub-tabs, segmented and select are at least 44 px", () => {
  for (const sel of [".sm{", ".play{", ".c-pl .play{", ".subnav button{", ".seg button{", "select{", ".iconbtn{"]) {
    const rule = css.slice(css.indexOf(sel), css.indexOf("}", css.indexOf(sel)));
    const h = rule.match(/(?:min-)?height:(\d+)px/);
    assert.ok(h && Number(h[1]) >= 44, `${sel} ${h && h[1]}`);
  }
});

test("control borders use the 3:1 token in light and dark", () => {
  const lum = hex => { const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(x => x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  assert.ok(ratio("#7b8396", "#ffffff") >= 3, "light on paper");
  assert.ok(ratio("#7b8396", "#f5f6f8") >= 3, "light on page");
  assert.ok(ratio("#6f7891", "#12151f") >= 3, "dark on paper");
  for (const sel of [".ghost{", ".subnav button{", ".seg button{", "select{"]) assert.match(css.slice(css.indexOf(sel), css.indexOf("}", css.indexOf(sel))), /var\(--ctl\)/, sel);
});

test("three tabs; Settings behind the gear on Today; Learn merged into the Library", async () => {
  const app = await loadApp();
  try {
    const d = app.window.document;
    assert.deepEqual([...d.querySelectorAll("#tabs [data-tab]")].map(b => b.textContent), ["Today", "Library", "Progress"]);
    assert.equal(d.querySelectorAll('.subnav [data-tab="learn"]').length, 0);
    d.querySelector('#tabs [data-tab="today"]').click();
    d.querySelector(".gear").click();
    assert.equal(d.querySelector("#scr-settings").hidden, false, "gear opens Settings");
    assert.equal(d.querySelector('#tabs [data-tab="today"]').getAttribute("aria-current"), "page");
    d.querySelector('#scr-settings [data-tab="today"]').click();
    assert.equal(d.querySelector("#scr-today").hidden, false, "back to Today");
    app.internals.navigate("learn", { verb: "aller" });
    assert.equal(d.querySelector("#scr-library").hidden, false, "a verb link opens the Library");
    assert.equal(d.querySelector('[data-libtoggle="aller"]').getAttribute("aria-expanded"), "true", "with the verb page open");
    await new Promise(r => setTimeout(r, 50));   // let the Library's log load finish before closing
  } finally { app.close(); }
});

test("study: one tap to the first card; progress reads 'n of N · about m min left'; keys 1 Again, 3 Good", async () => {
  const app = await loadApp();
  try {
    const w = app.window, d = w.document; let t = 1e6;
    w.performance.now = () => t; app.verbes.settings.animations = false;
    d.querySelector('[data-sec^="start:"]').click();
    d.querySelector('[data-today="ready"]').click();
    assert.match(d.querySelector("#sScore").textContent, /^0 of \d+ · about \d+ min left$/);
    const s = app.verbes.session, key = k => { t += 1000; d.dispatchEvent(new w.KeyboardEvent("keydown", { key: k, bubbles: true })); };
    const i0 = s.idx;
    key("3"); key("3");
    assert.equal(s.idx, i0 + 1, "3 shows the answer, then grades Good");
    key("1"); key("1");
    assert.equal(s.vs[Object.keys(s.vs).find(k => s.vs[k].fail)].fail, true, "1 grades Again");
  } finally { app.close(); }
});
