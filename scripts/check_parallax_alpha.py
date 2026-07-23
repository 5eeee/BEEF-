from PIL import Image
import numpy as np

im = Image.open("/data/table.png").convert("RGBA")
a = np.array(im)[:, :, 3]
print(
    "size",
    im.size,
    "opaque%",
    round(float((a > 40).mean() * 100), 1),
    "mean_a",
    round(float(a.mean()), 1),
)
