"""High-quality float sprites: chroma from salad-src + rembg fallbacks."""
from __future__ import annotations

import os
from collections import deque

import numpy as np
from PIL import Image, ImageFilter, ImageEnhance

ROOT = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "images")
OUT = os.path.join(ROOT, "float")


def sample_key(arr: np.ndarray) -> np.ndarray:
    h, w = arr.shape[:2]
    corners = [
        arr[8:40, 8:40],
        arr[8:40, w - 40 : w - 8],
        arr[h - 40 : h - 8, 8:40],
        arr[h - 40 : h - 8, w - 40 : w - 8],
    ]
    return np.concatenate([c.reshape(-1, 4) for c in corners], 0)[:, :3].mean(0)


def chroma_key(arr: np.ndarray) -> np.ndarray:
    key = sample_key(arr)
    rgb = arr[:, :, :3].astype(np.float32)
    # Distance to key in RGB, weighted toward green channel
    diff = rgb - key
    dist = np.sqrt((diff[:, :, 0] * 0.7) ** 2 + (diff[:, :, 1] * 1.4) ** 2 + (diff[:, :, 2] * 0.7) ** 2)
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    greenness = g - np.maximum(r, b)

    # Soft matte: far from key green = opaque
    alpha = np.clip((dist - 38) / 55.0, 0, 1)
    alpha = np.where(greenness > 55, alpha * 0.05, alpha)
    alpha = np.where((g > 180) & (g > r * 1.35) & (g > b * 1.35), 0.0, alpha)

    # Despill
    spill = np.clip(greenness / 70.0, 0, 1)
    max_rb = np.maximum(r, b)
    g2 = np.minimum(g, max_rb * 0.98 + 10)
    rgb[:, :, 1] = g * (1 - spill * 0.9) + g2 * (spill * 0.9)
    # Kill residual green fringe on near-transparent pixels
    fringe = (alpha > 0.05) & (alpha < 0.55)
    rgb[:, :, 1] = np.where(fringe, np.minimum(rgb[:, :, 1], max_rb + 5), rgb[:, :, 1])

    out = np.zeros((*arr.shape[:2], 4), dtype=np.uint8)
    out[:, :, :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    out[:, :, 3] = np.clip(alpha * 255, 0, 255).astype(np.uint8)

    # Slight alpha erode of very dark fringe (black leftover)
    dark = (out[:, :, 0] < 35) & (out[:, :, 1] < 35) & (out[:, :, 2] < 35) & (out[:, :, 3] > 0)
    out[:, :, 3] = np.where(dark, 0, out[:, :, 3])
    return out


def connected_components(alpha: np.ndarray, min_area: int):
    h, w = alpha.shape
    mask = alpha > 45
    visited = np.zeros((h, w), dtype=bool)
    comps = []
    dirs = [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]
    ys, xs = np.where(mask)
    for y0, x0 in zip(ys.tolist(), xs.tolist()):
        if visited[y0, x0]:
            continue
        q = deque([(y0, x0)])
        visited[y0, x0] = True
        pixels = []
        minx = miny = 10**9
        maxx = maxy = -1
        while q:
            y, x = q.popleft()
            pixels.append((y, x))
            minx, maxx = min(minx, x), max(maxx, x)
            miny, maxy = min(miny, y), max(maxy, y)
            for dy, dx in dirs:
                ny, nx = y + dy, x + dx
                if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx] and mask[ny, nx]:
                    visited[ny, nx] = True
                    q.append((ny, nx))
        area = len(pixels)
        if area >= min_area:
            comps.append((area, minx, miny, maxx, maxy, pixels))
    comps.sort(reverse=True)
    return comps


def classify(crop: np.ndarray) -> str:
    opac = crop[:, :, 3] > 55
    if not opac.any():
        return "other"
    r = float(crop[:, :, 0][opac].mean())
    g = float(crop[:, :, 1][opac].mean())
    b = float(crop[:, :, 2][opac].mean())
    area = int(opac.sum())
    bw = crop.shape[1] / max(crop.shape[0], 1)
    if area < 700:
        return "seed"
    if r > 140 and r > g + 22 and r > b + 15:
        # leaf+tomato stack: big and green-ish avg would fail; red wins
        if area > 80000 and g > 90:
            return "stack"
        return "tomato"
    if (r > 100 and b > 85 and r > g + 10 and b > g - 10) or (r > 120 and b > 100 and g < 110):
        return "onion"
    if g > 105 and g > r + 15:
        return "leaf"
    if g > 85 and abs(bw - 1.0) < 0.35 and area < 45000:
        return "cucumber"
    if g > r:
        return "leaf"
    return "other"


