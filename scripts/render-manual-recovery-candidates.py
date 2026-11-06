#!/usr/bin/env python3
"""Render original source pages for manual recovery candidates without editing PDFs."""
import json
import os
import re
from pathlib import Path

import fitz

ROOT = Path.cwd()
BOOKS = ROOT / "public" / "books"
SOURCE = ROOT / "src" / "data" / "extracted" / "manual-recovery-candidates.json"
OUT = ROOT / "review-pages-manual-recoveries"
DPI = int(os.environ.get("RENDER_DPI", "300"))

if DPI not in (240, 300):
    raise SystemExit("RENDER_DPI must be 240 or 300")


def main():
    data = json.loads(SOURCE.read_text(encoding="utf-8"))
    rows = data.get("records", [])
    if data.get("datasetStatus") != "candidate_only" or len(rows) != 8:
        raise SystemExit(f"Expected 8 candidate-only records, found {len(rows)}")

    ids = [row.get("recordId") for row in rows]
    pages = [(row.get("sourceFilename"), row.get("pdfPage")) for row in rows]
    if len(set(ids)) != len(rows) or len(set(pages)) != len(rows):
        raise SystemExit("Duplicate candidate IDs or source-page pairs")

    OUT.mkdir(parents=True, exist_ok=True)
    documents = {}
    rendered = []

    for index, row in enumerate(rows, 1):
        filename = row["sourceFilename"]
        pdf_path = BOOKS / filename
        if row.get("source") != f"public/books/{filename}":
            raise SystemExit(f"Source path mismatch: {filename}")
        if not pdf_path.is_file():
            raise SystemExit(f"Missing source PDF: {pdf_path}")
        with pdf_path.open("rb") as stream:
            if not stream.read(256).startswith(b"%PDF-"):
                raise SystemExit(f"Source is not a hydrated PDF/LFS object: {pdf_path}")

        if filename not in documents:
            documents[filename] = fitz.open(pdf_path)
        document = documents[filename]
        page_number = int(row["pdfPage"])
        if page_number < 1 or page_number > len(document):
            raise SystemExit(f"Out-of-range physical page {page_number}: {filename}")

        slug = re.sub(r"[^A-Za-z0-9_-]+", "_", Path(filename).stem).strip("_")[:42] or "book"
        image_name = f"{index:02d}_{slug}_p{page_number:04d}_{DPI}dpi.png"
        page = document.load_page(page_number - 1)
        pixmap = page.get_pixmap(
            matrix=fitz.Matrix(DPI / 72, DPI / 72),
            colorspace=fitz.csRGB,
            alpha=False,
        )
        pixmap.save(OUT / image_name)
        rendered.append({
            "recordId": row["recordId"],
            "source": row["source"],
            "sourceFilename": filename,
            "pdfPage": page_number,
            "grade": row.get("grade"),
            "contentType": row.get("contentType"),
            "existingReviewStatus": row.get("reviewStatus"),
            "existingUnitLink": row.get("unitLink"),
            "image": image_name,
            "dpi": DPI,
        })

    for document in documents.values():
        document.close()

    manifest = {
        "source": str(SOURCE.relative_to(ROOT)),
        "pageNumbering": "1-based physical PDF page",
        "dpi": DPI,
        "totalPages": len(rendered),
        "sourceBooks": len(documents),
        "status": "pending_direct_source_review",
        "pages": rendered,
    }
    (OUT / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Rendered {len(rendered)} candidate source pages from {len(documents)} PDFs at {DPI} DPI.")


if __name__ == "__main__":
    main()
