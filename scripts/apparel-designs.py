#!/usr/bin/env python3
"""
Far Fox apparel designs — parameterized for LIGHT and DARK shirts.

Each design renders twice: a dark-ink version (for light/cream/pastel shirts)
and a cream-ink "reverse" version (for black/navy/maroon shirts). The fox
sprites are full-colour and read on either, so only the type/line work flips.

Outputs to public/shop/designs/<name>.png and <name>-dark.png.
Run: python3 scripts/apparel-designs.py
"""
from PIL import Image, ImageDraw, ImageFont
import math, os

DIDOT="/System/Library/Fonts/Supplemental/Didot.ttc"
SNELL="/System/Library/Fonts/Supplemental/SnellRoundhand.ttc"
COP="/System/Library/Fonts/Supplemental/Copperplate.ttc"
DIN="/System/Library/Fonts/Supplemental/DIN Condensed Bold.ttf"
OUT="public/shop/designs"

def FD(s): return ImageFont.truetype(DIDOT,s)
def FS(s): return ImageFont.truetype(SNELL,s)
def FC(s,i=0): return ImageFont.truetype(COP,s,index=i)
def FN(s): return ImageFont.truetype(DIN,s)

LIGHT=dict(INK=(43,40,49), SUB=(110,104,116), TERRA=(178,94,58), LINE=(43,40,49))
DARK =dict(INK=(250,244,236), SUB=(202,196,186), TERRA=(232,156,104), LINE=(247,240,230))

def img(w,h):
    c=Image.new("RGBA",(w,h),(0,0,0,0)); d=ImageDraw.Draw(c); d._img=c; return c,d
def spaced(d,cx,y,t,f,fill,tr):
    ws=[d.textlength(ch,font=f)+tr for ch in t]; x=cx-(sum(ws)-tr)/2
    for ch,w in zip(t,ws): d.text((x,y),ch,font=f,fill=fill,anchor="lm"); x+=w
def heart(d,cx,cy,s,fill):
    r=s*0.5
    d.ellipse([cx-s*0.55,cy-r*0.6,cx-s*0.55+r*1.1,cy-r*0.6+r*1.1],fill=fill)
    d.ellipse([cx+s*0.55-r*1.1,cy-r*0.6,cx+s*0.55,cy-r*0.6+r*1.1],fill=fill)
    d.polygon([(cx-s*0.62,cy+r*0.02),(cx+s*0.62,cy+r*0.02),(cx,cy+s*0.9)],fill=fill)
def star4(d,cx,cy,r,fill):
    d.polygon([(cx,cy-r),(cx+r*0.22,cy-r*0.22),(cx+r,cy),(cx+r*0.22,cy+r*0.22),
               (cx,cy+r),(cx-r*0.22,cy+r*0.22),(cx-r,cy),(cx-r*0.22,cy-r*0.22)],fill=fill)
def fox(path,w):
    f=Image.open(path).convert("RGBA"); sc=w/f.width; return f.resize((w,int(f.height*sc)),Image.LANCZOS)
def rule(d,cx,y,half,fill,dot=True):
    d.line([cx-half,y,cx-26,y],fill=fill,width=4); d.line([cx+26,y,cx+half,y],fill=fill,width=4)
    if dot: d.ellipse([cx-7,y-7,cx+7,y+7],fill=fill)
def save(c,name):
    bbox=c.getbbox(); c=c.crop(bbox); c.save(f"{OUT}/{name}.png"); return c.size

