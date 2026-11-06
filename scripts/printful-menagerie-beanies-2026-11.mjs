/** Publishes only the approved Antelope and chair-riding Yak beanies. Never places an order.
 * node --env-file=.env scripts/printful-menagerie-beanies-2026-11.mjs --files-base=<immutable URL> --mockups|--poll|--create|--verify
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const stateFile = new URL('design/menagerie-beanies-2026-11/release-state.json', root);
const args = process.argv.slice(2);
const state = JSON.parse(await readFile(stateFile, 'utf8').catch(() => '{}'));
const base = args.find(a => a.startsWith('--files-base='))?.slice(13) || state.filesBase;
if (!process.env.PRINTFUL_TOKEN || !base) throw new Error('PRINTFUL_TOKEN and --files-base are required.');
if (state.filesBase && state.filesBase !== base) throw new Error('Use a new release state for different artwork.');
const headers = { Authorization: `Bearer ${process.env.PRINTFUL_TOKEN}`, 'X-PF-Store-Id': process.env.PRINTFUL_STORE_ID || '18292625', 'Content-Type': 'application/json' };
const plans = [
  { key: 'antelope', name: 'Affirming Antelope Beanie', colors: { 'Heather Grey': 8937, Navy: 8940 } },
  { key: 'yak-chair', name: 'Scan Yak Beanie', colors: { Black: 8936, 'Baby Pink': 17494 } },
];
const price = '26.00';
const fullColor = [{ id: 'full_color', value: true }];
const files = p => [{ type: 'embroidery_front', url: `${base}/${p.key}.png`, options: fullColor }];
const slug = s => s.toLowerCase().replace(/ /g, '-');
async function pf(path, body) {
  const r = await fetch(`https://api.printful.com${path}`, { method: body ? 'POST' : 'GET', headers, ...(body ? { body: JSON.stringify(body) } : {}) });
  const j = await r.json();
  if (!r.ok) throw new Error(`Printful ${r.status}: ${j.error?.message || j.result}`);
  return path.startsWith('/v2/') ? j.data : j.result;
}
const persist = async () => { state.filesBase = base; await writeFile(stateFile, JSON.stringify(state, null, 2) + '\n'); };
async function variants(plan) {
  const catalog = (await pf('/products/266')).variants;
  return Object.entries(plan.colors).map(([color, id]) => {
    const v = catalog.find(v => v.id === id);
    if (!v?.in_stock || v.color !== color || v.size !== 'One size') throw new Error(`Unexpected or unavailable variant: ${color}`);
    return v;
  });
}
for (const p of plans) {
  const s = state[p.key] ||= {};
  if (args.includes('--mockups')) {
    if (s.v2TaskId) { console.log(`${p.name}: task already started; use --poll.`); continue; }
    const r = await fetch(files(p)[0].url, { method: 'HEAD' });
    if (!r.ok) throw new Error(`Artwork is not reachable: ${r.status}`);
    const vs = await variants(p);
    const styles = await pf('/v2/catalog-products/266/mockup-styles');
    const style = styles.find(v => v.placement === 'embroidery_front').mockup_styles.find(v => v.category_name === 'Flat' && v.view_name === 'Front');
    if (!style) throw new Error('No flat front mockup style.');
    // V1 mockups ignored full_color and quantized brown to red; V2 retains the approved palette.
    const [task] = await pf('/v2/mockup-tasks', { format: 'png', mockup_width_px: 1200, products: [{
      source: 'catalog', mockup_style_ids: [style.id], catalog_product_id: 266, catalog_variant_ids: vs.map(v => v.id),
      placements: [{ placement: 'embroidery_front', technique: 'embroidery', placement_options: [{ name: 'unlimited_color', value: true }],
        layers: [{ type: 'file', url: files(p)[0].url, position: { width: 5, height: 1.75, top: 0, left: 0 } }] }],
    }] });
    s.v2TaskId = task.id; await persist(); console.log({ name: p.name, status: task.status });
  } else if (args.includes('--poll')) {
    if (!s.v2TaskId) throw new Error('Generate mockups first.');
    const [task] = await pf(`/v2/mockup-tasks?id=${s.v2TaskId}`);
    console.log({ name: p.name, status: task.status });
    if (task.status === 'completed') { s.mockups = task.catalog_variant_mockups.flatMap(v => v.mockups.map(m => ({ ...m, variant_ids: [v.catalog_variant_id] }))); await persist(); }
    else if (task.status !== 'pending') throw new Error(`Mockup failed: ${JSON.stringify(task.failure_reasons || task.status)}`);
  } else if (args.includes('--create')) {
    const existing = (await pf('/store/products?limit=100')).find(v => v.name === p.name);
    if (existing) { s.productId = existing.id; await persist(); console.log({ name: p.name, existing: existing.id }); continue; }
    const vs = await variants(p);
    const front = s.mockups?.find(m => m.variant_ids.includes(vs[0].id));
    if (!front) throw new Error('Complete mockups first.');
    const created = await pf('/store/products', { sync_product: { name: p.name, thumbnail: front.mockup_url }, sync_variants: vs.map(v => ({
      variant_id: v.id, external_id: `menagerie-${p.key}-${slug(v.color)}-202611`, retail_price: price, files: files(p), options: [{ id: 'embroidery_type', value: 'flat' }],
    })) });
    s.productId = created.id; await persist(); console.log({ name: p.name, created: created.id });
  } else if (args.includes('--verify')) {
    if (!s.productId) throw new Error('Create products first.');
    const d = await pf(`/store/products/${s.productId}`);
    if (d.sync_product.name !== p.name || d.sync_variants.length !== 2) throw new Error('Unexpected product or count.');
    for (const [color, id] of Object.entries(p.colors)) {
      const v = d.sync_variants.find(v => v.variant_id === id);
      // Catalog 266 names its front file ID "default" in sync responses.
      const f = v?.files.find(f => f.type === 'default' || f.type === 'embroidery_front');
      if (!v || v.color !== color || v.size !== 'One size' || Number(v.retail_price) !== 26 || f?.url !== files(p)[0].url || f.status !== 'ok' || !f.options?.some(o => o.id === 'full_color' && o.value === true)) throw new Error(`Variant is not ready: ${color} (${f?.status}), full color: ${JSON.stringify(f?.options)}`);
      const mockup = s.mockups?.find(m => m.variant_ids.includes(id));
      if (!mockup) throw new Error(`Missing photo for ${color}`);
      const r = await fetch(mockup.mockup_url); if (!r.ok) throw new Error('Mockup download failed.');
      const bytes = Buffer.from(await r.arrayBuffer());
      await mkdir(new URL('public/shop/colors/', root), { recursive: true });
      await writeFile(new URL(`public/shop/colors/${s.productId}-${slug(color)}.png`, root), bytes);
      if (id === Object.values(p.colors)[0]) {
        await mkdir(new URL('public/shop/mockups/', root), { recursive: true });
        await writeFile(new URL(`public/shop/mockups/${s.productId}.png`, root), bytes);
      }
    }
    s.verifiedAt = new Date().toISOString(); await persist(); console.log({ name: p.name, verified: s.productId, variants: 2, price });
  } else throw new Error('Choose --mockups, --poll, --create or --verify.');
}
