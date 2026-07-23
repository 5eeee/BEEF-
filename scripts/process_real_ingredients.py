"""Key white BG and tightly trim real ingredient cutouts."""
from __future__ import annotations

import os
import shutil

import numpy as np
from PIL import Image, ImageFilter, ImageEnhance

ASSETS = os.environ.get(
    "REAL_ASSETS",
    r"C:\Users\User\.cursor\projects\c-beefshteks-new\assets",
)
OUT = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "images", "real")

FILES = {
    "bun-top.png": "real-bun-top.png",
    "lettuce.png": "real-lettuce.png",
    "tomato.png": "real-tomato.png",
    "cheese.png": "real-cheese.png",
    "patty.png": "real-patty.png",
    "pickles.png": "real-pickles.png",
    "bun-bottom.png": "real-bun-bottom.png",
    "full.png": "real-burger-full.png",
}


def key_white(arr: np.ndarray) -> np.ndarray:
    rgb = arr[:, :, :3].astype(np.float32)
    lum = rgb.mean(2)
    sat = rgb.max(2) - rgb.min(2)
    alpha = np.clip(1.0 - (lum - 200) / 40.0, 0, 1)
    alpha = np.where(sat > 12, np.maximum(alpha, 0.95), alpha)
    alpha = np.where((lum > 245) & (sat < 10), 0.0, alpha)
    # kill near-white fringe
    fringe = (alpha > 0.05) & (alpha < 0.55) & (lum > 220)
    alpha = np.where(fringe, alpha * 0.2, alpha)
    out = np.zeros((*rgb.shape[:2], 4), dtype=np.uint8)
    out[:, :, :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    out[:, :, 3] = (np.clip(alpha, 0, 1) * 255).astype(np.uint8)
    return out


def trim(arr: np.ndarray, pad: int = 6) -> np.ndarray:
    opac = arr[:, :, 3] > 18
    if not opac.any():
        return arr
    ys, xs = np.where(opac)
    return arr[
        max(0, ys.min() - pad) : min(arr.shape[0], ys.max() + pad + 1),
        max(0, xs.min() - pad) : min(arr.shape[1], xs.max() + pad + 1),
    ]


def process(src_name: str, dest_name: str, max_w: int = 720):
    path = os.path.join(ASSETS, src_name)
    if not os.path.exists(path):
        # docker mount path
        path = os.path.join("/assets", src_name)
    if not os.path.exists(path):
        print("missing", src_name)
        return
    arr = key_white(np.array(Image.open(path).convert("RGBA")))
    arr = trim(arr)
    im = Image.fromarray(arr, "RGBA")
    a = im.split()[3].filter(ImageFilter.GaussianBlur(0.4))
    rgb = ImageEnhance.Contrast(Image.merge("RGB", im.split()[:3])).enhance(1.05)
    im = Image.merge("RGBA", (*rgb.split(), a))
    if im.size[0] > max_w:
        s = max_w / im.size[0]
        im = im.resize((int(im.size[0] * s), int(im.size[1] * s)), Image.Resampling.LANCZOS)
    im.save(os.path.join(OUT, dest_name), optimize=True)
    print("saved", dest_name, im.size)


def main():
    os.makedirs(OUT, exist_ok=True)
    for dest, src in FILES.items():
        process(src, dest, max_w=780 if dest == "full.png" else 640)


if __name__ == "__main__":
    main()
