#!/usr/bin/env python3
"""Ghost-mannequin regen for DTG color apparel (tees + hoodie) — robust.
One variant per colour, 500-retry, per-product isolation. PF=<token> python3 scripts/ghostify2.py"""
import importlib.util, json, time, os, urllib.request, shutil
spec=importlib.util.spec_from_file_location("gm","scripts/generate-mockups.py")
gm=importlib.util.module_from_spec(spec); spec.loader.exec_module(gm)
sid,_=gm.discover_store()
GHOST={71:(1120,1121),294:(22528,22529)}
def slug(s): return s.lower().replace(" ","-")
def poll(tid):
    for _ in range(100):
        time.sleep(4)
        st=gm.jget(f"{gm.API}/v2/mockup-tasks?id={tid}",store=sid)
        row=st["data"][0] if isinstance(st.get("data"),list) else st["data"]
        if row.get("status")=="completed": return row
        if row.get("status")=="failed": return None
    return None
def task(catpid,vids,placements,style):
    prod={"source":"catalog","catalog_product_id":catpid,"catalog_variant_ids":vids,
          "placements":placements,"mockup_style_ids":[style]}
    for attempt in range(5):
        try:
            r=json.loads(gm.req("POST",f"{gm.API}/v2/mockup-tasks",{"format":"jpg","products":[prod]},store=sid))
            tid=r["data"][0]["id"] if isinstance(r.get("data"),list) else r["data"]["id"]
            row=poll(tid)
            if row: return row
        except Exception as e:
            print("    task error, retry:",str(e)[:80])
        time.sleep(20)
    return None
def save(url,out): open(out,"wb").write(urllib.request.urlopen(url).read())

prods=gm.jget(f"{gm.API}/store/products?limit=100",store=sid)
items=prods if isinstance(prods,list) else prods.get("result",[])
for p in items:
    pid=p["id"]
    try:
        d=json.loads(gm.req("GET",f"{gm.API}/store/products/{pid}",store=sid))["result"]
        svs=[v for v in d["sync_variants"] if not v.get("is_ignored")]
        if not svs: continue
        catpid=svs[0].get("product",{}).get("product_id")
        if catpid not in GHOST: continue
        fstyle,bstyle=GHOST[catpid]
        def pls_of(v,fronly=False):
            out=[]
            for f in v.get("files",[]):
                t=f.get("type");
                if t in ("preview",) or not f.get("url"): continue
                tt="front" if t=="default" else t
                if fronly and tt!="front": continue
                out.append({"placement":tt,"technique":"dtg","layers":[{"type":"file","url":f["url"]}]})
            return out
        # group variants by their file-set (light vs dark design)
        groups={}
        for v in svs:
            key=tuple(sorted((f.get("type"),f.get("url")) for f in v.get("files",[]) if f.get("type") not in ("preview",) and f.get("url")))
            groups.setdefault(key,[]).append(v)
        rev={v["variant_id"]:v.get("color") for v in svs}
        # FRONT: one variant per colour per group
        for gvars in groups.values():
            byc={}
            for v in gvars: byc.setdefault(v.get("color"),v)
            vids=[v["variant_id"] for v in byc.values()]
            row=task(catpid,vids,pls_of(gvars[0],fronly=True),fstyle)
            if row:
                for cvm in row.get("catalog_variant_mockups",[]):
                    vid=cvm.get("catalog_variant_id"); color=rev.get(vid)
                    for mk in cvm.get("mockups",[]):
                        if mk.get("mockup_url") and color: save(mk["mockup_url"],f"public/shop/colors/{pid}-{slug(color)}.png"); break
            time.sleep(15)
        # main image = preferred light colour
        for pref in ["white","natural","ash","athletic-heather"]:
            c=f"public/shop/colors/{pid}-{pref}.png"
            if os.path.exists(c): shutil.copy(c,f"public/shop/mockups/{pid}.png"); break
        # BACK: single ghost (first group)
        g0=list(groups.values())[0]
        rowb=task(catpid,[g0[0]["variant_id"]],pls_of(g0[0]),bstyle)
        if rowb:
            for cvm in rowb.get("catalog_variant_mockups",[]):
                for mk in cvm.get("mockups",[]):
                    if mk.get("mockup_url"): save(mk["mockup_url"],f"public/shop/backs/{pid}.png"); break
        print(f"  ✓ {pid} ghost ({len(svs)} variants, {len(groups)} groups)"); time.sleep(15)
    except Exception as e:
        print(f"  ✗ {pid} failed: {str(e)[:120]}")
print("DTG GHOSTIFY DONE")
