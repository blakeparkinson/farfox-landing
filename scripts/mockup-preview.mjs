/**
 * Printful mockups of kit print files before they are live: Printful fetches the files from the public
 * GitHub repo at a pushed commit, so drafts can be reviewed on the real garment without deploying.
 *
 *   PRINTFUL_TOKEN=… node scripts/mockup-preview.mjs --kits twilight-skies,cobweb --out <dir> [--style Ghost] [--sha <commit>]
 *
 * Writes <out>/m-<kit>[-<style>]-0.png (front) and -1.png (back). --sha defaults to HEAD, which must be pushed.
 */
import { execSync } from 'node:child_process';
import { readdirSync, existsSync, writeFileSync } from 'node:fs';

const TOKEN = process.env.PRINTFUL_TOKEN;
if (!TOKEN) { console.error('Set PRINTFUL_TOKEN.'); process.exit(1); }
const args = process.argv.slice(2);
const arg = (k, fallback) => (args.includes(k) ? args[args.indexOf(k) + 1] : fallback);
const kits = arg('--kits', '').split(',').filter(Boolean);
const out = arg('--out');
const style = arg('--style', '');
const sha = arg('--sha', execSync('git rev-parse HEAD').toString().trim());
if (!kits.length || !out) { console.error('Pass --kits and --out.'); process.exit(1); }

const REPO_RAW = `https://raw.githubusercontent.com/blakeparkinson/farfox-landing/${sha}/public/shop/designs`;
const DESIGNS = new URL('../public/shop/designs/', import.meta.url);
const KIT_CATALOG = 644, KIT_VARIANT_M = 16261;
const H = { Authorization: `Bearer ${TOKEN}`, 'X-PF-Store-Id': process.env.PRINTFUL_STORE_ID || '18292625', 'Content-Type': 'application/json' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function pf(path, init = {}) {
  const r = await (await fetch(`https://api.printful.com${path}`, { headers: H, ...init })).json();
  if (r.code !== 200) throw new Error(`${path} ${JSON.stringify(r.error || r.result).slice(0, 300)}`);
  return r.result;
}

/** The designs folder holding a kit's files (kits-2026-09, kits-2026-10, kits-2026-holiday, kits-drafts…). */
function folderFor(kit) {
  const dir = readdirSync(DESIGNS, { withFileTypes: true }).find((d) => d.isDirectory() && existsSync(new URL(`${d.name}/sj-${kit}-front.png`, DESIGNS)));
  if (!dir) throw new Error(`no sj-${kit}-front.png under public/shop/designs`);
  return dir.name;
}

const spec = await pf(`/mockup-generator/printfiles/${KIT_CATALOG}`);
const byId = Object.fromEntries(spec.printfiles.map((p) => [p.printfile_id, p]));
const placements = spec.variant_printfiles.find((x) => x.variant_id === KIT_VARIANT_M).placements;
for (const kit of kits) {
  const file = (part) => `${REPO_RAW}/${folderFor(kit)}/sj-${kit}-${part}.png`;
  const sources = { front: file('front'), back: file('back'), sleeve_left: file('sleeve'), sleeve_right: file('sleeve') };
  const files = Object.entries(sources).map(([placement, image_url]) => {
    const p = byId[placements[placement]], side = Math.max(p.width, p.height);
    return { placement, image_url, position: { area_width: p.width, area_height: p.height, width: side, height: side, left: Math.round((p.width - side) / 2), top: Math.round((p.height - side) / 2) } };
  });
  const task = await pf(`/mockup-generator/create-task/${KIT_CATALOG}`, { method: 'POST', body: JSON.stringify({ variant_ids: [KIT_VARIANT_M], format: 'png', files, ...(style ? { option_groups: [style], options: ['Front', 'Back'] } : {}) }) });
  let done = null;
  for (let i = 0; i < 60 && !done; i++) {
    await sleep(5000);
    const res = await pf(`/mockup-generator/task?task_key=${task.task_key}`);
    if (res.status === 'failed') throw new Error(`${kit}: ${JSON.stringify(res.error)}`);
    if (res.status === 'completed') done = res;
  }
  if (!done) throw new Error(`${kit}: mockup task timed out`);
  const views = done.mockups.flatMap((m) => [{ p: m.placement, url: m.mockup_url }, ...(m.extra || []).map((e) => ({ p: e.title, url: e.url }))]);
  const picks = [views.find((v) => /front|default/i.test(v.p)), views.find((v) => /back/i.test(v.p))];
  for (const [i, v] of picks.entries()) if (v) writeFileSync(`${out}/m-${kit}${style ? `-${style}` : ''}-${i}.png`, Buffer.from(await (await fetch(v.url)).arrayBuffer()));
  console.log(`${kit}: ${picks.filter(Boolean).map((v) => v.p).join(', ')}`);
}
