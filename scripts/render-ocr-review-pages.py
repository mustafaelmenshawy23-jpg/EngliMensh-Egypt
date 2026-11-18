#!/usr/bin/env python3
"""Render OCR-review and unit-blocking source pages from the latest batch artifact."""
import json
import os
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path

import fitz

ROOT = Path.cwd()
BOOKS = ROOT / "public" / "books"
ARTIFACT = ROOT / "batch-artifact"
QUEUE = ARTIFACT / "artifacts" / "source-review-queue.json"
PROGRESS = ARTIFACT / "artifacts" / "unit-drafts" / "progress.json"
INDEX = ROOT / "data" / "curriculum" / "source-book-index.draft.json"
OUT = ROOT / "review-pages"
DPI = int(os.environ.get("REVIEW_DPI", "150"))


def add_page(pages, filename, page_number, queue_class, reason="", unit_id=None, unit_title=None, score=None):
    filename = str(filename or "").strip()
    try:
        page_number = int(page_number)
    except (TypeError, ValueError):
        return
    if not filename or Path(filename).name != filename or page_number < 1:
        return

    key = (filename, page_number)
    item = pages.setdefault(key, {
        "sourceFilename": filename,
        "pdfPage": page_number,
        "queueClasses": [],
        "reasons": [],
        "unitIds": [],
        "unitTitles": [],
        "sourceGateScores": [],
    })
    if queue_class and queue_class not in item["queueClasses"]:
        item["queueClasses"].append(queue_class)
    if reason and reason not in item["reasons"]:
        item["reasons"].append(str(reason))
    if unit_id and unit_id not in item["unitIds"]:
        item["unitIds"].append(str(unit_id))
    if unit_title and unit_title not in item["unitTitles"]:
        item["unitTitles"].append(str(unit_title))
    if isinstance(score, (int, float)) and score not in item["sourceGateScores"]:
        item["sourceGateScores"].append(score)


def main():
    if DPI not in (120, 150, 180, 240, 300):
        raise SystemExit("REVIEW_DPI must be one of 120, 150, 180, 240, or 300.")
    if not QUEUE.is_file() or not PROGRESS.is_file():
        raise SystemExit(
            "The latest curriculum batch artifact is incomplete: expected "
            "artifacts/source-review-queue.json and artifacts/unit-drafts/progress.json."
        )
    if not INDEX.is_file():
        raise SystemExit(f"Missing source index: {INDEX}")

    queue = json.loads(QUEUE.read_text(encoding="utf-8"))
    progress = json.loads(PROGRESS.read_text(encoding="utf-8"))
    index = json.loads(INDEX.read_text(encoding="utf-8"))
    books = {book.get("id"): book for book in index.get("books", []) if book.get("id")}
    pages = {}

    # Include every OCR-empty/unreliable page from the latest successful batch artifact.
    for item in queue.get("items", []):
        add_page(
            pages,
            item.get("sourceFilename") or Path(str(item.get("source", ""))).name,
            item.get("pdfPage"),
            item.get("status") or "ocr_manual_review",
            item.get("reason", ""),
        )

    # Also include pages that actually blocked indexed units, even when OCR classified
    # their text as readable. This captures watermark/repetition corruption missed by
    # the generic OCR queue.
    for blocked in progress.get("blocked", []):
        book = books.get(blocked.get("bookId"))
        filename = book.get("sourceFile") if book else None
        if not filename:
            continue
        for evaluation in blocked.get("pageEvaluations", []):
            if evaluation.get("status") != "blocked":
                continue
            add_page(
                pages,
                filename,
                evaluation.get("pdfPage"),
                "blocked_unit_source_gate",
                "; ".join(evaluation.get("issues", []) or blocked.get("issues", [])),
                blocked.get("unitId"),
                blocked.get("title"),
                evaluation.get("score"),
            )

    requested = sorted(pages.values(), key=lambda item: (item["sourceFilename"].casefold(), item["pdfPage"]))
    if not requested:
        raise SystemExit("No OCR-review or blocked-unit source pages were found.")

    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True, exist_ok=True)

    open_documents = {}
    rendered = []
    skipped = []
    for index_number, item in enumerate(requested, start=1):
        filename = item["sourceFilename"]
        source = BOOKS / filename
        if not source.is_file():
            skipped.append({**item, "renderStatus": "source_pdf_missing", "detail": str(source)})
            continue

        try:
            if filename not in open_documents:
                with source.open("rb") as stream:
                    header = stream.read(256)
                if not header.startswith(b"%PDF-"):
                    skipped.append({
                        **item,
                        "renderStatus": "source_not_hydrated",
                        "detail": "Source is still a Git LFS pointer or does not begin with a PDF signature.",
                    })
                    continue
                open_documents[filename] = fitz.open(source)

            document = open_documents[filename]
            page_number = item["pdfPage"]
            if page_number > len(document):
                skipped.append({
                    **item,
                    "renderStatus": "page_out_of_range",
                    "detail": f"PDF has {len(document)} pages.",
                })
                continue

            slug = re.sub(r"[^A-Za-z0-9_-]+", "_", Path(filename).stem).strip("_")[:48] or "book"
            image_name = f"{index_number:03d}_{slug}_p{page_number:04d}_{DPI}dpi.png"
            pixmap = document.load_page(page_number - 1).get_pixmap(
                matrix=fitz.Matrix(DPI / 72, DPI / 72),
                colorspace=fitz.csRGB,
                alpha=False,
            )
            pixmap.save(OUT / image_name)
            rendered.append({
                **item,
                "image": image_name,
                "dpi": DPI,
                "renderStatus": "rendered",
                "visualReviewStatus": "pending",
            })
        except Exception as error:
            skipped.append({**item, "renderStatus": "render_error", "detail": str(error)[:500]})

    for document in open_documents.values():
        document.close()

    manifest = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "repository": "mustafaelmenshawy23-jpg/EngliMensh-Egypt",
        "sourceBatchGeneratedAt": progress.get("generatedAt"),
        "sourceQueueGeneratedAt": queue.get("generatedAt"),
        "pageNumbering": "pdfPage is the 1-based physical PDF page number",
        "dpi": DPI,
        "indexedBooks": progress.get("indexedBooks"),
        "indexedUnits": progress.get("indexedUnits"),
        "blockedUnits": len(progress.get("blocked", [])),
        "requestedPages": len(requested),
        "renderedPages": len(rendered),
        "skippedPages": len(skipped),
        "sourceBooksRendered": len(open_documents),
        "policy": "Visual evidence only. No OCR text, curriculum content, answers, or approval status is changed by this workflow.",
        "pages": rendered,
        "skipped": skipped,
    }
    (OUT / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    print(json.dumps({
        "requestedPages": len(requested),
        "renderedPages": len(rendered),
        "skippedPages": len(skipped),
        "sourceBooksRendered": len(open_documents),
        "manifest": str(OUT / "manifest.json"),
        "reviewStatus": "pending",
    }, ensure_ascii=False, indent=2))

    if not rendered:
        raise SystemExit("No source pages could be rendered; see review-pages/manifest.json.")


if __name__ == "__main__":
    main()
