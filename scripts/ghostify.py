#!/usr/bin/env python3
"""Regenerate every apparel mockup as a ghost-mannequin (no models).
Jerseys (AOP) + color tees/hoodie (per-colour swatch images). Usage: PF=<token> python3 scripts/ghostify.py"""
import importlib.util, json, time, os, urllib.request
spec=importlib.util.spec_from_file_location("gm","scripts/generate-mockups.py")
gm=importlib.util.module_from_spec(spec); spec.loader.exec_module(gm)
sid,_=gm.discover_store()
GHOST={644:(4717,4718,True),792:(23716,23717,True),71:(1120,1121,False),294:(22528,22529,False)}  # front,back,is_aop
def slug(s): return s.lower().replace(" ","-")
def poll(tid):
    for _ in range(100):
        time.sleep(4)
        st=gm.jget(f"{gm.API}/v2/mockup-tasks?id={tid}",store=sid)
        row=st["data"][0] if isinstance(st.get("data"),list) else st["data"]
        if row.get("status")=="completed": return row
        if row.get("status")=="failed": return None
    return None
def task(catpid,vids,placements,style,stitch):
    prod={"source":"catalog","catalog_product_id":catpid,"catalog_variant_ids":vids,
          "placements":placements,"mockup_style_ids":[style]}
    if stitch: prod["product_options"]=[{"name":"stitch_color","value":stitch}]
    for attempt in range(4):
        r=json.loads(gm.req("POST",f"{gm.API}/v2/mockup-tasks",{"format":"jpg","products":[prod]},store=sid))
        tid=r["data"][0]["id"] if isinstance(r.get("data"),list) else r["data"]["id"]
        row=poll(tid)
        if row: return row
        time.sleep(20)
    return None
def save(url,out):
    open(out,"wb").write(urllib.request.urlopen(url).read())

prods=gm.jget(f"{gm.API}/store/products?limit=100",store=sid)
items=prods if isinstance(prods,list) else prods.get("result",[])
for p in items:
    pid=p["id"]; d=json.loads(gm.req("GET",f"{gm.API}/store/products/{pid}",store=sid))["result"]
    svs=[v for v in d["sync_variants"] if not v.get("is_ignored")]
    if not svs: continue
    catpid=svs[0].get("product",{}).get("product_id")
    if catpid not in GHOST: continue
    fstyle,bstyle,is_aop=GHOST[catpid]
    stitch="black" if is_aop else None
    def placements_of(variant):
        pls=[]
        for fobj in variant.get("files",[]):
            t=fobj.get("type")
            if t in ("preview",): continue
            tt="front" if t=="default" else t
            url=fobj.get("url")
            if url: pls.append({"placement":tt,"technique":("cut-sew" if is_aop else "dtg"),"layers":[{"type":"file","url":url}]})
        return pls
    if is_aop:
        v=svs[0]; pls=placements_of(v); vid=v["variant_id"]
        rowf=task(catpid,[vid],pls,fstyle,stitch)
        if rowf:
            for cvm in rowf.get("catalog_variant_mockups",[]):
                for mk in cvm.get("mockups",[]):
                    if mk.get("mockup_url"): save(mk["mockup_url"],f"public/shop/mockups/{pid}.png"); break
        time.sleep(20)
        rowb=task(catpid,[vid],pls,bstyle,stitch)
        if rowb:
            for cvm in rowb.get("catalog_variant_mockups",[]):
                for mk in cvm.get("mockups",[]):
                    if mk.get("mockup_url"): save(mk["mockup_url"],f"public/shop/backs/{pid}.png"); break
        print(f"  ✓ jersey {pid} ghost"); time.sleep(20); continue
    # DTG colour product: group variants by front-file (light vs dark design)
    groups={}
    for v in svs:
        key=tuple(sorted((f.get("type"),f.get("url")) for f in v.get("files",[]) if f.get("type") not in ("preview",) and f.get("url")))
        groups.setdefault(key,[]).append(v)
    revcolor={v["variant_id"]:v.get("color") for v in svs}
    # FRONT per colour (one task per design group)
    for key,gvars in groups.items():
        vids=[v["variant_id"] for v in gvars]
        pls=placements_of(gvars[0])
        # take only front placement for front render
        plsF=[x for x in pls if x["placement"]=="front"] or pls[:1]
        for i in range(0,len(vids),40):
            chunk=vids[i:i+40]
            row=task(catpid,chunk,plsF,fstyle,None)
            if row:
                for cvm in row.get("catalog_variant_mockups",[]):
                    vid=cvm.get("catalog_variant_id"); color=revcolor.get(vid)
                    for mk in cvm.get("mockups",[]):
                        if mk.get("mockup_url") and color: save(mk["mockup_url"],f"public/shop/colors/{pid}-{slug(color)}.png"); break
            time.sleep(20)
    # main image = white (or first) colour
    for pref in ["white","natural","ash"]:
        cand=f"public/shop/colors/{pid}-{pref}.png"
        if os.path.exists(cand): import shutil; shutil.copy(cand,f"public/shop/mockups/{pid}.png"); break
    # BACK single ghost (first group / light design)
    g0=list(groups.values())[0]; pls=placements_of(g0[0])
    rowb=task(catpid,[g0[0]["variant_id"]],pls,bstyle,None)
    if rowb:
        for cvm in rowb.get("catalog_variant_mockups",[]):
            for mk in cvm.get("mockups",[]):
                if mk.get("mockup_url"): save(mk["mockup_url"],f"public/shop/backs/{pid}.png"); break
    print(f"  ✓ apparel {pid} ghost ({len(svs)} variants, {len(groups)} design-groups)"); time.sleep(20)
print("GHOSTIFY DONE")
