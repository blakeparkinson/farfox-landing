/**
 * The holiday 2026 drop in Printful: four Long Distance FC kits (catalog 644) and the heart ornament (catalog 900).
 *
 *   PRINTFUL_TOKEN=… node scripts/printful-holiday-2026.mjs             # dry run: what would be created
 *   PRINTFUL_TOKEN=… node scripts/printful-holiday-2026.mjs --create    # create the products that don't exist yet
 *   PRINTFUL_TOKEN=… node scripts/printful-holiday-2026.mjs --mockups   # Ghost-style shop photos for each product
 *   PRINTFUL_TOKEN=… node scripts/printful-holiday-2026.mjs --update-files [--apply]   # re-point variants at the current file revisions
 *
 * The print files must already be live on lovefarfox.com (make-jersey-kits.mjs and make-ornament.mjs, then deploy).
 */
import { writeFile } from 'node:fs/promises';

const TOKEN = process.env.PRINTFUL_TOKEN;
const STORE = process.env.PRINTFUL_STORE_ID || '18292625';
const SITE = 'https://lovefarfox.com/shop/designs';
// Printful keeps the copy it first downloaded from a URL; bump a kit's revision when its files are rebuilt in place.
const FILE_REVISION = { rednose: 2, cobweb: 2, candycorn: 2 };
const revision = (path) => FILE_REVISION[Object.keys(FILE_REVISION).find((k) => path.includes(`sj-${k}-`))] || 1;
const KIT_CATALOG = 644;
const KIT_VARIANTS = { XS: 16259, S: 16260, M: 16261, L: 16262, XL: 16263, '2XL': 16264, '3XL': 16265 };
const ORNAMENT_CATALOG = 900, ORNAMENT_HEART = 23144;
const MOCKUP_STYLE = 'Ghost';

const KITS = [
  { kit: 'cobweb', name: 'Long Distance FC Jersey (Cobweb)', stitch: 'black' },
  { kit: 'candycorn', name: 'Long Distance FC Jersey (Candy Corn)', stitch: 'black' },
  { kit: 'fairisle', name: 'Long Distance FC Jersey (Fair Isle)', stitch: 'white' },
  { kit: 'rednose', name: 'Long Distance FC Jersey (Red Nose)', stitch: 'white' },
];
const KIT_PRICE = '50.00';
const ORNAMENT = { name: '"Miles Apart" Heart Ornament', price: '20.00', file: 'ornament-2026/ornament-heart.png' };

if (!TOKEN) { console.error('Set PRINTFUL_TOKEN.'); process.exit(1); }
const args = process.argv.slice(2);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function pf(path, init = {}, attempt = 0) {
  const r = await fetch(`https://api.printful.com${path}`, { ...init, headers: { Authorization: `Bearer ${TOKEN}`, 'X-PF-Store-Id': STORE, 'Content-Type': 'application/json', ...init.headers } });
  const body = await r.json().catch(() => ({}));
  if (r.status === 429 && attempt < 6) {
    const wait = Number(String(body.error?.message || body.result || '').match(/after (\d+) seconds/)?.[1] || 60);
    await sleep((wait + 2) * 1000);
    return pf(path, init, attempt + 1);
  }
  if (!r.ok) throw new Error(`PF ${init.method || 'GET'} ${path} -> ${r.status} ${JSON.stringify(body.error || body.result || '')}`);
  return body.result;
}

const url = (path) => `${SITE}/${path}?v=${revision(path)}`;
const kitFile = (kit, part) => url(`kits-2026-holiday/sj-${kit}-${part}.png`);
const fullName = (name) => `Far Fox — ${name}`;

function plans() {
  const kits = KITS.map(({ kit, name, stitch }) => ({
    key: kit, name: fullName(name), catalog: KIT_CATALOG,
    sync_variants: Object.entries(KIT_VARIANTS).map(([size, variant_id]) => ({
      external_id: `${kit}--${size}`, variant_id, retail_price: KIT_PRICE,
      files: [{ type: 'default', url: kitFile(kit, 'front') }, { type: 'back', url: kitFile(kit, 'back') }, { type: 'sleeve_left', url: kitFile(kit, 'sleeve') }, { type: 'sleeve_right', url: kitFile(kit, 'sleeve') }],
      options: [{ id: 'stitch_color', value: stitch }],
    })),
  }));
  const ornament = { key: 'ornament', name: fullName(ORNAMENT.name), catalog: ORNAMENT_CATALOG, sync_variants: [{ external_id: 'ornament-heart-2026', variant_id: ORNAMENT_HEART, retail_price: ORNAMENT.price, files: [{ type: 'default', url: url(ORNAMENT.file) }] }] };
  return [...kits, ornament];
}

async function existingByName() {
  const all = [];
  for (let offset = 0; ; offset += 100) {
    const page = await pf(`/store/products?limit=100&offset=${offset}`);
    all.push(...page);
    if (page.length < 100) break;
  }
  return Object.fromEntries(all.map((p) => [p.name, p.id]));
}

