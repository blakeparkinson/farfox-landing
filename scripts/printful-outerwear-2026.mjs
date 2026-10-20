/**
 * Far Fox outerwear in Printful: the Airways and Two Skies flight jackets (All-Over Print Unisex Bomber Jacket,
 * catalog 390) and the Far Fox beanie (Yupoong 1501KC cuffed beanie, catalog 266, flat embroidery). Files come from
 * public/shop/designs/outerwear-2026/ (make-outerwear-2026.mjs). Printful fetches them from the public GitHub
 * repo at a pushed commit (--sha, default HEAD), so the products can be created before the site deploys;
 * --live points at lovefarfox.com instead.
 *
 *   node --env-file=.env scripts/printful-outerwear-2026.mjs                 # dry run
 *   node --env-file=.env scripts/printful-outerwear-2026.mjs --apply         # create the products (skips ones that exist)
 *   node --env-file=.env scripts/printful-outerwear-2026.mjs --mockups       # shop photos into public/shop/{mockups,backs,colors}/; --only=twoskies,beanie limits it
 */
import { execSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';

const TOKEN = process.env.PRINTFUL_TOKEN;
const STORE = process.env.PRINTFUL_STORE_ID || '18292625';
if (!TOKEN) { console.error('Set PRINTFUL_TOKEN.'); process.exit(1); }
const args = process.argv.slice(2), apply = args.includes('--apply');
const arg = (k, fallback) => (args.includes(k) ? args[args.indexOf(k) + 1] : fallback);
const REVISION = 1;
const BASE = args.includes('--live')
  ? 'https://lovefarfox.com/shop/designs/outerwear-2026'
  : `https://raw.githubusercontent.com/blakeparkinson/farfox-landing/${arg('--sha', execSync('git rev-parse HEAD').toString().trim())}/public/shop/designs/outerwear-2026`;
const url = (name) => `${BASE}/${name}.png?v=${REVISION}`;

const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];
// Each jacket's print files share a prefix: <prefix>-front, -back, -sleeve (both arms), -details, -label.
const jacketFiles = (prefix) => [
  { type: 'default', url: url(`${prefix}-front`) }, { type: 'back', url: url(`${prefix}-back`) },
  { type: 'sleeve_left', url: url(`${prefix}-sleeve`) }, { type: 'sleeve_right', url: url(`${prefix}-sleeve`) },
  { type: 'details', url: url(`${prefix}-details`) }, { type: 'label_inside', url: url(`${prefix}-label`) },
];
const BOMBERS = {
  airways: { name: 'Far Fox — Airways Flight Jacket', catalog: 390, price: '95.00', sizes: SIZES, files: jacketFiles('bomber'), options: [{ id: 'stitch_color', value: 'black' }] },
  twoskies: { name: 'Far Fox — Two Skies Flight Jacket (New York / London)', catalog: 390, price: '95.00', sizes: SIZES, files: jacketFiles('twoskies'), options: [{ id: 'stitch_color', value: 'black' }] },
};
// Thread colours are Printful's own: Flamingo for the crest everywhere, White lettering on dark knits, Purple on light.
const FLAMINGO = '#CC3366', WHITE = '#FFFFFF', PURPLE = '#6B5294';
const BEANIE = {
  name: 'Far Fox — Beanie', catalog: 266, price: '26.00',
  colours: { Navy: 'dark', Black: 'dark', Spruce: 'dark', 'Heather Grey': 'light', 'Baby Pink': 'light' },
  threads: { dark: [WHITE, FLAMINGO], light: [PURPLE, FLAMINGO] },
};
const beanieFiles = (tone) => ({
  files: [{ type: 'embroidery_front', url: url(`beanie-${tone}`) }],
  options: [{ id: 'embroidery_type', value: 'flat' }, { id: 'thread_colors', value: BEANIE.threads[tone] }],
});

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

async function assertReachable() {
  for (const n of [...Object.values(BOMBERS).flatMap((b) => b.files.map((f) => f.url.split('/').pop().split('?')[0].replace('.png', ''))), 'beanie-dark', 'beanie-light']) {
    const r = await fetch(url(n), { method: 'HEAD' });
    if (!r.ok) throw new Error(`${url(n)} -> ${r.status}: push the commit first, or pass --live once the site has deployed`);
  }
}

