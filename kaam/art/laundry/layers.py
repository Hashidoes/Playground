# Cuts the welcome illustration (source.jpg) into the layers LaundryLoop animates.
# Needs: pip install pillow numpy opencv-python-headless
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFilter
rng=np.random.default_rng(7)
src=np.asarray(Image.open('src.jpg').convert('RGB')).astype(np.float32)
H,W=src.shape[:2]

def poly_mask(pts, blur=0):
    m=Image.new('L',(W,H),0); ImageDraw.Draw(m).polygon(pts,fill=255)
    if blur: m=m.filter(ImageFilter.GaussianBlur(blur))
    return np.asarray(m).astype(np.float32)/255

# ---------- Background -> alpha ----------
mn=src.min(2)
alpha=np.clip((247-mn)/26,0,1)
# un-premultiply against white
a3=np.maximum(alpha[...,None],1e-3)
rgb=np.clip((src-(1-a3)*255)/a3,0,255)

# ---------- Shapes ----------
ARM=[(312,452),(322,432),(330,418),(338,404),(360,388),(390,382),(420,387),(450,399),(480,404),(500,396),(520,380),(536,362),
     (530,382),(521,405),(514,432),(509,462),(504,497),(490,502),(470,492),(450,474),(430,460),(405,450),(390,451),
     (372,455),(358,460),(346,469),(332,472),(320,467)]
HELD=[(318,470),(332,474),(346,471),(358,462),(372,457),(390,453),(398,456),(402,475),(406,500),(411,525),(408,550),(403,570),(407,588),
      (390,591),(370,595),(345,604),(325,616),(310,629),(290,630),(280,612),(274,586),(279,565),(286,545),(295,515),(302,490),(310,474)]
arm_m=poly_mask(ARM)
held_m=poly_mask(HELD)
R=np.clip(arm_m+held_m,0,1)
R=cv2.dilate((R>0.5).astype(np.uint8),np.ones((5,5),np.uint8)).astype(bool)

ys,xs=np.mgrid[0:H,0:W]
y_rim=576-0.1*(xs-250)                 # top edge of the back rim
x_lid=339+0.25*(ys-360)                # outer right edge of the lid

base=rgb.copy(); base_a=alpha.copy()
# b) lid glass: copy each row from just left of the hole, then the frame, anti-aliased
x_lid=334+0.21*(ys-360)
d=x_lid-xs
lidzone=R & (ys<y_rim) & (d>-2)
for y in range(H):
    row=np.where(lidzone[y])[0]
    if len(row)==0: continue
    x0=row.min(); sample=rgb[y,max(x0-14,0):x0-3]
    c=np.median(sample,axis=0) if len(sample) else rgb[y,x0-1]
    base[y,row]=c
sm=lambda e0,e1,v: np.clip((v-e0)/(e1-e0),0,1)
bandw=sm(18.5,17,d)*sm(9,10.5,d)          # 1 inside the dark band
lightw=sm(10.5,9,d)                         # 1 in the light outer edge
c=base*(1-bandw-lightw)[...,None]+np.array((122,106,170),np.float32)*bandw[...,None]+np.array((168,176,218),np.float32)*lightw[...,None]
base[lidzone]=c[lidzone]
cov=np.clip(d+0.5,0,1)
base_a[R & (ys<y_rim) & (xs<450)]=cov[R & (ys<y_rim) & (xs<450)]
# c) inside the machine: inpaint from the surrounding machine
inside=R & (ys>=y_rim)
DRAPED=[(318,640),(330,612),(345,606),(370,598),(392,592),(415,592),(440,600),(462,616),(470,650),(470,780),(380,780),(360,700),(330,650)]
draped_m=poly_mask(DRAPED)>0.5
body_m=(xs>466)&(ys>540)&(ys<700)
unknown=(inside|(draped_m&(ys<660))|(body_m&(ys<620)&(xs<480))).astype(np.uint8)
img8=np.clip(base,0,255).astype(np.uint8)
filled=cv2.inpaint(img8,unknown,9,cv2.INPAINT_TELEA).astype(np.float32)
base[inside]=filled[inside]; base_a[inside]=1
# rim band and drum opening, drawn only where it was hidden
rimband=inside & (ys<y_rim+9); base[rimband]=(106,94,158)
cx,cy,rx,ry=332,603,104,20
e=((xs-cx)/rx)**2+((ys-cy)/ry)**2
hole=inside & (e<1)
shade=np.clip((ys-(cy-ry))/(2*ry),0,1)[...,None]
holecol=(48,46,96)*(1-shade)+(62,62,118)*shade
base[hole]=holecol[hole]
wall=inside & (e>=1) & (ys<cy) & (ys>=y_rim+9); base[wall]=(139,142,193)
# soften the repaint edges a touch, then add grain like the original
soft=cv2.GaussianBlur(base,(0,0),1.2); m=cv2.dilate(R.astype(np.uint8),np.ones((3,3),np.uint8)).astype(bool)
base[m&(base_a>0)]=soft[m&(base_a>0)]
noise=rng.normal(0,7,base.shape).astype(np.float32)
base[R]+=noise[R]
base=np.clip(base,0,255)

