/** Publish only the Bubble Trouble pocket tee. Never places an order.
 * --files-base=<immutable URL> --mockups|--poll|--create|--verify
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const stateFile = new URL('design/bubble-trouble-pocket-tee/release-state.json', root);
const state = JSON.parse(await readFile(stateFile, 'utf8').catch(() => '{}'));
const args = process.argv.slice(2);
const base = args.find(a => a.startsWith('--files-base='))?.slice(13) || state.filesBase;
if (!base || !process.env.PRINTFUL_TOKEN) throw new Error('Artwork URL and PRINTFUL_TOKEN are required.');
if (state.filesBase && state.filesBase !== base) throw new Error('Use a new release state for different artwork.');
const NAME = 'Prime Menagerie Bubble Trouble Pocket Tee';
const COLORS = ['White', 'Butter', 'Violet', 'True Navy'];
const SIZES = ['S', 'M', 'L', 'XL', '2XL'];
const PRICE = '34.00';
const tone = color => color === 'True Navy' ? 'dark' : 'light';
const slug = s => s.toLowerCase().replace(/ /g, '-');
const files = color => [{ type: 'pocket', url: `${base}/pocket-${tone(color)}.png` }, { type: 'back', url: `${base}/back.png` }];
const headers = { Authorization: `Bearer ${process.env.PRINTFUL_TOKEN}`, 'X-PF-Store-Id': process.env.PRINTFUL_STORE_ID || '18292625', 'Content-Type': 'application/json' };
async function pf(path, body) {
  const r = await fetch(`https://api.printful.com${path}`, { method: body ? 'POST' : 'GET', headers, ...(body ? { body: JSON.stringify(body) } : {}) });
  const j = await r.json();
  if (!r.ok) throw new Error(`Printful ${r.status}: ${j.error?.message || j.result}`);
  return j.result;
}
async function catalog() {
  const all = (await pf('/products/593')).variants;
  return COLORS.flatMap(color => SIZES.map(size => {
    const v = all.find(v => v.color === color && v.size === size);
    if (!v?.in_stock) throw new Error(`${color} ${size} is unavailable.`);
    return v;
  }));
}
const persist = async () => { state.filesBase = base; await writeFile(stateFile, JSON.stringify(state, null, 2) + '\n'); };
if (args.includes('--mockups')) {
  state.variants = await catalog();
  const spec = await pf('/mockup-generator/printfiles/593');
  state.tasks ||= {};
  for (const t of ['light', 'dark']) {
    if (state.tasks[t]) continue;
    const vs = state.variants.filter(v => tone(v.color) === t && v.size === 'M');
    const placement = spec.variant_printfiles.find(v => v.variant_id === vs[0].id).placements;
    const mockFiles = files(vs[0].color).map(f => {
      const area = spec.printfiles.find(p => p.printfile_id === placement[f.type]);
      if (!area) throw new Error(`Missing ${f.type} print area.`);
      return { placement: f.type, image_url: f.url, position: { area_width: area.width, area_height: area.height, width: area.width, height: area.height, top: 0, left: 0 } };
    });
    for (const f of mockFiles) { const r = await fetch(f.image_url, { method: 'HEAD' }); if (!r.ok) throw new Error(`Artwork inaccessible: ${r.status}`); }
    const task = await pf('/mockup-generator/create-task/593', { variant_ids: vs.map(v => v.id), format: 'png', files: mockFiles, option_groups: ['Flat'], options: ['Front', 'Back'] });
    state.tasks[t] = { key: task.task_key, status: task.status }; await persist(); console.log({ tone: t, status: task.status });
  }
} else if (args.includes('--poll')) {
  for (const [t, task] of Object.entries(state.tasks || {})) {
    if (task.status !== 'completed') {
      const result = await pf(`/mockup-generator/task?task_key=${encodeURIComponent(task.key)}`);
      task.status = result.status;
      if (result.status === 'completed') task.mockups = result.mockups;
      else if (result.status !== 'pending') throw new Error(`Mockup failed: ${JSON.stringify(result.error || result.status)}`);
      await persist();
    }
    console.log({ tone: t, status: task.status });
  }
} else if (args.includes('--create')) {
  const existing = (await pf('/store/products?limit=100')).find(p => p.name === NAME);
  if (existing) { state.productId = existing.id; await persist(); console.log({ existing: existing.id }); process.exit(0); }
  if (!['light', 'dark'].every(t => state.tasks?.[t]?.status === 'completed')) throw new Error('Complete both mockup tasks first.');
  state.variants = await catalog();
  const white = state.variants.find(v => v.color === 'White' && v.size === 'M');
  const front = state.tasks.light.mockups.find(m => m.placement === 'pocket' && m.variant_ids.includes(white.id));
  if (!front) throw new Error('White front mockup missing.');
  const created = await pf('/store/products', { sync_product: { name: NAME, thumbnail: front.mockup_url }, sync_variants: state.variants.map(v => ({ variant_id: v.id, external_id: `pm-bubble-${slug(v.color)}-${v.size.toLowerCase()}`, retail_price: PRICE, files: files(v.color) })) });
  state.productId = created.id; await persist(); console.log({ productId: created.id, name: NAME, variants: state.variants.length, price: PRICE });
} else if (args.includes('--verify')) {
  if (!state.productId) throw new Error('Create the product first.');
  const detail = await pf(`/store/products/${state.productId}`);
  if (detail.sync_product.name !== NAME || detail.sync_variants.length !== COLORS.length * SIZES.length) throw new Error('Unexpected product or variant count.');
  for (const color of COLORS) for (const size of SIZES) {
    const v = detail.sync_variants.find(v => v.color === color && v.size === size);
    if (!v || Number(v.retail_price) !== 34) throw new Error(`Price or variant mismatch: ${color} ${size}`);
    for (const f of files(color)) {
      const actual = v.files.find(a => a.type === f.type);
      if (actual?.url !== f.url || actual.status !== 'ok') throw new Error(`Artwork not ready: ${color} ${size} ${f.type} (${actual?.status})`);
    }
  }
  for (const color of COLORS) {
    const medium = state.variants.find(v => v.color === color && v.size === 'M');
    const mockups = state.tasks[tone(color)].mockups;
    for (const placement of ['pocket', 'back']) {
      const m = mockups.find(m => m.placement === placement && m.variant_ids.includes(medium.id));
      if (!m) throw new Error(`Missing ${color} ${placement} photo.`);
      const r = await fetch(m.mockup_url); if (!r.ok) throw new Error(`Photo download ${r.status}`);
      const bytes = Buffer.from(await r.arrayBuffer());
      const dir = new URL(`public/shop/${placement === 'pocket' ? 'colors' : 'backs'}/`, root);
      await mkdir(dir, { recursive: true });
      await writeFile(new URL(`${state.productId}-${slug(color)}.png`, dir), bytes);
      if (color === COLORS[0] && placement === 'back') await writeFile(new URL(`${state.productId}.png`, dir), bytes);
      if (color === COLORS[0] && placement === 'pocket') {
        const override = new URL('public/shop/mockups/', root); await mkdir(override, { recursive: true });
        await writeFile(new URL(`${state.productId}.png`, override), bytes);
      }
    }
  }
  state.verifiedAt = new Date().toISOString(); await persist(); console.log({ verified: NAME, productId: state.productId, variants: detail.sync_variants.length, colors: COLORS });
} else throw new Error('Choose --mockups, --poll, --create or --verify.');
