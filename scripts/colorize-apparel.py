#!/usr/bin/env python3
"""
Expand each apparel product into a full colour x size variant matrix.
Light colours use the dark-ink design; dark colours use the cream reverse.
Updates existing sync products in place (PUT) so ids/mockups are preserved.
Usage: PF=<token> python3 scripts/colorize-apparel.py
"""
import importlib.util, json, time
spec=importlib.util.spec_from_file_location("gm","scripts/generate-mockups.py")
gm=importlib.util.module_from_spec(spec); spec.loader.exec_module(gm)
SITE="https://lovefarfox.com"; SID,_=gm.discover_store()
SIZES=["S","M","L","XL","2XL"]
TEE_LIGHT=["White","Natural","Ash","Soft Pink","Heather Prism Ice Blue","Yellow"]
TEE_DARK =["Black","Navy","Maroon"]
HOOD_LIGHT=["White","Athletic Heather","Lilac"]
HOOD_DARK =["Black","Heather Navy","Maroon"]

def url(f): return f"{SITE}/{f}" if f.startswith("fox-") else f"{SITE}/shop/designs/{f}"
def files(specs): return [{"url":url(f),"type":t} for (t,f) in specs]

# id, catalog pid, light file specs, dark file specs, retail, hoodie?
PRODUCTS=[
 (436909622,71,[("front","morse.png")],[("front","morse-dark.png")],"30.00",False),
 (436908862,71,[("front","timezones.png")],[("front","timezones-dark.png")],"30.00",False),
 (436909615,71,[("front","ldc-front.png"),("back","ldc-back.png")],
                [("front","ldc-front-dark.png"),("back","ldc-back-dark.png")],"32.00",False),
 (436883116,71,[("front","club.png")],[("front","club-dark.png")],"30.00",False),
 (436882976,71,[("front","mile.png")],[("front","mile-dark.png")],"30.00",False),
 (436883133,71,[("front","fox-logo.png")],[("front","fox-logo.png")],"28.00",False),
 (436883154,294,[("front","hoodie.png")],[("front","hoodie-dark.png")],"48.00",True),
]

def variant_map(pid):
    m={}
    for off in range(0,800,100):
        d=gm.jget(f"{gm.API}/v2/catalog-products/{pid}/catalog-variants?limit=100&offset={off}")
        for v in d.get("data",[]):
            m[(v.get("color"),v.get("size"))]=v["id"]
        if off+100>=d.get("paging",{}).get("total",0): break
    return m

MAPS={71:variant_map(71),294:variant_map(294)}

def colorize(pid_id,pid,light_specs,dark_specs,retail,hoodie):
    vm=MAPS[pid]
    lights=HOOD_LIGHT if hoodie else TEE_LIGHT
    darks =HOOD_DARK  if hoodie else TEE_DARK
    sv=[]
    for color in lights:
        for size in SIZES:
            vid=vm.get((color,size))
            if vid: sv.append({"variant_id":vid,"retail_price":retail,"files":files(light_specs)})
    for color in darks:
        for size in SIZES:
            vid=vm.get((color,size))
            if vid: sv.append({"variant_id":vid,"retail_price":retail,"files":files(dark_specs)})
    body={"sync_variants":sv}
    r=json.loads(gm.req("PUT",f"{gm.API}/store/products/{pid_id}",body,store=SID))
    res=r.get("result",{})
    print(f"  ✓ {pid_id}: {res.get('synced')}/{res.get('variants')} variants ({len(sv)} requested)")

for cfg in PRODUCTS:
    try: colorize(*cfg)
    except Exception as e: print(f"  ✗ {cfg[0]} failed: {str(e)[:240]}")
    time.sleep(8)
print("done")
