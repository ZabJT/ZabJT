// Builds the profile's banners, light and dark, from data.mjs, in the portfolio's look: a cool mist page,
// deep green-black ink and a sage accent, Oranienbaum headlines with Cormorant Garamond italics, and Geist
// and Geist Mono for the rest. GitHub shows SVGs as images, which can't load web fonts, so the fonts are
// embedded, and text is measured with them in Chrome so it can be wrapped.
//
//   pnpm build

import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import * as data from "./data.mjs";
import { LOGO_PATHS, LOGO_VIEWBOX } from "./logo.mjs";

const ASSETS = path.resolve(import.meta.dirname, "..");
const FONT_DIR = path.join(ASSETS, "fonts");
const W = 1000;

const FONTS = {
  serif: {
    file: "oranienbaum.woff2",
    url: "https://fonts.gstatic.com/s/oranienbaum/v16/OZpHg_txtzZKMuXLIVrx-0zg5E3VdYHd.woff2",
    weights: [400],
  },
  italic: {
    file: "cormorant-garamond-italic.woff2",
    url: "https://fonts.gstatic.com/s/cormorantgaramond/v21/co3smX5slCNuHLi8bLeY9MK7whWMhyjYrGFEsdtdc62E6zd5wDD-iNM8A_6pUKz9.woff2",
    weights: [500],
    style: "italic",
  },
  sans: {
    file: "geist.woff2",
    url: "https://fonts.gstatic.com/s/geist/v5/gyByhwUxId8gMEwcGFWNOITd.woff2",
    weights: [400, 500, 600],
    variable: true,
  },
  mono: {
    file: "geist-mono.woff2",
    url: "https://fonts.gstatic.com/s/geistmono/v6/or3nQ6H-1_WfwkMZI_qYFrcdmhHkjko.woff2",
    weights: [400, 500],
    variable: true,
  },
};

const THEMES = {
  light: {
    dark: false,
    bg: "#f5f7f6",
    paper: "#ffffff",
    ink: "#15211e",
    inkSoft: "#33433e",
    muted: "#5b6b66",
    faint: "#8a9893",
    line: "#e3e9e6",
    sage: "#2f7d6d",
    sageTint: "#e3f1ec",
    live: "#2f9e6b",
    apricot: "#f2b880",
    onInk: "#f5f7f6",
    shadow: 0.09,
  },
  dark: {
    dark: true,
    bg: "#0e1513",
    paper: "#141d1a",
    ink: "#e8eeeb",
    inkSoft: "#c4cfcb",
    muted: "#93a29d",
    faint: "#6b7b75",
    line: "#25312d",
    sage: "#6cc2ad",
    sageTint: "#17302a",
    live: "#45c58a",
    apricot: "#f2b880",
    onInk: "#0e1513",
    shadow: 0.4,
  },
};

// ---------------------------------------------------------------------------------------------------
// Fonts and measuring

async function loadFonts() {
  fs.mkdirSync(FONT_DIR, { recursive: true });
  for (const font of Object.values(FONTS)) {
    const file = path.join(FONT_DIR, font.file);
    if (!fs.existsSync(file)) {
      const res = await fetch(font.url);
      if (!res.ok) throw new Error(`Couldn't download ${font.url}: ${res.status}`);
      fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    }
    font.base64 = fs.readFileSync(file).toString("base64");
  }
}

let widths = {};

// Every character's advance at 100px, per font and weight, measured in Chrome with the embedded fonts.
async function measureFonts() {
  const chars = [...new Set(JSON.stringify(data) + "0123456789 abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.,:;!?'\"()[]/&+-—–·’‘°%~#@|")];
  const browser = await chromium.launch({ channel: "chrome" });
  const page = await browser.newPage();
  const faces = Object.entries(FONTS).map(([key, font]) => ({
    key,
    base64: font.base64,
    style: font.style ?? "normal",
    weights: font.weights,
    range: font.variable ? "100 900" : String(font.weights[0]),
  }));
  widths = await page.evaluate(
    async ({ faces, chars }) => {
      const out = {};
      const ctx = document.createElement("canvas").getContext("2d");
      for (const face of faces) {
        const bytes = Uint8Array.from(atob(face.base64), (c) => c.charCodeAt(0));
        const ff = new FontFace(`ZT${face.key}`, bytes, { style: face.style, weight: face.range });
        document.fonts.add(await ff.load());
        for (const weight of face.weights) {
          ctx.font = `${face.style} ${weight} 100px ZT${face.key}`;
          out[`${face.key}${weight}`] = Object.fromEntries(chars.map((c) => [c, ctx.measureText(c).width]));
        }
      }
      return out;
    },
    { faces, chars }
  );
  await browser.close();
}

function measure(str, { f = "sans", s = 14, w = 400, ls = 0 } = {}) {
  const table = widths[`${f}${w}`] ?? widths[`${f}${FONTS[f].weights[0]}`];
  let sum = 0;
  for (const c of str) sum += table[c] ?? 60;
  return (sum * s) / 100 + ls * str.length;
}

