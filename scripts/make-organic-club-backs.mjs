/** Compose approved scenes without repainting them; export each printer's full print area. */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
const root = new URL('../', import.meta.url);
const font = { fontFiles: [new URL('design/prime-menagerie-pocket-tee/sources/BricolageGrotesque-ExtraBold.ttf', root).pathname], loadSystemFonts: false, defaultFontFamily: 'Bricolage Grotesque' };
for (const [key, folder, sceneFile, badgeBg, subtitle, w, h] of [
  ['pickleball','prime-menagerie-organic-graphics','pickleball-scene.png','#303136','PICKLEBALL CLUB',2250,2700],
  ['bowling','prime-menagerie-organic-graphics','bowling-scene.png','#294c3b','BOWLING CLUB',2250,2700],
]) {
  const design = new URL(`design/${folder}/`,root);
  const out = new URL(`public/shop/designs/organic-clubs-2026-11/${key}/`,root);
  await mkdir(out,{recursive:true});
  const scene = (await readFile(new URL(sceneFile,design))).toString('base64');
  const scale = w / 1800;
  for (const [tone,ink,ground] of [['cream','#F2E4C4','#252727'],['forest','#18392F','#ffecb5']]) {
    const text=(words,y,size,spacing=0)=>`<text x="900" y="${y}" text-anchor="middle" font-family="Bricolage Grotesque" font-weight="800" font-size="${size}" letter-spacing="${spacing}" fill="${ink}">${words}</text>`;
    const rule=key==='bowling'?'M155 272H440M1360 272H1645':'M155 272H330M1470 272H1645';
    const back=`<g transform="scale(${scale})">${text('PRIME MENAGERIE',180,143)}${text(subtitle,300,key==='bowling'?82:72,key==='bowling'?9:5)}<path d="${rule}" stroke="${ink}" stroke-width="5"/><image x="0" y="365" width="1800" height="1200" xlink:href="data:image/png;base64,${scene}"/>${text('primemenagerie.com',1680,48,1)}</g>`;
    for(const [side,body,width,height] of [['back',back,w,h]]) {
      const svg=content=>`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${content}</svg>`;
      const renderer=new Resvg(svg(body),{font});
      let outlined=renderer.toString();
      if(!outlined.includes('xmlns:xlink='))outlined=outlined.replace('<svg ','<svg xmlns:xlink="http://www.w3.org/1999/xlink" ');
      await writeFile(new URL(`${side}-${tone}.svg`,out),outlined);
      await sharp(renderer.render().asPng()).withMetadata({density:150}).png().toFile(new URL(`${side}-${tone}.png`,out).pathname);
      await writeFile(new URL(`${side}-${tone}-production-proof.png`,design),new Resvg(svg(`<rect width="${width}" height="${height}" fill="${ground}"/>${body}`),{font}).render().asPng());
    }
  }
  console.log(`${key}: full-width back ${w/150} inches; preserved chest badge; cream and forest back lettering.`);
}
