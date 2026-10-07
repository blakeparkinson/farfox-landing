/**
 * The October 2026 goods redo in Printful: points the existing mugs, prints and stickers at the files from
 * make-goods-2026-10.mjs, creates the Miss You / Miss You Too mugs, and saves shop photos (the main view to
 * public/shop/mockups/<id>.png; for mugs the other face to public/shop/backs/<id>.png).
 *
 *   PRINTFUL_TOKEN=… node scripts/printful-goods-2026-10.mjs            # dry run
 *   PRINTFUL_TOKEN=… node scripts/printful-goods-2026-10.mjs --apply    # update, create, then photos
 *   PRINTFUL_TOKEN=… node scripts/printful-goods-2026-10.mjs --mockups  # photos only
 *
 * The files must already be live on lovefarfox.com.
 */
import { writeFile } from 'node:fs/promises';

const TOKEN = process.env.PRINTFUL_TOKEN;
const STORE = process.env.PRINTFUL_STORE_ID || '18292625';
const BASE = 'https://lovefarfox.com/shop/designs/goods-2026-10';
// Printful keeps the copy it first downloaded from a URL; bump this when the files are rebuilt in place.
const FILE_REVISION = 1;
const MUG = { catalog: 19, size: [2700, 1050], variants: { '11 oz': 1320, '15 oz': 4830, '20 oz': 16586 }, price: '18.00' };
const KIND = {
  mug: { catalog: 19, placement: 'default', size: MUG.size },
  print: { catalog: 1, placement: 'default', size: [3507, 4962], orientation: 'vertical' },
  sheet: { catalog: 505, placement: 'default', size: [1750, 2482] },
  diecut: { catalog: 957, placement: 'front', size: [600, 600] },
};
// Existing products and their new file; `price` changes the retail price of every variant.
const EXISTING = [
  { id: 436908860, kind: 'mug', file: 'mug-airways' },
  { id: 436891457, kind: 'mug', file: 'mug-pride' },
  { id: 436888902, kind: 'mug', file: 'mug-hearteyes' },
  { id: 436888901, kind: 'mug', file: 'mug-samemoon' },
  { id: 436908856, kind: 'print', file: 'print-samesky' },
  { id: 436908844, kind: 'print', file: 'print-paravion' },
  { id: 436883196, kind: 'print', file: 'print-samemoon', price: '24.00' },
  { id: 436891456, kind: 'sheet', file: 'sheet-pride' },
  { id: 436888903, kind: 'sheet', file: 'sheet-foxy' },
  { id: 436883191, kind: 'diecut', file: 'diecut-foxy' },
  { id: 436883186, kind: 'diecut', file: 'diecut-missyoutoo' },
  { id: 436883173, kind: 'diecut', file: 'diecut-missyou' },
];
const NEW_MUGS = [
  { name: 'Far Fox — "Miss You" Mug', file: 'mug-missyou' },
  { name: 'Far Fox — "Miss You Too" Mug', file: 'mug-missyoutoo' },
];

if (!TOKEN) { console.error('Set PRINTFUL_TOKEN.'); process.exit(1); }
const args = process.argv.slice(2), apply = args.includes('--apply');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function pf(path, init = {}, attempt = 0) {
  const r = await fetch(`https://api.printful.com${path}`, { ...init, headers: { Authorization: `Bearer ${TOKEN}`, 'X-PF-Store-Id': STORE, 'Content-Type': 'application/json' } });
  const body = await r.json().catch(() => ({}));
  if (r.status === 429 && attempt < 8) {
    await sleep((Number(String(body.error?.message || body.result || '').match(/after (\d+)/)?.[1] || 30) + 3) * 1000);
    return pf(path, init, attempt + 1);
  }
  if (!r.ok) throw new Error(`PF ${init.method || 'GET'} ${path} -> ${r.status} ${JSON.stringify(body.error || body.result || '')}`);
  return body.result;
}
const fileUrl = (file) => `${BASE}/${file}.png?v=${FILE_REVISION}`;