# ---------- builders ----------
def build_morse(p,name):
    MORSE={"I":"..","L":".-..","O":"---","V":"...-","E":".","Y":"-.--","U":"..-"}
    DOT,DASH,GAP,LGAP,HH=24,64,18,64,28
    def ww(word):
        w=0
        for li,ch in enumerate(word):
            code=MORSE[ch]
            for si,sym in enumerate(code):
                w+=(DOT if sym=="." else DASH)
                if si<len(code)-1: w+=GAP
            if li<len(word)-1: w+=LGAP
        return w
    def draw(d,cx,y,word,col):
        x=cx-ww(word)/2
        for li,ch in enumerate(word):
            code=MORSE[ch]
            for si,sym in enumerate(code):
                if sym==".": d.ellipse([x,y-HH/2,x+DOT,y+HH/2],fill=col); x+=DOT
                else: d.rounded_rectangle([x,y-HH/2,x+DASH,y+HH/2],radius=HH/2,fill=col); x+=DASH
                if si<len(code)-1: x+=GAP
            if li<len(word)-1: x+=LGAP
    c,d=img(1700,1820); cx=850
    spaced(d,cx,80,"FAR FOX",FC(64),p["INK"],12)
    rule(d,cx,168,150,p["TERRA"]); heart(d,cx,168,22,p["TERRA"])
    for word,col,y in [("I",p["INK"],360),("LOVE",p["TERRA"],560),("YOU",p["INK"],760)]:
        draw(d,cx,y,word,col); spaced(d,cx,y+78," ".join(word),FD(52),p["SUB"],9)
    c.alpha_composite(fox("public/shop/poses/02-heart.png",400),(cx-200,940))
    spaced(d,cx,1450,"· THREE WORDS, ONE SIGNAL ·",FC(38),p["SUB"],5)
    spaced(d,cx,1540,"FAR FOX",FD(70),p["INK"],14)
    return save(c,name)

def build_timezones(p,name):
    c,d=img(1700,2100); cx=850
    def clock(cx0,cy,R,hh,mm,fill):
        d.ellipse([cx0-R,cy-R,cx0+R,cy+R],outline=fill,width=7)
        d.ellipse([cx0-R-22,cy-R-22,cx0+R+22,cy+R+22],outline=fill,width=2)
        for t in range(12):
            a=math.radians(t*30); x1=cx0+(R-14)*math.sin(a); y1=cy-(R-14)*math.cos(a)
            x2=cx0+(R-2)*math.sin(a); y2=cy-(R-2)*math.cos(a)
            d.line([(x1,y1),(x2,y2)],fill=fill,width=4 if t%3==0 else 2)
        ah=math.radians((hh%12+mm/60)*30); d.line([(cx0,cy),(cx0+R*0.5*math.sin(ah),cy-R*0.5*math.cos(ah))],fill=fill,width=8)
        am=math.radians(mm*6); d.line([(cx0,cy),(cx0+R*0.74*math.sin(am),cy-R*0.74*math.cos(am))],fill=fill,width=5)
        d.ellipse([cx0-9,cy-9,cx0+9,cy+9],fill=fill)
    R=300; lx,rx=cx-380,cx+380; cy=720
    clock(lx,cy,R,8,10,p["INK"]); clock(rx,cy,R,23,10,p["TERRA"])
    d.ellipse([lx-30,cy-R-150,lx+30,cy-R-90],outline=p["INK"],width=5)
    for t in range(8):
        a=math.radians(t*45); d.line([(lx+44*math.cos(a),cy-R-120+44*math.sin(a)),(lx+64*math.cos(a),cy-R-120+64*math.sin(a))],fill=p["INK"],width=4)
    mm_=Image.new("RGBA",(160,160),(0,0,0,0)); md=ImageDraw.Draw(mm_)
    md.ellipse([20,20,140,140],fill=p["TERRA"]); md.ellipse([55,8,175,128],fill=(0,0,0,0))
    c.alpha_composite(mm_,(rx-80,cy-R-200))
    spaced(d,lx,cy+R+70,"YOUR MORNING",FD(48),p["INK"],8)
    spaced(d,rx,cy+R+70,"MY NIGHT",FD(48),p["TERRA"],8)
    c.alpha_composite(fox("public/shop/poses/10-waving.png",300),(lx-150,cy+R+130))
    c.alpha_composite(fox("public/shop/poses/05-sleepy.png",300),(rx-150,cy+R+130))
    heart(d,cx,cy,70,p["TERRA"])
    yb=1640
    spaced(d,cx,yb,"FAR FOX",FD(150),p["INK"],20)
    rule(d,cx,yb+150,360,p["LINE"])
    spaced(d,cx,yb+210,"TWO TIME ZONES, ONE HEART",FD(48),p["SUB"],8)
    return save(c,name)