function wrap(str, maxW, opts) {
  const lines = [];
  let line = "";
  for (const word of str.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (line && measure(next, opts) > maxW) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

// ---------------------------------------------------------------------------------------------------
// Drawing

let used = new Set();
const r = (n) => Math.round(n * 10) / 10;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function text(x, y, str, { f = "sans", s = 14, w = 400, fill, anchor = "start", ls = 0, upper = false, extra = "" } = {}) {
  used.add(f);
  const content = upper ? String(str).toUpperCase() : str;
  return (
    `<text x="${r(x)}" y="${r(y)}" font-family="ZT${f}" font-size="${s}" font-weight="${w}"` +
    (FONTS[f].style ? ` font-style="${FONTS[f].style}"` : "") +
    (anchor !== "start" ? ` text-anchor="${anchor}"` : "") +
    (ls ? ` letter-spacing="${ls}"` : "") +
    ` fill="${fill}"${extra}>${esc(content)}</text>`
  );
}

function lines(x, y, rows, lh, opts) {
  return rows.map((row, i) => text(x, y + i * lh, row, opts)).join("");
}

/** The small uppercase mono label the portfolio puts over everything. */
const EYEBROW = { f: "mono", s: 10.5, w: 500, ls: 1.9, upper: true };
function eyebrow(x, y, str, fill, anchor = "start") {
  return text(x, y, str, { ...EYEBROW, fill, anchor });
}
const eyebrowWidth = (str) => measure(str.toUpperCase(), EYEBROW);

function rect(x, y, w, h, { fill = "none", stroke, rx = 0, sw = 1, extra = "" } = {}) {
  return (
    `<rect x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}" rx="${rx}" fill="${fill}"` +
    (stroke ? ` stroke="${stroke}" stroke-width="${sw}"` : "") +
    `${extra}/>`
  );
}

function card(x, y, w, h, t, { fill = t.paper, rx = 18, shadow = true } = {}) {
  return rect(x + 0.5, y + 0.5, w - 1, h - 1, { fill, stroke: t.line, rx, extra: shadow ? ' filter="url(#sh)"' : "" });
}

const CHIP = { f: "mono", s: 10.5, w: 400 };
function chipWidth(label) {
  return measure(label, CHIP) + 20;
}
function chip(x, y, label, { fill, stroke, color }) {
  const w = chipWidth(label);
  return rect(x + 0.5, y + 0.5, w - 1, 23, { fill, stroke, rx: 11.5 }) + text(x + 10, y + 16, label, { ...CHIP, fill: color });
}

/** Chips left to right, wrapping at maxW; with `rows`, the ones that don't fit become "+N". */
function chips(x, y, labels, maxW, style, { rows = Infinity, gap = 6 } = {}) {
  const placed = [];
  const rowEnd = () => {
    const last = placed.at(-1);
    return last && last.row === rows - 1 ? last.x + last.w + gap : 0;
  };
  let cx = 0;
  let row = 0;
  for (let i = 0; i < labels.length; i++) {
    const w = chipWidth(labels[i]);
    if (cx && cx + w > maxW) {
      row++;
      cx = 0;
    }
    if (row >= rows) {
      // Out of room: drop chips off the end until a "+N" for the rest fits.
      let hidden = labels.length - i;
      while (placed.length && rowEnd() + chipWidth(`+${hidden}`) > maxW) {
        placed.pop();
        hidden++;
      }
      placed.push({ x: rowEnd(), row: rows - 1, w: chipWidth(`+${hidden}`), label: `+${hidden}` });
      break;
    }
    placed.push({ x: cx, row, w, label: labels[i] });
    cx += w + gap;
  }
  const count = Math.max(...placed.map((p) => p.row)) + 1;
  return { svg: placed.map((p) => chip(x + p.x, y + p.row * 29, p.label, style)).join(""), h: count * 29 - 6 };
}

function logo(x, y, h, fill) {
  const k = h / LOGO_VIEWBOX[3];
  return `<g transform="translate(${r(x - LOGO_VIEWBOX[0] * k)} ${r(y)}) scale(${k.toFixed(4)})" fill="${fill}">${LOGO_PATHS.map((d) => `<path d="${d}"/>`).join("")}</g>`;
}

/** A right arrow drawn as a stroke, since the portfolio's fonts don't carry one. */
function arrow(x, y, len, stroke, sw = 2) {
  const head = Math.max(4, len * 0.28);
  return `<path d="M${r(x)} ${r(y)}H${r(x + len)}M${r(x + len - head)} ${r(y - head)}L${r(x + len)} ${r(y)}L${r(x + len - head)} ${r(y + head)}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

/** The ↗ that marks a link. */
function outArrow(x, y, size, stroke, sw = 1.4) {
  return `<path d="M${r(x)} ${r(y + size)}L${r(x + size)} ${r(y)}M${r(x + size * 0.3)} ${r(y)}H${r(x + size)}V${r(y + size * 0.7)}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function hexMix(a, b, k) {
  const pa = a.match(/\w\w/g).map((h) => parseInt(h, 16));
  const pb = b.match(/\w\w/g).map((h) => parseInt(h, 16));
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * k).toString(16).padStart(2, "0")).join("")}`;
}

const accentOf = (p, t) => (t.dark ? p.dark : p.accent);
const tintOf = (p, t) => (t.dark ? hexMix(t.paper, p.dark, 0.08) : p.tint);

function doc(w, h, title, body, t, css = "") {
  const fonts = [...used]
    .map((key) => {
      const font = FONTS[key];
      const weight = font.variable ? "100 900" : font.weights[0];
      return `@font-face{font-family:ZT${key};font-style:${font.style ?? "normal"};font-weight:${weight};src:url(data:font/woff2;base64,${font.base64}) format('woff2')}`;
    })
    .join("");
  used = new Set();
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}">` +
    `<title>${esc(title)}</title>` +
    `<defs><style>${fonts}${css}</style>` +
    `<filter id="sh" x="-10%" y="-10%" width="120%" height="140%"><feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="${t.dark ? "#000000" : "#15211e"}" flood-opacity="${t.shadow}"/></filter></defs>` +
    rect(0.5, 0.5, w - 1, h - 1, { fill: t.bg, stroke: t.line, rx: 24 }) +
    body +
    `</svg>`
  );
}

