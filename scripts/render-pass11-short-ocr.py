#!/usr/bin/env python3
"""Render Pass 11 short/fragmentary OCR candidates from hydrated source PDFs."""
import json
import re
from pathlib import Path
import fitz

ROOT = Path.cwd()
BOOKS = ROOT / "public" / "books"
SOURCE = ROOT / "src" / "data" / "extracted" / "ocr-quality-audit-pass11.jsonl"
OUT = ROOT / "review-pages-pass11"
DPI = int(__import__("os").environ.get("RENDER_DPI", "240"))
if DPI not in (180, 240, 300):
    raise SystemExit("RENDER_DPI must be 180, 240, or 300")

def main():
    records = [json.loads(line) for line in SOURCE.read_text(encoding="utf-8").splitlines() if line.strip()]
    candidates = [r for r in records if r.get("contentType") == "short_or_fragmentary_ocr"]
    if not candidates:
        raise SystemExit("No Pass 11 short/fragmentary OCR candidates found.")
    OUT.mkdir(parents=True, exist_ok=True)
    opened = {}
    manifest = []
    for idx, item in enumerate(candidates, 1):
        filename = item["sourceFilename"]
        pdf = BOOKS / filename
        if not pdf.is_file():
            raise SystemExit(f"Missing source PDF: {pdf}")
        if filename not in opened:
            with pdf.open("rb") as stream:
                if not stream.read(256).startswith(b"%PDF-"):
                    raise SystemExit(f"Source is not a hydrated PDF (LFS pointer?): {pdf}")
            opened[filename] = fitz.open(pdf)
        doc = opened[filename]
        page = int(item["pdfPage"])
        if page < 1 or page > len(doc):
            raise SystemExit(f"Invalid page {page} for {filename}; PDF has {len(doc)} pages.")
        slug = re.sub(r"[^A-Za-z0-9_-]+", "_", Path(filename).stem).strip("_")[:48] or "book"
        name = f"{idx:03d}_{slug}_p{page:04d}_{DPI}dpi.png"
        pix = doc.load_page(page - 1).get_pixmap(matrix=fitz.Matrix(DPI / 72, DPI / 72), colorspace=fitz.csRGB, alpha=False)
        pix.save(OUT / name)
        manifest.append({**item, "image": name, "dpi": DPI, "renderStatus": "rendered_pending_visual_review"})
    for doc in opened.values():
        doc.close()
    (OUT / "manifest.json").write_text(json.dumps({
        "source": "src/data/extracted/ocr-quality-audit-pass11.jsonl",
        "pageNumbering": "1-based physical PDF page",
        "dpi": DPI,
        "totalPages": len(manifest),
        "sourceBooks": len(opened),
        "status": "pending_visual_review",
        "pages": manifest
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Rendered {len(manifest)} pages from {len(opened)} PDFs at {DPI} DPI.")
if __name__ == "__main__":
    main()
