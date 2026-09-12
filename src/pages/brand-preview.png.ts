import type { APIRoute } from 'astro';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { foxyFaceData } from '../lib/foxyBrand';

export const prerender = true;
export const GET: APIRoute = async () => {
  const css = await fetch('https://fonts.googleapis.com/css2?family=Nunito:wght@800&display=swap', { headers: { 'User-Agent': 'Mozilla/5.0' } }).then(r => r.text());
  const fontUrl = css.match(/url\((https:[^)]+\.ttf)\)/)?.[1];
  if (!fontUrl) throw new Error('Brand preview font unavailable');
  const font = await fetch(fontUrl).then(r => r.arrayBuffer());
  const svg = await satori({ type: 'div', props: {
    style: { display: 'flex', width: '100%', height: '100%', background: '#FFF5F0', color: '#2D1B4E', padding: 76, alignItems: 'center', gap: 60, fontFamily: 'Nunito', fontWeight: 800 },
    children: [
      { type: 'img', props: { src: foxyFaceData, width: 260, height: 260, style: { flexShrink: 0 } } },
      { type: 'div', props: { style: { display: 'flex', flexDirection: 'column', width: 728, flexShrink: 0, gap: 22 }, children: [
        { type: 'div', props: { style: { fontSize: 30, color: '#963655' }, children: 'Far Fox' } },
        { type: 'div', props: { style: { display: 'flex', flexDirection: 'column', fontSize: 64, lineHeight: 1.1 }, children: [
          { type: 'div', props: { children: 'Less small talk.' } },
          { type: 'div', props: { children: 'More you two.' } },
        ] } },
        { type: 'div', props: { style: { fontSize: 25, color: '#6B5B7B' }, children: 'Daily rituals for couples who live apart.' } },
        { type: 'div', props: { style: { fontSize: 22, color: '#963655' }, children: 'lovefarfox.com' } },
      ] } },
    ],
  } }, { width: 1200, height: 630, fonts: [{ name: 'Nunito', data: font, weight: 800, style: 'normal' }] });
  return new Response(new Uint8Array(new Resvg(svg).render().asPng()), { headers: { 'Content-Type': 'image/png' } });
};
