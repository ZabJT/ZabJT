// Records the portfolio's fly-through, one clip per section, as looping animated WebPs in assets/showcase.
// The scroll is driven like a mouse wheel in real time, so Lenis eases it the way a visitor sees it.
//
//   pnpm record              every clip
//   pnpm record quadshield   just the named clips
//
// Needs Google Chrome and img2webp (brew install webp).

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";

const URL = "https://zabdielportfolio.vercel.app";
const OUT = path.resolve(import.meta.dirname, "../showcase");
const VIEWPORT = { width: 1280, height: 800 };
const WIDTH = 960;
const FPS = 15;

// Scroll stops at a 1280 × 800 viewport: each [y, speed] wheels from y at `speed` page pixels per
// second until the next stop. The products' simulations get the slower stretches.
const CLIPS = [
  { id: "intro", gate: true, stops: [[0, 750], [4400]] },
  { id: "quadshield", stops: [[6800, 1150], [12000, 480], [13800]] },
  { id: "dalago", stops: [[15000, 1000], [19200, 480], [21200]] },
  { id: "streams", stops: [[22000, 1150], [26600, 480], [28600]] },
  { id: "silkhub", stops: [[30000, 1150], [34000, 480], [36000]] },
  { id: "experience", stops: [[66400, 900], [74200]] },
];

const HIDE_CURSOR = `div[aria-hidden="true"].fixed.z-\\[100\\] { visibility: hidden !important; }`;

async function record(browser, clip) {
  const page = await browser.newPage({ viewport: VIEWPORT });
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: HIDE_CURSOR });
  await page.mouse.move(VIEWPORT.width / 2, VIEWPORT.height - 40);

  const cdp = await page.context().newCDPSession(page);
  const frames = [];
  cdp.on("Page.screencastFrame", ({ data, metadata, sessionId }) => {
    frames.push({ data, t: metadata.timestamp });
    cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
  });
  const start = () =>
    cdp.send("Page.startScreencast", { format: "jpeg", quality: 85, maxWidth: WIDTH, maxHeight: WIDTH });

  const enter = page.getByRole("button", { name: "Enter" });
  if (clip.gate) {
    await start();
    await enter.waitFor({ state: "visible", timeout: 60_000 });
    await page.waitForTimeout(1200);
    await enter.click();
    await page.waitForTimeout(2600);
  } else {
    await enter.waitFor({ state: "visible", timeout: 60_000 });
    await enter.click();
    await page.waitForTimeout(2600);
    await page.evaluate((y) => window.scrollTo(0, y), clip.stops[0][0]);
    await page.waitForTimeout(2500);
    await start();
    await page.waitForTimeout(400);
  }

  // Wheel at each stretch's steady rate, then let the easing settle.
  let y = clip.stops[0][0];
  let last = Date.now();
  for (let s = 0; s < clip.stops.length - 1; s++) {
    const [, speed] = clip.stops[s];
    const to = clip.stops[s + 1][0];
    while (y < to) {
      await page.waitForTimeout(16);
      const now = Date.now();
      const dy = Math.min(speed * ((now - last) / 1000), to - y);
      last = now;
      y += dy;
      await page.mouse.wheel(0, dy / 0.9);
    }
  }
  await page.waitForTimeout(1800);
  await cdp.send("Page.stopScreencast");
  await page.close();
  return frames;
}

// Resamples the screencast's uneven frames to a steady rate and encodes them.
function encode(frames, id) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `zabjt-${id}-`));
  const t0 = frames[0].t;
  const end = frames.at(-1).t;
  const step = 1 / FPS;
  const picks = [];
  let i = 0;
  for (let t = t0; t <= end; t += step) {
    while (i + 1 < frames.length && frames[i + 1].t <= t) i++;
    if (picks.at(-1)?.index === i) picks.at(-1).ms += step * 1000;
    else picks.push({ index: i, ms: step * 1000 });
  }
  picks.at(-1).ms += 1200;

  const args = ["-loop", "0", "-min_size", "-kmax", "60"];
  picks.forEach((pick, n) => {
    const file = path.join(dir, `${String(n).padStart(4, "0")}.jpg`);
    fs.writeFileSync(file, Buffer.from(frames[pick.index].data, "base64"));
    args.push("-d", String(Math.round(pick.ms)), "-lossy", "-q", "62", "-m", "6", file);
  });
  const out = path.join(OUT, `${id}.webp`);
  args.push("-o", out);
  execFileSync("img2webp", args, { stdio: "ignore" });
  fs.rmSync(dir, { recursive: true, force: true });
  const kb = Math.round(fs.statSync(out).size / 1024);
  console.log(`${id}: ${picks.length} frames, ${kb} KB`);
}

const wanted = process.argv.slice(2);
const clips = wanted.length ? CLIPS.filter((clip) => wanted.includes(clip.id)) : CLIPS;
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
for (const clip of clips) encode(await record(browser, clip), clip.id);
await browser.close();
