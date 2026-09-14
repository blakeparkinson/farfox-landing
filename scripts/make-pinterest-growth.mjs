/** Ten upload-ready Pinterest creatives. Run: node scripts/make-pinterest-growth.mjs */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'out/pinterest-growth-01');
mkdirSync(out, { recursive: true });
const pins = [
  { id: '01-reunion', kind: 'choice', label: 'THE REUNION QUESTION', headline: 'First night back together?', items: ['Stay in. Phones away.', 'Go out. Make a night of it.'], cta: 'Pick yours. Send it to your person.', path: '/', title: 'A Would You Rather Question for Your Next Reunion', description: 'First night together after time apart: a quiet night in or a proper night out? Pick your answer on FarFox, then send the question to your partner and see what they choose.', board: 'Long-Distance Relationship Activities' },
  { id: '02-couple-quiz', kind: 'feature', label: 'FREE COUPLES QUIZ', headline: 'How do you like to be loved?', items: ['6 questions', 'No signup', 'A result you can share'], cta: 'Take the quiz at lovefarfox.com', path: '/quiz', title: 'Free Couples Quiz: How Do You Like to Be Loved?', description: 'Take six questions about how you like to connect, then share your result with your partner. A free conversation starter for long-distance couples, with no signup required to take the quiz.', board: 'Couples Questions & Games' },
  { id: '03-date-night', kind: 'list', label: 'LONG-DISTANCE DATE NIGHT', headline: 'Dinner together. Two kitchens.', items: ['Choose the same recipe.', 'Prop up the video call.', 'Cook, compare, eat together.'], cta: 'Find 47 virtual date ideas', path: '/blog/long-distance-date-ideas', title: 'Virtual Dinner Date Idea for Long-Distance Couples', description: 'Choose the same recipe and cook together over video for your next long-distance date night. Find this idea and 46 more, including creative dates, games and low-effort weeknight plans.', board: 'Long-Distance Date Ideas' },
  { id: '04-no-spend-dates', kind: 'list', label: 'SAVE FOR YOUR NEXT CALL', headline: '3 dates. No shopping required.', items: ['Draw each other without looking.', 'Build a playlist, song by song.', 'Write letters. Read them aloud.'], cta: 'More long-distance date ideas', path: '/blog/long-distance-date-ideas', title: '3 No-Spend Long-Distance Date Ideas for Your Next Video Call', description: 'Use paper, music and a video call for three simple dates: blind portraits, a shared playlist or letters you read aloud. Save these ideas for a night when you want to do something together without buying anything.', board: 'Long-Distance Date Ideas' },
  { id: '05-open-when', kind: 'list', label: 'A GIFT TO MAKE BY HAND', headline: 'Start with 5 “open when” letters.', items: ['You miss me.', 'You have a terrible day.', 'You cannot sleep.', 'You have big news.', 'It is the night before our visit.'], cta: 'Get 60+ envelope ideas', path: '/blog/open-when-letters', title: '5 Open When Letter Ideas for Your Long-Distance Partner', description: 'Start an open when letter bundle with five envelopes for the moments you wish you could be there. The FarFox guide has 60+ ideas, writing tips and small things to tuck inside.', board: 'Love Letters & Long-Distance Gifts' },
  { id: '06-letter-prompt', kind: 'quote', label: 'A LOVE LETTER STARTER', headline: '“The ordinary thing I miss most about you is…”', items: ['Start with one small detail.', 'The coffee. The laugh. The walk home.'], cta: 'Find 50 love letter prompts', path: '/blog/love-letter-prompts-long-distance', title: 'A Love Letter Prompt for When You Miss Your Long-Distance Partner', description: 'Try starting your letter with the ordinary thing you miss most about your partner. One specific memory can give you somewhere to begin. Find 50 prompts for missing them, gratitude, shared memories and future plans.', board: 'Love Letters & Long-Distance Gifts' },
  { id: '07-ordinary-day', kind: 'quote', label: 'ASK YOUR PERSON', headline: '“What would a perfectly ordinary day with me look like?”', items: ['The morning. The errands.', 'What we would make for dinner.'], cta: 'Explore 100 couples questions', path: '/blog/long-distance-relationship-questions', title: 'A Thoughtful Question to Ask Your Long-Distance Partner', description: 'What would a perfectly ordinary day together look like? Use this question on your next call, then explore 100 long-distance relationship questions covering everyday life, memories, future plans and playful choices.', board: 'Couples Questions & Games' },
  { id: '08-time-zones', kind: 'feature', label: 'FREE TIME-ZONE TOOL', headline: 'Two cities. When can we call?', items: ['Choose your cities.', 'Compare your awake hours.', 'Find a time that overlaps.'], cta: 'Try the time-zone calculator', path: '/long-distance-time-zone-calculator', title: 'Find a Call Time Across Two Time Zones', description: 'Planning calls across time zones? Use the free FarFox long-distance time-zone calculator to compare two cities and find overlapping awake hours before you plan your next call.', board: 'Long-Distance Relationship Tips' },
  { id: '09-texting-games', kind: 'list', label: 'PLAY THROUGHOUT THE DAY', headline: '3 games you can play by text.', items: ['One sentence each. Build a story.', 'Two truths and a lie.', '20 questions. Yes or no only.'], cta: 'Find 47 long-distance games', path: '/blog/long-distance-relationship-games', title: '3 Texting Games for Long-Distance Couples', description: 'Trade sentences to build a story, share two truths and a lie, or play 20 questions between the gaps in your day. Find these and more in our guide to 47 long-distance relationship games.', board: 'Couples Questions & Games' },
  { id: '10-next-call', kind: 'list', label: 'FOR YOUR NEXT VIDEO CALL', headline: '3 questions worth taking your time with.', items: ['When do you feel most like yourself?', 'What does home mean to you?', 'What do you wish I asked you more often?'], cta: 'Save these. Find 97 more.', path: '/blog/long-distance-relationship-questions', title: '3 Deep Questions for Your Next Long-Distance Video Call', description: 'Pick one question for your next call: when do you feel most like yourself, what does home mean to you, or what do you wish I asked more often? Browse 100 couples questions when you want another place to start.', board: 'Couples Questions & Games' },
];

