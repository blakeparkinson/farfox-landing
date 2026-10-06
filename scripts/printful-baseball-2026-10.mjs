/**
 * The Ballpark baseball jersey in Printful: one sync product, one variant per colourway × size, each tagged
 * `ldc-baseball--<colourway>--<size>` (kits.mjs: BASEBALL, variantColorway, pickVariant, kitForColour).
 *
 *   PRINTFUL_TOKEN=… node scripts/printful-baseball-2026-10.mjs                          # dry run
 *   PRINTFUL_TOKEN=… node scripts/printful-baseball-2026-10.mjs --create                 # create the product
 *   PRINTFUL_TOKEN=… node scripts/printful-baseball-2026-10.mjs --mockups --product <id> # per-colour shop photos
 *
 * The print files must already be live on lovefarfox.com (make-baseball-2026-10.mjs, then deploy).
 */
import { writeFile } from 'node:fs/promises';
import { BASEBALL, colorwayExternalId } from '../src/lib/kits.mjs';

const TOKEN = process.env.PRINTFUL_TOKEN;
const STORE = process.env.PRINTFUL_STORE_ID || '18292625';
const NAME = 'Far Fox — Ballpark Baseball Jersey';
const PRICE = '55.00';
const CATALOG = 792; // All-Over Print Recycled Unisex Baseball Jersey
const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
const STITCH_COLOR = 'white';
const BASE = 'https://lovefarfox.com/shop/designs/baseball-2026-10';
// Printful keeps the copy it first downloaded from a URL; bump this when the files are rebuilt in place.
const FILE_REVISION = 1;
const AREA = { front: [5700, 6900], back: [5700, 6900], sleeve_left: [5700, 2250], sleeve_right: [5700, 2250] };
const PART = { front: 'front', back: 'back', sleeve_left: 'sleeve-left', sleeve_right: 'sleeve-right' };

if (!TOKEN) { console.error('Set PRINTFUL_TOKEN.'); process.exit(1); }
const args = process.argv.slice(2);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function pf(path, init = {}, attempt = 0) {
  const r = await fetch(`https://api.printful.com${path}`, { ...init, headers: { Authorization: `Bearer ${TOKEN}`, 'X-PF-Store-Id': STORE, 'Content-Type': 'application/json' } });
  const body = await r.json().catch(() => ({}));
  if (r.status === 429 && attempt < 6) {
    await sleep((Number(String(body.error?.message || body.result || '').match(/after (\d+)/)?.[1] || 60) + 2) * 1000);
    return pf(path, init, attempt + 1);
  }
  if (!r.ok) throw new Error(`PF ${init.method || 'GET'} ${path} -> ${r.status} ${JSON.stringify(body.error || body.result || '')}`);
  return body.result;
}

const fileUrl = (key, placement) => `${BASE}/${BASEBALL.kit}-${key}-${PART[placement]}.png?v=${FILE_REVISION}`;
const filesFor = (key) => Object.keys(PART).map((placement) => ({ type: placement === 'front' ? 'default' : placement, url: fileUrl(key, placement) }));

async function assertLive() {
  for (const { key } of BASEBALL.colorways) for (const placement of Object.keys(PART)) {
    const r = await fetch(fileUrl(key, placement), { method: 'HEAD' });
    if (!r.ok) throw new Error(`${key} ${placement} is not live (${r.status}); deploy the print files first`);
  }
}

async function create() {
  const existing = (await pf('/store/products?limit=100')).find((p) => p.name === NAME);
  if (existing) throw new Error(`${NAME} already exists as ${existing.id}; not creating a second one`);
  const catalog = (await pf(`/products/${CATALOG}`)).variants;
  const sync_variants = BASEBALL.colorways.flatMap(({ key }) => SIZES.map((size) => ({
    external_id: colorwayExternalId(BASEBALL.kit, key, size),
    variant_id: catalog.find((v) => v.size === size).id,
    retail_price: PRICE,
    files: filesFor(key),
    options: [{ id: 'stitch_color', value: STITCH_COLOR }],
  })));
  console.log(`${NAME}: ${sync_variants.length} variants (${BASEBALL.colorways.length} colourways × ${SIZES.length} sizes) at $${PRICE}`);
  if (!args.includes('--create')) { console.log('Dry run only. Re-run with --create.'); return; }
  await assertLive();
  const product = await pf('/store/products', { method: 'POST', body: JSON.stringify({ sync_product: { name: NAME }, sync_variants }) });
  console.log(`created sync product ${product.id}`);
}

/** Per-colourway front and back photos, plus the first colourway as the product default. */
async function mockups(productId) {
  const variantM = (await pf(`/products/${CATALOG}`)).variants.find((v) => v.size === 'M').id;
  for (const [index, { key, label }] of BASEBALL.colorways.entries()) {
    const files = Object.entries(AREA).map(([placement, [w, h]]) => ({ placement, image_url: fileUrl(key, placement), position: { area_width: w, area_height: h, width: w, height: h, top: 0, left: 0 } }));
    const task = await pf(`/mockup-generator/create-task/${CATALOG}`, { method: 'POST', body: JSON.stringify({ variant_ids: [variantM], format: 'png', files }) });
    let result = null;
    for (let i = 0; i < 60 && !result; i++) {
      await sleep(5000);
      const res = await pf(`/mockup-generator/task?task_key=${task.task_key}`);
      if (res.status === 'failed') throw new Error(`${key}: mockup task failed ${JSON.stringify(res.error)}`);
      if (res.status === 'completed') result = res;
    }
    if (!result) throw new Error(`${key}: mockup task timed out`);
    // The front placement's main view is the front; its "Back" extra is the back view.
    const front = result.mockups.find((m) => m.placement === 'front');
    const views = { colors: front.mockup_url, backs: (front.extra || []).find((e) => /back/i.test(e.option || e.title || ''))?.url };
    if (!views.backs) throw new Error(`${key}: no back view in the mockup result`);
    const slug = label.toLowerCase().replace(/ /g, '-');
    for (const [dir, url] of Object.entries(views)) {
      const png = Buffer.from(await (await fetch(url)).arrayBuffer());
      await writeFile(new URL(`../public/shop/${dir}/${productId}-${slug}.png`, import.meta.url), png);
      if (index === 0) await writeFile(new URL(`../public/shop/${dir === 'colors' ? 'mockups' : 'backs'}/${productId}.png`, import.meta.url), png);
    }
    console.log(`  ${key}: front + back photos`);
  }
}

if (args.includes('--mockups')) {
  const id = args[args.indexOf('--product') + 1];
  if (!id || id.startsWith('--')) throw new Error('--mockups needs --product <sync product id>');
  await mockups(id);
} else {
  await create();
}
