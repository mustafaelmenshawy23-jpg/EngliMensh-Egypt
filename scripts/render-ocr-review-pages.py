#!/usr/bin/env python3
"""Render every page listed in the OCR manual-review queue for visual inspection."""
import json
import re
from datetime import datetime, timezone
from pathlib import Path

import fitz

ROOT = Path.cwd()
BOOKS = ROOT / "public" / "books"
QUEUE = ROOT / "docs" / "ocr-manual-review-queue.md"
OUT = ROOT / "review-pages"
DPI = 120


def parse_pages(cell: str) -> list[int]:
    cell = cell.strip().replace("`", "")
    if not cell or cell in {"—", "-", "–"}:
        return []
    return [int(value.strip()) for value in cell.split(",") if value.strip().isdigit()]


def parse_queue():
    rows = []
    for line in QUEUE.read_text(encoding="utf-8").splitlines():
        if not line.startswith("|") or "Source PDF" in line or "---" in line:
            continue
        cells = [part.strip() for part in line.strip().strip("|").split("|")]
        if len(cells) != 4:
            continue
        filename = cells[0].strip("`")
        if not filename.lower().endswith(".pdf"):
            continue
        empty = set(parse_pages(cells[2]))
        nonempty = set(parse_pages(cells[3]))
        flagged = sorted(empty | nonempty)
        for page in flagged:
            kind = "empty_ocr" if page in empty else "nonempty_but_flagged"
            rows.append({"sourceFilename": filename, "pdfPage": page, "queueClass": kind})
    unique = {(r["sourceFilename"], r["pdfPage"]): r for r in rows}
    return sorted(unique.values(), key=lambda r: (r["sourceFilename"].casefold(), r["pdfPage"]))


def main():
    if not QUEUE.is_file():
        raise SystemExit(f"Missing review queue: {QUEUE}")
    pages = parse_queue()
    if not pages:
        raise SystemExit("No flagged pages were parsed from the OCR review queue.")

    OUT.mkdir(parents=True, exist_ok=True)
    manifest_pages = []
    by_file = {}
    for item in pages:
        filename = item["sourceFilename"]
        source = BOOKS / filename
        if not source.is_file():
            raise SystemExit(f"Required review PDF is missing: {source}")
        if filename not in by_file:
            with source.open("rb") as stream:
                header = stream.read(256)
            if not header.startswith(b"%PDF-"):
                raise SystemExit(f"Source is not a hydrated PDF (possibly an LFS pointer): {source}")
            by_file[filename] = fitz.open(source)

        doc = by_file[filename]
        page_no = item["pdfPage"]
        if page_no < 1 or page_no > len(doc):
            raise SystemExit(f"Page {page_no} is outside {filename} ({len(doc)} pages).")

        slug = re.sub(r"[^A-Za-z0-9_-]+", "_", Path(filename).stem).strip("_")[:48] or "book"
        image_name = f"{len(manifest_pages) + 1:03d}_{slug}_p{page_no:04d}.png"
        pix = doc.load_page(page_no - 1).get_pixmap(
            matrix=fitz.Matrix(DPI / 72, DPI / 72),
            colorspace=fitz.csRGB,
            alpha=False,
        )
        pix.save(OUT / image_name)
        manifest_pages.append({
            **item,
            "image": image_name,
            "visualReviewStatus": "pending",
            "dpi": DPI,
        })

    for doc in by_file.values():
        doc.close()

    manifest = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "sourceQueue": "docs/ocr-manual-review-queue.md",
        "pageNumbering": "pdfPage is the 1-based physical PDF page number",
        "totalPages": len(manifest_pages),
        "sourceBooks": len(by_file),
        "visualReviewStatus": "pending",
        "pages": manifest_pages,
    }
    (OUT / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Rendered {len(manifest_pages)} review pages from {len(by_file)} PDFs into {OUT}.")


if __name__ == "__main__":
    main()
