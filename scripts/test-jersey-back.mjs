/**
 * Local visual QA for the personalized jersey back generator.
 * Usage: node scripts/test-jersey-back.mjs  → writes /tmp/jb_<kit>.png
 */
import { renderJerseyBack } from '../src/lib/jerseyBack.mjs';
import { writeFile } from 'node:fs/promises';

const cases = [
  { kit: 'twilight', name: 'ALEX', number: '7' },
  { kit: 'flight', name: 'MORGAN', number: '23' },
  { kit: 'stars', name: 'SAM', number: '10' },
  { kit: 'chart', name: 'JORDAN', number: '99' },
];
for (const c of cases) {
  const buf = await renderJerseyBack({ ...c, size: 1500 });
  await writeFile(`/tmp/jb_${c.kit}.png`, buf);
  console.log('wrote', c.kit, buf.length, 'bytes');
}
