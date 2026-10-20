/**
 * Printful mockups of the outerwear drafts (make-outerwear-drafts.mjs) before any product exists: Printful
 * fetches the files from the public GitHub repo at a pushed commit.
 *
 *   node --env-file=.env scripts/mockup-outerwear-drafts.mjs --concepts twoskies,souvenir,paravion,knit --out <dir> [--sha <commit>]
 *
 * Writes <out>/<concept>-front.png and -back.png (bomber, ghost mannequin) or <out>/knit-front.png (beanie).
 */
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const TOKEN = process.env.PRINTFUL_TOKEN;
if (!TOKEN) { console.error('Set PRINTFUL_TOKEN.'); process.exit(1); }
const args = process.argv.slice(2);
const arg = (k, fallback) => (args.includes(k) ? args[args.indexOf(k) + 1] : fallback);
const concepts = arg('--concepts', '').split(',').filter(Boolean), out = arg('--out');
if (!concepts.length || !out) { console.error('Pass --concepts and --out.'); process.exit(1); }
mkdirSync(out, { recursive: true });
const sha = arg('--sha', execSync('git rev-parse HEAD').toString().trim());
const RAW = `https://raw.githubusercontent.com/blakeparkinson/farfox-landing/${sha}/public/shop/designs/outerwear-drafts`;
const H = { Authorization: `Bearer ${TOKEN}`, 'X-PF-Store-Id': process.env.PRINTFUL_STORE_ID || '18292625', 'Content-Type': 'application/json' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function pf(path, init = {}) {
  const r = await (await fetch(`https://api.printful.com${path}`, { headers: H, ...init })).json();
  if (r.code !== 200) throw new Error(`${path} ${JSON.stringify(r.error || r.result).slice(0, 300)}`);
  return r.result;
}
const BOMBER = 390, KNIT = 850;

async function generate(catalog, variantIds, files, style) {
  const task = await pf(`/mockup-generator/create-task/${catalog}`, { method: 'POST', body: JSON.stringify({ variant_ids: variantIds, format: 'png', files, ...style }) });
  let res;
  for (let i = 0; i < 60; i++) { await sleep(5000); res = await pf(`/mockup-generator/task?task_key=${task.task_key}`); if (res.status !== 'pending') break; }
  if (res.status !== 'completed') throw new Error(`mockups ${res.status}: ${JSON.stringify(res.error || '')}`);
  return res.mockups;
}
const area = (spec, placement) => { const f = spec.printfiles.find((x) => x.printfile_id === spec.variant_printfiles[0].placements[placement]); return { area_width: f.width, area_height: f.height, width: f.width, height: f.height, top: 0, left: 0 }; };
const save = async (file, src) => { writeFileSync(`${out}/${file}`, Buffer.from(await (await fetch(src)).arrayBuffer())); console.log(`  ${out}/${file}`); };

for (const c of concepts) {
  console.log(c);
  if (c === 'knit') {
    const spec = await pf(`/mockup-generator/printfiles/${KNIT}`);
    const variant = (await pf(`/products/${KNIT}`)).variants[0].id;
    const files = [{ placement: 'front', image_url: `${RAW}/knit-beanie.png`, position: area(spec, 'front') }];
    // Knitwear needs its yarns declared: the base and every colour in the file (make-outerwear-drafts.mjs YARN).
    const yarns = ['#343d55', '#e2dfdc', '#f66274', '#cd5e38'];
    const style = { option_groups: ['Flat'], options: ['Front'], product_options: { base_color: yarns[0], trim_color: yarns[0], yarn_colors: yarns } };
    for (const mk of await generate(KNIT, [variant], files, style)) await save('knit-front.png', mk.mockup_url);
    continue;
  }
  const spec = await pf(`/mockup-generator/printfiles/${BOMBER}`);
  const variant = (await pf(`/products/${BOMBER}`)).variants.find((v) => v.size === 'M').id;
  const part = (placement, file) => ({ placement, image_url: `${RAW}/${c}-${file}.png`, position: area(spec, placement) });
  const files = [part('front', 'front'), part('back', 'back'), part('sleeve_left', 'sleeve'), part('sleeve_right', 'sleeve'), part('details', 'details'), part('label_inside', 'label')];
  for (const mk of await generate(BOMBER, [variant], files, { option_groups: ['Ghost'], options: ['Front', 'Back'] })) {
    for (const view of ['front', 'back']) {
      const re = new RegExp(view, 'i');
      const img = (mk.extra || []).find((e) => re.test(e.option || e.title || ''))?.url || (re.test(mk.placement) ? mk.mockup_url : null);
      if (img) await save(`${c}-${view}.png`, img);
    }
  }
}
