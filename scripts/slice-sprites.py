#!/usr/bin/env python3
"""
Slice a kawaii-fox sprite sheet (grid of poses on a baked-in checker
background) into individual transparent PNGs.

Robust against neighbor bleed: after stripping the checker background, each
grid cell keeps the main sprite's connected component PLUS any small detached
bits near it (zzz, sparkles, floating hearts), and DROPS fragments that bled
in from an adjacent cell (they sit far from the main blob, near a cell edge).

Usage:
  python3 scripts/slice-sprites.py <sheet.png> <rows> <cols> <out_dir> [name1 name2 ...]
"""
import sys, os
from collections import deque
from PIL import Image
import numpy as np

def strip_checker(arr):
    """Border flood-fill: light near-grayscale checker -> transparent.
    Interior whites (muzzle) survive because they're enclosed by color."""
    H, W = arr.shape[:2]
    r, g, b = arr[:,:,0].astype(int), arr[:,:,1].astype(int), arr[:,:,2].astype(int)
    mx = np.maximum(np.maximum(r,g),b); mn = np.minimum(np.minimum(r,g),b)
    is_bg = (mn >= 188) & ((mx - mn) <= 16)
    visited = np.zeros((H,W), bool)
    dq = deque()
    for x in range(W):
        for y in (0, H-1):
            if is_bg[y,x] and not visited[y,x]: visited[y,x]=True; dq.append((x,y))
    for y in range(H):
        for x in (0, W-1):
            if is_bg[y,x] and not visited[y,x]: visited[y,x]=True; dq.append((x,y))
    while dq:
        x,y = dq.popleft()
        for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
            nx,ny = x+dx, y+dy
            if 0<=nx<W and 0<=ny<H and not visited[ny,nx] and is_bg[ny,nx]:
                visited[ny,nx]=True; dq.append((nx,ny))
    arr[:,:,3] = np.where(visited, 0, arr[:,:,3])
    return arr

def components(opaque):
    """Return list of (size, (cx,cy), (x0,y0,x1,y1), [pixel coords]) for each
    connected component of an opaque boolean mask (4-connectivity)."""
    H, W = opaque.shape
    seen = np.zeros((H,W), bool)
    comps = []
    ys, xs = np.nonzero(opaque)
    for sy, sx in zip(ys, xs):
        if seen[sy,sx]: continue
        dq = deque([(sx,sy)]); seen[sy,sx]=True
        pix=[]; minx=maxx=sx; miny=maxy=sy; sumx=sumy=0; n=0
        while dq:
            x,y = dq.popleft(); pix.append((x,y))
            minx=min(minx,x); maxx=max(maxx,x); miny=min(miny,y); maxy=max(maxy,y)
            sumx+=x; sumy+=y; n+=1
            for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
                nx,ny=x+dx,y+dy
                if 0<=nx<W and 0<=ny<H and opaque[ny,nx] and not seen[ny,nx]:
                    seen[ny,nx]=True; dq.append((nx,ny))
        comps.append((n,(sumx/n,sumy/n),(minx,miny,maxx+1,maxy+1),pix))
    return comps

def slice_cell(cell):
    """Keep the main blob + the sprite's own interior bits (zzz, sparkles,
    hearts). Drop neighbor bleed: a non-main component that touches a cell
    edge is a fragment clipped from an adjacent cell. Also drop tiny specks."""
    arr = np.array(cell)
    H, W = arr.shape[:2]
    opaque = arr[:,:,3] > 30
    comps = components(opaque)
    if not comps: return None
    comps.sort(key=lambda c: c[0], reverse=True)
    main_size = comps[0][0]
    speck = 0.0004 * H * W             # ignore anti-alias dust
    EDGE = 2
    keep_mask = np.zeros((H,W), bool)
    for n,(cx,cy),(x0,y0,x1,y1),pix in comps:
        is_main = (n == main_size)
        touches_edge = (x0 <= EDGE or y0 <= EDGE or x1 >= W-EDGE or y1 >= H-EDGE)
        if not is_main:
            if n < speck:           # dust
                continue
            if touches_edge:        # neighbor bleed clipped at the boundary
                continue
        for (x,y) in pix: keep_mask[y,x] = True
    arr[:,:,3] = np.where(keep_mask, arr[:,:,3], 0)
    out = Image.fromarray(arr, "RGBA")
    bbox = out.getbbox()
    return out.crop(bbox) if bbox else None

def main():
    sheet, rows, cols, out_dir = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
    names = sys.argv[5:] if len(sys.argv) > 5 else [f"{i+1:02d}" for i in range(rows*cols)]
    os.makedirs(out_dir, exist_ok=True)
    img = Image.open(sheet).convert("RGBA")
    arr = strip_checker(np.array(img))
    clean = Image.fromarray(arr, "RGBA")
    W, H = clean.size
    cw, ch = W // cols, H // rows
    for i in range(rows*cols):
        cx, cy = (i % cols)*cw, (i // cols)*ch
        cell = clean.crop((cx, cy, cx+cw, cy+ch))
        sprite = slice_cell(cell)
        name = names[i] if i < len(names) else f"{i+1:02d}"
        outp = os.path.join(out_dir, f"{i+1:02d}-{name}.png")
        if sprite: sprite.save(outp); print(f"  {outp}  {sprite.size}")
        else: print(f"  {outp}  EMPTY")

if __name__ == "__main__":
    main()
