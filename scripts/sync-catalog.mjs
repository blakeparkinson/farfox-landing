#!/usr/bin/env node
/**
 * Build-time catalog sync: pull every Printful sync product into the shop.
 *
 * Makes Printful the single source of truth. Adding/editing/removing a
 * product in the Printful dashboard appears on the next build — no code
 * change. Writes src/data/catalog.json (committed snapshot, so builds work
 * even without network) and downloads each product's mockup into
 * public/shop/auto/.
 *
 * Run automatically before `astro build` (see package.json). Needs
 * PRINTFUL_TOKEN (+ optional PRINTFUL_STORE_ID) in the environment; if the
 * token is missing or the API errors, it leaves the committed snapshot
 * intact and exits 0 so the build still succeeds.
 *
 * Image source = Printful's stored mockup (dashboard-controlled). Drop an
 * optional override at public/shop/mockups/<syncProductId>.{png,jpg} to
 * use a custom image instead — no code change either way.
 */
import { writeFileSync, mkdirSync, existsSync, readdirSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';

const TOKEN = process.env.PRINTFUL_TOKEN;
const STORE = process.env.PRINTFUL_STORE_ID || '18292625';
const ROOT = process.cwd();
const AUTO_DIR = join(ROOT, 'public/shop/auto');
const OVERRIDE_DIR = join(ROOT, 'public/shop/mockups');
const COLORS_DIR = join(ROOT, 'public/shop/colors');
const BACKS_DIR = join(ROOT, 'public/shop/backs');
const OUT = join(ROOT, 'src/data/catalog.json');

const H = { Authorization: `Bearer ${TOKEN}`, 'X-PF-Store-Id': STORE };

async function pf(path) {
  const r = await fetch(`https://api.printful.com${path}`, { headers: H });
  if (!r.ok) throw new Error(`PF ${path} -> ${r.status}`);
  return (await r.json()).result;
}

async function download(url, dest) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`download ${url} -> ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  writeFileSync(dest, buf);
}

function overrideFor(id) {
  if (!existsSync(OVERRIDE_DIR)) return null;
  const hit = readdirSync(OVERRIDE_DIR).find((f) => f.startsWith(`${id}.`));
  return hit ? join(OVERRIDE_DIR, hit) : null;
}

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function main() {
  if (!TOKEN) {
    console.warn('[sync-catalog] No PRINTFUL_TOKEN — keeping committed catalog snapshot.');
    return;
  }
  mkdirSync(AUTO_DIR, { recursive: true });
  const list = await pf(`/store/products?limit=100`);
  // Retired kits: hidden from the storefront but kept in Printful so they can
  // be revived. White (437126174) + Champions (437120257) — weakest soccer kits.
  const RETIRED = new Set([437126174, 437120257]);
  const products = [];
  for (const p of list) {
    if (RETIRED.has(Number(p.id))) continue;
    const detail = await pf(`/store/products/${p.id}`);
    const variants = (detail.sync_variants || []).filter((v) => !v.is_ignored);
    if (!variants.length) continue;
    const prices = variants.map((v) => parseFloat(v.retail_price)).filter((n) => !isNaN(n));
    const SIZE_ORDER = ['XS','S','M','L','XL','2XL','3XL','4XL','5XL','11 oz','15 oz','20 oz','One size'];
    const sizes = [...new Set(variants.map((v) => v.size).filter(Boolean))]
      .sort((a, b) => (SIZE_ORDER.indexOf(a) + 1 || 99) - (SIZE_ORDER.indexOf(b) + 1 || 99));
    // colours (with swatch hex). Light shirts listed before dark for a nicer picker.
    const COLOR_HEX = {
      'White':'#ffffff','Natural':'#fef1d1','Ash':'#f0f1ea','Soft Pink':'#ffd8e1',
      'Heather Prism Ice Blue':'#c3e2e3','Yellow':'#ffd667','Soft Cream':'#e7d4c0',
      'Athletic Heather':'#cececc','Lilac':'#efbbe3','Silver':'#e3e3dd',
      'Black':'#0c0c0c','Navy':'#212642','Maroon':'#721d37','Forest':'#223e25',
      'Heather Navy':'#303643','True Royal':'#01408d','Team Purple':'#230f46',
    };
    const DARKISH = new Set(['Black','Navy','Maroon','Forest','Heather Navy','True Royal','Team Purple','Heather Midnight Navy']);
    const colorNames = [...new Set(variants.map((v) => v.color).filter(Boolean))];
    colorNames.sort((a, b) => (DARKISH.has(a) ? 1 : 0) - (DARKISH.has(b) ? 1 : 0));
    const colorSlug = (s) => s.toLowerCase().replace(/ /g, '-');
    const colors = colorNames.map((name) => {
      const file = `${p.id}-${colorSlug(name)}.png`;
      const hasImg = existsSync(join(COLORS_DIR, file));
      return { name, hex: COLOR_HEX[name] || '#cccccc', image: hasImg ? `/shop/colors/${file}` : null };
    });
    // If we have per-colour images, use the first colour's image as the card default.
    const firstColorImg = colors.find((c) => c.image)?.image;
    // image: override file wins, else Printful preview/thumbnail downloaded locally
    let image;
    const ov = overrideFor(p.id);
    if (ov) {
      const ext = ov.split('.').pop();
      const dest = `mockup-${p.id}.${ext}`;
      copyFileSync(ov, join(AUTO_DIR, dest));
      image = `/shop/auto/${dest}`;
    } else {
      const previewUrl =
        (variants[0].files || []).find((f) => f.type === 'preview')?.preview_url ||
        p.thumbnail_url;
      if (previewUrl) {
        const dest = `mockup-${p.id}.jpg`;
        try { await download(previewUrl, join(AUTO_DIR, dest)); image = `/shop/auto/${dest}`; }
        catch { image = previewUrl; }
      }
    }
    products.push({
      id: String(p.id),                 // Printful sync product id (Snipcart item id)
      slug: slug(p.name),
      name: p.name.replace(/^Far Fox\s*[—-]\s*/i, ''),
      price: prices.length ? Math.min(...prices) : 0,
      currency: variants[0].currency || 'USD',
      image: firstColorImg || image,
      back: existsSync(join(BACKS_DIR, `${p.id}.png`)) ? `/shop/backs/${p.id}.png` : null,
      sizes: sizes.length > 1 ? sizes : [],   // size picker only when there's a choice
      colors: colors.length > 1 ? colors : [], // colour picker only when there's a choice
    });
  }
  // stable order: newest first by id desc
  products.sort((a, b) => Number(b.id) - Number(a.id));
  mkdirSync(join(ROOT, 'src/data'), { recursive: true });
  writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), products }, null, 2));
  console.log(`[sync-catalog] wrote ${products.length} products to src/data/catalog.json`);
}

main().catch((e) => {
  console.warn(`[sync-catalog] failed (${e.message}) — keeping committed snapshot.`);
  process.exit(0);
});
