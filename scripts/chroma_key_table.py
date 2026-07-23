"""Chroma-key green (#00FF00-ish) → transparent PNG for parallax table layer."""
from __future__ import annotations

import numpy as np
from PIL import Image, ImageFilter

SRC = "/data/table-chroma.png"
OUT = "/data/table.png"


def main() -> None:
    im = Image.open(SRC).convert("RGBA")
    arr = np.array(im)
    rgb = arr[:, :, :3].astype(np.float32)
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]

    # Green screen: strong G, low R/B
    green = (g > 90) & (g > r * 1.25) & (g > b * 1.25) & (g - np.maximum(r, b) > 28)
    green |= (g > 140) & (r < 120) & (b < 120) & (g > r + 40) & (g > b + 40)
    green |= (g > 180) & (r < 160) & (b < 160) & (g > r + 25)

    # Soft alpha from how "green" a pixel is
    greenness = np.clip((g - np.maximum(r, b) - 10) / 70.0, 0, 1)
    greenness *= np.clip((g - 70) / 80.0, 0, 1)
    alpha = 1.0 - greenness
    alpha = np.where(green, np.minimum(alpha, 0.04), alpha)

    # Keep warm food / wood (not green-dominant)
    food = (r > g - 5) | (b > 40) | ((r > 60) & (g > 40) & (g < r + 35))
    food &= ~((g > r + 50) & (g > b + 50))
    alpha = np.where(food & (alpha > 0.15), np.maximum(alpha, 0.9), alpha)

    # Despill green fringe
    fringe = (alpha > 0.1) & (alpha < 0.85) & (g > r) & (g > b)
    rgb = rgb.copy()
    over = np.clip(g[fringe] - np.maximum(r[fringe], b[fringe]), 0, None)
    rgb[fringe, 1] = np.clip(g[fringe] - over * 0.85, 0, 255)
    rgb[fringe, 0] = np.clip(r[fringe] + over * 0.12, 0, 255)
    rgb[fringe, 2] = np.clip(b[fringe] + over * 0.08, 0, 255)

    out = np.zeros((*arr.shape[:2], 4), dtype=np.uint8)
    out[:, :, :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    out[:, :, 3] = (np.clip(alpha, 0, 1) * 255).astype(np.uint8)

    # Trim
    opac = out[:, :, 3] > 20
    if opac.any():
        ys, xs = np.where(opac)
        pad = 16
        h, w = out.shape[:2]
        out = out[
            max(0, int(ys.min()) - pad) : min(h, int(ys.max()) + pad + 1),
            max(0, int(xs.min()) - pad) : min(w, int(xs.max()) + pad + 1),
        ]

    result = Image.fromarray(out, "RGBA")
    a = result.split()[3].filter(ImageFilter.GaussianBlur(0.6))
    a_arr = np.array(a).astype(np.float32)
    a_arr = np.clip((a_arr - 8) * (255 / 247), 0, 255)
    result = Image.merge(
        "RGBA",
        (*result.split()[:3], Image.fromarray(a_arr.astype(np.uint8), "L")),
    )
    result.save(OUT, optimize=True)
    a2 = np.array(result)[:, :, 3]
    print("saved", result.size, f"opaque={(a2 > 40).mean()*100:.1f}%")


if __name__ == "__main__":
    main()
