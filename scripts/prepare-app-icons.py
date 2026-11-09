#!/usr/bin/env python3
"""Prepare official EngliMensh-Egypt launcher/PWA icons from the owner's exact GitHub attachment."""
from __future__ import annotations

import argparse
import io
import time
import urllib.error
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
        headers={
            "User-Agent": "EngliMensh-Egypt-AppIconBuilder/1.0",
            "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
            "Cache-Control": "no-cache",
        },
    )
    data = None
    last_error: Exception | None = None
    # GitHub user-attachment delivery can intermittently return 502/503/504.
    # Retry transient delivery failures without ever substituting another image.
    for attempt, delay in enumerate((0, 5, 15, 30, 45), start=1):
        if delay:
            time.sleep(delay)
        try:
            with urllib.request.urlopen(request, timeout=90) as response:
                data = response.read()
            break
        except urllib.error.HTTPError as error:
            last_error = error
            if error.code not in {408, 425, 429, 500, 502, 503, 504}:
                raise RuntimeError(
                    f"The selected GitHub icon attachment returned HTTP {error.code}; "
                    "the original artwork was not replaced."
                ) from error
        except (urllib.error.URLError, TimeoutError, OSError) as error:
            last_error = error
    if data is None:
        raise RuntimeError(
            "Could not retrieve the exact selected GitHub icon attachment after 5 attempts. "
            "No substitute artwork was used."
        ) from last_error
    if len(data) < 10_000:
        raise RuntimeError(
            f"The selected GitHub attachment is unexpectedly small ({len(data)} bytes)."
        )
    PUBLIC_ICONS.mkdir(parents=True, exist_ok=True)
    try:
        image = Image.open(io.BytesIO(data))
        image_format = (image.format or "").upper()
        if image_format not in {"JPEG", "PNG", "WEBP"}:
            raise RuntimeError(f"Unsupported selected icon image format: {image_format or 'unknown'}.")
        image.verify()
        decoded = Image.open(io.BytesIO(data)).convert("RGB")
    except Exception as error:
        raise RuntimeError(
            "The selected GitHub attachment could not be decoded as a valid JPEG, PNG, or WEBP image."
        ) from error
    extension = {"JPEG": ".jpg", "PNG": ".png", "WEBP": ".webp"}[image_format]
    SOURCE_PATH.with_suffix(extension).write_bytes(data)
    return decoded


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