async function assertLive() {
  for (const { file } of [...EXISTING, ...NEW_MUGS]) {
    const r = await fetch(fileUrl(file), { method: 'HEAD' });
    if (!r.ok) throw new Error(`${file} is not live (${r.status}); deploy the files first`);
  }
}

async function updateExisting() {
  for (const p of EXISTING) {
    const detail = await pf(`/store/products/${p.id}`);
    for (const v of detail.sync_variants) {
      const files = [{ type: 'default', url: fileUrl(p.file) }];
      const done = (v.files || []).some((f) => f.type === 'default' && f.url === files[0].url) && (!p.price || v.retail_price === p.price);
      if (done) continue;
      console.log(`  ${detail.sync_product.name} ${v.size || ''}: ${p.file}${p.price && v.retail_price !== p.price ? `, $${v.retail_price} → $${p.price}` : ''}`);
      if (!apply) continue;
      await pf(`/store/variants/${v.id}`, { method: 'PUT', body: JSON.stringify({ files, options: v.options || [], ...(p.price ? { retail_price: p.price } : {}) }) });
      await sleep(600);
    }
  }
}

/** Creates the new mugs; returns { file → product id } for every new mug that exists afterwards. */
async function createMugs() {
  const list = await pf('/store/products?limit=100');
  const ids = {};
  for (const m of NEW_MUGS) {
    const existing = list.find((p) => p.name === m.name);
    if (existing) { ids[m.file] = existing.id; continue; }
    console.log(`  create ${m.name} (${Object.keys(MUG.variants).join(', ')}) at $${MUG.price}`);
    if (!apply) continue;
    const sync_variants = Object.values(MUG.variants).map((variant_id) => ({ variant_id, retail_price: MUG.price, files: [{ type: 'default', url: fileUrl(m.file) }] }));
    ids[m.file] = (await pf('/store/products', { method: 'POST', body: JSON.stringify({ sync_product: { name: m.name }, sync_variants }) })).id;
    console.log(`    created ${ids[m.file]}`);
  }
  return ids;
}

/** Main shop photo per product; for mugs also the handle-on-left view as the "back". */
async function mockups(products) {
  for (const { id, kind, file } of products) {
    const k = KIND[kind];
    const variant = (await pf(`/store/products/${id}`)).sync_variants[0].variant_id;
    const [w, h] = k.size;
    const body = { variant_ids: [variant], format: 'png', files: [{ placement: k.placement, image_url: fileUrl(file), position: { area_width: w, area_height: h, width: w, height: h, top: 0, left: 0 } }], ...(k.orientation ? { orientation: k.orientation } : {}) };
    const task = await pf(`/mockup-generator/create-task/${k.catalog}`, { method: 'POST', body: JSON.stringify(body) });
    let res;
    for (let i = 0; i < 60; i++) { await sleep(5000); res = await pf(`/mockup-generator/task?task_key=${task.task_key}`); if (res.status !== 'pending') break; }
    if (res.status !== 'completed') throw new Error(`${file}: mockups ${res.status}`);
    const m = res.mockups[0];
    const save = async (url, path) => writeFile(new URL(`../public/shop/${path}`, import.meta.url), Buffer.from(await (await fetch(url)).arrayBuffer()));
    await save(m.mockup_url, `mockups/${id}.png`);
    const other = kind === 'mug' && (m.extra || []).find((e) => /handle on left/i.test(e.option || e.title || ''));
    if (other) await save(other.url, `backs/${id}.png`);
    console.log(`  ${file}: photo${other ? ' + other side' : ''}`);
  }
}

if (args.includes('--mockups')) {
  const ids = await createMugs();
  await mockups([...EXISTING, ...NEW_MUGS.filter((m) => ids[m.file]).map((m) => ({ id: ids[m.file], kind: 'mug', file: m.file }))]);
} else {
  if (apply) await assertLive();
  await updateExisting();
  const ids = await createMugs();
  if (apply) await mockups([...EXISTING, ...NEW_MUGS.map((m) => ({ id: ids[m.file], kind: 'mug', file: m.file }))]);
  else console.log('\nDry run only. Re-run with --apply.');
}
