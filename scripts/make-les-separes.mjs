/**
 * Les Séparés: a heritage-style Long Distance FC jersey in three colourways.
 *
 * Wide picture stripes in a two-tone print, cream stripes set with Marceline
 * Desbordes-Valmore's "Les Séparés" in French, "Far Fox" across the chest and the
 * Far Fox crest as the only mark. The front is leaving (19th-century stations,
 * harbours and departures, Art Institute of Chicago); the back is writing (letters,
 * covers and telegrams, Smithsonian). There is no number, so it is not personalizable.
 *
 * Writes 6000×6000 Printful all-over-print files to public/shop/designs/les-separes/:
 *   <colourway>-front.jpg, <colourway>-back.jpg (photo art, JPEG keeps them ~6 MB)
 *   <colourway>-sleeve.png
 *   <colourway>-label.png    inside neck label (1.25 × 0.5 in): the poem's refrain, answered
 *
 * Usage: node scripts/make-les-separes.mjs [--colorway night,pink] [--preview out.jpg] [--label-only]
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import { CREST, D, rng } from './kit-designs-2026-10.mjs';
import { LES_SEPARES } from '../src/lib/kits.mjs';

const OUT = new URL('../public/shop/designs/les-separes/', import.meta.url);
const FRONT_PHOTOS = new URL('./assets/les-separes/front/', import.meta.url).pathname;
const BACK_PHOTOS = new URL('./assets/les-separes/back/', import.meta.url).pathname;
const JPEG_QUALITY = 90;

// Palettes from src/styles/global.css. dark: picture shadows, trim, cut-outs; hi: picture
// highlights; cream: light stripes; ink: poem; mark: crest; word/wordStroke: "Far Fox".
// toneCap/toneGamma set how far the pictures reach toward hi: lower and steeper keeps
// pale paper mid-toned, so the picture stripes stay darker than the cream ones.
const PALETTES = {
  night: { dark: '#21182B', hi: '#FFB2C6', cream: '#302239', ink: '#FFB2C6', mark: '#FFB2C6', cut: '#21182B', word: '#FFB2C6', wordStroke: '#21182B', toneCap: 0.86, toneGamma: 0.9 },
  pink: { dark: '#8E2443', hi: '#FFD3DC', cream: '#FFF5F0', ink: '#8E2443', mark: '#2D1B4E', cut: '#FFF5F0', word: '#2D1B4E', wordStroke: '#FFF5F0', toneCap: 0.62, toneGamma: 1.5 },
  plum: { dark: '#2C163E', hi: '#DEBA80', cream: '#F6EDE4', ink: '#2C163E', mark: '#D9B26A', cut: '#2C163E', word: '#2C163E', wordStroke: '#F6EDE4', toneCap: 0.62, toneGamma: 1.5 },
};
const BRAND = { pink: '#FF6B8A', purple: '#B76CFD' };

// Photo stripes wide enough that both side seams (x 1850 and 4230) land inside one.
const STRIPE = { photo: 620, cream: 320, centre: 3000 };
const GRAVITIES = ['centre', 'north', 'south', 'east', 'west', 'entropy', 'attention'];
const SEED = { front: 20261003, back: 20261004 };
const CUFF = { accentTop: 3980, accentHeight: 40, bandTop: 4040 };
// Printful's inside label is 188 × 75 px at 150 dpi; drawn at 8× so the text stays crisp.
const LABEL = { w: 188 * 8, h: 75 * 8 };

// Marceline Desbordes-Valmore, "Les Séparés" (Poésies posthumes, 1886), public domain; text as
// validated on French Wikisource. No-break spaces before ! ; : keep French punctuation on its word.
const POEM = `LES SÉPARÉS. MARCELINE DESBORDES-VALMORE.
N’écris pas ! Je suis triste, et je voudrais m’éteindre ; / Les beaux étés, sans toi, c’est l’amour sans flambeau. / J’ai refermé mes bras qui ne peuvent t’atteindre ; / Et, frapper à mon cœur, c’est frapper au tombeau. / N’écris pas !
N’écris pas ! n’apprenons qu’à mourir à nous même. / Ne demande qu’à Dieu… qu’à toi si je t’aimais. / Au fond de ton silence écouter que tu m’aimes, / C’est entendre le ciel sans y monter jamais. / N’écris pas !
N’écris pas ! Je te crains ; j’ai peur de ma mémoire ; / Elle a gardé ta voix qui m’appelle souvent. / Ne montre pas l’eau vive à qui ne peut la boire. / Une chère écriture est un portrait vivant. / N’écris pas !
N’écris pas ces deux mots que je n’ose plus lire : / Il semble que ta voix les répand sur mon cœur, / Que je les vois briller à travers ton sourire ; / Il semble qu’un baiser les empreint sur mon cœur. / N’écris pas !`;
const TEXT = { size: 36, lead: 50, pad: 18, charWidth: 0.52, opacity: 0.4 };
const POEM_START = { front: 0, back: 60 };

const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/'/g, '&#39;').replace(/"/g, '&quot;');
const rgbOf = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

async function loadFonts() {
  const fonts = [['uncial', 'Uncial+Antiqua'], ['garamond', 'EB+Garamond:wght@500'], ['garamond-italic', 'EB+Garamond:ital,wght@1,500']];
  return Promise.all(fonts.map(async ([family, query]) => {
    const css = await fetch(`https://fonts.googleapis.com/css2?family=${query}&display=swap`, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then((r) => r.text());
    const file = join(tmpdir(), `farfox-les-separes-${family}.ttf`);
    await writeFile(file, Buffer.from(await fetch(css.match(/url\((https:[^)]+\.ttf)\)/)[1]).then((r) => r.arrayBuffer())));
    return file;
  }));
}

/** Two-tone crop of a photo. Every crop position is tried; the one with the most visible
 *  detail wins, penalising glare (a blank patch) and near-black (a flat block). */