/** A section's numbered label and heading, the way the portfolio's chapters open. */
function heading(x, y, label, title, t) {
  return eyebrow(x, y, label, t.sage) + text(x, y + 46, title, { f: "serif", s: 44, fill: t.ink });
}

// ---------------------------------------------------------------------------------------------------
// The banners

const FLOAT = `
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
@keyframes hold{0%{stroke-dashoffset:94.2}60%,80%{stroke-dashoffset:0}100%{stroke-dashoffset:94.2}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}
.fl{animation:float 6s ease-in-out infinite}.d1{animation-delay:-1.5s}.d2{animation-delay:-3s}.d3{animation-delay:-4.5s}.d4{animation-delay:-2.2s}
.ring{stroke-dasharray:94.2;animation:hold 2.8s ease-in-out infinite}.pulse{animation:pulse 1.8s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.fl,.ring,.pulse{animation:none}}`;

/** The intro's live snippets of the real work, floating around the headline. */
function heroChip(kind, cx, cy, rot, delay, t) {
  const sizes = { api: [188, 58], sos: [178, 62], gps: [238, 62], esp32: [196, 62], ai: [138, 76] };
  const [w, h] = sizes[kind];
  let inner = card(0, 0, w, h, t, { rx: 16 });
  if (kind === "api") {
    inner +=
      text(16, 24, "POST /api/reports", { f: "mono", s: 11, fill: t.muted }) +
      `<circle cx="19" cy="40" r="3" fill="${t.live}"/>` +
      text(28, 44, "201 Created · 38 ms", { f: "mono", s: 12.5, fill: t.ink });
  } else if (kind === "sos") {
    inner +=
      `<g transform="rotate(-90 33 31)"><circle cx="33" cy="31" r="15" fill="none" stroke="${t.line}" stroke-width="3"/>` +
      `<circle class="ring" cx="33" cy="31" r="15" fill="none" stroke="${t.apricot}" stroke-width="3" stroke-linecap="round"/></g>` +
      text(60, 28, "Hold 3s for SOS", { s: 13, w: 500, fill: t.ink }) +
      text(60, 45, "Citizen app", { s: 11, fill: t.muted });
  } else if (kind === "gps") {
    inner +=
      `<circle cx="32" cy="31" r="18" fill="${t.sageTint}"/>` +
      `<path d="M32 22.5c-3.6 0-6.3 2.7-6.3 6.2 0 4.6 6.3 10.8 6.3 10.8s6.3-6.2 6.3-10.8c0-3.5-2.7-6.2-6.3-6.2z" fill="none" stroke="${t.sage}" stroke-width="1.8" stroke-linejoin="round"/><circle cx="32" cy="28.8" r="2.2" fill="none" stroke="${t.sage}" stroke-width="1.8"/>` +
      text(60, 28, "14.7439° N, 121.6497° E", { f: "mono", s: 12, fill: t.ink }) +
      text(60, 45, "Live caller location", { s: 11, fill: t.muted });
  } else if (kind === "esp32") {
    inner +=
      rect(14, 13, 36, 36, { fill: t.ink, rx: 11 }) +
      rect(24, 23, 16, 16, { stroke: t.onInk, rx: 2.5, sw: 1.5 }) +
      `<path d="M28 20v3M32 20v3M36 20v3M28 39v3M32 39v3M36 39v3M21 27h3M21 31h3M21 35h3M40 27h3M40 31h3M40 35h3" stroke="${t.onInk}" stroke-width="1.5" stroke-linecap="round"/>` +
      text(62, 28, "ESP32 alert button", { s: 13, w: 500, fill: t.ink }) +
      `<circle class="pulse" cx="65" cy="41" r="3" fill="${t.live}"/>` +
      text(73, 45, "Online", { s: 11, fill: t.muted });
  } else if (kind === "ai") {
    inner += text(16, 25, "AI costs cut", { s: 11, fill: t.muted }) + text(16, 60, "99.4%", { f: "serif", s: 34, fill: t.ink });
  }
  return `<g transform="translate(${cx} ${cy}) rotate(${rot})"><g class="fl ${delay}"><g transform="translate(${-w / 2} ${-h / 2})">${inner}</g></g></g>`;
}

