"""Slice a full side-profile burger into aligned transparent layers.

Each layer keeps the SAME canvas size and position as the full image,
so stacking them recreates the burger; explode = translateY only.
"""
from __future__ import annotations

import os

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "images", "kit")

# Named bands as fractions of the burger bounding-box height (top→bottom)
BANDS = [
    ("bun-top", 0.00, 0.22),
    ("lettuce", 0.16, 0.34),
    ("tomato", 0.28, 0.44),
    ("cheese", 0.38, 0.52),
    ("patty", 0.46, 0.70),
    ("pickles", 0.64, 0.78),
    ("bun-bottom", 0.72, 1.00),
]


def key_white(arr: np.ndarray) -> np.ndarray:
    rgb = arr[:, :, :3].astype(np.float32)
    a = arr[:, :, 3].astype(np.float32) if arr.shape[2] == 4 else np.full(rgb.shape[:2], 255.0)
    lum = rgb.mean(2)
    sat = rgb.max(2) - rgb.min(2)
    alpha = np.clip(1.0 - (lum - 205) / 38.0, 0, 1)
    alpha = np.where(sat > 14, np.maximum(alpha, 0.92), alpha)
    alpha = np.where((lum > 246) & (sat < 10), 0.0, alpha)
    # keep already-transparent
    alpha = np.minimum(alpha, a / 255.0)
    out = np.zeros((*rgb.shape[:2], 4), dtype=np.uint8)
    out[:, :, :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    out[:, :, 3] = (alpha * 255).astype(np.uint8)
    return out


def burger_bbox(alpha: np.ndarray, thresh: int = 28):
    ys, xs = np.where(alpha > thresh)
    if len(ys) == 0:
        h, w = alpha.shape
        return 0, 0, w, h
    pad = 4
    y0 = max(0, int(ys.min()) - pad)
    y1 = min(alpha.shape[0], int(ys.max()) + pad + 1)
    x0 = max(0, int(xs.min()) - pad)
    x1 = min(alpha.shape[1], int(xs.max()) + pad + 1)
    return x0, y0, x1, y1


def soft_edge(layer: np.ndarray) -> np.ndarray:
    im = Image.fromarray(layer, "RGBA")
    a = im.split()[3].filter(ImageFilter.GaussianBlur(0.45))
    return np.array(Image.merge("RGBA", (*im.split()[:3], a)))


def slice_burger(src_path: str, out_dir: str):
    os.makedirs(out_dir, exist_ok=True)
    raw = np.array(Image.open(src_path).convert("RGBA"))
    keyed = key_white(raw)
    h, w = keyed.shape[:2]
    x0, y0, x1, y1 = burger_bbox(keyed[:, :, 3])
    bh = y1 - y0

    # Save keyed full
    Image.fromarray(keyed, "RGBA").save(os.path.join(out_dir, "full.png"), optimize=True)

    for name, t0, t1 in BANDS:
        sy0 = y0 + int(bh * t0)
        sy1 = y0 + int(bh * t1)
        sy0 = max(0, min(h - 1, sy0))
        sy1 = max(sy0 + 1, min(h, sy1))

        layer = np.zeros_like(keyed)
        # copy only this horizontal band, full width of canvas (preserves X alignment)
        band = keyed[sy0:sy1, :, :].copy()
        # fade edges of band vertically for softer split
        band_h = band.shape[0]
        if band_h > 6:
            ramp = np.ones((band_h, 1), dtype=np.float32)
            edge = min(5, band_h // 4)
            ramp[:edge, 0] = np.linspace(0.15, 1.0, edge)
            ramp[-edge:, 0] = np.linspace(1.0, 0.15, edge)
            band[:, :, 3] = (band[:, :, 3].astype(np.float32) * ramp).astype(np.uint8)

        layer[sy0:sy1, :, :] = band
        # clear almost-empty leftover
        layer = soft_edge(layer)
        Image.fromarray(layer, "RGBA").save(os.path.join(out_dir, f"{name}.png"), optimize=True)
        print(" ", name, f"y={sy0}-{sy1}")

    print("done", out_dir)


def main():
    kits = {
        "classic": [
            os.path.join(ROOT, "classic", "full.png"),
            os.path.join(ROOT, "classic", "full-alt.png"),
            os.path.join(os.path.dirname(ROOT), "profile", "classic.png"),
        ],
        "spicy": [
            os.path.join(ROOT, "spicy", "full.png"),
            os.path.join(os.path.dirname(ROOT), "profile", "spicy.png"),
        ],
        "cheese": [
            os.path.join(ROOT, "cheese", "full.png"),
            os.path.join(os.path.dirname(ROOT), "profile", "cheese.png"),
        ],
    }
    for name, candidates in kits.items():
        src = next((p for p in candidates if os.path.exists(p)), None)
        if not src:
            print("skip missing", name)
            continue
        print("slicing", name, "from", src)
        slice_burger(src, os.path.join(ROOT, name))


if __name__ == "__main__":
    main()
