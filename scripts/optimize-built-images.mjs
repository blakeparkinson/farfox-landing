/**
 * After `astro build`: every PNG/JPEG a page displays (img src, and the colour swatch / Front-Back
 * attributes the shop swaps into it) gets a WebP copy at most 1200 px wide under dist/client/opt/, and
 * the built HTML is rewritten to use it. Full-size originals stay where they are for Snipcart's
 * data-item-image, social previews, JSON-LD and the Merchant Center feed, which never reference /opt/.
 *
 *   node scripts/optimize-built-images.mjs
 */
import { readFile, writeFile, readdir, stat, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../dist/client/', import.meta.url));
export const OPT = { maxWidth: 1200, quality: 80, dir: 'opt' };
const SITE = 'https://lovefarfox.com';
// Only display attributes: data-item-image (Snipcart), meta tags and JSON-LD keep the originals.
const DISPLAY_REF = /\b(src|data-image|data-back|data-view)="((?:https:\/\/lovefarfox\.com)?)(\/[^"]+?\.(?:png|jpe?g))"/g;

async function htmlFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await htmlFiles(path));
    else if (entry.name.endsWith('.html')) out.push(path);
  }
  return out;
}

const optPath = (src) => `/${OPT.dir}${src.replace(/\.(png|jpe?g)$/, '.webp')}`;

const pages = await htmlFiles(root);
const sources = new Set();
const html = new Map();
for (const page of pages) {
  const text = await readFile(page, 'utf8');
  html.set(page, text);
  for (const m of text.matchAll(DISPLAY_REF)) sources.add(m[3]);
}

const converted = new Set();
let before = 0, after = 0;
for (const src of sources) {
  const input = join(root, src);
  const info = await stat(input).catch(() => null);
  if (!info) continue; // a reference to a file the build doesn't have stays untouched
  const output = join(root, optPath(src));
  await mkdir(dirname(output), { recursive: true });
  const result = await sharp(input).resize({ width: OPT.maxWidth, withoutEnlargement: true }).webp({ quality: OPT.quality }).toFile(output);
  before += info.size; after += result.size;
  converted.add(src);
}

let rewrites = 0;
for (const [page, text] of html) {
  const next = text.replace(DISPLAY_REF, (whole, attr, host, src) => {
    if (!converted.has(src)) return whole;
    rewrites++;
    return `${attr}="${host ? SITE : ''}${optPath(src)}"`;
  });
  if (next !== text) await writeFile(page, next);
}
console.log(`[optimize-images] ${converted.size} images → WebP, ${(before / 1e6).toFixed(1)} MB → ${(after / 1e6).toFixed(1)} MB, ${rewrites} references rewritten.`);