function hero(t) {
  const H = 530;
  const { eyebrow: label, line, accent, sub } = data.hero;
  let body =
    logo(32, 24, 24, t.ink) +
    text(84, 41, "Zabdiel Tumang", { s: 13, w: 500, fill: t.ink }) +
    eyebrow(W - 32, 40, "Manila, Philippines", t.faint, "end") +
    `<g transform="translate(21 ${H / 2}) rotate(-90)">${eyebrow(0, 0, "01 · Intro", t.faint, "middle")}</g>`;

  body +=
    eyebrow(W / 2, 150, label, t.muted, "middle") +
    text(W / 2, 234, line, { f: "serif", s: 78, fill: t.ink, anchor: "middle" }) +
    text(W / 2, 314, accent, { f: "italic", s: 86, fill: t.sage, anchor: "middle" }) +
    lines(W / 2, 364, wrap(sub, 420, { s: 16 }), 25, { s: 16, fill: t.muted, anchor: "middle" });

  body +=
    heroChip("api", 150, 104, -4, "", t) +
    heroChip("sos", 852, 100, 3, "d1", t) +
    heroChip("gps", W / 2, 452, 1.5, "d2", t) +
    heroChip("esp32", 150, 400, 2, "d3", t) +
    heroChip("ai", 850, 404, -3, "d4", t);

  const cta = "Click to fly through";
  body +=
    eyebrow(32, H - 28, cta, t.faint) +
    outArrow(32 + eyebrowWidth(cta) + 4, H - 37, 8, t.faint, 1.2) +
    eyebrow(W - 32, H - 28, "zabdielportfolio.vercel.app", t.faint, "end");

  return doc(W, H, `${line} ${accent} Zabdiel Tumang, full-stack software engineer in Manila. ${sub}`, body, t, FLOAT);
}

/** The link buttons under the hero: the portfolio one filled in ink, like the portfolio's Résumé button. */
function button(link, t) {
  const primary = link.id === "portfolio";
  const label = link.label.toUpperCase();
  // The logo is 16 tall, so about 30 wide; the label starts after it with a gap.
  const logoW = (16 * LOGO_VIEWBOX[2]) / LOGO_VIEWBOX[3];
  const lead = primary ? Math.ceil(16 + logoW + 9) : 18;
  const w = Math.ceil(lead + measure(label, { f: "mono", s: 11, w: 500, ls: 1.6 }) + 34);
  const H = 40;
  const fg = primary ? t.onInk : t.ink;
  let body = rect(0.5, 0.5, w - 1, H - 1, { fill: primary ? t.ink : t.paper, stroke: primary ? t.ink : t.line, rx: 20 });
  if (primary) body += logo(16, 12, 16, fg);
  body += text(lead, 24.5, label, { f: "mono", s: 11, w: 500, ls: 1.6, fill: fg }) + outArrow(w - 26, 15.5, 8, fg, 1.3);
  const fonts = [...used].map((key) => `@font-face{font-family:ZT${key};font-weight:100 900;src:url(data:font/woff2;base64,${FONTS[key].base64}) format('woff2')}`).join("");
  used = new Set();
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${H}" viewBox="0 0 ${w} ${H}" role="img" aria-label="${link.label}"><title>${link.label}</title><defs><style>${fonts}</style></defs>${body}</svg>`;
}

function skills(t) {
  const top = 132;
  const rowH = 76;
  const H = top + data.skills.length * rowH + 28;
  let body = heading(40, 52, "02 · Skills", "Skills", t);
  body += eyebrow(W - 40, 52, "What I build with", t.faint, "end");
  data.skills.forEach((skill, i) => {
    const y = top + i * rowH;
    const summary = wrap(skill.summary, 300, { s: 14 });
    body +=
      `<path d="M40 ${y}H${W - 40}" stroke="${t.line}"/>` +
      text(40, y + 42, String(i + 1).padStart(2, "0"), { f: "mono", s: 11, fill: t.faint }) +
      text(80, y + 45, skill.title, { f: "serif", s: 26, fill: t.ink }) +
      lines(360, y + (summary.length > 1 ? 33 : 43), summary, 20, { s: 14, fill: t.muted });
    const chipW = 270;
    const first = chips(0, 0, skill.tools, chipW, { fill: t.paper, stroke: t.line, color: t.inkSoft });
    body += chips(W - 40 - chipW, y + (rowH - first.h) / 2, skill.tools, chipW, { fill: t.paper, stroke: t.line, color: t.inkSoft }).svg;
  });
  return doc(W, H, `Skills: ${data.skills.map((s) => `${s.title}: ${s.summary}`).join(" ")}`, body, t);
}