async function twoTone(path, w, h, pick, palette) {
  let best = null;
  for (let attempt = 0; attempt < GRAVITIES.length; attempt++) {
    const position = GRAVITIES[(pick + attempt) % GRAVITIES.length];
    const { data, info } = await sharp(path).resize(w, h, { fit: 'cover', position }).greyscale().normalise().raw().toBuffer({ resolveWithObject: true });
    const n = info.width * info.height;
    let sum = 0, sq = 0, glare = 0, dark = 0;
    for (let i = 0; i < n; i++) {
      const v = data[i * info.channels] / 255;
      sum += v; sq += v * v;
      if (v > 0.88) glare++;
      if (v < 0.08) dark++;
    }
    const mean = sum / n, spread = Math.sqrt(Math.max(0, sq / n - mean * mean));
    const score = spread - 2 * Math.max(0, glare / n - 0.12) - 0.6 * Math.max(0, dark / n - 0.55);
    if (!best || score > best.score) best = { data, info, score };
  }
  const { data, info } = best;
  const [lo, hi] = [rgbOf(palette.dark), rgbOf(palette.hi)];
  const out = Buffer.alloc(info.width * info.height * 3);
  for (let i = 0; i < info.width * info.height; i++) {
    const t = palette.toneCap * (data[i * info.channels] / 255) ** palette.toneGamma;
    for (let c = 0; c < 3; c++) out[i * 3 + c] = Math.round(lo[c] + (hi[c] - lo[c]) * t);
  }
  const png = await sharp(out, { raw: { width: info.width, height: info.height, channels: 3 } }).png().toBuffer();
  return `data:image/png;base64,${png.toString('base64')}`;
}

function stripes() {
  const period = STRIPE.photo + STRIPE.cream, out = [];
  for (let x = STRIPE.centre - STRIPE.photo / 2 - period * 4; x < D; x += period) {
    out.push({ kind: 'photo', x, w: STRIPE.photo }, { kind: 'cream', x: x + STRIPE.photo, w: STRIPE.cream });
  }
  return out.filter((s) => s.x + s.w > 0 && s.x < D);
}

