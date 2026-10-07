/**
 * Point the rebuilt soccer kits' Printful sync products at the kits-2026-09
 * print files, then fetch fresh Printful mockups for the shop.
 *
 *   PRINTFUL_TOKEN=… node scripts/printful-update-kits.mjs            # dry run: show every planned change
 *   PRINTFUL_TOKEN=… node scripts/printful-update-kits.mjs --apply    # update all sync variants
 *   PRINTFUL_TOKEN=… node scripts/printful-update-kits.mjs --mockups  # write public/shop/{mockups,backs}/<id>.png
 *   --style Ghost picks a Printful mockup style (option group); --out <dir> writes
 *   <kit>-mockups.png / <kit>-backs.png there instead of public/shop.
 *   --kit flight,paradise limits a run to some kits; KITS_BASE=<url> (mockups only)
 *   renders from a preview deployment before the files are in production.
 *
 * Front, back and both sleeves are replaced; any other placement (collar,
 * label, …) is kept by file id. The stale "preview" file is dropped because
 * Printful regenerates it. The files must already be live on lovefarfox.com.
 */
import { writeFile } from 'node:fs/promises';

const TOKEN = process.env.PRINTFUL_TOKEN;
const STORE = process.env.PRINTFUL_STORE_ID || '18292625';
// KITS_BASE lets --mockups read files from a preview deployment before they ship.
const BASE = process.env.KITS_BASE || 'https://lovefarfox.com/shop/designs/kits-2026-09';
// Coordinates (chart) is retired, so it's no longer updated. Twilight joins
// with the October 2026 drop; its files live in kits-2026-10/.
const KITS = {
  dropzone: 443420345, dalmatian: 443578239, twilight: 443164966,
  flight: 443213452, paradise: 443540637,
  'bb-home': 436911930, 'bb-royal': 437021439, 'bb-red': 437052584,
  // New in the October 2026 drop (created 2026-09-28).
  otherhalfa: 475844794, otherhalfb: 475844798, morse: 475844805,
  'moose-blush': 475849115, // Moose Lodge, Blush only (created 2026-09-28)
  flyway: 443631285, // the former Mardi Gras product, redesigned 2026-09-28
  stars: 443266866, // Same Stars on the shared crest and back font (restyle-stars-kit.mjs)
};
// Baseball kits only get a new front; their backs and sleeves stay as they are.
const isBaseball = (kit) => kit.startsWith('bb-');
const replaceFor = (kit) => (isBaseball(kit) ? { default: 'front' } : REPLACE);
const OCTOBER = new Set(['dropzone', 'dalmatian', 'twilight', 'otherhalfa', 'otherhalfb', 'morse', 'moose-blush', 'flyway', 'stars']);
const folder = (kit) => (process.env.KITS_BASE || !OCTOBER.has(kit) ? BASE : BASE.replace('kits-2026-09', 'kits-2026-10'));
// Printful keeps the copy it first downloaded from a URL; bump a kit here when
// its files are edited in place so Printful fetches the new ones.
const FILE_REVISION = { paradise: 2, flyway: 3, dropzone: 2, 'moose-blush': 2 };
const revision = (kit) => (FILE_REVISION[kit] ? `?v=${FILE_REVISION[kit]}` : '');
const fileUrl = (kit, part) => `${folder(kit)}/${isBaseball(kit) ? 'rj' : 'sj'}-${kit}-${part}.png${revision(kit)}`;
// Printful names this product's front placement "default".
const REPLACE = { default: 'front', back: 'back', sleeve_left: 'sleeve', sleeve_right: 'sleeve' };

if (!TOKEN) {
  console.error('Set PRINTFUL_TOKEN (a private token with sync-product and mockup scopes).');
  process.exit(1);
}
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const mockups = args.includes('--mockups');
// Mockup style is a Printful option group, e.g. "Ghost", "Flat", "Women's", "Couple’s".
const style = args.includes('--style') ? args[args.indexOf('--style') + 1] : null;
const outDir = args.includes('--out') ? new URL(`file://${args[args.indexOf('--out') + 1].replace(/\/?$/, '/')}`) : null;
const only = args.includes('--kit') ? args[args.indexOf('--kit') + 1].split(',') : null;
if (apply && process.env.KITS_BASE) {
  console.error('Refusing --apply with KITS_BASE: Printful products must point at production URLs.');
  process.exit(1);
}

async function pf(path, init = {}, attempt = 0) {
  const r = await fetch(`https://api.printful.com${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${TOKEN}`, 'X-PF-Store-Id': STORE, 'Content-Type': 'application/json', ...init.headers },
  });
  const body = await r.json().catch(() => ({}));
  // Product edits have a tighter limit than reads; wait out the window Printful names.
  if (r.status === 429 && attempt < 6) {
    const wait = Number(String(body.error?.message || body.result || '').match(/after (\d+) seconds/)?.[1] || 60);
    console.log(`  rate limited, waiting ${wait + 2}s`);
    await sleep((wait + 2) * 1000);
    return pf(path, init, attempt + 1);
  }
  if (!r.ok) throw new Error(`PF ${init.method || 'GET'} ${path} -> ${r.status} ${JSON.stringify(body.error || body.result || '')}`);
  return body.result;
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function assertLive(kit) {
  for (const part of new Set(Object.values(replaceFor(kit)))) {
    const r = await fetch(fileUrl(kit, part), { method: 'HEAD' });
    if (!r.ok) throw new Error(`${kit} ${part} file is not live (${r.status}); deploy first`);
  }
}

