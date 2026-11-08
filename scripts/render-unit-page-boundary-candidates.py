#!/usr/bin/env python3
"""Render OCR-derived unit start-page candidates for direct visual review.

This script never edits source PDFs or promotes candidate pages into the source index.
"""
import json
import os
import re
from pathlib import Path

import fitz

ROOT = Path.cwd()
BOOKS = ROOT / "public" / "books"
SOURCE = ROOT / "data" / "curriculum" / "unit-page-boundary-candidates.draft.json"
INDEX = ROOT / "data" / "curriculum" / "source-book-index.draft.json"
OUT = ROOT / "review-pages-unit-boundaries"
DPI = int(os.environ.get("RENDER_DPI", "300"))

if DPI not in (240, 300):
    raise SystemExit("RENDER_DPI must be 240 or 300")


def main():
    data = json.loads(SOURCE.read_text(encoding="utf-8"))
    rows = data.get("candidates", [])
    allowed_statuses = {"draft_needs_visual_review", "boundary_pages_visually_verified"}
    if data.get("status") not in allowed_statuses or len(rows) != 19:
        raise SystemExit(f"Expected 19 candidates in a recognized review state, found {len(rows)}")

    index_data = json.loads(INDEX.read_text(encoding="utf-8"))
    books_by_source = {book.get("sourceFile"): book for book in index_data.get("books", [])}

    page_keys = [(row.get("sourceFile"), row.get("candidateStartPdfPage")) for row in rows]
    if len(set(page_keys)) != len(rows):
        raise SystemExit("Duplicate source/page candidate pairs")

    OUT.mkdir(parents=True, exist_ok=True)
    documents = {}
    rendered = []

    for index, row in enumerate(rows, 1):
        filename = row["sourceFile"]
        indexed_book = books_by_source.get(filename)
        if not indexed_book or indexed_book.get("id") != row.get("bookId"):
            raise SystemExit(f"Candidate source/book ID does not match source index: {filename}")
        indexed_unit = next(
            (unit for unit in indexed_book.get("units", []) if unit.get("number") == row.get("unitNumber")),
            None,
        )
        if not indexed_unit:
            raise SystemExit(f"Candidate unit is missing from source index: {row.get('bookId')} U{row.get('unitNumber')}")
        if data.get("status") == "boundary_pages_visually_verified":
            if row.get("visualReviewStatus") != "verified" or row.get("verifiedStartPdfPage") != row.get("candidateStartPdfPage"):
                raise SystemExit(f"Verified candidate metadata is incomplete: {row.get('bookId')} U{row.get('unitNumber')}")
            if indexed_unit.get("startPdfPage") != row.get("verifiedStartPdfPage"):
                raise SystemExit(f"Verified page is not synchronized into the source index: {row.get('bookId')} U{row.get('unitNumber')}")

        source_path = BOOKS / filename
        if not source_path.is_file():
            raise SystemExit(f"Missing source PDF: {source_path}")
        with source_path.open("rb") as stream:
            if not stream.read(256).startswith(b"%PDF-"):
                raise SystemExit(f"Source is not a hydrated PDF/LFS object: {source_path}")

        if filename not in documents:
            documents[filename] = fitz.open(source_path)
        document = documents[filename]
        page_number = int(row["candidateStartPdfPage"])
        if page_number < 1 or page_number > len(document):
            raise SystemExit(f"Out-of-range physical page {page_number}: {filename}")

        slug = re.sub(r"[^A-Za-z0-9_-]+", "_", Path(filename).stem).strip("_")[:42] or "book"
        image_name = f"{index:02d}_{slug}_u{int(row['unitNumber']):02d}_p{page_number:04d}_{DPI}dpi.png"
        page = document.load_page(page_number - 1)
        pixmap = page.get_pixmap(
            matrix=fitz.Matrix(DPI / 72, DPI / 72),
            colorspace=fitz.csRGB,
            alpha=False,
        )
        pixmap.save(OUT / image_name)
        rendered.append({
            **row,
            "image": image_name,
            "dpi": DPI,
            "pageNumbering": "1-based physical PDF page",
            "visualReviewStatus": "pending",
        })

    for document in documents.values():
        document.close()

    manifest = {
        "source": str(SOURCE.relative_to(ROOT)),
        "sourceArtifactRunId": data.get("sourceArtifact", {}).get("workflowRunId"),
        "dpi": DPI,
        "totalPages": len(rendered),
        "sourceBooks": len(documents),
        "status": "pending_direct_visual_review" if data.get("status") == "draft_needs_visual_review" else "re-render_of_visually_verified_pages",
        "warning": "Only the candidate JSON review state and source-index synchronization establish verification; rendering itself does not approve lesson content.",
        "pages": rendered,
    }
    (OUT / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Rendered {len(rendered)} candidate pages from {len(documents)} source PDFs at {DPI} DPI.")


if __name__ == "__main__":
    main()
