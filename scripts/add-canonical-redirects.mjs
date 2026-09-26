import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const clientDir = join(root, 'dist/client');
const configPath = join(root, '.vercel/output/config.json');

async function collectPages(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const pages = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      pages.push(...await collectPages(path));
    } else if (entry.isFile() && entry.name === 'index.html') {
      const page = relative(clientDir, path).split(sep).join('/');
      if (page !== 'index.html') pages.push(page.slice(0, -'/index.html'.length));
    }
  }
  return pages.sort();
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const pages = await collectPages(clientDir);
if (pages.length === 0) throw new Error('No prerendered pages found in dist/client');

const src = `^/(${pages.map(escapeRegex).join('|')})$`;
const config = JSON.parse(await readFile(configPath, 'utf8'));
if (!Array.isArray(config.routes)) throw new Error('Vercel Build Output config has no routes array');

const existingIndex = config.routes.findIndex(route => route.src === src);
if (existingIndex === -1) {
  config.routes.unshift({ src, headers: { Location: '/$1/' }, status: 308 });
} else if (existingIndex > 0) {
  const [route] = config.routes.splice(existingIndex, 1);
  config.routes.unshift(route);
}

await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
console.log(`[canonical-redirects] Added or retained one 308 redirect for ${pages.length} prerendered page paths.`);
