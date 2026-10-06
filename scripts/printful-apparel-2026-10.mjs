/**
 * October 2026 apparel in Printful: the reworked tees and hoodie, Love Is Love in Black, and the
 * embroidered Long Distance Club crewneck. Files come from public/shop/designs/apparel-2026-10/
 * (make-apparel-2026-10.mjs) and must be live on lovefarfox.com first.
 *
 *   PRINTFUL_TOKEN=… node scripts/printful-apparel-2026-10.mjs              # dry run
 *   PRINTFUL_TOKEN=… node scripts/printful-apparel-2026-10.mjs --apply      # update products, add Black, create the crewneck
 *   PRINTFUL_TOKEN=… node scripts/printful-apparel-2026-10.mjs --mockups    # per-colour shop photos (DTG products); --only=pocket,ldc limits it
 */
import { existsSync } from 'node:fs';
import { writeFile, rm } from 'node:fs/promises';

const TOKEN = process.env.PRINTFUL_TOKEN;
const STORE = process.env.PRINTFUL_STORE_ID || '18292625';
const BASE = 'https://lovefarfox.com/shop/designs/apparel-2026-10';
const REVISION = 2;
const CREW_REVISION = 1;
const DARK = new Set(['Black', 'Navy', 'Maroon', 'Heather Navy', 'True Navy', 'Berry']);
const tone = (colour) => (DARK.has(colour) ? 'dark' : 'light');
const url = (name, t, revision = REVISION) => `${BASE}/${name}-${t}.png?v=${revision}`;
// Crewneck files can be served from elsewhere (CREW_FILES_BASE) so the product can be created before the site deploys.
const crewUrl = (name) => `${process.env.CREW_FILES_BASE || BASE}/${name}.png?v=${CREW_REVISION}`;

// Tees are Bella + Canvas 3001 (catalog 71); the hoodie is Bella + Canvas 3719 (catalog 294).
const PRODUCTS = {
  ldc: { id: 436909615, catalog: 71, front: 'ldc-front', back: 'ldc-back', label: null, price: '32.00' },
  timezones: { id: 436908862, catalog: 71, front: 'timezones', label: null, price: '30.00' },
  morse: { id: 436909622, catalog: 71, front: 'morse', label: null, price: '30.00' },
  pride: { id: 436891455, catalog: 71, front: 'pride', label: null, price: '30.00', addColours: ['Black'] },
  hearteyes: { id: 436883133, catalog: 71, front: 'hearteyes', label: null, price: '30.00' },
  hoodie: { id: 436883154, catalog: 294, front: 'hoodie-front', back: 'hoodie-back', label: null, price: null },
};
// Comfort Colors 6030 garment-dyed pocket tee (catalog 593): prints on the pocket and the back. Created by --apply.
const POCKET = {
  name: 'Far Fox — Pocket Tee', catalog: 593, front: 'pocket-front', frontType: 'pocket', back: 'pocket-back', label: null, price: '34.00', revision: 5,
  colours: ['White', 'Butter', 'Violet', 'Watermelon', 'True Navy', 'Berry', 'Black'], sizes: ['S', 'M', 'L', 'XL', '2XL'],
};
const CREW = {
  name: 'Far Fox — Long Distance Club Crewneck', catalog: 845, price: '55.00',
  colours: { 'Oatmeal Heather': 'oatmeal', Navy: 'navy' }, sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
  // Printful thread colours per colourway: lettering, then fox; the cuff heart is pink on both.
  // Large embroidery is dashboard-only, so the crest is a 4×4in centre-chest embroidery.
  threads: { oatmeal: ['#6B5294', '#CC3366'], navy: ['#FFFFFF', '#CC3366'] }, wristThread: '#CC3366',
};

if (!TOKEN) { console.error('Set PRINTFUL_TOKEN.'); process.exit(1); }
const args = process.argv.slice(2), apply = args.includes('--apply');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function pf(path, init = {}, attempt = 0) {
  let r, body;
  try {
    r = await fetch(`https://api.printful.com${path}`, { ...init, headers: { Authorization: `Bearer ${TOKEN}`, 'X-PF-Store-Id': STORE, 'Content-Type': 'application/json' } });
    body = await r.json().catch(() => ({}));
  } catch (e) { if (attempt < 5) { await sleep(5000); return pf(path, init, attempt + 1); } throw e; }
  if (r.status === 429 && attempt < 8) {
    await sleep(((+String(body.error?.message || body.result || '').match(/after (\d+)/)?.[1] || 30) + 3) * 1000);
    return pf(path, init, attempt + 1);
  }
  if (!r.ok) throw new Error(`PF ${init.method || 'GET'} ${path} -> ${r.status} ${JSON.stringify(body.error || body.result)}`);
  return body.result;
}

