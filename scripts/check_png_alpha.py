from PIL import Image

path = "/data/burger-tehas-617041.png"
im = Image.open(path)
print("mode", im.mode, "size", im.size)
px = im.convert("RGBA")
corners = [(0, 0), (10, 10), (im.width - 1, im.height - 1), (im.width // 2, 5)]
for c in corners:
    print(c, px.getpixel(c))
data = list(px.getdata())
trans = sum(1 for p in data if p[3] < 10)
print("transparent_ratio", round(trans / len(data), 3))
