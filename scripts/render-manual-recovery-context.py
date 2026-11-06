#!/usr/bin/env python3
"""Render candidate pages plus adjacent physical pages for source-context review."""
import json
import os
import re
from pathlib import Path
import fitz

ROOT = Path.cwd()
BOOKS = ROOT / "public" / "books"
SOURCE = ROOT / "src" / "data" / "extracted" / "manual-recovery-candidates.json"
OUT = ROOT / "review-pages-manual-context"
DPI = int(os.environ.get("RENDER_DPI", "240"))
RADIUS = int(os.environ.get("CONTEXT_RADIUS", "1"))

if DPI not in (200, 240, 300):
    raise SystemExit("RENDER_DPI must be 200, 240, or 300")
if RADIUS not in (1, 2):
    raise SystemExit("CONTEXT_RADIUS must be 1 or 2")


def main():
    data = json.loads(SOURCE.read_text(encoding="utf-8"))
    rows = data.get("records", [])
    if data.get("datasetStatus") != "candidate_only" or not rows:
        raise SystemExit("Expected candidate-only source records")

    OUT.mkdir(parents=True, exist_ok=True)
    documents = {}
    requested = {}
    for row in rows:
        filename = row["sourceFilename"]
        if row.get("source") != f"public/books/{filename}":
            raise SystemExit(f"Source path mismatch: {filename}")
        pdf_path = BOOKS / filename
        if not pdf_path.is_file():
            raise SystemExit(f"Missing source PDF: {pdf_path}")
        with pdf_path.open("rb") as stream:
            if not stream.read(256).startswith(b"%PDF-"):
                raise SystemExit(f"Source is not a hydrated PDF/LFS object: {pdf_path}")
        if filename not in documents:
            documents[filename] = fitz.open(pdf_path)
        doc = documents[filename]
        page = int(row["pdfPage"])
        if page < 1 or page > len(doc):
            raise SystemExit(f"Out-of-range page {page}: {filename}")
        requested.setdefault(filename, set()).update(
            range(max(1, page - RADIUS), min(len(doc), page + RADIUS) + 1)
        )

    manifest_pages = []
    counter = 0
    for filename, page_numbers in requested.items():
        doc = documents[filename]
        slug = re.sub(r"[^A-Za-z0-9_-]+", "_", Path(filename).stem).strip("_")[:36] or "book"
        for page_number in sorted(page_numbers):
            counter += 1
            name = f"{counter:03d}_{slug}_p{page_number:04d}_{DPI}dpi.png"
            pix = doc.load_page(page_number - 1).get_pixmap(
                matrix=fitz.Matrix(DPI / 72, DPI / 72),
                colorspace=fitz.csRGB,
                alpha=False,
            )
            pix.save(OUT / name)
            candidate_ids = [
                row["recordId"] for row in rows
                if row["sourceFilename"] == filename
                and abs(int(row["pdfPage"]) - page_number) <= RADIUS
            ]
            manifest_pages.append({
                "sourceFilename": filename,
                "pdfPage": page_number,
                "image": name,
                "dpi": DPI,
                "isCandidatePage": any(
                    row["sourceFilename"] == filename and int(row["pdfPage"]) == page_number
                    for row in rows
                ),
                "nearCandidateIds": candidate_ids,
            })

    for doc in documents.values():
        doc.close()

    manifest = {
        "source": str(SOURCE.relative_to(ROOT)),
        "pageNumbering": "1-based physical PDF page",
        "dpi": DPI,
        "contextRadius": RADIUS,
        "candidateCount": len(rows),
        "renderedPageCount": len(manifest_pages),
        "sourceBookCount": len(documents),
        "status": "pending_human_context_review",
        "pages": manifest_pages,
    }
    (OUT / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        f"Rendered {len(manifest_pages)} contextual pages around "
        f"{len(rows)} candidates from {len(documents)} PDFs at {DPI} DPI."
    )


if __name__ == "__main__":
    main()