const dataImage = name => `data:image/png;base64,${readFileSync(resolve(root, `public/brand/${name}-v1.png`)).toString('base64')}`;
const face = dataImage('foxy-face');
const letter = dataImage('foxy-letter');
const box = (children, style = {}) => ({ type: 'div', props: { style: { display: 'flex', ...style }, children } });
const txt = (children, style = {}) => box(children, style);
const pic = (src, size, style = {}) => ({ type: 'img', props: { src, width: size, height: size, style } });
const ink = '#34243C';
const palettes = [['#FFF5E8', '#E25E32'], ['#F3ECFF', '#7752AC'], ['#FFF0F2', '#B94765']];

function artwork(pin, i) {
  const [bg, accent] = palettes[i % palettes.length];
  const quote = pin.kind === 'quote';
  const feature = pin.kind === 'feature';
  return box([
    box([pic(face, 62), txt('farfox', { fontSize: 35, fontWeight: 900 })], { alignItems: 'center', gap: 12 }),
    txt(pin.label, { fontSize: 23, letterSpacing: 3, color: accent, marginTop: 48 }),
    txt(pin.headline, { fontSize: quote ? 82 : 86, fontWeight: 900, lineHeight: 1.08, letterSpacing: -2, marginTop: 22 }),
    ...(feature ? [pic(letter, 390, { alignSelf: 'center', marginTop: 20 })] : []),
    box(pin.items.map((item, j) => box([
      ...(!quote && !feature ? [txt(pin.kind === 'choice' ? String.fromCharCode(65 + j) : `${j + 1}`, { width: 48, height: 48, borderRadius: 24, background: accent, color: '#FFFFFF', alignItems: 'center', justifyContent: 'center', fontSize: 25, flexShrink: 0 })] : []),
      txt(item, { fontSize: pin.items.length > 4 ? 36 : 42, lineHeight: 1.28, flex: 1 }),
    ], { padding: quote || feature ? '8px 0' : '28px 25px', background: quote || feature ? 'transparent' : '#FFFFFF', borderRadius: 24, gap: 19, alignItems: 'center' })), { flexDirection: 'column', gap: pin.items.length > 4 ? 12 : 18, marginTop: feature ? 8 : 38 }),
    ...(!feature ? [pic(quote ? letter : face, quote ? 440 : pin.items.length > 4 ? 205 : 320, { position: 'absolute', bottom: 184, right: 64 })] : []),
    box([txt(pin.cta, { fontSize: 29, fontWeight: 900 }), txt('lovefarfox.com', { fontSize: 25, marginTop: 13, color: '#756579' })], { position: 'absolute', bottom: 63, left: 64, right: 64, flexDirection: 'column', borderTop: '2px solid #DACED7', paddingTop: 25 }),
  ], { width: 1000, height: 1500, padding: '55px 64px', background: bg, color: ink, fontFamily: 'Nunito', fontWeight: 700, flexDirection: 'column', position: 'relative' });
}