/** The poem word-wrapped to a stripe, verse by verse; run-on lines indent. */
function poemLines(width) {
  const max = Math.floor((width - 2 * TEXT.pad) / (TEXT.size * TEXT.charWidth));
  const lines = [];
  for (const stanza of POEM.split('\n')) {
    for (const verse of stanza.split(' / ')) {
      let line = '';
      for (const word of verse.split(' ')) {
        if ((line + ' ' + word).trim().length > max) { lines.push(line); line = `  ${word}`; } else line = line ? `${line} ${word}` : word;
      }
      lines.push(line);
    }
    lines.push('');
  }
  return lines;
}

/** Cream stripes carry one running text: each picks up where the stripe to its left stopped. */
function creamStripes(all, palette, start, prefix) {
  const cursor = { n: start };
  let out = '';
  for (const [k, s] of all.entries()) {
    if (s.kind !== 'cream') continue;
    const lines = poemLines(s.w);
    let text = '';
    for (let y = 60; y < D; y += TEXT.lead) {
      const line = lines[cursor.n++ % lines.length];
      if (line) text += `<text xml:space="preserve" x="${s.x + TEXT.pad}" y="${y}" font-family="EB Garamond" font-size="${TEXT.size}" fill="${palette.ink}" fill-opacity="${TEXT.opacity}">${esc(line)}</text>`;
    }
    out += `<rect x="${s.x}" y="0" width="${s.w}" height="${D}" fill="${palette.cream}"/><clipPath id="${prefix}${k}"><rect x="${s.x}" y="0" width="${s.w}" height="${D}"/></clipPath><g clip-path="url(#${prefix}${k})">${text}</g>`;
  }
  return out;
}

/** Photo stripes: each column shuffles its own order and never repeats its left neighbour's photo at the same height. */
async function photoStripes(all, dir, seed, palette) {
  const { readdir } = await import('node:fs/promises');
  const photos = (await readdir(dir)).filter((f) => f.endsWith('.jpg')).sort();
  const rand = rng(seed);
  const placed = [];
  let out = '';
  for (const [k, s] of all.filter((c) => c.kind === 'photo').entries()) {
    let y = -Math.floor(rand() * 900), prev = null;
    while (y < D) {
      const h = 640 + Math.floor(rand() * 620);
      const beside = placed.filter((p) => p.k === k - 1 && p.y < y + h && p.y + p.h > y).map((p) => p.photo);
      const choices = photos.filter((p) => p !== prev && !beside.includes(p));
      const photo = choices[Math.floor(rand() * choices.length)];
      out += `<image href="${await twoTone(join(dir, photo), s.w, h, Math.floor(rand() * GRAVITIES.length), palette)}" x="${s.x}" y="${y}" width="${s.w}" height="${h}" preserveAspectRatio="none"/>`;
      placed.push({ k, y, h, photo });
      prev = photo; y += h;
    }
  }
  return out;
}

/** The Far Fox crest as one-colour embroidery: solid mark, cut-outs in the shirt colour. */
function foxMark(cx, cy, w, p) {
  const s = w / 300;
  return `<g transform="translate(${cx - w / 2} ${cy - (306 * s) / 2}) scale(${s})">
    <polygon points="25,0 100,88 200,88 275,0 300,190 150,306 0,190" fill="${p.mark}"/>
    <polygon points="35,30 30,95 85,85" fill="${p.cut}"/><polygon points="265,30 270,95 215,85" fill="${p.cut}"/>
    <polygon points="72,140 125,152 120,175 70,162" fill="${p.cut}"/><polygon points="228,140 175,152 180,175 230,162" fill="${p.cut}"/>
    <polygon points="88,196 212,196 150,306" fill="none" stroke="${p.cut}" stroke-width="6"/><polygon points="137,226 163,226 150,248" fill="${p.cut}"/></g>`;
}

