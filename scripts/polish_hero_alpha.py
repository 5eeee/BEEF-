"""Gentle cream fringe cleanup after rembg — no hole punching."""
from __future__ import annotations

import glob
import os

import numpy as np
from PIL import Image, ImageFilter

DIR = os.path.join(
    os.path.dirname(__file__), "..", "frontend", "public", "images", "hero-burgers"
)


def clean(path: str):
    arr = np.array(Image.open(path).convert("RGBA")).astype(np.float32)
    rgb = arr[:, :, :3]
    a = arr[:, :, 3]
    lum = rgb.mean(2)
    sat = rgb.max(2) - rgb.min(2)

    # Only clear bright cream leftovers OUTSIDE food (high lum + low sat)
    cream = (lum > 225) & (sat < 35)
    cream |= (lum > 240) & (sat < 50)
    a = np.where(cream, 0, a)

    # Soften bright semi-transparent fringe only
    fringe = (a > 8) & (a < 140) & (lum > 210) & (sat < 40)
    a = np.where(fringe, a * 0.25, a)

    # Fill tiny internal holes: if surrounded by opaque food, restore
    opaque = a > 200
    # dilate then use as fill mask for near-zero holes inside
    op_img = Image.fromarray((opaque.astype(np.uint8) * 255), "L")
    filled = op_img.filter(ImageFilter.MaxFilter(5))
    fill_mask = (np.array(filled) > 128) & (a < 30) & (lum < 180)
    # don't fill cream
    fill_mask &= ~((lum > 220) & (sat < 40))
    a = np.where(fill_mask, 255, a)

    out = np.zeros_like(arr, dtype=np.uint8)
    out[:, :, :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    out[:, :, 3] = np.clip(a, 0, 255).astype(np.uint8)

    opac = out[:, :, 3] > 12
    if opac.any():
        ys, xs = np.where(opac)
        pad = 6
        out = out[
            max(0, ys.min() - pad) : ys.max() + pad + 1,
            max(0, xs.min() - pad) : xs.max() + pad + 1,
        ]

    a2 = Image.fromarray(out[:, :, 3], "L").filter(ImageFilter.GaussianBlur(0.4))
    im = Image.merge("RGBA", (*Image.fromarray(out).split()[:3], a2))
    im.save(path, optimize=True)
    c = np.concatenate([np.array(im)[:4, :4].reshape(-1, 4), np.array(im)[:4, -4:].reshape(-1, 4)])
    print(os.path.basename(path), im.size, f"cornerA={c[:,3].mean():.1f}")


def main():
    for p in sorted(glob.glob(os.path.join(DIR, "*.png"))):
        clean(p)


if __name__ == "__main__":
    main()
