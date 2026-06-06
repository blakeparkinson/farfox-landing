#!/usr/bin/env python3
"""
Mock up the original Far Fox *designs* (public/shop/designs/*) on real
products via Printful, reusing the helpers in generate-mockups.py.
Usage: PF=<token> python3 scripts/generate-design-mockups.py
"""
import os, time, importlib.util

spec = importlib.util.spec_from_file_location("gm", os.path.join(os.path.dirname(__file__), "generate-mockups.py"))
gm = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gm)

SITE = "https://lovefarfox.com"
# (catalog_product_id, output filename, design url, preferred colors)
DESIGNS = [
    (71,  "design-mile-tee.png",      f"{SITE}/shop/designs/worth-every-mile.png",   ["White", "Soft Cream", "Natural"]),
    (71,  "design-club-tee.png",      f"{SITE}/shop/designs/long-distance-club.png", ["Natural", "Soft Cream", "White"]),
    (19,  "design-moon-mug.png",      f"{SITE}/shop/designs/same-moon.png",          ["White"]),
    (957, "design-missyou-sticker.png", f"{SITE}/shop/designs/miss-you.png",         ["White"]),
]

if __name__ == "__main__":
    sid, sname = gm.discover_store()
    print(f"Store: {sname} ({sid})")
    for i, (pid, fname, art, prefer) in enumerate(DESIGNS):
        print(f"Generating {fname} …")
        try:
            gm.generate(sid, pid, fname, art, prefer)
        except (Exception, SystemExit) as e:
            print(f"  ✗ {fname} skipped: {str(e)[:200]}")
        if i < len(DESIGNS) - 1:
            time.sleep(60)
    print("Done.")
