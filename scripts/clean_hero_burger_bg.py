"""Aggressive cream/white background removal for hero burger photos."""
from __future__ import annotations

import glob
import os

import numpy as np
from PIL import Image, ImageFilter

DIR = os.path.join(
    os.path.dirname(__file__), "..", "frontend", "public", "images", "hero-burgers"
)


def remove_cream(arr: np.ndarray) -> np.ndarray:
    rgb = arr[:, :, :3].astype(np.float32)
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
    sat = rgb.max(2) - rgb.min(2)

    # Cream / bone / near-white backgrounds (warm light neutrals)
    cream = (lum > 200) & (sat < 45) & (r > 185) & (g > 180) & (b > 165)
    cream |= (lum > 220) & (sat < 55)
    cream |= (lum > 235) & (sat < 70)
    # Very light warm gray
    cream |= (r > 230) & (g > 225) & (b > 210) & (sat < 35)

    # Soft alpha: opaque food, transparent cream
    alpha = np.ones(lum.shape, dtype=np.float32)
    # Distance from pure cream toward food
    # Higher cream score → lower alpha
    cream_score = np.clip((lum - 190) / 55.0, 0, 1) * np.clip(1.0 - sat / 50.0, 0, 1)
    alpha = 1.0 - cream_score * 0.98
    alpha = np.where(cream, np.minimum(alpha, 0.08), alpha)
    alpha = np.where((lum > 248) & (sat < 20), 0.0, alpha)

    # Keep saturated food (tomato, bun brown, greens, meat)
    food = (sat > 28) & (lum < 230)
    food |= (r > g + 25) & (r > 100)  # reds
    food |= (g > r + 12) & (g > 70) & (lum < 210)  # greens
    food |= (r > 90) & (g > 55) & (b < 90) & (sat > 20)  # browns/bun
    alpha = np.where(food, np.maximum(alpha, 0.92), alpha)

    # Despill cream fringe
    fringe = (alpha > 0.08) & (alpha < 0.65) & (lum > 200)
    rgb = rgb.copy()
    rgb[fringe] = rgb[fringe] * 0.75

    out = np.zeros((*arr.shape[:2], 4), dtype=np.uint8)
    out[:, :, :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    out[:, :, 3] = (np.clip(alpha, 0, 1) * 255).astype(np.uint8)
    return out


def trim(arr: np.ndarray, pad: int = 10) -> np.ndarray:
    opac = arr[:, :, 3] > 12
    if not opac.any():
        return arr
    ys, xs = np.where(opac)
    return arr[
        max(0, ys.min() - pad) : min(arr.shape[0], ys.max() + pad + 1),
        max(0, xs.min() - pad) : min(arr.shape[1], xs.max() + pad + 1),
    ]


def process(path: str):
    raw = np.array(Image.open(path).convert("RGBA"))
    keyed = remove_cream(raw)
    keyed = trim(keyed)
    im = Image.fromarray(keyed, "RGBA")
    a = im.split()[3].filter(ImageFilter.GaussianBlur(0.55))
    # slight erode of alpha to kill leftover halo
    a_arr = np.array(a).astype(np.float32)
    a_arr = np.clip((a_arr - 12) * (255 / 243), 0, 255)
    im = Image.merge("RGBA", (*im.split()[:3], Image.fromarray(a_arr.astype(np.uint8), "L")))
    im.save(path, optimize=True)
    print("cleaned", os.path.basename(path), im.size, f"opaque={(np.array(im)[:,:,3]>40).mean()*100:.1f}%")


def main():
    for path in sorted(glob.glob(os.path.join(DIR, "*.png"))):
        if "rembg" in path:
            continue
        process(path)


if __name__ == "__main__":
    main()
