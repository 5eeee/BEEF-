"""Extract bull-only mark from logo.png (no wordmark / line / est)."""
from PIL import Image

im = Image.open("/data/logo.png").convert("RGBA")
w, h = im.size
# Bull occupies roughly y=180..720; text starts ~760.
crop = im.crop((int(w * 0.12), 170, int(w * 0.88), 720))
px = crop.load()
cw, ch = crop.size

for y in range(ch):
    for x in range(cw):
        r, g, b, a = px[x, y]
        if r > 160 and g < 100 and b < 100:
            px[x, y] = (0, 0, 0, 0)
            continue
        lum = 0.299 * r + 0.587 * g + 0.114 * b
        if lum >= 155:
            t = min(1.0, (lum - 155) / 70)
            px[x, y] = (255, 255, 255, int(255 * t))
        else:
            px[x, y] = (0, 0, 0, 0)

bbox = crop.getbbox()
bull = crop.crop(bbox)
bw, bh = bull.size
side = int(max(bw, bh) * 1.15)
out = Image.new("RGBA", (side, side), (0, 0, 0, 0))
out.paste(bull, ((side - bw) // 2, (side - bh) // 2), bull)
out.save("/data/logo-mark.png", optimize=True)
print("ok", out.size, "bbox", bbox)
