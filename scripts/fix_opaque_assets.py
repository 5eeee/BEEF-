"""Force-opaque food layers: kill white BG on floats + fill veggies holes."""
from __future__ import annotations

import os

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "images")
FLOAT = os.path.join(ROOT, "float")


def kill_white_bg(arr: np.ndarray) -> np.ndarray:
    rgb = arr[:, :, :3].astype(np.float32)
    a = arr[:, :, 3].astype(np.float32)
    # If almost fully opaque corners with bright pixels → treat as white canvas
    corners = np.concatenate(
        [
            arr[:8, :8].reshape(-1, 4),
            arr[:8, -8:].reshape(-1, 4),
            arr[-8:, :8].reshape(-1, 4),
            arr[-8:, -8:].reshape(-1, 4),
        ]
    )
    corner_white = ((corners[:, 0] > 230) & (corners[:, 1] > 230) & (corners[:, 2] > 230) & (corners[:, 3] > 200)).mean()
    if corner_white < 0.15 and a.mean() < 200:
        # already cut — still despill near-white fringe
        fringe = (a > 10) & (a < 220) & (rgb.mean(2) > 220)
        a = np.where(fringe, a * 0.2, a)
        out = arr.copy()
        out[:, :, 3] = np.clip(a, 0, 255).astype(np.uint8)
        return out

    lum = rgb.mean(2)
    sat = rgb.max(2) - rgb.min(2)
    alpha = np.clip(1.0 - (lum - 210) / 35.0, 0, 1)
    alpha = np.where(sat > 28, np.maximum(alpha, 0.9), alpha)
    alpha = np.where((lum > 245) & (sat < 18), 0.0, alpha)
    out = np.zeros_like(arr)
    out[:, :, :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    out[:, :, 3] = (alpha * 255).astype(np.uint8)
    return out


def fill_internal_holes(arr: np.ndarray) -> np.ndarray:
    """Make semi-transparent interior of food fully opaque (fix 'hole' look)."""
    a = arr[:, :, 3].astype(np.float32)
    rgb = arr[:, :, :3].astype(np.float32)
    h, w = a.shape
    # food mask = any meaningful alpha
    food = a > 40
    if not food.any():
        return arr
    # dilate/erode approx via blur
    mask_img = Image.fromarray((food.astype(np.uint8) * 255), "L")
    solid = mask_img.filter(ImageFilter.MaxFilter(9))
    solid = np.array(solid) > 128
    # interior: solid but currently low alpha, and not pure black
    interior = solid & (a < 240) & (rgb.mean(2) > 25)
    # boost alpha to opaque; slightly darken to avoid white flashes
    a = np.where(interior, 255, a)
    # also kill pure black exterior leftovers
    exterior = ~solid
    a = np.where(exterior, 0, a)
    out = arr.copy()
    out[:, :, 3] = a.astype(np.uint8)
    return out


def trim(arr: np.ndarray, pad: int = 6) -> np.ndarray:
    opac = arr[:, :, 3] > 15
    if not opac.any():
        return arr
    ys, xs = np.where(opac)
    return arr[
        max(0, ys.min() - pad) : min(arr.shape[0], ys.max() + pad + 1),
        max(0, xs.min() - pad) : min(arr.shape[1], xs.max() + pad + 1),
    ]


def save(arr: np.ndarray, path: str, max_side: int = 520):
    arr = trim(arr)
    im = Image.fromarray(arr, "RGBA")
    a = im.split()[3].filter(ImageFilter.GaussianBlur(0.4))
    im = Image.merge("RGBA", (*im.split()[:3], a))
    m = max(im.size)
    if m > max_side:
        s = max_side / m
        im = im.resize((int(im.size[0] * s), int(im.size[1] * s)), Image.Resampling.LANCZOS)
    im.save(path, optimize=True)
    print("saved", os.path.basename(path), im.size)


def main():
    # Fix floats with white backgrounds
    for name in sorted(os.listdir(FLOAT)):
        if not name.endswith(".png"):
            continue
        path = os.path.join(FLOAT, name)
        arr = np.array(Image.open(path).convert("RGBA"))
        fixed = kill_white_bg(arr)
        fixed = fill_internal_holes(fixed) if name.startswith(("tomato", "cucumber", "onion", "stack", "leaf")) else fixed
        save(fixed, path, max_side=440)

    # Burger veggies layer
    veg_path = os.path.join(ROOT, "layer-veggies.png")
    if os.path.exists(veg_path):
        arr = np.array(Image.open(veg_path).convert("RGBA"))
        arr = kill_white_bg(arr)
        arr = fill_internal_holes(arr)
        # Extra: force center disk opaque if tomato/lettuce present
        h, w = arr.shape[:2]
        yy, xx = np.ogrid[:h, :w]
        cy, cx = h // 2, w // 2
        r = min(h, w) * 0.22
        disk = (yy - cy) ** 2 + (xx - cx) ** 2 <= r ** 2
        # only fill where some food color exists nearby
        nearby = arr[:, :, 3] > 30
        if nearby[disk].mean() > 0.2:
            arr[:, :, 3] = np.where(disk & nearby, 255, arr[:, :, 3])
        save(arr, veg_path, max_side=720)
        print("veggies opaque center ready")

    # Rebuild rotated variants from cleaned primaries
    from PIL import ImageEnhance

    def variant(src, dest, rot, mirror=False, scale=1.0):
        im = Image.open(os.path.join(FLOAT, src)).convert("RGBA")
        if mirror:
            im = im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        im = im.rotate(rot, expand=True, resample=Image.Resampling.BICUBIC)
        if abs(scale - 1) > 0.01:
            im = im.resize((int(im.size[0] * scale), int(im.size[1] * scale)), Image.Resampling.LANCZOS)
        im.save(os.path.join(FLOAT, dest), optimize=True)
        print("variant", dest)

    if os.path.exists(os.path.join(FLOAT, "tomato-1.png")):
        variant("tomato-1.png", "tomato-3.png", 40, True, 0.9)
        variant("tomato-1.png", "tomato-5.png", 15, True, 0.7)
    if os.path.exists(os.path.join(FLOAT, "cucumber-1.png")):
        variant("cucumber-1.png", "cucumber-3.png", 20, False, 0.88)


if __name__ == "__main__":
    main()