async function create(plan, variantsOf) {
  const existing = (await pf('/store/products?limit=100')).find((p) => p.name === plan.name);
  if (existing) { console.log(`\n${plan.name} already exists (${existing.id})`); return existing.id; }
  const catalog = (await pf(`/products/${plan.catalog}`)).variants;
  const sync_variants = variantsOf(catalog);
  console.log(`\n${plan.name}: ${sync_variants.length} variants at $${plan.price}`);
  for (const v of sync_variants) console.log(`  ${v.external_id}: ${v.files.map((f) => f.url.split('/').pop().split('?')[0]).join(', ')}${v.options?.[1] ? ` threads ${v.options[1].value.join(' ')}` : ''}`);
  if (!apply) return null;
  const created = await pf('/store/products', { method: 'POST', body: JSON.stringify({ sync_product: { name: plan.name }, sync_variants }) });
  console.log(`  created ${created.id}`);
  return created.id;
}
const createBomber = (key) => create(BOMBERS[key], (catalog) => BOMBERS[key].sizes.map((size) => ({
  variant_id: catalog.find((v) => v.size === size).id, external_id: `${key}-jacket--${size}`, retail_price: BOMBERS[key].price, files: BOMBERS[key].files, options: BOMBERS[key].options,
})));
const createBeanie = () => create(BEANIE, (catalog) => Object.entries(BEANIE.colours).map(([colour, tone]) => ({
  variant_id: catalog.find((v) => v.color === colour).id, external_id: `beanie--${colour.toLowerCase().replace(/ /g, '-')}`, retail_price: BEANIE.price, ...beanieFiles(tone),
})));

const slugOf = (colour) => colour.toLowerCase().replace(/ /g, '-');
const shopFile = (path) => new URL(`../public/shop/${path}`, import.meta.url);
const save = async (path, src) => writeFile(shopFile(path), Buffer.from(await (await fetch(src)).arrayBuffer()));

/** One generator task; returns the mockups with each view's own image picked out of the extras. */
async function generate(catalog, variantIds, files, style) {
  const task = await pf(`/mockup-generator/create-task/${catalog}`, { method: 'POST', body: JSON.stringify({ variant_ids: variantIds, format: 'png', files, ...style }) });
  let res;
  for (let i = 0; i < 60; i++) { await sleep(5000); res = await pf(`/mockup-generator/task?task_key=${task.task_key}`); if (res.status !== 'pending') break; }
  if (res.status !== 'completed') throw new Error(`mockups ${res.status}: ${JSON.stringify(res.error || '')}`);
  return res.mockups;
}
const area = (spec, placement) => { const f = spec.printfiles.find((x) => x.printfile_id === spec.variant_printfiles[0].placements[placement]); return { area_width: f.width, area_height: f.height, width: f.width, height: f.height, top: 0, left: 0 }; };

/** Shop photos: the jacket's front and back on a ghost mannequin, the beanie flat in each colour. */
async function mockups() {
  const only = args.find((a) => a.startsWith('--only='))?.slice(7).split(',');
  const products = await pf('/store/products?limit=100');
  const beanie = products.find((p) => p.name === BEANIE.name);
  for (const [key, BOMBER] of Object.entries(BOMBERS)) {
    const bomber = products.find((p) => p.name === BOMBER.name);
    if (!bomber || (only && !only.includes(key))) continue;
    const spec = await pf(`/mockup-generator/printfiles/${BOMBER.catalog}`);
    const files = BOMBER.files.map((f) => ({ placement: f.type === 'default' ? 'front' : f.type, image_url: f.url, position: area(spec, f.type === 'default' ? 'front' : f.type) }));
    const m = (await pf(`/products/${BOMBER.catalog}`)).variants.find((v) => v.size === 'M').id;
    for (const mk of await generate(BOMBER.catalog, [m], files, { option_groups: ['Ghost'], options: ['Front', 'Back'] })) {
      for (const view of [{ name: 'front', re: /front/i }, { name: 'back', re: /back/i }]) {
        const img = (mk.extra || []).find((e) => view.re.test(e.option || e.title || ''))?.url || (view.re.test(mk.placement) ? mk.mockup_url : null);
        if (!img) continue;
        const dest = view.name === 'back' ? `backs/${bomber.id}.png` : `mockups/${bomber.id}.png`;
        await save(dest, img);
        console.log(`  ${dest}`);
      }
    }
  }
  if (beanie && !(only && !only.includes('beanie'))) {
    const spec = await pf(`/mockup-generator/printfiles/${BEANIE.catalog}`);
    const catalog = (await pf(`/products/${BEANIE.catalog}`)).variants;
    for (const tone of ['dark', 'light']) {
      const colours = Object.entries(BEANIE.colours).filter(([, t]) => t === tone).map(([c]) => c);
      const ids = colours.map((c) => catalog.find((v) => v.color === c).id);
      const files = [{ placement: 'embroidery_front', image_url: url(`beanie-${tone}`), position: area(spec, 'embroidery_front') }];
      for (const mk of await generate(BEANIE.catalog, ids, files, { option_groups: ['Flat'], options: ['Front'] })) {
        for (const vid of mk.variant_ids) {
          const colour = colours[ids.indexOf(vid)];
          if (!colour) continue;
          const dest = `colors/${beanie.id}-${slugOf(colour)}.png`;
          await save(dest, mk.mockup_url);
          console.log(`  ${dest}`);
        }
      }
    }
  }
}

if (args.includes('--mockups')) await mockups();
else {
  await assertReachable();
  for (const key of Object.keys(BOMBERS)) await createBomber(key);
  await createBeanie();
  if (!apply) console.log('\nDry run only. Re-run with --apply.');
}
