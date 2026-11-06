/** Release only the approved Bowling Club crewneck. Never places an order. */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const stateFile = new URL('design/prime-menagerie-bowling-club/release-state.json', root);
const state = JSON.parse(await readFile(stateFile,'utf8').catch(()=>'{}'));
const args = process.argv.slice(2);
const base = args.find(a=>a.startsWith('--files-base='))?.slice(13) || state.filesBase;
if (!base || !process.env.PRINTFUL_TOKEN) throw new Error('Artwork URL and PRINTFUL_TOKEN required.');
if (state.filesBase && state.filesBase !== base) throw new Error('Artwork URL differs from this release state.');
const NAME = 'Prime Menagerie Bowling Club Crewneck';
const COLOR = 'Blue Spruce';
const SIZES = ['S','M','L','XL','2XL','3XL'];
const PRICE = '59.00';
const files = [{type:'default',url:`${base}/front.png`},{type:'back',url:`${base}/back.png`}];
const headers = {Authorization:`Bearer ${process.env.PRINTFUL_TOKEN}`,'X-PF-Store-Id':process.env.PRINTFUL_STORE_ID || '18292625','Content-Type':'application/json'};
async function pf(path,body) {
  const r=await fetch(`https://api.printful.com${path}`,{method:body?'POST':'GET',headers,...(body?{body:JSON.stringify(body)}:{})});
  const j=await r.json();
  if(!r.ok)throw new Error(`Printful ${r.status}: ${j.error?.message || JSON.stringify(j.result)}`);
  return j.result;
}
const persist=async()=>{state.filesBase=base;await writeFile(stateFile,JSON.stringify(state,null,2)+'\n');};
function photoFor(placement){
  const mock=state.task?.mockups?.find(m=>m.placement===placement);
  const explicit=mock?.extra?.find(e=>e.option?.toLowerCase()===placement && e.option_group==='Flat');
  if(explicit)return explicit.url;
  if(mock?.mockup_url.includes(`-${placement}-`))return mock.mockup_url;
  throw new Error(`No unambiguous ${placement} provider photo.`);
}
async function catalog(){
  const all=(await pf('/products/839')).variants;
  return SIZES.map(size=>{
    const v=all.find(v=>v.color===COLOR && v.size===size);
    if(!v?.in_stock)throw new Error(`${COLOR} ${size} unavailable.`);
    return v;
  });
}
if(args.includes('--mockups')){
  if(state.task)throw new Error('Mockup task already exists; poll it.');
  state.variants=await catalog();
  const spec=await pf('/mockup-generator/printfiles/839');
  const medium=state.variants.find(v=>v.size==='M');
  const placements=spec.variant_printfiles.find(v=>v.variant_id===medium.id).placements;
  const mockFiles=files.map(f=>{
    const placement=f.type==='default'?'front':f.type;
    const area=spec.printfiles.find(p=>p.printfile_id===placements[placement]);
    if(area?.width!==1800 || area?.height!==2400)throw new Error('Unexpected print area.');
    return {placement,image_url:f.url,position:{area_width:1800,area_height:2400,width:1800,height:2400,top:0,left:0}};
  });
  for(const f of files){const r=await fetch(f.url,{method:'HEAD'});if(!r.ok)throw new Error(`Artwork inaccessible ${r.status}`);}
  state.task=await pf('/mockup-generator/create-task/839',{variant_ids:[medium.id],format:'png',files:mockFiles,option_groups:['Flat'],options:['Front','Back']});
  await persist();console.log({status:state.task.status});
}else if(args.includes('--poll')){
  if(!state.task)throw new Error('No mockup task.');
  if(state.task.status!=='completed')state.task=await pf(`/mockup-generator/task?task_key=${encodeURIComponent(state.task.task_key)}`);
  await persist();console.log({status:state.task.status,mockups:state.task.mockups?.map(m=>({placement:m.placement,variants:m.variant_ids,extra:m.extra?.length}))});
}else if(args.includes('--create')){
  if(state.task?.status!=='completed')throw new Error('Complete and inspect the provider mockups first.');
  const existing=(await pf('/store/products?limit=100')).find(p=>p.name===NAME);
  if(existing){state.productId=existing.id;await persist();console.log({existing:existing.id});process.exit(0);}
  state.variants=await catalog();
  const created=await pf('/store/products',{sync_product:{name:NAME,thumbnail:photoFor('front')},sync_variants:state.variants.map(v=>({variant_id:v.id,external_id:`pm-bowling-blue-spruce-${v.size.toLowerCase()}`,retail_price:PRICE,files}))});
  state.productId=created.id;await persist();console.log({productId:created.id,name:NAME,variants:state.variants.length,price:PRICE});
}else if(args.includes('--verify')){
  if(!state.productId)throw new Error('Product not created.');
  const detail=await pf(`/store/products/${state.productId}`);
  if(detail.sync_product.name!==NAME || detail.sync_variants.length!==SIZES.length)throw new Error('Unexpected product or variant count.');
  for(const size of SIZES){
    const v=detail.sync_variants.find(v=>v.color===COLOR && v.size===size);
    if(!v || v.variant_id!==state.variants.find(c=>c.size===size).id || Number(v.retail_price)!==59)throw new Error(`Variant/price mismatch: ${size}`);
    for(const f of files){const a=v.files.find(a=>a.type===f.type);if(a?.url!==f.url || a.status!=='ok')throw new Error(`Artwork not ready: ${size} ${f.type} (${a?.status})`);}
  }
  for(const placement of ['front','back']){
    const r=await fetch(photoFor(placement));if(!r.ok)throw new Error(`Mockup download ${r.status}`);
    const data=Buffer.from(await r.arrayBuffer());
    const out=new URL(`public/shop/${placement==='front'?'colors':'backs'}/`,root);await mkdir(out,{recursive:true});
    await writeFile(new URL(`${state.productId}-blue-spruce.png`,out),data);
    if(placement==='back')await writeFile(new URL(`${state.productId}.png`,out),data);
    else {const ov=new URL('public/shop/mockups/',root);await mkdir(ov,{recursive:true});await writeFile(new URL(`${state.productId}.png`,ov),data);}
  }
  state.verifiedAt=new Date().toISOString();await persist();console.log({verified:NAME,id:state.productId,color:COLOR,sizes:SIZES,price:PRICE});
}else if(args.includes('--preview')){
  if(state.task?.status!=='completed')throw new Error('Mockups not complete.');
  const out=new URL('design/prime-menagerie-bowling-club/provider-preview/',root);await mkdir(out,{recursive:true});
  for(const placement of ['front','back']){const r=await fetch(photoFor(placement));if(!r.ok)throw new Error(`Preview ${r.status}`);await writeFile(new URL(`${placement}.png`,out),Buffer.from(await r.arrayBuffer()));}
  console.log('Saved provider previews.');
}else throw new Error('Choose --mockups, --poll, --preview, --create or --verify.');
