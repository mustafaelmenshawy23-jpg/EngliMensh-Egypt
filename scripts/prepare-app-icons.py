#!/usr/bin/env python3
"""Prepare official EngliMensh-Egypt launcher/PWA icons from the owner's exact GitHub attachment."""
from __future__ import annotations

import argparse
import io
import urllib.request
from pathlib import Path

from PIL import Image

SOURCE_URL = "https://github.com/user-attachments/assets/1ca26e40-e568-42ff-84fa-c83369991f31"
ROOT = Path(__file__).resolve().parents[1]
PUBLIC_ICONS = ROOT / "public" / "icons"
SOURCE_PATH = PUBLIC_ICONS / "englimensh-icon-source.jpg"


def download_source() -> Image.Image:
    request = urllib.request.Request(
        SOURCE_URL,
        headers={"User-Agent": "EngliMensh-Egypt-AppIconBuilder/1.0"},
    )
    with urllib.request.urlopen(request, timeout=45) as response:
        data = response.read()
    if len(data) < 10_000 or not data.startswith(b"\xff\xd8\xff"):
        raise RuntimeError("The selected GitHub attachment did not return the expected JPEG image.")
    PUBLIC_ICONS.mkdir(parents=True, exist_ok=True)
    SOURCE_PATH.write_bytes(data)
    image = Image.open(io.BytesIO(data))
    image.verify()
    return Image.open(io.BytesIO(data)).convert("RGB")


def save_web_icons(source: Image.Image) -> None:
    for size in (192, 512):
        target = PUBLIC_ICONS / f"englimensh-icon-{size}.png"
        source.resize((size, size), Image.Resampling.LANCZOS).save(target, format="PNG", optimize=True)


def save_android_icons(source: Image.Image) -> None:
    res = ROOT / "android" / "app" / "src" / "main" / "res"
    if not (res / "mipmap-mdpi").exists():
        raise RuntimeError("Android project resources were not generated before icon preparation.")

    density_sizes = {
        "mipmap-mdpi": 48,
        "mipmap-hdpi": 72,
        "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144,
        "mipmap-xxxhdpi": 192,
    }
    for folder, size in density_sizes.items():
        out_dir = res / folder
        out_dir.mkdir(parents=True, exist_ok=True)
        icon = source.resize((size, size), Image.Resampling.LANCZOS)
        icon.save(out_dir / "ic_launcher.png", format="PNG", optimize=True)
        icon.save(out_dir / "ic_launcher_round.png", format="PNG", optimize=True)

    # Keep the entire selected artwork inside the adaptive-icon safe zone.
    foreground_dir = res / "drawable-nodpi"
    foreground_dir.mkdir(parents=True, exist_ok=True)
    foreground = Image.new("RGBA", (432, 432), (0, 0, 0, 0))
    art = source.resize((288, 288), Image.Resampling.LANCZOS).convert("RGBA")
    foreground.alpha_composite(art, ((432 - 288) // 2, (432 - 288) // 2))
    foreground.save(foreground_dir / "ic_launcher_foreground.png", format="PNG", optimize=True)

    values_dir = res / "values"
    values_dir.mkdir(parents=True, exist_ok=True)
    (values_dir / "ic_launcher_background.xml").write_text(
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<resources><color name="ic_launcher_background">#071D49</color></resources>\n',
        encoding="utf-8",
    )

    adaptive_dir = res / "mipmap-anydpi-v26"
    adaptive_dir.mkdir(parents=True, exist_ok=True)
    adaptive_xml = (
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
        '    <background android:drawable="@color/ic_launcher_background" />\n'
        '    <foreground android:drawable="@drawable/ic_launcher_foreground" />\n'
        '</adaptive-icon>\n'
    )
    (adaptive_dir / "ic_launcher.xml").write_text(adaptive_xml, encoding="utf-8")
    (adaptive_dir / "ic_launcher_round.xml").write_text(adaptive_xml, encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--web", action="store_true")
    parser.add_argument("--android", action="store_true")
    args = parser.parse_args()
    if not args.web and not args.android:
        parser.error("Select --web, --android, or both.")
    source = download_source()
    if args.web:
        save_web_icons(source)
    if args.android:
        save_android_icons(source)
    print(f"Prepared EngliMensh-Egypt icon from the selected source: {SOURCE_PATH}")


if __name__ == "__main__":
    main()