function projectCard(p, i, x, y, w, h, t) {
  const accent = accentOf(p, t);
  const [category, org] = p.client.split(" · ");
  const pad = 26;
  const inner = w - pad * 2;
  let out = card(x, y, w, h, t, { fill: tintOf(p, t) });
  out += eyebrow(x + pad, y + 38, category, accent);
  if (p.press) {
    const label = p.press.toUpperCase();
    const bw = measure(label, { f: "mono", s: 9.5, w: 500, ls: 1.4 }) + 22;
    out += rect(x + w - pad - bw, y + 22, bw, 24, { fill: accent, rx: 12 });
    out += text(x + w - pad - bw / 2, y + 38, label, { f: "mono", s: 9.5, w: 500, ls: 1.4, fill: t.dark ? t.onInk : "#ffffff", anchor: "middle" });
  } else {
    out += eyebrow(x + w - pad, y + 38, String(i + 1).padStart(2, "0"), t.faint, "end");
  }
  const size = Math.min(w > 450 ? 50 : 42, Math.floor((inner * 42) / measure(p.word, { f: "serif", s: 42 })));
  out += text(x + pad, y + 64 + size * 0.62, p.word, { f: "serif", s: size, fill: accent });
  let cy = y + 64 + size * 0.62 + 28;
  out += text(x + pad, cy, org + (p.localName ? ` · ${p.localName}` : ""), { f: "mono", s: 10.5, fill: t.muted });
  cy += 24;
  const title = wrap(p.title, inner, { s: 13.5, w: 500 });
  out += lines(x + pad, cy, title, 19, { s: 13.5, w: 500, fill: t.ink });
  cy += title.length * 19 + 2;
  const summary = wrap(w > 450 ? p.line : p.summary, inner, { s: 13 });
  out += lines(x + pad, cy, summary.slice(0, 3), 19, { s: 13, fill: t.muted });
  out += chips(x + pad, y + h - pad - 23, p.technologies, inner, { fill: t.dark ? t.paper : "#ffffff", stroke: hexMix(t.dark ? t.paper : "#ffffff", accent, 0.25), color: accent }, { rows: 1 }).svg;
  return out;
}

function work(t) {
  const gap = 16;
  const top = 128;
  const rowH = 278;
  const inner = W - 64;
  const wide = Math.round((inner - gap) * 0.6);
  const narrow = inner - gap - wide;
  const third = (inner - gap * 2) / 3;
  const [qs, dalago, streams, silkhub, waste, afp, bodyart] = data.projects;
  const H = top + rowH * 3 + gap * 2 + 32;
  let body = heading(32, 52, "03 · Work", "Work", t);
  body += eyebrow(W - 32, 52, "Government · Enterprise · Business", t.faint, "end");
  body += projectCard(qs, 0, 32, top, wide, rowH, t);
  body += projectCard(dalago, 1, 32 + wide + gap, top, narrow, rowH, t);
  [streams, silkhub, waste].forEach((p, k) => {
    body += projectCard(p, 2 + k, 32 + k * (third + gap), top + rowH + gap, third, rowH, t);
  });
  body += projectCard(afp, 5, 32, top + (rowH + gap) * 2, narrow, rowH, t);
  body += projectCard(bodyart, 6, 32 + narrow + gap, top + (rowH + gap) * 2, wide, rowH, t);
  return doc(W, H, `Work: ${data.projects.map((p) => `${p.word}, ${p.title}, for ${p.client}`).join("; ")}.`, body, t);
}

function about(t) {
  const top = 132;
  let body = heading(40, 52, "04 · About", "About", t);
  // The facts, as the portfolio's About card lists them.
  let y = top;
  for (const fact of data.facts) {
    const value = wrap(fact.value, 380, { s: 15 });
    body += `<path d="M40 ${y}H460" stroke="${t.line}"/>` + eyebrow(40, y + 26, fact.label, t.faint);
    body += lines(40, y + 50, value, 21, { s: 15, fill: t.ink });
    y += 50 + value.length * 21 - 4;
  }
  const leftEnd = y;
  // Built for.
  body += eyebrow(512, top + 2, "Built for", t.faint);
  let by = top + 18;
  data.builtFor.forEach((entry) => {
    const rows = wrap(entry.text, 250, { s: 13 });
    const h = Math.max(70, 26 + rows.length * 19);
    body += card(512, by, W - 40 - 512, h, t, { rx: 14, shadow: false });
    body += text(532, by + 41, entry.title, { f: "serif", s: 22, fill: t.ink });
    body += lines(690, by + (h - rows.length * 19) / 2 + 14, rows, 19, { s: 13, fill: t.muted });
    by += h + 10;
  });
  const bottom = Math.max(leftEnd, by) + 18;
  body +=
    `<path d="M40 ${bottom}H${W - 40}" stroke="${t.line}"/>` +
    `<circle class="pulse" cx="45" cy="${bottom + 35}" r="4" fill="${t.live}"/>` +
    eyebrow(58, bottom + 39, "Currently", t.sage) +
    text(58 + eyebrowWidth("Currently") + 14, bottom + 40, data.currently, { s: 15, fill: t.ink });
  const H = bottom + 66;
  return doc(
    W,
    H,
    `About: ${data.facts.map((f) => `${f.label}: ${f.value}`).join(". ")}. Built for ${data.builtFor.map((b) => b.title).join(", ")}. Currently: ${data.currently}`,
    body,
    t,
    "@keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}.pulse{animation:pulse 1.8s ease-in-out infinite}"
  );
}

