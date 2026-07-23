"""Chroma-key hero burger PNG."""
from __future__ import annotations

import numpy as np
from PIL import Image, ImageFilter

SRC = "/data/hero-burger-chroma.png"
OUT = "/data/hero-burger.png"


def main() -> None:
    im = Image.open(SRC).convert("RGBA")
    arr = np.array(im)
    rgb = arr[:, :, :3].astype(np.float32)
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]

    green = (g > 85) & (g > r * 1.2) & (g > b * 1.2) & (g - np.maximum(r, b) > 22)
    green |= (g > 130) & (r < 115) & (b < 115) & (g > r + 35)

    greenness = np.clip((g - np.maximum(r, b) - 8) / 65.0, 0, 1)
    alpha = 1.0 - greenness
    alpha = np.where(green, np.minimum(alpha, 0.03), alpha)

    food = (r > 50) & ((r > g - 8) | (sat := (rgb.max(2) - rgb.min(2)) > 25))
    alpha = np.where(food & (alpha > 0.12), np.maximum(alpha, 0.92), alpha)

    fringe = (alpha > 0.08) & (alpha < 0.8) & (g > r) & (g > b)
    over = np.clip(g[fringe] - np.maximum(r[fringe], b[fringe]), 0, None)
    rgb = rgb.copy()
    rgb[fringe, 1] = np.clip(g[fringe] - over * 0.9, 0, 255)

    out = np.zeros((*arr.shape[:2], 4), dtype=np.uint8)
    out[:, :, :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    out[:, :, 3] = (np.clip(alpha, 0, 1) * 255).astype(np.uint8)

    opac = out[:, :, 3] > 18
    if opac.any():
        ys, xs = np.where(opac)
        pad = 14
        h, w = out.shape[:2]
        out = out[
            max(0, int(ys.min()) - pad) : min(h, int(ys.max()) + pad + 1),
            max(0, int(xs.min()) - pad) : min(w, int(xs.max()) + pad + 1),
        ]

    result = Image.fromarray(out, "RGBA")
    a = result.split()[3].filter(ImageFilter.GaussianBlur(0.55))
    result = Image.merge("RGBA", (*result.split()[:3], a))
    result.save(OUT, optimize=True)
    a2 = np.array(result)[:, :, 3]
    print("saved", result.size, f"opaque={(a2 > 40).mean()*100:.1f}%")


if __name__ == "__main__":
    main()
