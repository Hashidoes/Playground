"""Recolour the layers to the Kaam palette, scale to 3/4 and save the WebP files the app uses.

Run from this folder after layers.py:  python3 layers.py && python3 export.py
Then copy the printed offsets into SCENE / LAYERS in src/components/LaundryLoop.tsx
(subtract the base layer's x and y from every layer).
"""
import json
import numpy as np
from PIL import Image
from recolor import recolor, PLANS

S = 0.75
out = {}
for k in ('base', 'front', 'cloth', 'arm', 'basket'):
    a = recolor(np.asarray(Image.open(f'L_{k}.png').convert('RGBA')), PLANS['D'])
    im = Image.fromarray(a, 'RGBA')
    im = im.resize((round(im.width * S), round(im.height * S)), Image.LANCZOS)
    box = im.getchannel('A').point(lambda v: 255 if v > 2 else 0).getbbox()
    box = (max(box[0] - 2, 0), max(box[1] - 2, 0), min(box[2] + 2, im.width), min(box[3] + 2, im.height))
    im.crop(box).save(f'../../assets/onboarding/laundry/{k}.webp', 'WEBP', quality=88, method=6)
    out[k] = dict(x=box[0], y=box[1], w=box[2] - box[0], h=box[3] - box[1])
print(json.dumps(out))
