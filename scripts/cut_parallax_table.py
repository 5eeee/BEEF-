"""Keep table+food; drop cream wall only (not full rembg cutout)."""
from __future__ import annotations

import os

import numpy as np
from PIL import Image, ImageFilter

SRC = "/data/table-src.png"
OUT = "/data/table.png"


def main() -> None:
    im = Image.open(SRC).convert("RGBA")
    arr = np.array(im)
    rgb = arr[:, :, :3].astype(np.float32)
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
    sat = rgb.max(2) - rgb.min(2)
    h, w = lum.shape
    yy = np.linspace(0, 1, h)[:, None]

    # Cream / plaster wall (bright, low sat) — mostly upper frame
    wall = (lum > 195) & (sat < 42) & (r > 180) & (g > 175) & (b > 160)
    wall |= (lum > 215) & (sat < 55) & (yy < 0.72)
    wall |= (lum > 230) & (sat < 70) & (yy < 0.78)

    # Protect food + wood
    wood = (r > 70) & (g > 40) & (b < 120) & (r > b + 15) & (lum < 200) & (sat > 18)
    food = (sat > 30) & (lum < 225)
    food |= (g > r + 10) & (g > 60) & (lum < 200)  # lettuce
    food |= (r > g + 20) & (r > 90) & (lum < 210)  # tomato/meat/onion
    protect = wood | food

    alpha = np.ones((h, w), dtype=np.float32)
    # Soft fade for wall score
    wall_score = np.clip((lum - 185) / 60.0, 0, 1) * np.clip(1.0 - sat / 48.0, 0, 1)
    wall_score *= np.clip(1.15 - yy * 0.55, 0.35, 1.0)  # stronger up high
    alpha = 1.0 - wall_score * 0.98
    alpha = np.where(wall, np.minimum(alpha, 0.05), alpha)
    alpha = np.where(protect, np.maximum(alpha, 0.94), alpha)

    # Soft vertical falloff above mid so wall vanishes cleanly
    alpha *= np.clip((yy - 0.08) / 0.18, 0, 1) * 0.15 + np.clip((yy - 0.18) / 0.35, 0, 1) * 0.85

    out = np.zeros((h, w, 4), dtype=np.uint8)
    out[:, :, :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    out[:, :, 3] = (np.clip(alpha, 0, 1) * 255).astype(np.uint8)

    # Trim empty margins
    opac = out[:, :, 3] > 18
    if opac.any():
        ys, xs = np.where(opac)
        pad = 12
        out = out[
            max(0, ys.min() - pad) : min(h, ys.max() + pad + 1),
            max(0, xs.min() - pad) : min(w, xs.max() + pad + 1),
        ]

    result = Image.fromarray(out, "RGBA")
    a = result.split()[3].filter(ImageFilter.GaussianBlur(0.7))
    result = Image.merge("RGBA", (*result.split()[:3], a))
    result.save(OUT, optimize=True)
    a_arr = np.array(result)[:, :, 3]
    print(
        "saved",
        OUT,
        result.size,
        f"opaque={(a_arr > 40).mean() * 100:.1f}%",
    )


if __name__ == "__main__":
    main()
