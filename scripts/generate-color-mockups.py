#!/usr/bin/env python3
"""
Generate one Printful mockup PER COLOUR for each apparel product, so the shop
can swap the image when a colour swatch is clicked.

Batches by light/dark group (one mockup task per group returns a mockup for
every colour in it). Saves to public/shop/colors/<syncProductId>-<slug>.png.
Usage: PF=<token> python3 scripts/generate-color-mockups.py
"""
import importlib.util, json, time, os, urllib.request
spec=importlib.util.spec_from_file_location("gm","scripts/generate-mockups.py")
gm=importlib.util.module_from_spec(spec); spec.loader.exec_module(gm)
SITE="https://lovefarfox.com"; SID,_=gm.discover_store()
OUT="public/shop/colors"; os.makedirs(OUT,exist_ok=True)

TEE_LIGHT=["White","Natural","Ash","Soft Pink","Heather Prism Ice Blue","Yellow"]
TEE_DARK =["Black","Navy","Maroon"]
HOOD_LIGHT=["White","Athletic Heather","Lilac"]
HOOD_DARK =["Black","Heather Navy","Maroon"]
def url(f): return f"{SITE}/{f}" if f.startswith("fox-") else f"{SITE}/shop/designs/{f}"
def slug(s): return s.lower().replace(" ","-")

# syncId, pid, style, [(placement, lightfile)], [(placement, darkfile)]
PRODUCTS=[
 (436909622,71,768,[("front","morse.png")],[("front","morse-dark.png")]),
 (436908862,71,744,[("front","timezones.png")],[("front","timezones-dark.png")]),
 (436909615,71,745,[("front","ldc-front.png"),("back","ldc-back.png")],
                   [("front","ldc-front-dark.png"),("back","ldc-back-dark.png")]),
 (436883116,71,839,[("front","club.png")],[("front","club-dark.png")]),
 (436882976,71,798,[("front","mile.png")],[("front","mile-dark.png")]),
 (436883133,71,758,[("front","fox-logo.png")],[("front","fox-logo.png")]),
 (436883154,294,None,[("front","hoodie.png")],[("front","hoodie-dark.png")]),
]

def vmap(pid):
    by={}; rev={}
    for off in range(0,800,100):
        d=gm.jget(f"{gm.API}/v2/catalog-products/{pid}/catalog-variants?limit=100&offset={off}")
        for v in d.get("data",[]):
            by[(v.get("color"),v.get("size"))]=v["id"]; rev[v["id"]]=v.get("color")
        if off+100>=d.get("paging",{}).get("total",0): break
    return by,rev
MAPS={71:vmap(71),294:vmap(294)}
TECH={pid:gm.styles(pid)[1] for pid in (71,294)}
HOOD_STYLE=gm.styles(294)[2]

def pick_ids(pid,colors):
    by,_=MAPS[pid]; ids=[]
    for c in colors:
        vid=by.get((c,"M")) or next((by[k] for k in by if k[0]==c),None)
        if vid: ids.append((c,vid))
    return ids

def run_group(syncId,pid,style,files,colors):
    ids=pick_ids(pid,colors)
    if not ids: return 0
    tech=TECH[pid]
    placements=[{"placement":pl,"technique":tech,"layers":[{"type":"file","url":url(f)}]} for pl,f in files]
    product={"source":"catalog","catalog_product_id":pid,
             "catalog_variant_ids":[v for _,v in ids],"placements":placements}
    if style: product["mockup_style_ids"]=[style]
    body={"format":"jpg","products":[product]}
    task=gm.create_task(SID,body)
    tid=task["data"][0]["id"] if isinstance(task.get("data"),list) else task["data"]["id"]
    _,rev=MAPS[pid]; saved=0
    for _ in range(80):
        time.sleep(4)
        st=gm.jget(f"{gm.API}/v2/mockup-tasks?id={tid}",store=SID)
        row=st["data"][0] if isinstance(st.get("data"),list) else st["data"]
        if row.get("status")=="completed":
            for cvm in row.get("catalog_variant_mockups",[]):
                vid=cvm.get("catalog_variant_id"); color=rev.get(vid)
                u=None
                for mk in cvm.get("mockups",[]):
                    if mk.get("mockup_url"): u=mk["mockup_url"]; break
                if u and color:
                    open(f"{OUT}/{syncId}-{slug(color)}.png","wb").write(urllib.request.urlopen(u).read()); saved+=1
            return saved
        if row.get("status")=="failed": print("  fail",json.dumps(row)[:160]); return 0
    return 0

total=0
for syncId,pid,style,lf,df in PRODUCTS:
    st_use=HOOD_STYLE if (pid==294 and style is None) else style
    lc=HOOD_LIGHT if pid==294 else TEE_LIGHT
    dc=HOOD_DARK  if pid==294 else TEE_DARK
    n1=run_group(syncId,pid,st_use,lf,lc); time.sleep(20)
    n2=run_group(syncId,pid,st_use,df,dc); time.sleep(20)
    print(f"  ✓ {syncId}: {n1}+{n2} colour mockups"); total+=n1+n2
print(f"done — {total} colour mockups in {OUT}")
