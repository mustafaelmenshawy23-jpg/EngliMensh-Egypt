#!/usr/bin/env python3
"""Render empty-OCR candidate pages at high resolution for blank-page verification."""
import json
import re
from pathlib import Path
import fitz

ROOT = Path.cwd()
BOOKS = ROOT / "public" / "books"
QUEUE = ROOT / "docs" / "ocr-manual-review-queue.md"
OUT = ROOT / "blank-candidate-pages"
DPI = int(__import__("os").environ.get("REVIEW_DPI", "240"))

def pages_from_cell(value):
    value = value.strip().replace("`", "")
    if not value or value in {"—", "-", "–"}:
        return []
    return [int(x.strip()) for x in value.split(",") if x.strip().isdigit()]

def main():
    entries = {}
    for line in QUEUE.read_text(encoding="utf-8").splitlines():
        if not line.startswith("|") or "Source PDF" in line or "---" in line:
            continue
        cells = [x.strip() for x in line.strip().strip("|").split("|")]
        if len(cells) != 4:
            continue
        filename = cells[0].strip("`")
        if not filename.lower().endswith(".pdf"):
            continue
        for page in pages_from_cell(cells[2]):
            entries[(filename, page)] = {"sourceFilename": filename, "pdfPage": page}

    if not entries:
        raise SystemExit("No empty-OCR candidates found.")
    OUT.mkdir(parents=True, exist_ok=True)
    docs, manifest = {}, []
    for filename, page_no in sorted(entries):
        source = BOOKS / filename
        if not source.is_file():
            raise SystemExit(f"Missing source PDF: {source}")
        if filename not in docs:
            with source.open("rb") as f:
                if not f.read(256).startswith(b"%PDF-"):
                    raise SystemExit(f"Not a hydrated PDF: {source}")
            docs[filename] = fitz.open(source)
        doc = docs[filename]
        if page_no < 1 or page_no > len(doc):
            raise SystemExit(f"Page out of range: {filename} p.{page_no}")
        slug = re.sub(r"[^A-Za-z0-9_-]+", "_", Path(filename).stem).strip("_")[:48] or "book"
        name = f"{len(manifest)+1:03d}_{slug}_p{page_no:04d}_{DPI}dpi.png"
        pix = doc.load_page(page_no-1).get_pixmap(matrix=fitz.Matrix(DPI/72,DPI/72), colorspace=fitz.csRGB, alpha=False)
        pix.save(OUT / name)
        manifest.append({"source":f"public/books/{filename}","sourceFilename":filename,"pdfPage":page_no,"image":name,"dpi":DPI,"reviewStatus":"needs_review","visualDisposition":"pending"})
    for doc in docs.values():
        doc.close()
    (OUT/"manifest.json").write_text(json.dumps({"dpi":DPI,"totalPages":len(manifest),"pages":manifest},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(f"Rendered {len(manifest)} empty-OCR candidates at {DPI} DPI.")
if __name__ == "__main__":
    main()