def save(rgbarr,a,name,box=None):
    out=np.dstack([np.clip(rgbarr,0,255),np.clip(a,0,1)*255]).astype(np.uint8)
    im=Image.fromarray(out,'RGBA')
    if box: im=im.crop(box)
    im.save(name); return im
# d) the body's own outline where the arm joined it
t=np.clip((ys-368)/144,0,1)
h00=2*t**3-3*t**2+1; h10=t**3-2*t**2+t; h01=-2*t**3+3*t**2; h11=t**3-t**2
x_body=h00*530+h10*(-0.65*144)+h01*489+h11*(-0.45*144)
x_body=np.where(ys<368, 530+(368-ys)*0.66, x_body)
cut=536-0.237*(ys-362)
zone=(ys>=340)&(ys<=512)&(xs>=x_body-3)&(xs<cut+26)
inside_body=zone&(xs>=x_body)
outside=(ys>=340)&(ys<=512)&(xs<x_body)&(xs>440)
img8=np.clip(base,0,255).astype(np.uint8)
unk=(zone|(outside)).astype(np.uint8)
f2=cv2.inpaint(img8,unk,12,cv2.INPAINT_TELEA).astype(np.float32)
base[inside_body]=f2[inside_body]+rng.normal(0,6,f2.shape).astype(np.float32)[inside_body]
edge_cov=np.clip(xs-x_body+0.5,0,1)
sel=(ys>=340)&(ys<=512)&(xs>440)&(xs<cut+26)
base_a[sel]=edge_cov[sel]
base=np.clip(base,0,255)
save(base,base_a,'L_base.png')

# ---------- Arm sprite (extends a little into the body so the shoulder stays joined) ----------
cut_x=lambda y: 536-(y-362)*(32/135)   # roughly the cut line from (536,362) to (504,497)
ext=np.clip(1-(xs-cut_x(ys))/22,0,1)*((ys>360)&(ys<505)&(xs>=cut_x(ys))&(xs<560))
arm_a=np.maximum(cv2.GaussianBlur(arm_m,(0,0),0.8)*alpha, ext*alpha)
save(rgb,arm_a,'L_arm.png')
# ---------- Held cloth sprite: fades out where it enters the drum ----------
fade=np.clip((612-ys)/14,0,1)
cloth_a=cv2.GaussianBlur(held_m,(0,0),0.8)*alpha*fade*(1-cv2.GaussianBlur(arm_m,(0,0),1.5)*(ys<470))
save(rgb,cloth_a,'L_cloth.png')
# ---------- Machine front: drawn over the falling cloth ----------
front=np.zeros((H,W),np.float32)
lower=(ys>cy)&(e>=1)|(ys>cy+ry)
front[(xs>215)&(xs<445)&lower&(ys<1100)]=1
front=np.maximum(front, draped_m.astype(np.float32))
front=cv2.GaussianBlur(front,(0,0),1)
save(base,front*base_a,'L_front.png')
print('ok')

# ---------- Basket front: drawn over the arm, so the hand reaches into the basket ----------
BASKET=[(492,548),(505,566),(522,584),(546,601),(580,613),(620,614),(655,605),(690,590),(725,572),(760,560),(800,575),(830,600),(830,760),(490,760)]
bm=cv2.GaussianBlur(poly_mask(BASKET),(0,0),1.2)
save(base,bm*base_a,'L_basket.png')