function planFiles(kit, files) {
  const types = files.map((f) => f.type);
  const replace = replaceFor(kit);
  for (const t of Object.keys(replace)) if (!types.includes(t)) throw new Error(`${kit}: variant has no "${t}" file (has ${types.join(', ')})`);
  return files
    .filter((f) => f.type !== 'preview')
    .map((f) => (replace[f.type] ? { type: f.type, url: fileUrl(kit, replace[f.type]) } : { type: f.type, id: f.id }));
}

async function updateKit(kit, productId) {
  await assertLive(kit);
  const detail = await pf(`/store/products/${productId}`);
  const variants = detail.sync_variants.filter((v) => !v.is_ignored);
  console.log(`\n${detail.sync_product.name} (${productId}): ${variants.length} variants`);
  for (const v of variants) {
    const next = planFiles(kit, v.files || []);
    // Re-runs skip sizes that already point at the new files.
    const replace = replaceFor(kit);
    const done = (v.files || []).filter((f) => replace[f.type]).every((f) => f.url === fileUrl(kit, replace[f.type]));
    if (done) { console.log(`  ${v.size || v.name}: already updated`); continue; }
    console.log(`  ${v.size || v.name}: ${next.map((f) => (f.url ? `${f.type}→new` : `${f.type} kept`)).join(', ')}`);
    if (apply) {
      // Send options back unchanged so the collar stitch colour is preserved.
      await pf(`/store/variants/${v.id}`, { method: 'PUT', body: JSON.stringify({ files: next, options: v.options || [] }) });
      await sleep(600); // stay well under Printful's 120 requests/minute
    }
  }
  return variants;
}

async function mockupsFor(kit, productId) {
  const detail = await pf(`/store/products/${productId}`);
  const v = detail.sync_variants.find((x) => x.size === 'M') || detail.sync_variants[0];
  const catalogProduct = v.product.product_id;
  const spec = await pf(`/mockup-generator/printfiles/${catalogProduct}`);
  const byId = Object.fromEntries(spec.printfiles.map((p) => [p.printfile_id, p]));
  const placementFile = spec.variant_printfiles.find((x) => x.variant_id === v.variant_id)?.placements || {};
  // The generator calls the front "front" where sync files call it "default".
  const GEN = { front: 'front', back: 'back', sleeve_left: 'sleeve', sleeve_right: 'sleeve' };
  // Baseball kits: new front, plus the variant's current back and sleeve files.
  const current = Object.fromEntries((v.files || []).map((f) => [f.type === 'default' ? 'front' : f.type, f.url]));
  const files = Object.entries(GEN).map(([placement, part]) => {
    const pfile = byId[placementFile[placement]];
    if (!pfile) throw new Error(`${kit}: generator has no "${placement}" placement`);
    const image_url = isBaseball(kit) && placement !== 'front' ? current[placement] : fileUrl(kit, part);
    // Mirror the sync files' implicit "cover": scale the square art to cover
    // the print area and centre-crop, exactly as Printful prints it.
    const side = Math.max(pfile.width, pfile.height);
    return {
      placement,
      image_url,
      position: {
        area_width: pfile.width, area_height: pfile.height, width: side, height: side,
        left: Math.round((pfile.width - side) / 2), top: Math.round((pfile.height - side) / 2),
      },
    };
  });
  const task = await pf(`/mockup-generator/create-task/${catalogProduct}`, {
    method: 'POST',
    body: JSON.stringify({
      variant_ids: [v.variant_id], format: 'png', files,
      ...(style ? { option_groups: [style], options: ['Front', 'Back'] } : {}),
    }),
  });
  for (let i = 0; i < 40; i++) {
    await sleep(5000);
    const res = await pf(`/mockup-generator/task?task_key=${task.task_key}`);
    if (res.status === 'failed') throw new Error(`${kit}: mockup task failed ${JSON.stringify(res.error)}`);
    if (res.status !== 'completed') continue;
    const views = res.mockups.flatMap((m) => [{ placement: m.placement, url: m.mockup_url }, ...(m.extra || []).map((e) => ({ placement: e.title, url: e.url }))]);
    const front = views.find((x) => /front|default/i.test(x.placement));
    const back = views.find((x) => /back/i.test(x.placement));
    for (const [view, dir] of [[front, 'mockups'], [back, 'backs']]) {
      if (!view) { console.warn(`  ${kit}: no ${dir === 'mockups' ? 'front' : 'back'} view returned`); continue; }
      const buf = Buffer.from(await (await fetch(view.url)).arrayBuffer());
      const dest = outDir ? new URL(`${kit}-${dir}.png`, outDir) : new URL(`../public/shop/${dir}/${productId}.png`, import.meta.url);
      await writeFile(dest, buf);
      console.log(`  ${kit}: ${view.placement} → ${dest.pathname}`);
    }
    return;
  }
  throw new Error(`${kit}: mockup task timed out`);
}

for (const [kit, id] of Object.entries(KITS)) {
  if (only && !only.includes(kit)) continue;
  if (mockups) await mockupsFor(kit, id);
  else await updateKit(kit, id);
}
if (!apply && !mockups) console.log('\nDry run only. Re-run with --apply to update Printful.');