function principles(t) {
  const gap = 16;
  const top = 96;
  const cw = (W - 64 - gap) / 2;
  const ch = 246;
  const H = top + ch * 2 + gap + 32;
  let body = eyebrow(32, 52, "04 · About — How I work", t.sage);
  body += eyebrow(W - 32, 52, "Each principle, and the number behind it", t.faint, "end");
  data.principles.forEach((p, i) => {
    const x = 32 + (i % 2) * (cw + gap);
    const y = top + Math.floor(i / 2) * (ch + gap);
    body += card(x, y, cw, ch, t);
    body += eyebrow(x + 26, y + 38, `Principle ${String(i + 1).padStart(2, "0")}`, t.sage);
    const line = wrap(p.line, cw - 52, { f: "serif", s: 29 });
    body += lines(x + 26, y + 78, line, 33, { f: "serif", s: 29, fill: t.ink });
    body += text(x + 26, y + 78 + line.length * 33 - 6, p.from, { s: 12.5, fill: t.muted });
    body += `<path d="M${x + 26} ${y + 156}H${x + cw - 26}" stroke="${t.line}"/>`;
    // The stat: "4 → 1" gets a drawn arrow.
    const vs = 46;
    let vx = x + 26;
    const vy = y + 214;
    const parts = p.value.split(" → ");
    if (parts.length === 2) {
      body += text(vx, vy, parts[0], { f: "serif", s: vs, fill: t.ink });
      vx += measure(parts[0], { f: "serif", s: vs }) + 10;
      body += arrow(vx, vy - 15, 30, t.sage, 2);
      vx += 40;
      body += text(vx, vy, parts[1], { f: "serif", s: vs, fill: t.ink });
      vx += measure(parts[1], { f: "serif", s: vs });
    } else {
      body += text(vx, vy, p.value, { f: "serif", s: vs, fill: t.ink });
      vx += measure(p.value, { f: "serif", s: vs });
    }
    const lx = Math.max(vx + 22, x + 150);
    const label = wrap(p.label, x + cw - 26 - lx, { s: 13 });
    body += lines(lx, vy - 14 - (label.length - 1) * 9.5, label, 19, { s: 13, fill: t.muted });
  });
  return doc(W, H, `How I work: ${data.principles.map((p) => `${p.line} ${p.value} ${p.label}.`).join(" ")}`, body, t);
}

