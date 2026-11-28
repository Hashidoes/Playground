import numpy as np, cv2
def circ(h,c,w):  # weight 1 near hue c (degrees), fading over w
    d=np.abs(((h-c+180)%360)-180); return np.clip(1-(d-w*0.5)/(w*0.5),0,1)
def recolor(rgba, plan):
    rgb=rgba[...,:3].astype(np.uint8)
    hsv=cv2.cvtColor(rgb[None] if rgb.ndim==2 else rgb,cv2.COLOR_RGB2HSV_FULL).astype(np.float32)
    h=hsv[...,0]*360/256; s=hsv[...,1]; v=hsv[...,2]
    nh=h.copy(); ns=s.copy(); nv=v.copy(); total=np.zeros_like(h)
    for entry in plan:
        c,w,target,sat,val=entry[:5]; smax=entry[5] if len(entry)>5 else 999
        wt=circ(h,c,w)*np.clip((smax-s)/12+0.5,0,1)*(1-total); total+=wt
        d=((target-h+180)%360)-180
        nh=nh+wt*d; ns=ns*(1-wt)+np.clip(s*sat,0,255)*wt; nv=nv*(1-wt)+np.clip(v*val,0,255)*wt
    out=np.dstack([(nh%360)*256/360,ns,nv]).astype(np.uint8)
    rgb2=cv2.cvtColor(out,cv2.COLOR_HSV2RGB_FULL)
    res=rgba.copy(); res[...,:3]=rgb2; return res
PLANS={
 'A': [(245,70,207,0.8,1.03),(185,50,108,0.75,0.95),(25,40,40,1.1,1.0),(345,50,24,1.05,1.0)],
 'D': [(320,60,207,0.55,1.07,75),(305,40,207,0.55,1.07),(245,70,207,0.55,1.07),(185,50,213,1.15,0.88),(25,40,42,1.15,1.03),(345,50,28,1.1,1.0)],
 'E': [(245,70,207,0.55,1.07),(185,50,213,1.15,0.88),(25,40,42,1.15,1.03),(345,50,350,0.9,1.0)],
}
