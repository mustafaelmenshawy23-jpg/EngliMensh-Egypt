#!/usr/bin/env python3
"""Generate Android launcher and PWA icons from the approved source artwork."""
from pathlib import Path
from PIL import Image, ImageOps
import sys

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public/assets/englimensh-app-icon-source.png"
ANDROID = ROOT / "android/app/src/main/res"
WEB = ROOT / "public/assets/app-icons"

if not SOURCE.is_file():
    sys.exit("Missing approved source image: public/assets/englimensh-app-icon-source.png")

im = Image.open(SOURCE).convert("RGBA")
if im.width != im.height:
    side = max(im.size)
    canvas = Image.new("RGBA", (side, side), (13, 39, 83, 255))
    canvas.alpha_composite(im, ((side-im.width)//2, (side-im.height)//2))
    im = canvas

def save_png(image, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, "PNG", optimize=True)

# Legacy Android launcher icons.
for folder, size in {
    "mipmap-mdpi": 48, "mipmap-hdpi": 72, "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144, "mipmap-xxxhdpi": 192,
}.items():
    icon = ImageOps.fit(im, (size, size), method=Image.Resampling.LANCZOS)
    save_png(icon, ANDROID / folder / "ic_launcher.png")
    save_png(icon, ANDROID / folder / "ic_launcher_round.png")

# Adaptive foreground, centered within the 66% Android safe zone.
for folder, size in {
    "mipmap-mdpi": 108, "mipmap-hdpi": 162, "mipmap-xhdpi": 216,
    "mipmap-xxhdpi": 324, "mipmap-xxxhdpi": 432,
}.items():
    canvas = Image.new("RGBA", (size, size), (13, 39, 83, 0))
    art_size = int(size * 0.66)
    art = ImageOps.fit(im, (art_size, art_size), method=Image.Resampling.LANCZOS)
    canvas.alpha_composite(art, ((size-art_size)//2, (size-art_size)//2))
    save_png(canvas, ANDROID / folder / "ic_launcher_foreground.png")

values = ANDROID / "values"
values.mkdir(parents=True, exist_ok=True)
(values / "ic_launcher_background.xml").write_text(
    '<?xml version="1.0" encoding="utf-8"?>\n'
    '<resources><color name="ic_launcher_background">#0D2753</color></resources>\n',
    encoding="utf-8")
adaptive = ANDROID / "mipmap-anydpi-v26"
adaptive.mkdir(parents=True, exist_ok=True)
xml = (
    '<?xml version="1.0" encoding="utf-8"?>\n'
    '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
    '  <background android:drawable="@color/ic_launcher_background"/>\n'
    '  <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n'
    '</adaptive-icon>\n'
)
(adaptive / "ic_launcher.xml").write_text(xml, encoding="utf-8")
(adaptive / "ic_launcher_round.xml").write_text(xml, encoding="utf-8")

for size in (192, 512):
    save_png(ImageOps.fit(im, (size, size), method=Image.Resampling.LANCZOS),
             WEB / f"icon-{size}.png")
print("Generated Android launcher/adaptive icons and PWA icons.")