/** Most used, the A–Z stack and tools, counted the way the portfolio counts them. */
function stack(t) {
  const usedTech = [...data.experiences.map((e) => e.technologies), ...data.projectTechnologies].flat().map((tech) => tech.replace(/\s+\d+(\.\d+)*$/, ""));
  const counts = new Map();
  for (const tech of usedTech) counts.set(tech, (counts.get(tech) ?? 0) + 1);
  const ranked = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const share = (n) => (n / usedTech.length) * 100;
  const top8 = ranked.slice(0, 8).map(([name, n]) => ({ name, pct: share(n) }));
  const rest = ranked.slice(8).reduce((sum, [, n]) => sum + n, 0);
  const mostUsed = [...top8, { name: "Other", pct: share(rest) }];
  const az = [...counts.keys()].sort((a, b) => a.localeCompare(b));

  const shades = (i) => (i === mostUsed.length - 1 ? t.line : hexMix(t.sage, t.dark ? t.bg : "#ffffff", Math.min(0.78, i * 0.1)));
  const top = 96;
  const lw = 400;
  let body = eyebrow(32, 52, "04 · About — Stack", t.sage);
  // Most used.
  const lh = 30;
  const ch = 120 + mostUsed.length * lh;
  body += card(32, top, lw, ch, t);
  body += eyebrow(58, top + 38, "Most used", t.sage);
  body += text(58, top + 62, "How often each shows up across my roles and projects.", { s: 12.5, fill: t.muted });
  let bx = 58;
  const bw = lw - 52;
  body += `<clipPath id="bar"><rect x="58" y="${top + 80}" width="${bw}" height="10" rx="5"/></clipPath><g clip-path="url(#bar)">`;
  mostUsed.forEach((m, i) => {
    const w = (m.pct / 100) * bw;
    body += rect(bx, top + 80, w + 0.5, 10, { fill: shades(i) });
    bx += w;
  });
  body += "</g>";
  mostUsed.forEach((m, i) => {
    const y = top + 124 + i * lh;
    body += `<circle cx="62" cy="${y - 4}" r="4" fill="${shades(i)}"/>`;
    body += text(76, y, m.name, { s: 13.5, fill: t.ink });
    body += text(32 + lw - 26, y, `${m.pct.toFixed(1)}%`, { f: "mono", s: 12, fill: t.muted, anchor: "end" });
  });
  // Tech stack A–Z and tools.
  const rx = 32 + lw + 16;
  const rw = W - 32 - rx;
  const style = { fill: t.paper, stroke: t.line, color: t.inkSoft };
  const stackChips = chips(rx + 26, top + 58, az, rw - 52, style);
  const sh = 58 + stackChips.h + 26;
  body += card(rx, top, rw, sh, t);
  body += eyebrow(rx + 26, top + 38, "Tech stack", t.sage) + eyebrow(rx + rw - 26, top + 38, "A — Z", t.faint, "end");
  body += stackChips.svg;
  const ty = top + sh + 16;
  const toolChips = chips(rx + 26, ty + 58, data.tools, rw - 52, style);
  const th = ch - sh - 16;
  body += card(rx, ty, rw, th, t);
  body += eyebrow(rx + 26, ty + 38, "Tools", t.sage) + toolChips.svg;
  const H = top + ch + 32;
  return doc(W, H, `Stack. Most used: ${mostUsed.map((m) => `${m.name} ${m.pct.toFixed(1)}%`).join(", ")}. Tech stack: ${az.join(", ")}. Tools: ${data.tools.join(", ")}.`, body, t);
}

function experience(t) {
  const now = new Date();
  const nowYear = now.getFullYear() + now.getMonth() / 12;
  const from = 2022;
  const to = Math.ceil(nowYear + 0.5);
  const x0 = 140;
  const x1 = W - 40;
  const X = (year) => x0 + ((year - from) / (to - from)) * (x1 - x0);
  const top = 128;
  const laneH = 34;
  let body = heading(40, 52, "05 · Experience", "Experience", t);
  body += eyebrow(W - 40, 52, `${from} — Present`, t.faint, "end");
  // Year grid.
  for (let year = from; year <= to; year++) {
    body += `<path d="M${r(X(year))} ${top}V${top + laneH * 3 + 6}" stroke="${t.line}"/>`;
    body += text(X(year), top + laneH * 3 + 26, String(year), { f: "mono", s: 10.5, fill: t.faint, anchor: "middle" });
  }
  const laneColor = { study: t.sageTint, work: t.sage, founder: t.ink };
  const laneText = { study: t.sage, work: t.dark ? t.onInk : "#ffffff", founder: t.onInk };
  body += `<defs>${Object.entries(laneColor)
    .map(([key, color]) => `<linearGradient id="fade-${key}" x1="0" x2="1"><stop offset="0.75" stop-color="${color}"/><stop offset="1" stop-color="${color}" stop-opacity="0.35"/></linearGradient>`)
    .join("")}</defs>`;
  data.lanes.forEach((lane, i) => {
    const y = top + i * laneH + 8;
    body += eyebrow(40, y + 14, lane.label, t.muted);
    for (const role of data.experiences.filter((e) => e.lane === lane.key)) {
      const end = role.end ?? nowYear;
      const bx = X(role.start);
      const bw = X(end) - bx;
      body += rect(bx, y, bw, 20, { fill: role.end ? laneColor[lane.key] : `url(#fade-${lane.key})`, rx: 10 });
      // Inside the bar when it fits, else beside it, on the left when something follows in the lane.
      const label = role.short;
      const later = data.experiences.some((e) => e.lane === lane.key && e.start > role.start);
      if (measure(label, { s: 11, w: 500 }) + 20 < bw) body += text(bx + 10, y + 14, label, { s: 11, w: 500, fill: laneText[lane.key] });
      else if (later) body += text(bx - 8, y + 14, label, { s: 11, w: 500, fill: t.inkSoft, anchor: "end" });
      else body += text(bx + bw + 8, y + 14, label, { s: 11, w: 500, fill: t.inkSoft });
    }
  });
  const nx = X(nowYear);
  body +=
    `<path d="M${r(nx)} ${top - 8}V${top + laneH * 3 + 6}" stroke="${t.apricot}" stroke-width="1.5" stroke-dasharray="3 4"/>` +
    `<circle class="pulse" cx="${r(nx)}" cy="${top - 8}" r="4" fill="${t.apricot}"/>` +
    eyebrow(nx - 10, top - 4, "Now", t.faint, "end");

  // The roles, oldest first.
  const cy = top + laneH * 3 + 52;
  const gap = 14;
  const cw = (W - 80 - gap * 3) / 4;
  const ch = 236;
  data.experiences.forEach((role, i) => {
    const x = 40 + i * (cw + gap);
    body += card(x, cy, cw, ch, t, { rx: 16 });
    body += rect(x + 20, cy + 20, 26, 4, { fill: laneColor[role.lane] === t.sageTint ? t.sage : laneColor[role.lane], rx: 2 });
    body += text(x + 20, cy + 46, role.period.toUpperCase(), { f: "mono", s: 9.5, w: 500, ls: 1.2, fill: t.faint });
    const title = wrap(role.title, cw - 40, { s: 13.5, w: 600 });
    body += lines(x + 20, cy + 70, title, 18, { s: 13.5, w: 600, fill: t.ink });
    const company = wrap(role.company, cw - 40, { s: 12 });
    const ccy = cy + 70 + title.length * 18 + 2;
    body += lines(x + 20, ccy, company, 17, { s: 12, fill: t.muted });
    const headline = wrap(role.headline, cw - 40, { f: "serif", s: 19 });
    body += lines(x + 20, cy + ch - 22 - (headline.length - 1) * 22, headline, 22, { f: "serif", s: 19, fill: t.ink });
  });
  const H = cy + ch + 32;
  return doc(
    W,
    H,
    `Experience: ${data.experiences.map((e) => `${e.title}, ${e.company}, ${e.period}: ${e.headline}`).join("; ")}.`,
    body,
    t,
    "@keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}.pulse{animation:pulse 1.8s ease-in-out infinite}"
  );
}