const filesFor = (p, colour) => [
  { type: p.frontType || 'default', url: url(p.front, tone(colour), p.revision) },
  ...(p.back ? [{ type: 'back', url: url(p.back, tone(colour), p.revision) }] : []),
  // Printful's API rejects a printed inside label next to DTG placements (label_inside is unsupported,
  // label_inside_dtf can't mix with DTG), so the Foxy label files wait until that's possible.
  ...(p.label ? [{ type: p.label, url: url('label', tone(colour)) }] : []),
];

async function assertLive() {
  for (const n of ['ldc-front', 'ldc-back', 'timezones', 'morse', 'pride', 'hearteyes', 'hoodie-front', 'hoodie-back', 'pocket-front', 'pocket-back', 'label']) {
    for (const t of ['light', 'dark']) { const r = await fetch(url(n, t), { method: 'HEAD' }); if (!r.ok) throw new Error(`${n}-${t} not live (${r.status})`); }
  }
  for (const c of Object.values(CREW.colours)) for (const part of ['crew-chest', 'crew-wrist']) {
    const r = await fetch(crewUrl(`${part}-${c}`), { method: 'HEAD' }); if (!r.ok) throw new Error(`${part}-${c} not live (${r.status})`);
  }
}

async function updateProducts() {
  for (const [key, p] of Object.entries(await withPocket())) {
    const detail = await pf(`/store/products/${p.id}`);
    console.log(`\n${detail.sync_product.name} (${p.id}): ${detail.sync_variants.length} variants`);
    for (const v of detail.sync_variants) {
      const files = filesFor(p, v.color);
      // Re-runs skip variants already on these files at this price.
      const done = files.every((f) => (v.files || []).some((g) => g.type === f.type && g.url === f.url)) && (!p.price || v.retail_price === p.price);
      if (done) continue;
      console.log(`  ${v.color} ${v.size}: ${tone(v.color)} files${p.price && v.retail_price !== p.price ? `, $${v.retail_price} → $${p.price}` : ''}`);
      if (!apply) continue;
      await pf(`/store/variants/${v.id}`, { method: 'PUT', body: JSON.stringify({ files, options: v.options || [], ...(p.price ? { retail_price: p.price } : {}) }) });
      await sleep(600);
    }
    for (const colour of p.addColours || []) {
      const have = new Set(detail.sync_variants.filter((v) => v.color === colour).map((v) => v.size));
      const sizes = [...new Set(detail.sync_variants.map((v) => v.size))].filter((s) => !have.has(s));
      const catalog = (await pf(`/products/${p.catalog}`)).variants;
      for (const size of sizes) {
        const cv = catalog.find((x) => x.color === colour && x.size === size);
        console.log(`  + ${colour} ${size}`);
        if (!apply || !cv) continue;
        await pf(`/store/products/${p.id}/variants`, { method: 'POST', body: JSON.stringify({ variant_id: cv.id, retail_price: p.price, files: filesFor(p, colour) }) });
        await sleep(600);
      }
    }
  }
}

async function createCrew() {
  const existing = (await pf('/store/products?limit=100')).find((p) => p.name === CREW.name);
  if (existing) { console.log(`\n${CREW.name} already exists (${existing.id})`); return existing.id; }
  const catalog = (await pf(`/products/${CREW.catalog}`)).variants;
  const sync_variants = Object.entries(CREW.colours).flatMap(([colour, key]) => CREW.sizes.map((size) => ({
    variant_id: catalog.find((v) => v.color === colour && v.size === size).id,
    retail_price: CREW.price,
    files: [
      { type: 'embroidery_chest_center', url: crewUrl(`crew-chest-${key}`) },
      { type: 'embroidery_wrist_left', url: crewUrl(`crew-wrist-${key}`) },
    ],
    options: [{ id: 'thread_colors_chest_center', value: CREW.threads[key] }, { id: 'thread_colors_wrist_left', value: [CREW.wristThread] }],
  })));
  console.log(`\n${CREW.name}: ${sync_variants.length} variants at $${CREW.price}`);
  if (!apply) return null;
  const created = await pf('/store/products', { method: 'POST', body: JSON.stringify({ sync_product: { name: CREW.name }, sync_variants }) });
  console.log(`  created ${created.id}`);
  return created.id;
}

/** PRODUCTS plus the pocket tee once it exists in Printful. */
async function withPocket() {
  const pocket = (await pf('/store/products?limit=100')).find((p) => p.name === POCKET.name);
  return { ...PRODUCTS, ...(pocket ? { pocket: { ...POCKET, id: pocket.id } } : {}) };
}

