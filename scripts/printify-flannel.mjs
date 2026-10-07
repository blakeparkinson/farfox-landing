/**
 * The Far Fox National Park flannel in Printify (Independent Trading Co. EXP50F, blueprint 1369, printed by
 * Dimona Tee). Uploads the files from make-flannel.mjs and creates or updates the product, then saves
 * Printify's mockups as the shop's per-colour photos and prints the cost of each variant.
 *
 *   PRINTIFY_TOKEN=… node scripts/printify-flannel.mjs           # dry run: what would be created
 *   PRINTIFY_TOKEN=… node scripts/printify-flannel.mjs --apply   # create or update the product
 */
import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { normaliseColour } from '../src/lib/printifyOrder.mjs';

const TOKEN = process.env.PRINTIFY_TOKEN;
const SHOP = process.env.PRINTIFY_SHOP_ID || '29228113';
const BLUEPRINT = 1369, PROVIDER = 61;
const TITLE = 'Far Fox — National Park Flannel';
const PRICE_CENTS = 8900;
const COLOURS = ['Charcoal Heather/ Black', 'Grey Heather/ Black', 'Red / Black'];
const DESIGNS = new URL('../public/shop/designs/flannel/', import.meta.url);
const SHOP_PHOTOS = new URL('../public/shop/', import.meta.url);
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// Where each print sits in its placeholder (x/y are the image centre as a fraction; scale 1 = placeholder width).
// The back area starts at the yoke seam: at full width the badge needs y >= 0.37 or its top is cut off.
const PLACEMENTS = [
  { position: 'back', file: 'flannel-back.png', x: 0.5, y: 0.375, scale: 1 },
  { position: 'left_pocket', file: 'flannel-pocket.png', x: 0.5, y: 0.6, scale: 0.78 },
  { position: 'neck', file: 'flannel-neck.png', x: 0.5, y: 0.5, scale: 1 },
];

if (!TOKEN) { console.error('Set PRINTIFY_TOKEN.'); process.exit(1); }
const apply = process.argv.includes('--apply');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function pfy(path, init = {}, attempt = 0) {
  const r = await fetch(`https://api.printify.com/v1${path}`, { ...init, headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json', 'User-Agent': 'farfox-landing' } });
  if (r.status === 429 && attempt < 6) { await sleep(10000); return pfy(path, init, attempt + 1); }
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Printify ${init.method || 'GET'} ${path} -> ${r.status} ${JSON.stringify(body).slice(0, 400)}`);
  return body;
}

const inColours = (await pfy(`/catalog/blueprints/${BLUEPRINT}/print_providers/${PROVIDER}/variants.json?show-out-of-stock=0`)).variants
  .filter((v) => COLOURS.includes(v.options.color));
// Only sizes made in every colour: the shop offers one size list for all colours.
const sizesEverywhere = [...new Set(inColours.map((v) => v.options.size))].filter((size) => COLOURS.every((c) => inColours.some((v) => v.options.color === c && v.options.size === size)));
const variants = inColours.filter((v) => sizesEverywhere.includes(v.options.size));
console.log(`${TITLE}: ${variants.length} variants (${COLOURS.join(', ')}) at $${PRICE_CENTS / 100}`);
if (!apply) { console.log('Dry run only. Re-run with --apply.'); process.exit(0); }

const uploads = {};
for (const p of PLACEMENTS) {
  const contents = (await readFile(new URL(p.file, DESIGNS))).toString('base64');
  uploads[p.file] = (await pfy('/uploads/images.json', { method: 'POST', body: JSON.stringify({ file_name: p.file, contents }) })).id;
}
const existing = (await pfy(`/shops/${SHOP}/products.json?limit=50`)).data.find((p) => p.title === TITLE);
// An update must list every variant the product holds, so ours are enabled and the rest stay off.
const ours = new Set(variants.map((v) => v.id));
const allIds = existing ? existing.variants.map((v) => v.id) : [...ours];
const body = {
  title: TITLE,
  description: 'A real brushed flannel with a Far Fox National Park patch on the back, a Foxy patch on the pocket and our label in the collar.',
  blueprint_id: BLUEPRINT, print_provider_id: PROVIDER,
  variants: allIds.map((id) => ({ id, price: PRICE_CENTS, is_enabled: ours.has(id) })),
  print_areas: [{ variant_ids: allIds, placeholders: PLACEMENTS.map((p) => ({ position: p.position, images: [{ id: uploads[p.file], x: p.x, y: p.y, scale: p.scale, angle: 0 }] })) }],
};
const product = existing
  ? await pfy(`/shops/${SHOP}/products/${existing.id}.json`, { method: 'PUT', body: JSON.stringify(body) })
  : await pfy(`/shops/${SHOP}/products.json`, { method: 'POST', body: JSON.stringify(body) });
console.log(`${existing ? 'updated' : 'created'} ${product.id}`);

const costs = {};
for (const v of product.variants.filter((x) => x.is_enabled)) costs[v.title] = v.cost;
console.log('cost per variant (cents):', JSON.stringify(costs));

// Shop photos: the front (pocket) and back mockup of each colour, plus the first colour as the product default.
const fresh = await pfy(`/shops/${SHOP}/products/${product.id}.json`);
const colourOf = new Map(variants.map((v) => [v.id, normaliseColour(v.options.color)]));
const saved = new Set();
for (const img of fresh.images) {
  const colour = colourOf.get(img.variant_ids.find((id) => colourOf.has(id)));
  const dir = img.position === 'back' ? 'backs' : img.position === 'left_pocket' ? 'colors' : null;
  if (!colour || !dir || saved.has(`${dir}/${colour}`)) continue;
  const png = await sharp(Buffer.from(await (await fetch(img.src)).arrayBuffer())).resize(1000).png().toBuffer();
  await writeFile(new URL(`${dir}/${product.id}-${slug(colour)}.png`, SHOP_PHOTOS), png);
  if (colour === normaliseColour(COLOURS[0])) await writeFile(new URL(dir === 'backs' ? `backs/${product.id}.png` : `mockups/${product.id}.png`, SHOP_PHOTOS), png);
  saved.add(`${dir}/${colour}`);
}
console.log(`saved ${saved.size} shop photos (${[...saved].join(', ')})`);
