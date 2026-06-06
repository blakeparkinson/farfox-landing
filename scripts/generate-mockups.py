#!/usr/bin/env python3
"""
Generate real Printful product mockups for the Far Fox shop and save them
into public/shop/. Reads the Printful token from the PF env var (never
committed). Auto-discovers the store id, picks a tasteful cream/white
variant per product, generates v2 mockup tasks, polls them, and downloads
the resulting product photos.

Usage:  PF=<printful_token> python3 scripts/generate-mockups.py
Requires: at least one store to exist in the Printful account (create one
in the dashboard → Stores → "Manual order / API platform").
"""
import os, json, time, urllib.request, urllib.error

PF = os.environ["PF"]
API = "https://api.printful.com"
HDR = {"Authorization": f"Bearer {PF}", "Content-Type": "application/json"}
SITE = "https://lovefarfox.com"

# product_id, output filename, fox art url, preferred colors (first match wins)
PRODUCTS = [
    (71,  "tee.png",            f"{SITE}/fox-logo.png",     ["Soft Cream", "Natural", "White"]),
    (294, "hoodie.png",         f"{SITE}/fox-letter.png",   ["Soft Cream", "Natural", "White", "Sand"]),
    (19,  "mug.png",            f"{SITE}/fox-logo.png",     ["White"]),
    (84,  "tote.png",           f"{SITE}/fox-sleeping.png", ["Natural", "White"]),
    (957, "sticker-single.png", f"{SITE}/fox-logo.png",     ["White"]),
    (1,   "print.png",          f"{SITE}/fox-letter.png",   ["White"]),
]

def req(method, url, body=None, store=None):
    h = dict(HDR)
    if store: h["X-PF-Store-Id"] = str(store)
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(url, data=data, headers=h, method=method)
    try:
        return urllib.request.urlopen(r).read()
    except urllib.error.HTTPError as e:
        raise SystemExit(f"{method} {url} -> {e.code}: {e.read().decode()[:400]}")

def jget(url, store=None): return json.loads(req("GET", url, store=store))

def discover_store():
    d = jget(f"{API}/v2/stores")
    stores = d.get("data", [])
    if not stores:
        raise SystemExit("No Printful store found. Create one in the dashboard "
                         "(Stores → add a 'Manual order / API platform' store), then rerun.")
    return stores[0]["id"], stores[0].get("name")

def pick_variant(pid, prefer):
    variants = []
    for off in range(0, 600, 100):
        d = jget(f"{API}/v2/catalog-products/{pid}/catalog-variants?limit=100&offset={off}")
        variants += d.get("data", [])
        if off + 100 >= d.get("paging", {}).get("total", 0): break
    # prefer a size M in a preferred color, else any preferred color, else first
    for color in prefer:
        for v in variants:
            if v.get("color") == color and v.get("size") in (None, "", "M", "11oz", "One size", "9″×11″", "18″×24″"):
                return v["id"]
        for v in variants:
            if v.get("color") == color:
                return v["id"]
    return variants[0]["id"]

def styles(pid):
    d = jget(f"{API}/v2/catalog-products/{pid}/mockup-styles")
    placements = d.get("data", [])
    # prefer a lifestyle/front style; fall back to first
    front = next((p for p in placements if p["placement"] in ("front", "default")), placements[0])
    style_id = None
    for p in placements:
        for s in p.get("mockup_styles", []):
            if "lifestyle" in (s.get("category_name", "").lower()):
                style_id = s["id"]; break
        if style_id: break
    if style_id is None and front.get("mockup_styles"):
        style_id = front["mockup_styles"][0]["id"]
    return front["placement"], front["technique"], style_id

def generate(store, pid, fname, art, prefer):
    vid = pick_variant(pid, prefer)
    placement, technique, style_id = styles(pid)
    product = {
        "source": "catalog",
        "catalog_product_id": pid,
        "catalog_variant_ids": [vid],
        "placements": [{
            "placement": placement,
            "technique": technique,
            "layers": [{"type": "file", "url": art}],
        }],
    }
    if style_id:
        product["mockup_style_ids"] = [style_id]
    body = {"format": "jpg", "products": [product]}
    task = json.loads(req("POST", f"{API}/v2/mockup-tasks", body, store=store))
    tid = task["data"][0]["id"] if isinstance(task.get("data"), list) else task["data"]["id"]
    # poll
    for _ in range(40):
        time.sleep(3)
        st = jget(f"{API}/v2/mockup-tasks?id={tid}", store=store)
        row = st["data"][0] if isinstance(st.get("data"), list) else st["data"]
        if row.get("status") == "completed":
            mocks = row.get("mockups", [])
            url = mocks[0]["mockup_url"] if mocks else None
            if not url: raise SystemExit(f"{fname}: completed but no mockup url: {json.dumps(row)[:300]}")
            img = urllib.request.urlopen(url).read()
            out = os.path.join("public/shop", fname)
            with open(out, "wb") as f: f.write(img)
            print(f"  ✓ {fname}  (variant {vid}, style {style_id})")
            return
        if row.get("status") == "failed":
            raise SystemExit(f"{fname}: task failed: {json.dumps(row)[:300]}")
    raise SystemExit(f"{fname}: timed out polling")

if __name__ == "__main__":
    sid, sname = discover_store()
    print(f"Store: {sname} ({sid})")
    for pid, fname, art, prefer in PRODUCTS:
        print(f"Generating {fname} from product {pid} …")
        generate(sid, pid, fname, art, prefer)
    print("Done. Real mockups saved to public/shop/.")