async function create() {
  const existing = await existingByName();
  for (const plan of plans()) {
    if (existing[plan.name]) { console.log(`${plan.name}: exists as ${existing[plan.name]}`); continue; }
    console.log(`${plan.name}: ${plan.sync_variants.length} variant(s) at $${plan.sync_variants[0].retail_price}`);
    if (!args.includes('--create')) continue;
    const product = await pf('/store/products', { method: 'POST', body: JSON.stringify({ sync_product: { name: plan.name }, sync_variants: plan.sync_variants }) });
    console.log(`  created ${product.id}`);
    await sleep(1500);
  }
  if (!args.includes('--create')) console.log('\nDry run only. Re-run with --create to make the products.');
}

/** Ghost-style front (and back, for kits) photos into public/shop/mockups and public/shop/backs. */
async function mockups() {
  const existing = await existingByName();
  for (const plan of plans()) {
    const id = existing[plan.name];
    if (!id) { console.log(`${plan.name}: not created yet`); continue; }
    const spec = await pf(`/mockup-generator/printfiles/${plan.catalog}`);
    const byId = Object.fromEntries(spec.printfiles.map((p) => [p.printfile_id, p]));
    const variant = plan.catalog === KIT_CATALOG ? KIT_VARIANTS.M : ORNAMENT_HEART;
    const placements = spec.variant_printfiles.find((x) => x.variant_id === variant).placements;
    const sources = plan.catalog === KIT_CATALOG
      ? { front: kitFile(plan.key, 'front'), back: kitFile(plan.key, 'back'), sleeve_left: kitFile(plan.key, 'sleeve'), sleeve_right: kitFile(plan.key, 'sleeve') }
      : { front: url(ORNAMENT.file) };
    const files = Object.entries(sources).map(([placement, image_url]) => {
      const p = byId[placements[placement]];
      // Kit files are square and "cover" their print areas; the ornament file already matches its area.
      const side = plan.catalog === KIT_CATALOG ? Math.max(p.width, p.height) : null;
      return { placement, image_url, position: side
        ? { area_width: p.width, area_height: p.height, width: side, height: side, left: Math.round((p.width - side) / 2), top: Math.round((p.height - side) / 2) }
        : { area_width: p.width, area_height: p.height, width: p.width, height: p.height, left: 0, top: 0 } };
    });
    const style = plan.catalog === KIT_CATALOG ? { option_groups: [MOCKUP_STYLE], options: ['Front', 'Back'] } : {};
    const task = await pf(`/mockup-generator/create-task/${plan.catalog}`, { method: 'POST', body: JSON.stringify({ variant_ids: [variant], format: 'png', files, ...style }) });
    let result = null;
    for (let i = 0; i < 60 && !result; i++) {
      await sleep(5000);
      const res = await pf(`/mockup-generator/task?task_key=${task.task_key}`);
      if (res.status === 'failed') throw new Error(`${plan.key}: mockup task failed ${JSON.stringify(res.error)}`);
      if (res.status === 'completed') result = res;
    }
    if (!result) throw new Error(`${plan.key}: mockup task timed out`);
    const views = result.mockups.flatMap((m) => [{ placement: m.placement, url: m.mockup_url }, ...(m.extra || []).map((e) => ({ placement: e.title, url: e.url }))]);
    const save = async (view, path) => {
      await writeFile(new URL(`../public/shop/${path}`, import.meta.url), Buffer.from(await (await fetch(view.url)).arrayBuffer()));
      console.log(`  ${plan.key}: ${view.placement} → public/shop/${path}`);
    };
    await save(views.find((x) => /front|default/i.test(x.placement)), `mockups/${id}.png`);
    // The ornament prints the same design on both faces, so it gets no Back view.
    if (plan.catalog === KIT_CATALOG) await save(views.find((x) => /back/i.test(x.placement)), `backs/${id}.png`);
  }
}

/** Point every variant at its plan's current file URLs (a new ?v= makes Printful download the rebuilt file). */
async function updateFiles() {
  const existing = await existingByName();
  for (const plan of plans()) {
    const id = existing[plan.name];
    if (!id) continue;
    const detail = await pf(`/store/products/${id}`);
    for (const v of detail.sync_variants) {
      const target = plan.sync_variants.find((p) => p.external_id === v.external_id);
      const current = (v.files || []).filter((f) => f.type !== 'preview');
      if (!target || target.files.every((f) => current.some((c) => c.type === f.type && c.url === f.url))) continue;
      console.log(`${plan.key} ${v.external_id}: ${target.files.map((f) => `${f.type}→${f.url.split('/').pop()}`).join(', ')}`);
      if (args.includes('--apply')) { await pf(`/store/variants/${v.id}`, { method: 'PUT', body: JSON.stringify({ files: target.files, options: v.options || [] }) }); await sleep(600); }
    }
  }
  if (!args.includes('--apply')) console.log('\nDry run only. Re-run with --apply to update Printful.');
}

if (args.includes('--mockups')) await mockups();
else if (args.includes('--update-files')) await updateFiles();
else await create();