async function createPocket() {
  const existing = (await pf('/store/products?limit=100')).find((p) => p.name === POCKET.name);
  if (existing) { console.log(`\n${POCKET.name} already exists (${existing.id})`); return existing.id; }
  const catalog = (await pf(`/products/${POCKET.catalog}`)).variants;
  const sync_variants = POCKET.colours.flatMap((colour) => POCKET.sizes.map((size) => ({
    variant_id: catalog.find((v) => v.color === colour && v.size === size).id, retail_price: POCKET.price, files: filesFor(POCKET, colour),
  })));
  console.log(`\n${POCKET.name}: ${sync_variants.length} variants at $${POCKET.price}`);
  if (!apply) return null;
  const created = await pf('/store/products', { method: 'POST', body: JSON.stringify({ sync_product: { name: POCKET.name }, sync_variants }) });
  console.log(`  created ${created.id}`);
  return created.id;
}

const slugOf = (colour) => colour.toLowerCase().replace(/ /g, '-');
const shopFile = (path) => new URL(`../public/shop/${path}`, import.meta.url);

/** Per-colour shop photos for the DTG products: one generator task per ink tone, then a retry for any colour it skipped. */
async function mockups() {
  const only = args.find((a) => a.startsWith('--only='))?.slice(7).split(',');
  for (const [key, p] of Object.entries(await withPocket())) {
    if (only && !only.includes(key)) continue;
    const detail = await pf(`/store/products/${p.id}`);
    const colours = [...new Set(detail.sync_variants.map((v) => v.color))];
    const missing = () => colours.filter((c) => !existsSync(shopFile(`colors/${p.id}-${slugOf(c)}.png`)) || (p.back && !existsSync(shopFile(`backs/${p.id}-${slugOf(c)}.png`))));
    for (const c of colours) for (const dir of ['colors', 'backs']) await rm(shopFile(`${dir}/${p.id}-${slugOf(c)}.png`), { force: true });
    for (const t of ['light', 'dark']) await renderMockups(p, colours.filter((c) => tone(c) === t), t);
    for (const c of missing()) await renderMockups(p, [c], tone(c));
    console.log(`  ${key}: ${colours.length} colours${missing().length ? `, STILL MISSING ${missing().join(', ')}` : ''}`);
  }
}

async function renderMockups(p, group, t) {
  if (!group.length) return;
  const catalog = (await pf(`/products/${p.catalog}`)).variants;
  const spec = await pf(`/mockup-generator/printfiles/${p.catalog}`);
  const byId = Object.fromEntries(spec.printfiles.map((x) => [x.printfile_id, x]));
  const placements = spec.variant_printfiles[0].placements;
  const frontPlacement = p.frontType && p.frontType !== 'default' ? p.frontType : 'front';
  const variantIds = group.map((c) => catalog.find((v) => v.color === c && v.size === 'M').id);
  const area = (pl) => { const f = byId[placements[pl]]; return { area_width: f.width, area_height: f.height, width: f.width, height: f.height, top: 0, left: 0 }; };
  const files = [{ placement: frontPlacement, image_url: url(p.front, t, p.revision), position: area(frontPlacement) }, ...(p.back ? [{ placement: 'back', image_url: url(p.back, t, p.revision), position: area('back') }] : [])];
  const task = await pf(`/mockup-generator/create-task/${p.catalog}`, { method: 'POST', body: JSON.stringify({ variant_ids: variantIds, format: 'png', files, option_groups: ['Flat'], options: ['Front', 'Back'] }) });
  let res;
  for (let i = 0; i < 60; i++) { await sleep(5000); res = await pf(`/mockup-generator/task?task_key=${task.task_key}`); if (res.status !== 'pending') break; }
  if (res.status !== 'completed') throw new Error(`${p.id} ${t}: mockups ${res.status}`);
  for (const m of res.mockups) for (const vid of m.variant_ids) {
    const colour = group[variantIds.indexOf(vid)];
    if (!colour) continue;
    // The generator files the back view under extras for some tasks, so pick each view by its own label.
    const isBack = /back/i.test(m.placement);
    const view = (m.extra || []).find((e) => (isBack ? /back/i : /front/i).test(e.option || e.title || ''))?.url || m.mockup_url;
    await writeFile(shopFile(`${isBack ? 'backs' : 'colors'}/${p.id}-${slugOf(colour)}.png`), Buffer.from(await (await fetch(view)).arrayBuffer()));
  }
}

if (args.includes('--mockups')) await mockups();
else {
  if (apply) await assertLive();
  await updateProducts();
  await createCrew();
  await createPocket();
  if (!apply) console.log('\nDry run only. Re-run with --apply.');
}