def polish(crop: np.ndarray) -> Image.Image:
    im = Image.fromarray(crop, "RGBA")
    # Soften jagged alpha
    a = im.split()[3].filter(ImageFilter.GaussianBlur(0.6))
    r, g, b, _ = im.split()
    im = Image.merge("RGBA", (r, g, b, a))
    # Mild vibrance for dark hero
    rgb = Image.merge("RGB", im.split()[:3])
    rgb = ImageEnhance.Color(rgb).enhance(1.12)
    rgb = ImageEnhance.Contrast(rgb).enhance(1.06)
    im = Image.merge("RGBA", (*rgb.split(), im.split()[3]))
    # Upscale small pieces
    if max(im.size) < 200:
        im = im.resize((im.size[0] * 2, im.size[1] * 2), Image.Resampling.LANCZOS)
    elif max(im.size) > 520:
        # keep stacks usable but not huge
        scale = 420 / max(im.size)
        im = im.resize((int(im.size[0] * scale), int(im.size[1] * scale)), Image.Resampling.LANCZOS)
    return im


def extract(path: str, min_area: int, max_keep: int):
    arr = np.array(Image.open(path).convert("RGBA"))
    keyed = chroma_key(arr)
    comps = connected_components(keyed[:, :, 3], min_area)
    h, w = keyed.shape[:2]
    out = []
    for area, minx, miny, maxx, maxy, pixels in comps[:max_keep]:
        pad = 12
        x0, y0 = max(0, minx - pad), max(0, miny - pad)
        x1, y1 = min(w, maxx + pad + 1), min(h, maxy + pad + 1)
        crop = np.zeros((y1 - y0, x1 - x0, 4), dtype=np.uint8)
        for y, x in pixels:
            crop[y - y0, x - x0] = keyed[y, x]
        # also keep soft edge alphas from keyed bbox
        soft = keyed[y0:y1, x0:x1]
        m = soft[:, :, 3] > crop[:, :, 3]
        crop[m] = soft[m]
        opac = crop[:, :, 3] > 40
        if not opac.any():
            continue
        ys, xs = np.where(opac)
        crop = crop[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1]
        kind = classify(crop)
        if crop[:, :, 3].mean() < 12:
            continue
        out.append((kind, area, crop))
    return out


def crop_layer_rings(src_name: str, kind: str, boxes: list[tuple], counters: dict):
    """Manual crops from already-transparent layer PNGs."""
    path = os.path.join(ROOT, src_name)
    if not os.path.exists(path):
        return
    im = Image.open(path).convert("RGBA")
    w, h = im.size
    for i, (fx0, fy0, fx1, fy1) in enumerate(boxes):
        box = (int(fx0 * w), int(fy0 * h), int(fx1 * w), int(fy1 * h))
        crop = im.crop(box)
        # trim
        arr = np.array(crop)
        opac = arr[:, :, 3] > 30
        if not opac.any():
            continue
        ys, xs = np.where(opac)
        crop = crop.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
        counters[kind] = counters.get(kind, 0) + 1
        name = f"{kind}-{counters[kind]}.png"
        polish(np.array(crop)).save(os.path.join(OUT, name), optimize=True)
        print("saved", name, "(layer crop)")


def main():
    os.makedirs(OUT, exist_ok=True)
    for f in os.listdir(OUT):
        if f.endswith(".png"):
            os.remove(os.path.join(OUT, f))

    counters: dict[str, int] = {}
    all_items = []
    for name, mina, keep in [
        ("salad-src.png", 900, 30),
        ("lettuce-src.png", 4000, 3),
        ("veggies-src.png", 4000, 3),
    ]:
        path = os.path.join(ROOT, name)
        items = extract(path, mina, keep)
        print(f"{name}: {len(items)}")
        all_items.extend(items)

    by_kind: dict[str, list] = {}
    for kind, area, crop in all_items:
        by_kind.setdefault(kind, []).append((area, crop))

    limits = {"leaf": 8, "tomato": 7, "cucumber": 6, "onion": 4, "stack": 3, "other": 4, "seed": 12}
    for kind, lim in limits.items():
        pieces = sorted(by_kind.get(kind, []), key=lambda t: -t[0])[:lim]
        for area, crop in pieces:
            counters[kind] = counters.get(kind, 0) + 1
            name = f"{kind}-{counters[kind]}.png"
            polish(crop).save(os.path.join(OUT, name), optimize=True)
            print("saved", name)

    # Extra onion/pickle accents from transparent layers
    crop_layer_rings(
        "layer-onion.png",
        "onion",
        [
            (0.15, 0.2, 0.55, 0.55),
            (0.4, 0.35, 0.8, 0.75),
            (0.25, 0.45, 0.65, 0.85),
        ],
        counters,
    )
    crop_layer_rings(
        "layer-pickles.png",
        "cucumber",
        [
            (0.2, 0.2, 0.55, 0.55),
            (0.4, 0.35, 0.78, 0.72),
            (0.28, 0.5, 0.7, 0.88),
        ],
        counters,
    )
    print("done", sum(counters.values()))


if __name__ == "__main__":
    main()
