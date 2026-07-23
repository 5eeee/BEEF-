from PIL import Image
im = Image.open("/data/logo-mark.png").convert("RGBA")
px = im.load()
w, h = im.size
for y in range(h):
    for x in range(w):
        r, g, b, a = px[x, y]
        lum = (r + g + b) / 3
        if lum < 40:
            px[x, y] = (0, 0, 0, 0)
        else:
            # force pure white icon
            px[x, y] = (255, 255, 255, min(255, int(a * (lum / 255) * 1.4)))
bbox = im.getbbox()
if bbox:
    im = im.crop(bbox)
w, h = im.size
s = max(w, h)
out = Image.new("RGBA", (s, s), (0, 0, 0, 0))
out.paste(im, ((s - w) // 2, (s - h) // 2), im)
out.save("/data/logo-mark.png")
print("cleaned", out.size)
