/** Publishes only the approved Butter Prime Menagerie Pocket Tee. Never places an order.
 * PRINTFUL_TOKEN=... node scripts/printful-prime-menagerie-2026-11.mjs --files-base=<immutable public URL> --mockups|--poll|--create|--verify
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
const NAME = 'Prime Menagerie Pocket Tee';
const SIZES = ['S', 'M', 'L', 'XL', '2XL'];
const PRICE = '34.00';
const root = new URL('../', import.meta.url);
const stateFile = new URL('design/prime-menagerie-pocket-tee/release-state.json', root);
const args = process.argv.slice(2);
let state = JSON.parse(await readFile(stateFile, 'utf8').catch(() => '{}'));
const base = args.find(a => a.startsWith('--files-base='))?.slice(13) || state.filesBase;
if (!process.env.PRINTFUL_TOKEN) throw new Error('PRINTFUL_TOKEN is required.');
if (!base) throw new Error('Pass --files-base with the published print files URL.');
const headers = { Authorization: `Bearer ${process.env.PRINTFUL_TOKEN}`, 'X-PF-Store-Id': process.env.PRINTFUL_STORE_ID || '18292625', 'Content-Type': 'application/json' };
async function pf(path, body) {
  const r = await fetch(`https://api.printful.com${path}`, { method: body ? 'POST' : 'GET', headers, ...(body ? { body: JSON.stringify(body) } : {}) });
  const j = await r.json();
  if (!r.ok) throw new Error(`Printful ${r.status}: ${j.error?.message || j.result}`);
  return j.result;
}
const persist = async () => { state.filesBase = base; await writeFile(stateFile, JSON.stringify(state, null, 2) + '\n'); };
const files = [{ type: 'pocket', url: `${base}/pocket-light.png` }, { type: 'back', url: `${base}/back-light.png` }];
async function catalog() {
  const all = (await pf('/products/593')).variants;
  return SIZES.map(size => {
    const v = all.find(v => v.color === 'Butter' && v.size === size);
    if (!v?.in_stock) throw new Error(`Butter ${size} is unavailable.`);
    return v;
  });
}
if (args.includes('--mockups')) {
  if (state.taskKey) { console.log('Mockup task already started; use --poll.'); process.exit(0); }
  for (const f of files) { const r = await fetch(f.url); if (!r.ok) throw new Error(`Print file is not accessible: ${r.status}`); }
  const variants = await catalog();
  const specs = await pf('/mockup-generator/printfiles/593');
  const medium = variants.find(v => v.size === 'M');
  const placements = specs.variant_printfiles.find(v => v.variant_id === medium.id).placements;
  const mockFiles = files.map(f => {
    const spec = specs.printfiles.find(p => p.printfile_id === placements[f.type]);
    return { placement: f.type, image_url: f.url, position: { area_width: spec.width, area_height: spec.height, width: spec.width, height: spec.height, top: 0, left: 0 } };
  });
  const task = await pf('/mockup-generator/create-task/593', { variant_ids: [medium.id], format: 'png', files: mockFiles, option_groups: ['Flat'], options: ['Front', 'Back'] });
  state.taskKey = task.task_key; await persist(); console.log({ mockupStatus: task.status });
} else if (args.includes('--poll')) {
  if (!state.taskKey) throw new Error('Start the mockup task first.');
  const task = await pf(`/mockup-generator/task?task_key=${encodeURIComponent(state.taskKey)}`);
  console.log({ mockupStatus: task.status });
  if (task.status === 'completed') {
    state.mockups = task.mockups;
    await persist();
    console.log(task.mockups.map(m => ({ placement: m.placement, variants: m.variant_ids, url: m.mockup_url })));
  } else if (task.status !== 'pending') throw new Error(`Mockup task failed: ${JSON.stringify(task)}`);
} else if (args.includes('--create')) {
  const existing = (await pf('/store/products?limit=100')).find(p => p.name === NAME);
  if (existing) { state.productId = existing.id; await persist(); console.log({ existingProduct: existing.id }); process.exit(0); }
  const variants = await catalog();
  const front = state.mockups?.find(m => m.placement === 'front' || m.placement === 'pocket');
  if (!front) throw new Error('Generate the provider mockups before creating the product.');
  const created = await pf('/store/products', { sync_product: { name: NAME, thumbnail: front.mockup_url }, sync_variants: variants.map(v => ({ variant_id: v.id, retail_price: PRICE, files })) });
  state.productId = created.id; await persist(); console.log({ productId: created.id, name: NAME, color: 'Butter', sizes: SIZES, price: PRICE });
} else if (args.includes('--verify')) {
  if (!state.productId) throw new Error('Create the product first.');
  const detail = await pf(`/store/products/${state.productId}`);
  if (detail.sync_variants.length !== SIZES.length) throw new Error('Unexpected variant count.');
  for (const size of SIZES) {
    const v = detail.sync_variants.find(v => v.size === size && v.color === 'Butter');
    if (!v || Number(v.retail_price) !== Number(PRICE)) throw new Error(`Variant or price mismatch for ${size}`);
    for (const f of files) {
      const actual = v.files.find(a => a.type === f.type);
      if (actual?.url !== f.url || actual.status !== 'ok') throw new Error(`${size} ${f.type} is not ready (${actual?.status})`);
    }
  }
  for (const m of state.mockups || []) {
    const back = m.placement === 'back';
    const dir = new URL(`public/shop/${back ? 'backs' : 'colors'}/`, root);
    await mkdir(dir, { recursive: true });
    const r = await fetch(m.mockup_url); if (!r.ok) throw new Error('Mockup download failed.');
    const bytes = Buffer.from(await r.arrayBuffer());
    await writeFile(new URL(`${state.productId}-butter.png`, dir), bytes);
    if (back) await writeFile(new URL(`${state.productId}.png`, dir), bytes);
  }
  console.log({ verified: NAME, variants: detail.sync_variants.length, productId: state.productId });
} else console.log('Choose --mockups, --poll, --create or --verify.');
