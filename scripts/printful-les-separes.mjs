/**
 * Les Séparés in Printful: one sync product, one variant per colourway × size, each variant
 * tagged `les-separes--<colourway>--<size>` so the shop's colour picker and the order webhook
 * can tell them apart (kits.mjs: variantColorway / pickVariant).
 *
 *   PRINTFUL_TOKEN=… node scripts/printful-les-separes.mjs                         # dry run
 *   PRINTFUL_TOKEN=… node scripts/printful-les-separes.mjs --create                # create the product
 *   PRINTFUL_TOKEN=… node scripts/printful-les-separes.mjs --update-files --product <id> [--apply]
 *     points every variant of an existing product at the current files (dry run without --apply)
 *   PRINTFUL_TOKEN=… node scripts/printful-les-separes.mjs --mockups --product <id>
 *     writes public/shop/colors/<id>-<colour>.png and public/shop/backs/<id>-<colour>.png per
 *     colourway, plus the default colourway's public/shop/mockups/<id>.png and backs/<id>.png
 *
 * The print files must already be live on lovefarfox.com (make-les-separes.mjs, then deploy).
 */
import { writeFile } from 'node:fs/promises';
import { LES_SEPARES, colorwayExternalId } from '../src/lib/kits.mjs';

const TOKEN = process.env.PRINTFUL_TOKEN;
const STORE = process.env.PRINTFUL_STORE_ID || '18292625';
const NAME = 'Far Fox — Long Distance FC Jersey (Les Séparés)';
const PRICE = '50.00';
const BASE = 'https://lovefarfox.com/shop/designs/les-separes';
// All-Over Print Recycled Unisex Sports Jersey (catalog 644), the same sizes as the other FC kits.
const CATALOG_VARIANTS = { XS: 16259, S: 16260, M: 16261, L: 16262, XL: 16263, '2XL': 16264, '3XL': 16265 };
const STITCH_COLOR = 'black';
const MOCKUP_STYLE = 'Ghost';

if (!TOKEN) {
  console.error('Set PRINTFUL_TOKEN (a private token with sync-product and mockup scopes).');
  process.exit(1);
}
const args = process.argv.slice(2);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function pf(path, init = {}, attempt = 0) {
  const r = await fetch(`https://api.printful.com${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${TOKEN}`, 'X-PF-Store-Id': STORE, 'Content-Type': 'application/json', ...init.headers },
  });
  const body = await r.json().catch(() => ({}));
  if (r.status === 429 && attempt < 6) {
    const wait = Number(String(body.error?.message || body.result || '').match(/after (\d+) seconds/)?.[1] || 60);
    console.log(`  rate limited, waiting ${wait + 2}s`);
    await sleep((wait + 2) * 1000);
    return pf(path, init, attempt + 1);
  }
  if (!r.ok) throw new Error(`PF ${init.method || 'GET'} ${path} -> ${r.status} ${JSON.stringify(body.error || body.result || '')}`);
  return body.result;
}

const PNG_PARTS = new Set(['sleeve', 'label']);
const fileUrl = (colorway, part) => `${BASE}/${colorway}-${part}.${PNG_PARTS.has(part) ? 'png' : 'jpg'}`;
const filesFor = (colorway) => [
  { type: 'default', url: fileUrl(colorway, 'front') },
  { type: 'back', url: fileUrl(colorway, 'back') },
  { type: 'sleeve_left', url: fileUrl(colorway, 'sleeve') },
  { type: 'sleeve_right', url: fileUrl(colorway, 'sleeve') },
  { type: 'label_inside', url: fileUrl(colorway, 'label') },
];

async function assertLive() {
  for (const { key } of LES_SEPARES.colorways) {
    for (const part of ['front', 'back', 'sleeve', 'label']) {
      const r = await fetch(fileUrl(key, part), { method: 'HEAD' });
      if (!r.ok) throw new Error(`${key} ${part} is not live (${r.status}); deploy the print files first`);
    }
  }
}

function plannedVariants() {
  return LES_SEPARES.colorways.flatMap(({ key }) => Object.entries(CATALOG_VARIANTS).map(([size, variantId]) => ({
    external_id: colorwayExternalId(LES_SEPARES.kit, key, size),
    variant_id: variantId,
    retail_price: PRICE,
    files: filesFor(key),
    options: [{ id: 'stitch_color', value: STITCH_COLOR }],
  })));
}