/** A slim section label, for the parts of the page that aren't banners themselves. */
function label(id, number, title, note, t) {
  const H = 96;
  const body = eyebrow(32, 42, number, t.sage) + text(32, 80, title, { f: "serif", s: 34, fill: t.ink }) + eyebrow(W - 32, 80, note, t.faint, "end");
  return [id, doc(W, H, `${title}. ${note}`, body, t)];
}

function contact(t) {
  const H = 420;
  const lead = "Let's build ";
  const it = "something.";
  const ls = 82;
  const lw = measure(lead, { f: "serif", s: ls });
  const iw = measure(it, { f: "italic", s: ls + 8 });
  const x = W / 2 - (lw + iw) / 2;
  let body = eyebrow(W / 2, 92, "06 · Contact", t.sage, "middle");
  body += text(x, 180, lead, { f: "serif", s: ls, fill: t.ink }) + text(x + lw, 180, it, { f: "italic", s: ls + 8, fill: t.sage });
  body += lines(W / 2, 226, wrap("Government, enterprise or business, tell me what you need and I'll get back to you.", 440, { s: 16 }), 25, { s: 16, fill: t.muted, anchor: "middle" });
  const email = data.EMAIL;
  const ew = measure(email, { f: "mono", s: 13 }) + 74;
  const ex = W / 2 - ew / 2;
  body += rect(ex, 290, ew, 46, { fill: t.ink, rx: 23 });
  body += rect(ex + 20, 305, 20, 15, { stroke: t.onInk, rx: 3, sw: 1.4 }) + `<path d="M${ex + 21} ${307}L${ex + 30} ${314}L${ex + 39} ${307}" fill="none" stroke="${t.onInk}" stroke-width="1.4" stroke-linejoin="round"/>`;
  body += text(ex + 52, 318, email, { f: "mono", s: 13, fill: t.onInk });
  body += logo(32, H - 50, 20, t.faint) + text(76, H - 33, `© ${new Date().getFullYear()} Zabdiel Tumang`, { s: 12, fill: t.faint });
  body += eyebrow(W - 32, H - 33, "Manila, Philippines", t.faint, "end");
  return doc(W, H, `Let's build something. Government, enterprise or business, tell me what you need: ${email}`, body, t);
}

// ---------------------------------------------------------------------------------------------------

await loadFonts();
await measureFonts();

const out = [];
for (const [mode, t] of Object.entries(THEMES)) {
  out.push([`hero-${mode}`, hero(t)]);
  for (const link of data.links) out.push([`btn-${link.id}-${mode}`, button(link, t)]);
  out.push([`skills-${mode}`, skills(t)]);
  out.push([`work-${mode}`, work(t)]);
  out.push([`about-${mode}`, about(t)]);
  out.push([`principles-${mode}`, principles(t)]);
  out.push([`stack-${mode}`, stack(t)]);
  out.push([`experience-${mode}`, experience(t)]);
  out.push(label(`showcase-${mode}`, "Recorded from the portfolio", "The fly-through", "Scroll-driven, as you'd see it", t));
  out.push(label(`activity-${mode}`, "GitHub", "Activity", "Updated daily", t));
  out.push([`contact-${mode}`, contact(t)]);
}
for (const [name, svg] of out) fs.writeFileSync(path.join(ASSETS, `${name}.svg`), svg);
console.log(`Wrote ${out.length} SVGs to assets/`);
