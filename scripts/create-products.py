#!/usr/bin/env python3
"""
Create sellable Printful sync products for the Far Fox shop.
Usage: PF=<token> python3 scripts/create-products.py
Reuses helpers from generate-mockups.py. (The "Worth Every Mile" tee was
created separately and is excluded here to avoid a duplicate.)
"""
import os, time, json, importlib.util
spec = importlib.util.spec_from_file_location("gm", os.path.join(os.path.dirname(__file__), "generate-mockups.py"))
gm = importlib.util.module_from_spec(spec); spec.loader.exec_module(gm)

SITE = "https://lovefarfox.com"
TEE_SIZES = ["S", "M", "L", "XL", "2XL"]

# name, catalog pid, preferred colors, sizes(None=all), design url, file type, retail
CONFIGS = [
    ('Far Fox — Long Distance Club Tee', 71, ["Natural","Soft Cream","White"], TEE_SIZES,
     f"{SITE}/shop/designs/long-distance-club.png", "front", "30.00"),
    ('Far Fox — Heart Eyes Tee', 71, ["Soft Cream","Natural","White"], TEE_SIZES,
     f"{SITE}/fox-logo.png", "front", "28.00"),
    ('Far Fox — Love Letter Hoodie', 294, ["Sand","Natural","White","Soft Cream"], TEE_SIZES,
     f"{SITE}/fox-letter.png", "front", "48.00"),
    ('Far Fox — "Same Moon" Mug', 19, ["White"], None,
     f"{SITE}/shop/designs/same-moon.png", "default", "18.00"),
    ('Far Fox — Heart Eyes Mug', 19, ["White"], None,
     f"{SITE}/fox-logo.png", "default", "18.00"),
    ('Far Fox — "Miss You" Sticker', 957, ["White"], None,
     f"{SITE}/shop/designs/miss-you.png", "default", "4.50"),
    ('Far Fox — "Miss You Too" Sticker', 957, ["White"], None,
     f"{SITE}/shop/designs/miss-you-too.png", "default", "4.50"),
    ('Far Fox — Die-Cut Sticker', 957, ["White"], None,
     f"{SITE}/fox-logo.png", "default", "4.50"),
    ('Far Fox — Art Print', 1, ["White"], None,
     f"{SITE}/fox-letter.png", "default", "20.00"),
]

def variants_for(pid, colors, sizes):
    allv=[]
    for off in range(0,600,100):
        d=gm.jget(f"{gm.API}/v2/catalog-products/{pid}/catalog-variants?limit=100&offset={off}", store=STORE)
        allv+=d.get("data",[])
        if off+100>=d.get("paging",{}).get("total",0): break
    picked=[]
    for color in (colors or [None]):
        cand=[v for v in allv if (color is None or v.get("color")==color)]
        if sizes: cand=[v for v in cand if v.get("size") in sizes]
        if cand: picked=cand; break
    if not picked: picked=allv[:1]
    return picked

def create(name, pid, colors, sizes, design, ftype, retail):
    vs=variants_for(pid, colors, sizes)
    body={"sync_product":{"name":name},
          "sync_variants":[{"retail_price":retail,"variant_id":v["id"],
                            "files":[{"url":design,"type":ftype}]} for v in vs]}
    r=json.loads(gm.req("POST", f"{gm.API}/store/products", body, store=STORE))
    res=r.get("result",{})
    print(f"  ✓ {name}  → id {res.get('id')}, {res.get('synced')}/{res.get('variants')} variants @ ${retail}")

if __name__ == "__main__":
    STORE,_=gm.discover_store()
    print(f"Store {STORE}")
    for i,cfg in enumerate(CONFIGS):
        try: create(*cfg)
        except Exception as e: print(f"  ✗ {cfg[0]} failed: {str(e)[:200]}")
        time.sleep(5)
    print("Done. Review/publish in the Printful dashboard.")