async function create() {
  const existing = (await pf('/store/products?limit=100')).find((p) => p.name === NAME);
  if (existing) throw new Error(`${NAME} already exists as ${existing.id}; not creating a second one`);
  const sync_variants = plannedVariants();
  console.log(`${NAME}: ${sync_variants.length} variants (${LES_SEPARES.colorways.length} colourways × ${Object.keys(CATALOG_VARIANTS).length} sizes) at $${PRICE}`);
  if (!args.includes('--create')) {
    for (const v of sync_variants.filter((x) => x.external_id.endsWith('--M'))) console.log(`  ${v.external_id}: ${v.files.map((f) => f.url.split('/').pop()).join(', ')}`);
    console.log('\nDry run only. Re-run with --create to make the product.');
    return;
  }
  await assertLive();
  const product = await pf('/store/products', { method: 'POST', body: JSON.stringify({ sync_product: { name: NAME }, sync_variants }) });
  console.log(`created sync product ${product.id}`);
}

async function mockups(productId) {
  const detail = await pf(`/store/products/${productId}`);
  const spec = await pf('/mockup-generator/printfiles/644');
  const byId = Object.fromEntries(spec.printfiles.map((p) => [p.printfile_id, p]));
  const placements = spec.variant_printfiles.find((x) => x.variant_id === CATALOG_VARIANTS.M)?.placements || {};
  const GENERATOR = { front: 'front', back: 'back', sleeve_left: 'sleeve', sleeve_right: 'sleeve' };
  for (const [index, { key, label }] of LES_SEPARES.colorways.entries()) {
    if (!detail.sync_variants.some((v) => v.external_id === colorwayExternalId(LES_SEPARES.kit, key, 'M'))) throw new Error(`no ${key} variant on ${productId}`);
    const files = Object.entries(GENERATOR).map(([placement, part]) => {
      const pfile = byId[placements[placement]];
      const side = Math.max(pfile.width, pfile.height); // the sync files' implicit "cover"
      return { placement, image_url: fileUrl(key, part), position: { area_width: pfile.width, area_height: pfile.height, width: side, height: side, left: Math.round((pfile.width - side) / 2), top: Math.round((pfile.height - side) / 2) } };
    });
    const task = await pf('/mockup-generator/create-task/644', { method: 'POST', body: JSON.stringify({ variant_ids: [CATALOG_VARIANTS.M], format: 'png', files, option_groups: [MOCKUP_STYLE], options: ['Front', 'Back'] }) });
    let result = null;
    for (let i = 0; i < 40 && !result; i++) {
      await sleep(5000);
      const res = await pf(`/mockup-generator/task?task_key=${task.task_key}`);
      if (res.status === 'failed') throw new Error(`${key}: mockup task failed ${JSON.stringify(res.error)}`);
      if (res.status === 'completed') result = res;
    }
    if (!result) throw new Error(`${key}: mockup task timed out`);
    const views = result.mockups.flatMap((m) => [{ placement: m.placement, url: m.mockup_url }, ...(m.extra || []).map((e) => ({ placement: e.title, url: e.url }))]);
    const save = async (view, path) => {
      await writeFile(new URL(`../public/shop/${path}`, import.meta.url), Buffer.from(await (await fetch(view.url)).arrayBuffer()));
      console.log(`  ${key}: ${view.placement} → public/shop/${path}`);
    };
    const front = views.find((x) => /front|default/i.test(x.placement)), back = views.find((x) => /back/i.test(x.placement));
    const slug = label.toLowerCase().replace(/ /g, '-');
    await save(front, `colors/${productId}-${slug}.png`);
    await save(back, `backs/${productId}-${slug}.png`);
    if (index === 0) {
      await save(front, `mockups/${productId}.png`);
      await save(back, `backs/${productId}.png`);
    }
  }
}

/** Point each existing variant at its colourway's current files, keeping its options. */
async function updateFiles(productId) {
  await assertLive();
  const detail = await pf(`/store/products/${productId}`);
  for (const v of detail.sync_variants) {
    const key = /^les-separes--([a-z0-9]+)--/.exec(v.external_id || '')?.[1];
    if (!key) throw new Error(`variant ${v.id} has no colourway tag (${v.external_id})`);
    const files = filesFor(key);
    const done = files.every((f) => (v.files || []).some((g) => g.type === f.type && g.url === f.url));
    console.log(`  ${v.external_id}: ${done ? 'already up to date' : files.map((f) => f.type).join(', ')}`);
    if (done || !args.includes('--apply')) continue;
    await pf(`/store/variants/${v.id}`, { method: 'PUT', body: JSON.stringify({ files, options: v.options || [] }) });
    await sleep(600); // stay well under Printful's 120 requests/minute
  }
  if (!args.includes('--apply')) console.log('\nDry run only. Re-run with --apply to update Printful.');
}

const productArg = () => {
  const id = args.includes('--product') ? args[args.indexOf('--product') + 1] : null;
  if (!id) throw new Error('this mode needs --product <sync product id>');
  return id;
};
if (args.includes('--update-files')) {
  await updateFiles(productArg());
} else if (args.includes('--mockups')) {
  await mockups(productArg());
} else {
  await create();
}
