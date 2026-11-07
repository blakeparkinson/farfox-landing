/** Authorized club release: updates catalog products and mockups, never places orders. */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const args=process.argv.slice(2);
const stateName=args.find(a=>a.startsWith('--state-file='))?.slice(13)||'pickleball-cities-release.json';
if(!/^[a-z0-9-]+\.json$/.test(stateName))throw Error('Invalid release state filename');
const stateFile=new URL('design/'+stateName,root);
const state=JSON.parse(await readFile(stateFile,'utf8').catch(()=>'{}'));
const base=args.find(a=>a.startsWith('--files-base='))?.slice(13)||state.filesBase;
if(!base||!process.env.PRINTFUL_TOKEN)throw Error('Artwork URL and printer access required');
if(state.filesBase&&state.filesBase!==base)throw Error('Immutable artwork base mismatch');
const sizes=['S','M','L','XL','2XL','3XL'];
const configs=[
  {
    "key": "portland",
    "productId": 490719865,
    "catalog": 839,
    "name": "Prime Menagerie Pickleball Club Crewneck — Portland, Maine",
    "price": "59.00",
    "colors": [
      "Blue Spruce",
      "Pepper",
      "True Navy",
      "Butter"
    ],
    "light": "Butter",
    "front": "front_dtf",
    "back": "back_large_dtf",
    "width": 2250,
    "height": 2700,
    "technique": "DTFILM",
    "frontBase": "https://raw.githubusercontent.com/blakeparkinson/farfox-landing/33eab86/public/shop/designs/pickleball-crewneck-2026-11/pickleball"
  },
  {
    "key": "new-orleans",
    "productId": 490719872,
    "catalog": 839,
    "name": "Prime Menagerie Pickleball Club Crewneck — New Orleans",
    "price": "59.00",
    "colors": [
      "Blue Spruce",
      "Pepper",
      "True Navy",
      "Butter"
    ],
    "light": "Butter",
    "front": "front_dtf",
    "back": "back_large_dtf",
    "width": 2250,
    "height": 2700,
    "technique": "DTFILM",
    "frontBase": "https://raw.githubusercontent.com/blakeparkinson/farfox-landing/33eab86/public/shop/designs/pickleball-crewneck-2026-11/pickleball"
  }
];
const headers={Authorization:`Bearer ${process.env.PRINTFUL_TOKEN}`,'X-PF-Store-Id':process.env.PRINTFUL_STORE_ID||'18292625','Content-Type':'application/json'};
async function pf(path,body,method=body?'POST':'GET'){
 const r=await fetch(`https://api.printful.com${path}`,{method,headers,...(body?{body:JSON.stringify(body)}:{})});
 const j=await r.json();if(!r.ok)throw Error(`Printer ${r.status}: ${j.error?.message||JSON.stringify(j.result)}`);return j.result;
}
const save=async()=>{state.filesBase=base;await writeFile(stateFile,JSON.stringify(state,null,2)+'\n');};
const slug=s=>s.toLowerCase().replaceAll(' ','-');
const files=(c,color)=>[c.front,c.back].map((type,i)=>({type,url:`${i?`${base}/${c.key}`:c.frontBase}/${i?'back':'front'}-${color===c.light?'forest':'cream'}.png`}));
async function catalog(c){
 const all=(await pf(`/products/${c.catalog}`)).variants;
 const selected=c.colors.flatMap(color=>sizes.map(size=>all.find(v=>v.color===color&&v.size===size)).filter(v=>v?.in_stock));
 if(c.colors.some(color=>!selected.some(v=>v.color===color&&v.size==='M')))throw Error('Missing representative color/medium');
 return selected;
}
function photo(c,color,side){
 const s=state[c.key];const medium=s.variants.find(v=>v.color===color&&v.size==='M');
 const task=s.tasks[color===c.light?'forest':'cream'];
 const mocks=task.mockups.filter(m=>m.variant_ids.includes(medium.id));
 for(const m of mocks){const e=m.extra?.find(e=>e.option?.toLowerCase()===side&&e.option_group==='Flat');if(e)return e.url;}
 const match=mocks.find(m=>m.mockup_url.includes(`-${side}-`));
 if(match)return match.mockup_url;
 throw Error(`No unambiguous ${side} photo for ${c.key} ${color}`);
}
const only=args.find(a=>a.startsWith('--only='))?.slice(7);
if(only&&!configs.some(c=>c.key===only))throw Error('Unknown city');
for(const c of configs.filter(c=>!only||c.key===only)){
 const s=state[c.key]??=( {productId:c.productId,tasks:{}} );
 if(args.includes('--mockups')){
  s.variants=await catalog(c);const spec=await pf(`/mockup-generator/printfiles/${c.catalog}?technique=${c.technique}`);
  for(const tone of ['cream','forest']){
   if(s.tasks[tone])continue;
   const variants=s.variants.filter(v=>v.size==='M'&&(v.color===c.light)===(tone==='forest'));
   const placements=spec.variant_printfiles.find(v=>v.variant_id===variants[0].id).placements;
   const mockFiles=files(c,variants[0].color).map((f,i)=>{
    const placement=f.type==='default'?'front':f.type;const area=spec.printfiles.find(p=>p.printfile_id===placements[placement]);
    const width=i?c.width:1800,height=i?c.height:2400;
    if(area?.width!==width||area?.height!==height)throw Error(`Unexpected ${c.key} ${placement} area`);
    return {placement,image_url:f.url,position:{area_width:width,area_height:height,width,height,top:0,left:0}};
   });
   for(const f of mockFiles){const r=await fetch(f.image_url,{method:'HEAD'});if(!r.ok)throw Error(`Artwork inaccessible ${r.status}`);}
   s.tasks[tone]=await pf(`/mockup-generator/create-task/${c.catalog}`,{variant_ids:variants.map(v=>v.id),format:'png',files:mockFiles,option_groups:['Flat'],options:['Front','Back']});
   await save();console.log(c.key,tone,s.tasks[tone].status);
  }
 }else if(args.includes('--poll')){
  for(const tone of Object.keys(s.tasks)){
   if(s.tasks[tone].status!=='completed')s.tasks[tone]=await pf(`/mockup-generator/task?task_key=${encodeURIComponent(s.tasks[tone].task_key)}`);
   await save();console.log(c.key,tone,s.tasks[tone].status,s.tasks[tone].error||'');
  }
 }else if(args.includes('--preview')||args.includes('--verify')){
  if(Object.values(s.tasks).some(t=>t.status!=='completed'))throw Error('Mockups not complete');
  if(args.includes('--verify')){
   const detail=await pf(`/store/products/${s.productId}`);
   if(detail.sync_product.name!==c.name||detail.sync_variants.length!==s.variants.length)throw Error('Product/variant count mismatch');
   for(const v of s.variants){
    const actual=detail.sync_variants.find(a=>a.variant_id===v.id);
    if(!actual||Number(actual.retail_price)!==Number(c.price))throw Error(`Variant price mismatch ${v.id}`);
    if(s.before && actual.id!==s.before.sync_variants.find(a=>a.variant_id===v.id)?.id)throw Error('Existing variant ID changed');
    for(const f of files(c,v.color)){const a=actual.files.find(a=>a.type===f.type);if(a?.url!==f.url||a.status!=='ok')throw Error(`Artwork not ready ${v.color} ${v.size} ${f.type}: ${a?.status}`);}
    const productionTypes=actual.files.filter(f=>f.type!=='preview').map(f=>f.type);
    if(productionTypes.length!==2)throw Error('Unexpected additional print placements');
   }
   s.verifiedAt=new Date().toISOString();await save();console.log('VERIFIED',c.name,s.productId,s.variants.length,c.price);
  }
  for(const color of c.colors)for(const side of ['front','back']){
   const r=await fetch(photo(c,color,side));if(!r.ok)throw Error(`Photo download ${r.status}`);const data=Buffer.from(await r.arrayBuffer());
   const out=args.includes('--verify')?new URL(`public/shop/${side==='front'?'colors':'backs'}/`,root):new URL(`design/pickleball-cities-provider-preview/${c.key}/`,root);
   await mkdir(out,{recursive:true});
   await writeFile(new URL(args.includes('--verify')?`${s.productId}-${slug(color)}.png`:`${slug(color)}-${side}.png`,out),data);
   if(args.includes('--verify')&&color===c.colors[0]){
    const dir=new URL(`public/shop/${side==='front'?'mockups':'backs'}/`,root);await mkdir(dir,{recursive:true});await writeFile(new URL(`${s.productId}.png`,dir),data);
   }
  }
 }else if(args.includes('--publish')){
  if(Object.values(s.tasks).length!==2||Object.values(s.tasks).some(t=>t.status!=='completed'))throw Error('Complete and inspect all provider mockups first');
  // Recheck stock before creating only the combinations which can be fulfilled.
  const variants=s.variants.map(v=>({variant_id:v.id,external_id:`pm-${c.key}-${slug(v.color)}-${v.size.toLowerCase()}`,retail_price:c.price,files:files(c,v.color)}));
  if(!s.productId){const existing=(await pf('/store/products?limit=100')).find(p=>p.name===c.name);if(existing)s.productId=existing.id;}
  if(!s.productId){const created=await pf('/store/products',{sync_product:{name:c.name,thumbnail:photo(c,c.colors[0],'front')},sync_variants:variants});s.productId=created.id;await save();console.log('CREATED',c.key,s.productId,variants.length);}
  else{
   const detail=await pf(`/store/products/${s.productId}`);
   if(detail.sync_product.name!==c.name || detail.sync_variants.length!==s.variants.length)throw Error('Product identity/count mismatch');
   if(!s.before){s.before=detail;await save();}
   for(const v of variants){
    const old=detail.sync_variants.find(a=>a.variant_id===v.variant_id);
    if(!old)throw Error('Existing crewneck variant missing; do not create replacements');
    if(old&&old.retail_price===v.retail_price&&v.files.every(f=>old.files.some(a=>a.type===f.type&&a.url===f.url)))continue;
    await new Promise(r=>setTimeout(r,6500));
    if(old)await pf(`/store/variants/${old.id}`,{retail_price:v.retail_price,files:v.files},'PUT');
    else await pf(`/store/products/${s.productId}/variants`,v);
    console.log(old?'UPDATED':'ADDED',c.key,v.external_id);await save();
   }
  }
 }else throw Error('Choose --mockups, --poll, --preview, --publish, or --verify');
}