def build_ldc_front(p,name):
    c,d=img(900,900); fx=450
    c.alpha_composite(fox("public/fox-logo.png",300),(fx-150,120))
    spaced(d,fx,470,"FAR FOX",FC(78),p["INK"],10)
    d.line([fx-200,560,fx-40,560],fill=p["TERRA"],width=5); d.line([fx+40,560,fx+200,560],fill=p["TERRA"],width=5)
    star4(d,fx,560,16,p["TERRA"])
    spaced(d,fx,600,"LONG DISTANCE CLUB",FC(34),p["SUB"],5)
    return save(c,name)

def build_ldc_back(p,name):
    c,d=img(1700,2150); cx=850
    spaced(d,cx,70,"FAR FOX",FC(70),p["INK"],12)
    star4(d,cx-360,95,20,p["TERRA"]); star4(d,cx+360,95,20,p["TERRA"])
    d.text((cx,220),"LONG",font=FN(520),fill=p["INK"],anchor="mt")
    d.text((cx,640),"DISTANCE",font=FN(420),fill=p["TERRA"],anchor="mt")
    d.line([cx-560,1120,cx-150,1120],fill=p["INK"],width=8); d.line([cx+150,1120,cx+560,1120],fill=p["INK"],width=8)
    spaced(d,cx,1095,"CLUB",FN(110),p["INK"],18)
    c.alpha_composite(fox("public/shop/poses/04-couple.png",620),(cx-310,1240))
    spaced(d,cx,1980,"MILES APART  ·  NEVER ALONE",FC(46),p["SUB"],6)
    return save(c,name)

def build_club(p,name):
    c,d=img(1500,1900); cx=750
    c.alpha_composite(fox("public/shop/poses/01-sitting.png",520),(cx-260,120))
    spaced(d,cx,820,"FAR FOX",FD(170),p["INK"],22)
    rule(d,cx,990,400,p["LINE"])
    spaced(d,cx,1070,"LONG DISTANCE CLUB",FD(56),p["SUB"],10)
    spaced(d,cx,1190,"· EST. WHEREVER YOU ARE ·",FC(36),p["SUB"],4)
    return save(c,name)

def build_mile(p,name):
    c,d=img(1600,1900); cx=800
    spaced(d,cx,110,"FAR FOX",FC(60),p["SUB"],10)
    spaced(d,cx,300,"WORTH",FD(220),p["INK"],14)
    spaced(d,cx,540,"EVERY MILE",FD(150),p["TERRA"],10)
    rule(d,cx,760,420,p["LINE"])
    c.alpha_composite(fox("public/shop/poses/04-couple.png",620),(cx-310,860))
    spaced(d,cx,1640,"EVERY MILE BETWEEN US IS WORTH IT",FC(40),p["SUB"],4)
    spaced(d,cx,1740,"FAR FOX",FD(64),p["INK"],12)
    return save(c,name)

def build_hoodie(p,name):
    c,d=img(1500,1700); cx=750
    c.alpha_composite(fox("public/fox-letter.png",520),(cx-260,90))
    spaced(d,cx,720,"FAR FOX",FD(150),p["INK"],20)
    rule(d,cx,880,360,p["LINE"])
    spaced(d,cx,960,"LOVE LETTERS",FD(60),p["SUB"],12)
    spaced(d,cx,1080,"· SEALED WITH A PAW ·",FC(36),p["SUB"],4)
    return save(c,name)

if __name__=="__main__":
    os.makedirs(OUT,exist_ok=True)
    builders={"morse":build_morse,"timezones":build_timezones,"ldc-front":build_ldc_front,
              "ldc-back":build_ldc_back,"club":build_club,"mile":build_mile,"hoodie":build_hoodie}
    for nm,fn in builders.items():
        s1=fn(LIGHT,nm); s2=fn(DARK,nm+"-dark"); print(f"  ✓ {nm} {s1} / {nm}-dark {s2}")
    print("done")
