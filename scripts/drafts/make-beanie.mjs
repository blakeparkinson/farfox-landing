// Far Fox Fair Isle beanie: a 410×229 stitch chart for Printful's Knitted Beanie (catalog 850).
// One pixel = one stitch, only Printful yarn colours. Rows 184-229 fold up as the cuff, so they're knitted upside down.
import sharp from '/Users/blake/Projects/personal/farfox-landing/node_modules/sharp/lib/index.js';

const W = 410, H = 229;
const YARN = { violet: [0x50, 0x43, 0x72], hot: [0xf6, 0x62, 0x74], light: [0xed, 0xd9, 0xd9], orange: [0xd1, 0x77, 0x3b] };
const BANDS = { crownEnd: 78, bodyEnd: 139, fold: 184 };
const FRONT = 205;
const grid = Array.from({ length: H }, () => Array(W).fill('violet'));
const put = (x, y, c) => { if (y >= 0 && y < H) grid[y][((x % W) + W) % W] = c; };

// 5×7 letters, drawn at 2× on the cuff.
const FONT = {
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
};
// Geometric fox head, 17×17: X body, e eye/inner ear (base), w muzzle, n nose.
const FOX = [
  'X...............X', 'XX.............XX', 'XeX...........XeX', 'XeeX.........XeeX', 'XeeeXXXXXXXXXeeeX',
  'XXXXXXXXXXXXXXXXX', 'XXXXXXXXXXXXXXXXX', 'XXeeeXXXXXXXeeeXX', 'XXXXXXXXXXXXXXXXX', '.XXXXXXXXXXXXXXX.',
  '..XXXwwwwwwwXXX..', '...XXXwwwwwXXX...', '....XXXwnwXXX....', '.....XXXwXXX.....', '......XXXXX......',
  '.......XXX.......', '........X........',
];
const HEART = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'];

function stamp(rows, x0, y0, colours, scale = 1) {
  rows.forEach((row, ry) => [...row].forEach((ch, rx) => {
    const c = colours[ch];
    if (!c) return;
    for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) put(x0 + rx * scale + dx, y0 + ry * scale + dy, c);
  }));
}
function word(text, xCentre, y0, colour, scale) {
  const step = 6 * scale, width = text.length * step - scale;
  [...text].forEach((ch, i) => stamp(FONT[ch], xCentre - width / 2 + i * step, y0, { '#': colour }, scale));
}

// Crown: sparse light-pink stars on violet.
for (let y = 8; y < BANDS.crownEnd - 4; y += 14) for (let x = (y / 14) % 2 ? 0 : 10; x < W; x += 41) {
  for (const [dx, dy] of [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]]) put(x + dx, y + dy, 'light');
}

// Body: light rules, zigzags above and below a ring of hearts.
const B = BANDS.crownEnd;
for (const y of [B + 3, BANDS.bodyEnd - 4]) for (let x = 0; x < W; x++) put(x, y, 'light');
const zigzag = (y0, flip) => { for (let x = 0; x < W; x++) { const k = Math.abs((x % 10) - 5); put(x, flip ? y0 + 5 - k : y0 + k, 'hot'); } };
zigzag(B + 8, false);
for (let i = 0; i < 10; i++) stamp(HEART, FRONT - 3 + i * 41, B + 25, { '#': i % 2 ? 'orange' : 'hot' }, 2);
zigzag(BANDS.bodyEnd - 15, true);

// Cuff, drawn upright in its own grid then flipped into rows fold..229.
const cuffH = H - BANDS.fold;
const cuff = Array.from({ length: cuffH }, () => Array(W).fill('violet'));
const cput = (x, y, c) => { if (y >= 0 && y < cuffH) cuff[y][((x % W) + W) % W] = c; };
for (const y of [2, cuffH - 3]) for (let x = 0; x < W; x++) cput(x, y, 'light');
const save = grid; // stamp() writes into grid; point it at the cuff temporarily
const swap = (rows) => rows.forEach((r, i) => (grid[i] = r));
const original = grid.map((r) => r.slice());
for (let i = 0; i < H; i++) grid[i] = i < cuffH ? cuff[i] : grid[i];
stamp(FOX, FRONT - 17, 6, { X: 'hot', e: 'violet', w: 'light', n: 'violet' }, 2);
word('FAR', FRONT - 52, 9, 'light', 2);
word('FOX', FRONT + 52, 9, 'light', 2);
// Cuff hearts round the back, kept clear of the FAR · fox · FOX lockup at the front.
const LOCKUP_HALF = 92;
for (let i = 1; i < 10; i++) {
  const x = FRONT - 7 + i * 41, d = Math.min(Math.abs(((x + 7 - FRONT) % W + W) % W), W - Math.abs(((x + 7 - FRONT) % W + W) % W));
  if (d > LOCKUP_HALF) stamp(HEART, x, 16, { '#': 'hot' }, 2);
}
for (let i = 0; i < cuffH; i++) cuff[i] = grid[i];
for (let i = 0; i < H; i++) grid[i] = original[i];
for (let y = 0; y < cuffH; y++) for (let x = 0; x < W; x++) grid[H - 1 - y][W - 1 - x] = cuff[y][x]; // 180° for the fold

const buf = Buffer.alloc(W * H * 3);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) buf.set(YARN[grid[y][x]], (y * W + x) * 3);
await sharp(buf, { raw: { width: W, height: H, channels: 3 } }).png().toFile(new URL('./beanie-chart.png', import.meta.url).pathname);
// A worn-view preview: the cuff turned the right way up and shown under the band.
const worn = Buffer.alloc(W * (BANDS.bodyEnd + cuffH) * 3);
for (let y = 0; y < BANDS.bodyEnd; y++) for (let x = 0; x < W; x++) worn.set(YARN[grid[y][x]], (y * W + x) * 3);
for (let y = 0; y < cuffH; y++) for (let x = 0; x < W; x++) worn.set(YARN[cuff[y][x]], ((BANDS.bodyEnd + y) * W + x) * 3);
await sharp(worn, { raw: { width: W, height: BANDS.bodyEnd + cuffH, channels: 3 } }).resize({ width: W * 3, kernel: 'nearest' }).png().toFile(new URL('./beanie-worn.png', import.meta.url).pathname);
console.log('chart + worn preview written; yarns:', Object.keys(YARN).join(', '));