async function fetchOK(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status}: ${url}`);
  return response;
}
const css = await (await fetchOK('https://fonts.googleapis.com/css2?family=Nunito:wght@700;900&display=swap')).text();
const fontUrls = [...css.matchAll(/url\((https:[^)]+)\)/g)].map(m => m[1]);
if (!fontUrls.length) throw new Error('No Nunito fonts returned');
const fonts = await Promise.all([700, 900].map(async (weight, i) => ({ name: 'Nunito', weight, style: 'normal', data: await (await fetchOK(fontUrls[Math.min(i, fontUrls.length - 1)])).arrayBuffer() })));
const manifest = [];
for (const [i, pin] of pins.entries()) {
  const url = new URL(pin.path, 'https://lovefarfox.com');
  url.search = new URLSearchParams({ utm_source: 'pinterest', utm_medium: 'pin', utm_campaign: 'pinterest_growth_01', utm_content: pin.id }).toString();
  if (pin.title.length > 100 || pin.description.length > 800) throw new Error(`Copy exceeds Pinterest limits: ${pin.id}`);
  const file = `${pin.id}.png`;
  const svg = await satori(artwork(pin, i), { width: 1000, height: 1500, fonts });
  const png = new Resvg(svg).render().asPng();
  if (png.readUInt32BE(16) !== 1000 || png.readUInt32BE(20) !== 1500) throw new Error(`Wrong size: ${file}`);
  writeFileSync(resolve(out, file), png);
  manifest.push({ file, title: pin.title, description: pin.description, link: url.href, alt_text: `Foxy accompanies the text: ${pin.headline} ${pin.items.join(' ')} ${pin.cta}`, suggested_board: pin.board, suggested_day: i + 1 });
}
writeFileSync(resolve(out, 'pins.json'), JSON.stringify(manifest, null, 2) + '\n');
const keys = Object.keys(manifest[0]);
const csv = v => `"${String(v).replaceAll('"', '""')}"`;
writeFileSync(resolve(out, 'upload-worksheet.csv'), [keys.map(csv).join(','), ...manifest.map(p => keys.map(k => csv(p[k])).join(','))].join('\n'));
const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
writeFileSync(resolve(out, 'preview.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FarFox • 10 Pinterest pins</title><style>body{font:16px system-ui;background:#fff5ee;color:#34243c;margin:32px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:28px}article{background:white;padding:16px;border-radius:18px}img{width:100%;height:auto;border-radius:12px}h1{font-size:30px}h2{font-size:19px}p{line-height:1.5}a{color:#963655}</style><h1>FarFox: 10-pin traffic experiment</h1><p>Ready to upload. Not published. Suggested order: one pin per day for ten days.</p><main>${manifest.map(p => `<article><a href="${esc(p.file)}"><img src="${esc(p.file)}" alt="${esc(p.alt_text)}"></a><h2>${esc(p.title)}</h2><p>${esc(p.description)}</p><p>${esc(p.suggested_board)}</p><a href="${esc(p.link)}">Tracked destination</a></article>`).join('')}</main></html>`);
writeFileSync(resolve(out, 'README.md'), `# FarFox Pinterest growth experiment\n\n10 original 1000 × 1500 PNG pins using approved Foxy artwork. Nothing has been published or scheduled.\n\n## Upload\n\nOpen preview.html to review. Create each image Pin in your Pinterest account. Use the matching title, description, destination link and alt text from upload-worksheet.csv or pins.json. Choose a relevant existing board; suggested board names are topics, not boards we created. The CSV is a copy/paste worksheet, not a verified native bulk-import file.\n\nPublish one pin per day for ten days as a first experiment, not a claimed optimal cadence. Each creative is distinct; pins 3/4 and 7/10 test different hooks for the same article.\n\n## Measure\n\nAll links use utm_source=pinterest, utm_medium=pin, utm_campaign=pinterest_growth_01 and an individual utm_content. After 14 and 30 days compare impressions, saves, outbound clicks and outbound click rate in Pinterest Analytics. If your site analytics records UTMs, compare visits and available quiz/signup conversions by utm_content. Do not infer traffic or conversions from saves alone. No baseline or conversion instrumentation was verified for this kit.\n\nKeep high-click topics and test new hooks. Give low-impression pins more time before judging their copy. Do not publish private partner answers or imply quiz results measure relationship compatibility.\n\n## Regenerate\n\nFrom the repo: node scripts/make-pinterest-growth.mjs. Requires network for Nunito fonts. Outputs are gitignored under out/pinterest-growth-01.\n`);
console.log(`Generated ${manifest.length} pins and upload pack in ${out}`);
const sheet = box(manifest.map(p => box([
  pic(`data:image/png;base64,${readFileSync(resolve(out, p.file)).toString('base64')}`, 240, { height: 360 }),
  txt(p.file.replace('.png', ''), { fontSize: 15, marginTop: 8 }),
], { flexDirection: 'column', width: 240, margin: 12 })), { width: 1320, height: 810, flexWrap: 'wrap', background: '#FFFFFF', fontFamily: 'Nunito', color: ink });
writeFileSync(resolve(out, 'contact-sheet.png'), new Resvg(await satori(sheet, { width: 1320, height: 810, fonts })).render().asPng());
