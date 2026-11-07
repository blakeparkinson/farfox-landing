/** Replace artwork on six existing products, preserving every sync variant.
 * API contract: https://developers.printful.com/docs/#tag/Sync-Products-API
 * --files-base=<immutable commit URL> --mockups|--poll|--preview|--publish|--verify
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const root=new URL('../',import.meta.url),args=process.argv.slice(2);
const stateFile=new URL('design/purple-rat-release.json',root);
const state=JSON.parse(await readFile(stateFile,'utf8').catch(()=>'{}'));
const base=args.find(a=>a.startsWith('--files-base='))?.slice(13)||state.base;
if(!base||!process.env.PRINTFUL_TOKEN)throw Error('Immutable artwork base and printer access required');
if(state.base&&state.base!==base)throw Error('Artwork base changed');
state.base=base;
const configs=[
 {key:'portland',id:490719865,count:24,name:'Prime Menagerie Pickleball Club Crewneck — Portland, Maine',crew:true},
 {key:'new-orleans',id:490719872,count:24,name:'Prime Menagerie Pickleball Club Crewneck — New Orleans',crew:true},
 {key:'pickleball',id:490239643,count:24,name:'Prime Menagerie Pickleball Club Crewneck',crew:true},
 {key:'bowling',id:490151911,count:24,name:'Prime Menagerie Bowling Club Crewneck',crew:true},
 {key:'soapbox',id:490092600,count:20,name:'Prime Menagerie Soapbox Derby Pocket Tee'},
 {key:'campfire',id:489992811,count:5,name:'Prime Menagerie Pocket Tee'},
];
const headers={Authorization:`Bearer ${process.env.PRINTFUL_TOKEN}`,'X-PF-Store-Id':process.env.PRINTFUL_STORE_ID||'18292625','Content-Type':'application/json'};
async function pf(path,body,method=body?'POST':'GET'){
 const r=await fetch(`https://api.printful.com${path}`,{method,headers,...(body?{body:JSON.stringify(body)}:{})});
 const j=await r.json();if(!r.ok)throw Error(`Printer ${r.status}: ${j.error?.message||j.result}`);return j.result;
}
const save=()=>writeFile(stateFile,JSON.stringify(state,null,2)+'\n');
const slug=s=>s.toLowerCase().replaceAll(' ','-');
const tone=(c,color)=>c.crew?(color==='Butter'?'forest':'cream'):(color==='True Navy'?'dark':'light');
const backType=c=>c.crew?'back_large_dtf':'back';
const backUrl=(c,v)=>`${base}/${c.key}/back-${tone(c,v.color)}.png`;
function identity(c,d){if(d.sync_product.name!==c.name||d.sync_variants.length!==c.count)throw Error(`Unexpected product identity/count ${c.key}`);}
function sameVariants(a,b){const key=v=>`${v.id}:${v.variant_id}:${v.color}:${v.size}:${v.retail_price}`;return a.map(key).sort().join('|')===b.map(key).sort().join('|');}
function photo(c,color,side){
 const s=state[c.key],v=s.before.sync_variants.find(v=>v.color===color&&v.size==='M');
 const mocks=s.tasks[tone(c,color)].mockups.filter(m=>m.variant_ids.includes(v.variant_id));
 for(const m of mocks){const x=m.extra?.find(x=>x.option?.toLowerCase()===side&&x.option_group==='Flat');if(x)return x.url;}
 const m=mocks.find(m=>m.mockup_url.includes(`-${side}-`));if(m)return m.mockup_url;
 throw Error(`Missing ${c.key} ${color} ${side} mockup`);
}
const only=args.find(a=>a.startsWith('--only='))?.slice(7).split(',');
if(only?.some(key=>!configs.some(c=>c.key===key)))throw Error('Unknown product selection');
for(const c of configs.filter(c=>!only||only.includes(c.key))){
 const s=state[c.key]??={tasks:{}};
 if(args.includes('--mockups')){
  s.before??=await pf(`/store/products/${c.id}`);identity(c,s.before);await save();
  const variants=s.before.sync_variants;
  const groups=Object.groupBy(variants.filter(v=>v.size==='M'),v=>tone(c,v.color));
  for(const [t,vs] of Object.entries(groups)){
   if(s.tasks[t])continue;
   const v=vs[0],files=v.files.filter(f=>f.type!=='preview').map(f=>({placement:f.type,image_url:f.type===backType(c)?backUrl(c,v):f.url,position:{area_width:f.width,area_height:f.height,width:f.width,height:f.height,top:0,left:0}}));
   const body={variant_ids:vs.map(v=>v.variant_id),format:'png',files,option_groups:['Flat'],options:['Front','Back'],...(c.crew?{technique:'DTFILM'}:{})};
   s.tasks[t]=await pf(`/mockup-generator/create-task/${v.product.product_id}`,body);await save();console.log('MOCKUPS',c.key,t,s.tasks[t].status);
   await new Promise(r=>setTimeout(r,6500));
  }
 }else if(args.includes('--poll')){
  for(const t of Object.keys(s.tasks)){if(s.tasks[t].status==='completed')continue;s.tasks[t]=await pf(`/mockup-generator/task?task_key=${encodeURIComponent(s.tasks[t].task_key)}`);await save();console.log(c.key,t,s.tasks[t].status);}
 }else if(args.includes('--publish')){
  if(!s.before||!Object.keys(s.tasks).length||Object.values(s.tasks).some(t=>t.status!=='completed'))throw Error('Finish and inspect mockups first');
  const current=await pf(`/store/products/${c.id}`);identity(c,current);
  if(!sameVariants(s.before.sync_variants,current.sync_variants))throw Error(`Variants changed since preparation: ${c.key}`);
  // Include EVERY current sync ID. Printful deletes omitted IDs in this endpoint.
  const sync_variants=current.sync_variants.map(v=>({id:v.id,files:v.files.filter(f=>f.type!=='preview').map(f=>f.type===backType(c)?{type:f.type,url:backUrl(c,v)}:{type:f.type,id:f.id})}));
  if(sync_variants.length!==c.count||new Set(sync_variants.map(v=>v.id)).size!==c.count)throw Error('Incomplete variant set');
  await pf(`/store/products/${c.id}`,{sync_product:{thumbnail:photo(c,current.sync_variants[0].color,'front')},sync_variants},'PUT');
  s.publishedAt=new Date().toISOString();await save();console.log('PUBLISHED',c.key,c.count);await new Promise(r=>setTimeout(r,6500));
 }else if(args.includes('--preview')||args.includes('--verify')){
  if(Object.values(s.tasks).some(t=>t.status!=='completed'))throw Error('Mockups pending');
  if(args.includes('--verify')){
   const d=await pf(`/store/products/${c.id}`);identity(c,d);if(!sameVariants(s.before.sync_variants,d.sync_variants))throw Error('Variant IDs/options/prices changed');
   for(const v of d.sync_variants){
    const b=v.files.find(f=>f.type===backType(c));if(b?.url!==backUrl(c,v)||b.status!=='ok')throw Error(`Back artwork not ready: ${c.key} ${v.color} ${v.size} ${b?.status}`);
    const old=s.before.sync_variants.find(o=>o.id===v.id);for(const f of old.files.filter(f=>f.type!=='preview'&&f.type!==backType(c))){if(!v.files.some(n=>n.type===f.type&&n.id===f.id))throw Error('Unrelated placement changed');}
   }
   s.verifiedAt=new Date().toISOString();await save();console.log('VERIFIED',c.key,d.sync_variants.length);
  }
  const colors=[...new Set(s.before.sync_variants.map(v=>v.color))];
  for(const color of colors)for(const side of ['front','back']){
   const r=await fetch(photo(c,color,side));if(!r.ok)throw Error('Mockup download failed');const data=Buffer.from(await r.arrayBuffer());
   const out=args.includes('--verify')?new URL(`public/shop/${side==='front'?'colors':'backs'}/`,root):new URL(`design/purple-rat-provider-preview/${c.key}/`,root);await mkdir(out,{recursive:true});
   await writeFile(new URL(args.includes('--verify')?`${c.id}-${slug(color)}.png`:`${slug(color)}-${side}.png`,out),data);
   if(args.includes('--verify')&&color===colors[0]){const dir=new URL(`public/shop/${side==='front'?'mockups':'backs'}/`,root);await mkdir(dir,{recursive:true});await writeFile(new URL(`${c.id}.png`,dir),data);}
  }
 }else throw Error('Choose --mockups, --poll, --preview, --publish, or --verify');
}
