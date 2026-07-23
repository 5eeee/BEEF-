"""Convert generated clean assets to transparent float sprites."""
from __future__ import annotations

import os
import shutil

import numpy as np
from PIL import Image, ImageFilter, ImageEnhance

ASSETS = os.path.join(os.path.dirname(__file__), "..", "..", "Users", "User", ".cursor", "projects", "c-beefshteks-new", "assets")
# Prefer explicit path via env or sibling
CANDIDATES = [
    r"C:\Users\User\.cursor\projects\c-beefshteks-new\assets",
    "/work/assets_host",
]
OUT = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "images", "float")


def find_assets() -> str:
    for p in CANDIDATES:
        if os.path.isdir(p):
            return p
    raise SystemExit("assets dir not found")


def remove_white_bg(arr: np.ndarray, thresh: float = 235.0, soft: float = 28.0) -> np.ndarray:
    rgb = arr[:, :, :3].astype(np.float32)
    # luminance closeness to white
    mn = rgb.min(axis=2)
    mx = rgb.max(axis=2)
    whiteness = (mn + mx) / 2.0
    # near-white AND low saturation
    sat = mx - mn
    bg = (whiteness > thresh - soft) & (sat < 40)
    alpha = np.ones(arr.shape[:2], dtype=np.float32)
    # soft falloff toward white
    t = np.clip((whiteness - (thresh - soft)) / soft, 0, 1)
    alpha = np.where(sat < 45, 1.0 - t, alpha)
    alpha = np.where(whiteness >= thresh + 5, 0.0, alpha)
    # keep saturated food pixels
    alpha = np.where(sat > 35, np.maximum(alpha, 0.85), alpha)

    out = np.zeros((*arr.shape[:2], 4), dtype=np.uint8)
    out[:, :, :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    out[:, :, 3] = np.clip(alpha * 255, 0, 255).astype(np.uint8)
    return out


def remove_dark_bg(arr: np.ndarray) -> np.ndarray:
    rgb = arr[:, :, :3].astype(np.float32)
    lum = 0.2126 * rgb[:, :, 0] + 0.7152 * rgb[:, :, 1] + 0.0722 * rgb[:, :, 2]
    alpha = np.clip((lum - 12) / 28.0, 0, 1)
    out = np.zeros((*arr.shape[:2], 4), dtype=np.uint8)
    out[:, :, :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    out[:, :, 3] = np.clip(alpha * 255, 0, 255).astype(np.uint8)
    return out


def trim(arr: np.ndarray, pad: int = 8) -> np.ndarray:
    opac = arr[:, :, 3] > 20
    if not opac.any():
        return arr
    ys, xs = np.where(opac)
    y0, y1 = max(0, ys.min() - pad), min(arr.shape[0], ys.max() + pad + 1)
    x0, x1 = max(0, xs.min() - pad), min(arr.shape[1], xs.max() + pad + 1)
    return arr[y0:y1, x0:x1]


def polish(arr: np.ndarray) -> Image.Image:
    im = Image.fromarray(arr, "RGBA")
    a = im.split()[3].filter(ImageFilter.GaussianBlur(0.5))
    rgb = Image.merge("RGB", im.split()[:3])
    rgb = ImageEnhance.Color(rgb).enhance(1.08)
    rgb = ImageEnhance.Contrast(rgb).enhance(1.04)
    im = Image.merge("RGBA", (*rgb.split(), a))
    # resize to ~360 max for crisp float
    m = max(im.size)
    if m > 420:
        s = 400 / m
        im = im.resize((int(im.size[0] * s), int(im.size[1] * s)), Image.Resampling.LANCZOS)
    return im


def process_file(src: str, dest_name: str, mode: str = "white"):
    arr = np.array(Image.open(src).convert("RGBA"))
    keyed = remove_white_bg(arr) if mode == "white" else remove_dark_bg(arr)
    keyed = trim(keyed)
    # skip if almost empty
    if keyed[:, :, 3].mean() < 5:
        print("skip empty", dest_name)
        return
    polish(keyed).save(os.path.join(OUT, dest_name), optimize=True)
    print("saved", dest_name)


def main():
    assets = find_assets()
    os.makedirs(OUT, exist_ok=True)
    # clear old
    for f in os.listdir(OUT):
        if f.endswith(".png"):
            os.remove(os.path.join(OUT, f))

    mapping = [
        ("leaf-clean-1.png", "leaf-1.png", "dark"),
        ("leaf-clean-2.png", "leaf-2.png", "white"),
        ("tomato-clean-1.png", "tomato-1.png", "dark"),
        ("tomato-clean-2.png", "tomato-2.png", "white"),
        ("cucumber-clean-1.png", "cucumber-1.png", "dark"),
        ("cucumber-clean-2.png", "cucumber-2.png", "white"),
        ("onion-clean-1.png", "onion-1.png", "dark"),
        ("onion-clean-2.png", "onion-2.png", "white"),
        ("seeds-clean-1.png", "seed-1.png", "white"),
        ("stack-clean-1.png", "stack-1.png", "white"),
    ]
    # Also copy variants with slight rotation-ready duplicates by reprocessing
    extras = [
        ("leaf-clean-2.png", "leaf-3.png", "white"),
        ("leaf-clean-1.png", "leaf-4.png", "dark"),
        ("tomato-clean-1.png", "tomato-3.png", "dark"),
        ("tomato-clean-2.png", "tomato-4.png", "white"),
        ("cucumber-clean-1.png", "cucumber-3.png", "dark"),
        ("onion-clean-2.png", "onion-3.png", "white"),
        ("seeds-clean-1.png", "seed-2.png", "white"),
        ("seeds-clean-1.png", "seed-3.png", "white"),
        ("stack-clean-1.png", "stack-2.png", "white"),
        ("leaf-clean-2.png", "leaf-5.png", "white"),
        ("tomato-clean-1.png", "tomato-5.png", "dark"),
        ("cucumber-clean-2.png", "cucumber-4.png", "white"),
        ("leaf-clean-1.png", "leaf-6.png", "dark"),
    ]

    for src_name, dest, mode in mapping + extras:
        path = os.path.join(assets, src_name)
        if not os.path.exists(path):
            print("missing", path)
            continue
        process_file(path, dest, mode)


if __name__ == "__main__":
    main()
