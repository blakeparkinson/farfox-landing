/**
 * Renders the ornament artwork (ornamentArt.mjs) to PNG. Used by scripts/make-ornament.mjs and by
 * GET /api/ornament.png, which Printful fetches for a personalised order.
 */
import { writeFile, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { ornamentSvg, W } from './ornamentArt.mjs';

const SITE = 'https://lovefarfox.com';
const FONTS = [['oswald', 'Oswald:wght@600'], ['playfair-italic', 'Playfair+Display:ital,wght@1,600']];
export const PRINT_SCALE = 2; // Printful's file is 978×972; send it at twice that.

// resvg-js reads fonts from files, so each face is downloaded once per instance into the temp dir.
let fontFiles = null;
async function loadFonts() {
  if (fontFiles) return fontFiles;
  fontFiles = await Promise.all(FONTS.map(async ([family, query]) => {
    const file = join(tmpdir(), `farfox-${family}.ttf`);
    try { await access(file); return file; } catch {}
    const css = await fetch(`https://fonts.googleapis.com/css2?family=${query}&display=swap`, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then((r) => r.text());
    const url = css.match(/url\((https:[^)]+\.ttf)\)/)[1];
    await writeFile(file, Buffer.from(await fetch(url).then((r) => r.arrayBuffer())));
    return file;
  }));
  return fontFiles;
}

let siteFoxy = null;
async function foxyFromSite(site = SITE) {
  if (!siteFoxy) {
    const png = Buffer.from(await fetch(`${site}/brand/print/foxy-letter.png`).then((r) => { if (!r.ok) throw new Error(`foxy ${r.status}`); return r.arrayBuffer(); }));
    siteFoxy = { href: `data:image/png;base64,${png.toString('base64')}`, aspect: 1 };
  }
  return siteFoxy;
}

/** PNG of the ornament with these two lines; `width` defaults to print resolution, `preview` clips it to the heart. */
export async function renderOrnamentPng({ top, bottom, width = W * PRINT_SCALE, preview = false, foxy, site } = {}) {
  const markup = ornamentSvg(foxy || (await foxyFromSite(site)), { top, bottom, preview });
  const resvg = new Resvg(markup, { fitTo: { mode: 'width', value: width }, font: { fontFiles: await loadFonts(), loadSystemFonts: false, defaultFontFamily: 'Oswald' } });
  return Buffer.from(resvg.render().asPng());
}