const wordmark = (p) => `<text x="3000" y="3520" text-anchor="middle" font-family="Uncial Antiqua" font-size="440" fill="${p.word}" stroke="${p.wordStroke}" stroke-width="16" paint-order="stroke">Far Fox</text>`;
const svg = (body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${D}" height="${D}" viewBox="0 0 ${D} ${D}">
  <defs><linearGradient id="brand" x1="0" x2="1"><stop offset="0" stop-color="${BRAND.pink}"/><stop offset="1" stop-color="${BRAND.purple}"/></linearGradient></defs>${body}</svg>`;

async function front(p) {
  const all = stripes();
  return svg((await photoStripes(all, FRONT_PHOTOS, SEED.front, p)) + creamStripes(all, p, POEM_START.front, 'f')
    + wordmark(p) + foxMark(CREST.x, CREST.y, CREST.w, p));
}

async function back(p) {
  const all = stripes();
  return svg((await photoStripes(all, BACK_PHOTOS, SEED.back, p)) + creamStripes(all, p, POEM_START.back, 'b'));
}

/** Plain cream sleeves (stripes cannot line up across a set-in sleeve), a pink-to-purple accent, dark cuff. */
const sleeve = (p) => svg(`<rect width="${D}" height="${D}" fill="${p.cream}"/>
  <rect x="0" y="${CUFF.accentTop}" width="${D}" height="${CUFF.accentHeight}" fill="url(#brand)"/>
  <rect x="0" y="${CUFF.bandTop}" width="${D}" height="${D - CUFF.bandTop}" fill="${p.dark}"/>`);

/** Inside neck label: "Don't write!" from the poem, answered with "…but call me." */
const insideLabel = (p) => `<svg xmlns="http://www.w3.org/2000/svg" width="${LABEL.w}" height="${LABEL.h}" viewBox="0 0 ${LABEL.w} ${LABEL.h}">
  <text x="${LABEL.w / 2}" y="290" text-anchor="middle" font-family="Uncial Antiqua" font-size="200" fill="${p.dark}">N’écris pas !</text>
  <text x="${LABEL.w / 2}" y="500" text-anchor="middle" font-family="EB Garamond" font-style="italic" font-size="140" fill="${p.dark}">…mais appelle-moi.</text></svg>`;

const args = process.argv.slice(2);
const only = args.includes('--colorway') ? args[args.indexOf('--colorway') + 1].split(',') : null;
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const fontFiles = await loadFonts();
const render = (markup) => new Resvg(markup, { fitTo: { mode: 'width', value: D }, font: { fontFiles, loadSystemFonts: false } }).render().asPng();
await mkdir(OUT, { recursive: true });
const previews = [];
for (const { key } of LES_SEPARES.colorways) {
  if (only && !only.includes(key)) continue;
  const palette = PALETTES[key];
  const parts = args.includes('--label-only') ? null : [render(await front(palette)), render(await back(palette))];
  if (parts) {
  const [frontPng, backPng] = parts;
  await sharp(frontPng).jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toFile(new URL(`${key}-front.jpg`, OUT).pathname);
  await sharp(backPng).jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toFile(new URL(`${key}-back.jpg`, OUT).pathname);
  await sharp(render(sleeve(palette))).png({ compressionLevel: 9 }).toFile(new URL(`${key}-sleeve.png`, OUT).pathname);
  const label = new Resvg(insideLabel(palette), { fitTo: { mode: 'width', value: LABEL.w }, font: { fontFiles, loadSystemFonts: false } }).render().asPng();
  await sharp(label).png({ compressionLevel: 9 }).toFile(new URL(`${key}-label.png`, OUT).pathname);
  console.log(`[les-separes] ${key}: front, back, sleeve, label written`);
  if (previewOut) previews.push(await sharp(frontPng).extract({ left: 1700, top: 1200, width: 2600, height: 4700 }).resize(260).toBuffer());
  }
  if (parts) continue;
  const label = new Resvg(insideLabel(palette), { fitTo: { mode: 'width', value: LABEL.w }, font: { fontFiles, loadSystemFonts: false } }).render().asPng();
  await sharp(label).png({ compressionLevel: 9 }).toFile(new URL(`${key}-label.png`, OUT).pathname);
  console.log(`[les-separes] ${key}: label written`);
}
if (previewOut && previews.length) {
  await sharp({ create: { width: 260 * previews.length, height: Math.round(4700 * 260 / 2600), channels: 3, background: '#fff' } })
    .composite(previews.map((input, i) => ({ input, left: i * 260, top: 0 }))).jpeg({ quality: 75 }).toFile(previewOut);
  console.log(`[les-separes] preview → ${previewOut}`);
}
