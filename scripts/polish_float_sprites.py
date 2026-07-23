"""Clean rembg fringe + make rotated variants for denser orbit."""
from __future__ import annotations

import os

import numpy as np
from PIL import Image, ImageFilter, ImageEnhance

OUT = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "images", "float")


def decontaminate(path: str):
    im = Image.open(path).convert("RGBA")
    arr = np.array(im).astype(np.float32)
    a = arr[:, :, 3]
    # Soft contract: kill near-transparent fringe
    a = np.clip((a - 18) * (255 / (255 - 18)), 0, 255)
    # Edge mask
    edge = (a > 20) & (a < 230)
    rgb = arr[:, :, :3]
    # Pull bright fringe toward local food color (despill white)
    lum = rgb.mean(axis=2)
    bright = edge & (lum > 200)
    # Mix toward darker neighbor estimate via green channel preference for leaves
    rgb[bright] = rgb[bright] * 0.55 + np.array([40, 90, 40], dtype=np.float32) * 0.15
    # For red foods
    redish = edge & (rgb[:, :, 0] > rgb[:, :, 1] + 30) & (lum > 180)
    rgb[redish] = rgb[redish] * 0.7 + np.array([160, 30, 30], dtype=np.float32) * 0.3

    arr[:, :, :3] = np.clip(rgb, 0, 255)
    arr[:, :, 3] = a
    out = Image.fromarray(arr.astype(np.uint8), "RGBA")
    # slight alpha blur for anti-alias
    aa = out.split()[3].filter(ImageFilter.GaussianBlur(0.45))
    out = Image.merge("RGBA", (*out.split()[:3], aa))
    # trim
    bbox = out.getbbox()
    if bbox:
        out = out.crop(bbox)
    # normalize size
    m = max(out.size)
    if m > 480:
        s = 440 / m
        out = out.resize((int(out.size[0] * s), int(out.size[1] * s)), Image.Resampling.LANCZOS)
    out.save(path, optimize=True)
    print("cleaned", os.path.basename(path), out.size)


def make_variant(src: str, dest: str, rotate: float, mirror: bool = False, scale: float = 1.0):
    im = Image.open(os.path.join(OUT, src)).convert("RGBA")
    if mirror:
        im = im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    if abs(rotate) > 0.1:
        im = im.rotate(rotate, expand=True, resample=Image.Resampling.BICUBIC)
    if abs(scale - 1.0) > 0.01:
        im = im.resize((int(im.size[0] * scale), int(im.size[1] * scale)), Image.Resampling.LANCZOS)
    # slight color shift for variety
    rgb = Image.merge("RGB", im.split()[:3])
    rgb = ImageEnhance.Color(rgb).enhance(1.05 if not mirror else 0.98)
    im = Image.merge("RGBA", (*rgb.split(), im.split()[3]))
    im.save(os.path.join(OUT, dest), optimize=True)
    print("variant", dest)


def main():
    # Clean rembg primaries
    for name in [
        "leaf-1.png",
        "leaf-2.png",
        "onion-1.png",
        "onion-2.png",
        "stack-1.png",
        "seed-1.png",
        "tomato-2.png",
        "cucumber-2.png",
        "tomato-1.png",
        "cucumber-1.png",
    ]:
        p = os.path.join(OUT, name)
        if os.path.exists(p):
            decontaminate(p)

    # Rotated / mirrored variants so orbit isn't copy-paste identical
    make_variant("leaf-1.png", "leaf-3.png", 35, False, 0.92)
    make_variant("leaf-2.png", "leaf-4.png", -28, True, 0.88)
    make_variant("leaf-1.png", "leaf-5.png", 70, True, 0.75)
    make_variant("leaf-2.png", "leaf-6.png", -55, False, 0.8)
    make_variant("tomato-1.png", "tomato-3.png", 40, False, 0.9)
    make_variant("tomato-2.png", "tomato-4.png", -25, False, 0.85)
    make_variant("tomato-1.png", "tomato-5.png", 15, True, 0.7)
    make_variant("cucumber-1.png", "cucumber-3.png", 20, False, 0.88)
    make_variant("cucumber-2.png", "cucumber-4.png", -35, True, 0.8)
    make_variant("onion-1.png", "onion-3.png", 48, True, 0.82)
    make_variant("seed-1.png", "seed-2.png", 25, False, 0.7)
    make_variant("seed-1.png", "seed-3.png", -40, False, 0.55)
    make_variant("stack-1.png", "stack-2.png", -18, True, 0.78)
    print("done")


if __name__ == "__main__":
    main()
