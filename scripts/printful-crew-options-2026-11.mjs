/** Adds approved crew options. Idempotent, preserves old variant IDs, never places orders.
 * Run with --prepare, --mockups, --poll, --preview, --publish-adults, --publish-kids or --verify.
 * Livingston's Mint-and-moose scene was approved by the user; youth products remain on hold.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const dir = new URL('design/crew-options-2026-11/', root);
await mkdir(dir, { recursive: true });
const stateFile = new URL('release.json', dir);
const state = JSON.parse(await readFile(stateFile, 'utf8').catch(() => '{"products":{}}'));
const args = process.argv.slice(2);
if (args.includes('--publish-kids')) throw Error('Kids sizes are on hold at the user’s request. Do not publish.');
const only = args.find(arg => arg.startsWith('--only='))?.slice(7);
const selected = () => Object.values(state.products).filter(p => !p.kids && (!only || String(p.parentId) === only));
const extra = ['Blue Jean', 'Crimson', 'Orchid', 'Seafoam', 'Grey'];
const kidsColors = ['Navy', 'Black', 'Dark Heather', 'Maroon', 'Red', 'Royal', 'Sport Grey', 'White'];
const light = new Set(['Butter', 'Orchid', 'Seafoam', 'Grey', 'Sport Grey', 'White']);
const adultSizes = ['S', 'M', 'L', 'XL', '2XL', '3XL'];
const kidsSizes = ['XS', 'S', 'M', 'L', 'XL'];
const parents = [490151911, 490239643, 490719865, 490719872];
const slug = value => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const save = () => writeFile(stateFile, JSON.stringify(state, null, 2) + '\n');
const headers = { Authorization: `Bearer ${process.env.PRINTFUL_TOKEN}`, 'X-PF-Store-Id': '18292625', 'Content-Type': 'application/json' };
if (!process.env.PRINTFUL_TOKEN) throw Error('Printful access required');
async function pf(path, body, method = body ? 'POST' : 'GET') {
  const response = await fetch(`https://api.printful.com${path}`, { method, headers, ...(body ? { body: JSON.stringify(body) } : {}) });
  const data = await response.json();
  if (!response.ok) throw Error(`Printful ${response.status}: ${data.error?.message || data.result}`);
  return data.result;
}
function files(p, color) {
  const source = p.art[light.has(color) ? 'forest' : 'cream'];
  return source.map((f, i) => ({ type: p.kids ? (i ? 'back' : 'default') : f.type, url: f.url }));
}
function photo(p, color, side) {
  const medium = p.variants.find(v => v.color === color && v.size === 'M');
  const task = p.tasks[light.has(color) ? 'forest' : 'cream'];
  for (const mock of task?.mockups ?? []) {
    if (!mock.variant_ids.includes(medium.id)) continue;
    const extra = mock.extra?.find(e => e.option?.toLowerCase() === side && e.option_group === 'Flat');
    if (extra) return extra.url;
    if (mock.mockup_url.includes(`-${side}-`)) return mock.mockup_url;
  }
  throw Error(`Missing ${p.name} ${color} ${side} mockup`);
}
if (args.includes('--prepare-livingston') || args.includes('--prepare-skowhegan')) {
  const city = args.includes('--prepare-skowhegan') ? 'skowhegan' : 'livingston';
  const cityName = city === 'skowhegan' ? 'Skowhegan, Maine' : 'Livingston, Montana';
  const base = args.find(arg => arg.startsWith('--files-base='))?.slice(13);
  if (!base?.startsWith('https://raw.githubusercontent.com/blakeparkinson/farfox-landing/')) throw Error('Use a committed immutable artwork URL');
  const p = state.products[`${city}-adult`] ??= { tasks: {}, before: null };
  if (p.filesBase && p.filesBase !== base) throw Error('Do not replace the approved artwork URLs');
  const source = await pf('/store/products/490719865');
  p.filesBase = base;
  p.parentId = city;
  p.kids = false;
  p.catalog = 839;
  p.name = `Prime Menagerie Pickleball Club Crewneck — ${cityName}`;
  p.price = '59.00';
  p.colors = ['Blue Spruce', 'Pepper', 'True Navy', 'Butter', ...extra];
  p.art = Object.fromEntries([['cream', 'Blue Spruce'], ['forest', 'Butter']].map(([tone, color]) => {
    const front = source.sync_variants.find(v => v.color === color && v.size === 'M').files.find(f => f.type === 'front_dtf');
    if (front?.status !== 'ok') throw Error('Chest artwork not ready');
    return [tone, [{ type: front.type, url: front.url, width: front.width, height: front.height }, { type: 'back_large_dtf', url: `${base}/back-${tone}.png`, width: 2250, height: 2700 }]];
  }));
  const catalog = await pf('/products/839');
  p.variants = p.colors.flatMap(color => adultSizes.map(size => catalog.variants.find(v => v.color === color && v.size === size)).filter(v => v?.in_stock));
  if (p.variants.length !== p.colors.length * adultSizes.length) throw Error('Recheck stock before offering all combinations');
  p.spec = await pf('/mockup-generator/printfiles/839?technique=DTFILM');
  await save();
  console.log('PREPARED', p.name, p.variants.length, 'variants');
} else if (args.includes('--prepare')) {
  const catalogs = {};
  for (const id of [839, 677]) catalogs[id] = await pf(`/products/${id}`);
  for (const id of parents) {
    const detail = await pf(`/store/products/${id}`);
    if (!/^Prime Menagerie (Bowling|Pickleball) Club Crewneck/.test(detail.sync_product.name)) throw Error('Unexpected parent product');
    const art = {};
    for (const [tone, color] of [['cream', 'Blue Spruce'], ['forest', 'Butter']]) {
      const source = detail.sync_variants.find(v => v.color === color && v.size === 'M');
      art[tone] = ['front_dtf', 'back_large_dtf'].map(type => {
        const f = source.files.find(f => f.type === type);
        if (!f || f.status !== 'ok') throw Error('Approved artwork is not ready');
        return { type, url: f.url, width: f.width, height: f.height };
      });
    }
    for (const kids of [false, true]) {
      const key = `${id}-${kids ? 'kids' : 'adult'}`;
      const p = state.products[key] ??= { tasks: {}, before: kids ? null : detail };
      p.parentId = id;
      p.kids = kids;
      p.catalog = kids ? 677 : 839;
      p.name = detail.sync_product.name.replace('Crewneck', kids ? 'Kids Crewneck' : 'Crewneck');
      p.price = kids ? '39.00' : '59.00';
      if (!kids) p.productId = id;
      p.art = art;
      p.colors = kids ? kidsColors : extra;
      p.variants = p.colors.flatMap(color => (kids ? kidsSizes : adultSizes).map(size => catalogs[p.catalog].variants.find(v => v.color === color && v.size === size)).filter(v => v?.in_stock));
      if (p.colors.some(color => !p.variants.some(v => v.color === color && v.size === 'M'))) throw Error('A color lacks a representative available size');
      p.spec = await pf(`/mockup-generator/printfiles/${p.catalog}${kids ? '' : '?technique=DTFILM'}`);
      console.log(p.name, p.variants.length, 'new variants', p.price);
      await save();
    }
  }
} else if (args.includes('--mockups')) {
  for (const p of selected()) for (const tone of ['cream', 'forest']) {
    if (p.tasks[tone]) continue;
    const variants = p.variants.filter(v => v.size === 'M' && light.has(v.color) === (tone === 'forest'));
    const placements = p.spec.variant_printfiles.find(v => v.variant_id === variants[0].id).placements;
    const mockFiles = files(p, variants[0].color).map((f, i) => {
      const placement = f.type === 'default' ? 'front' : f.type;
      const area = p.spec.printfiles.find(a => a.printfile_id === placements[placement]);
      if (!area) throw Error('Missing print area');
      const source = p.art[tone][i];
      const scale = Math.min(area.width / source.width, area.height / source.height);
      const width = Math.round(source.width * scale), height = Math.round(source.height * scale);
      return { placement, image_url: f.url, position: { area_width: area.width, area_height: area.height, width, height, left: Math.round((area.width - width) / 2), top: 0 } };
    });
    p.tasks[tone] = await pf(`/mockup-generator/create-task/${p.catalog}`, { variant_ids: variants.map(v => v.id), format: 'png', files: mockFiles, option_groups: ['Flat'], options: ['Front', 'Back'] });
    await save();
    console.log(p.name, tone, p.tasks[tone].status);
    await new Promise(resolve => setTimeout(resolve, 6500));
  }
} else if (args.includes('--poll')) {
  for (const p of selected()) for (const [tone, task] of Object.entries(p.tasks)) {
    if (task.status !== 'completed') p.tasks[tone] = await pf(`/mockup-generator/task?task_key=${encodeURIComponent(task.task_key)}`);
    console.log(p.name, tone, p.tasks[tone].status, p.tasks[tone].error || '');
    await save();
  }
} else if (args.includes('--preview')) {
  for (const p of selected()) {
    const key = `${p.parentId}-adult`;
    const out = new URL(`preview/${key}/`, dir);
    await mkdir(out, { recursive: true });
    for (const color of p.colors) for (const side of ['front', 'back']) {
      const r = await fetch(photo(p, color, side));
      if (!r.ok) throw Error('Mockup download failed');
      await writeFile(new URL(`${slug(color)}-${side}.png`, out), Buffer.from(await r.arrayBuffer()));
    }
    console.log('PREVIEW', p.name, p.colors.length, 'colors');
  }
} else if (args.includes('--publish-adults') || args.includes('--publish-kids')) {
  const kids = args.includes('--publish-kids');
  const existing = await pf('/store/products?limit=100');
  for (const p of selected().filter(p => p.kids === kids)) {
    if (Object.keys(p.tasks).length !== 2 || Object.values(p.tasks).some(t => t.status !== 'completed')) throw Error('Finish and inspect provider previews first');
    const available = (await pf(`/products/${p.catalog}`)).variants;
    if (p.variants.some(v => !available.find(a => a.id === v.id)?.in_stock)) throw Error('Stock changed; refresh the plan');
    const variants = p.variants.map(v => ({ variant_id: v.id, external_id: `pm-crew-${p.parentId}-${kids ? 'youth' : 'adult'}-${slug(v.color)}-${v.size.toLowerCase()}`, retail_price: p.price, files: files(p, v.color) }));
    if (!p.productId) p.productId = existing.find(x => x.name === p.name)?.id;
    if (!p.productId) {
      const created = await pf('/store/products', { sync_product: { name: p.name, thumbnail: photo(p, p.colors[0], 'front') }, sync_variants: variants });
      p.productId = created.id;
      await save();
      console.log('CREATED', p.name, p.productId, variants.length);
    } else {
      const detail = await pf(`/store/products/${p.productId}`);
      if (detail.sync_product.name !== p.name) throw Error('Product identity changed');
      const additions = [];
      for (const v of variants) {
        const prior = detail.sync_variants.find(a => a.variant_id === v.variant_id);
        if (prior) {
          if (prior.retail_price !== v.retail_price || !v.files.every(f => prior.files.some(a => a.type === f.type && a.url === f.url))) throw Error('An existing option differs; never replace it silently');
        } else additions.push(v);
      }
      // Printful's product update replaces the variant list: include EVERY existing ID,
      // with no changed fields, then append only new options. Never omit an old variant.
      if (additions.length) {
        const kept = detail.sync_variants.map(v => ({ id: v.id }));
        if (kept.length + additions.length > 100) throw Error('Product exceeds Printful variant limit');
        await pf(`/store/products/${p.productId}`, { sync_variants: [...kept, ...additions] }, 'PUT');
      }
      console.log('ADDED', p.name, p.productId, variants.length, 'planned options');
    }
    p.publishedAt = new Date().toISOString();
    await save();
  }
} else if (args.includes('--verify')) {
  for (const p of selected().filter(p => p.publishedAt)) {
    const detail = await pf(`/store/products/${p.productId}`);
    for (const v of p.variants) {
      const actual = detail.sync_variants.find(a => a.variant_id === v.id);
      if (!actual || actual.retail_price !== p.price) throw Error('Missing or mispriced option');
      for (const f of files(p, v.color)) if (!actual.files.some(a => a.type === f.type && a.url === f.url && a.status === 'ok')) throw Error('Artwork is not ready');
    }
    for (const old of p.before?.sync_variants ?? []) {
      const kept = detail.sync_variants.find(a => a.id === old.id);
      if (!kept || kept.variant_id !== old.variant_id || kept.retail_price !== old.retail_price || old.files.filter(f => f.type !== 'preview').some(f => !kept.files.some(k => k.type === f.type && k.url === f.url))) throw Error('An existing option changed');
    }
    for (const color of p.colors) for (const side of ['front', 'back']) {
      const target = new URL(`public/shop/${side === 'front' ? 'colors' : 'backs'}/`, root);
      await mkdir(target, { recursive: true });
      const data = await readFile(new URL(`preview/${p.parentId}-${p.kids ? 'kids' : 'adult'}/${slug(color)}-${side}.png`, dir));
      await writeFile(new URL(`${p.productId}-${slug(color)}.png`, target), data);
      if (!p.before && color === p.colors[0]) {
        const base = new URL(`public/shop/${side === 'front' ? 'mockups' : 'backs'}/`, root);
        await mkdir(base, { recursive: true });
        await writeFile(new URL(`${p.productId}.png`, base), data);
      }
    }
    p.verifiedAt = new Date().toISOString();
    await save();
    console.log('VERIFIED', p.name, detail.sync_variants.length, 'variants');
  }
} else throw Error('Choose a release phase');
