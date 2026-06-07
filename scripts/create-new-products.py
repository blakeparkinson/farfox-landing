#!/usr/bin/env python3
"""
Create the 4 new Far Fox merch products (Par Avion, Same Sky, Far Fox Airways,
Two Time Zones) as Printful sync products. Reuses helpers from generate-mockups.py.
Usage: PF=<token> python3 scripts/create-new-products.py
"""
import os, time, json, importlib.util
spec = importlib.util.spec_from_file_location("gm", os.path.join(os.path.dirname(__file__), "generate-mockups.py"))
gm = importlib.util.module_from_spec(spec); spec.loader.exec_module(gm)

SITE = "https://lovefarfox.com"
TEE_SIZES = ["S", "M", "L", "XL", "2XL"]

# name, catalog pid, preferred colors, sizes(None=all), design url, file type, retail
CONFIGS = [
    ('Far Fox — "Par Avion" Art Print', 1, ["White"], None,
     f"{SITE}/shop/designs/airmail.png", "default", "24.00"),
    ('Far Fox — "Under the Same Sky" Art Print', 1, ["White"], None,
     f"{SITE}/shop/designs/constellation.png", "default", "24.00"),
    ('Far Fox — Far Fox Airways Mug', 19, ["White"], None,
     f"{SITE}/shop/designs/boardingpass.png", "default", "18.00"),
    ('Far Fox — Two Time Zones Tee', 71, ["Natural", "Soft Cream", "White"], TEE_SIZES,
     f"{SITE}/shop/designs/timezones.png", "front", "30.00"),
]

def variants_for(pid, colors, sizes, store):
    allv = []
    for off in range(0, 600, 100):
        d = gm.jget(f"{gm.API}/v2/catalog-products/{pid}/catalog-variants?limit=100&offset={off}", store=store)
        allv += d.get("data", [])
        if off + 100 >= d.get("paging", {}).get("total", 0): break
    picked = []
    for color in (colors or [None]):
        cand = [v for v in allv if (color is None or v.get("color") == color)]
        if sizes: cand = [v for v in cand if v.get("size") in sizes]
        if cand: picked = cand; break
    if not picked: picked = allv[:1]
    return picked

def create(name, pid, colors, sizes, design, ftype, retail, store):
    vs = variants_for(pid, colors, sizes, store)
    body = {"sync_product": {"name": name},
            "sync_variants": [{"retail_price": retail, "variant_id": v["id"],
                               "files": [{"url": design, "type": ftype}]} for v in vs]}
    r = json.loads(gm.req("POST", f"{gm.API}/store/products", body, store=store))
    res = r.get("result", {})
    print(f"  ✓ {name}  → id {res.get('id')}, {res.get('synced')}/{res.get('variants')} variants @ ${retail}")
    return res.get("id")

if __name__ == "__main__":
    STORE, sname = gm.discover_store()
    print(f"Store {sname} ({STORE})")
    ids = {}
    for cfg in CONFIGS:
        try:
            pid = create(*cfg, store=STORE)
            ids[cfg[0]] = pid
        except Exception as e:
            print(f"  ✗ {cfg[0]} failed: {str(e)[:300]}")
        time.sleep(6)
    print("IDS:", json.dumps(ids))
