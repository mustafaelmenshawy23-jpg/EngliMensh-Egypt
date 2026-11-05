#!/usr/bin/env python3
"""Extract searchable text from source PDFs without inventing or rewriting content.

Run from the repository root:
  python3 -m pip install -r requirements-extraction.txt
  python3 scripts/extract-pdfs.py

Outputs:
  public/books/catalog.json
  src/data/extracted/pages.jsonl
  src/data/extracted/extraction-report.json
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BOOKS_DIR = ROOT / "public" / "books"
OUTPUT_DIR = ROOT / "src" / "data" / "extracted"
CATALOG_PATH = BOOKS_DIR / "catalog.json"
PAGES_PATH = OUTPUT_DIR / "pages.jsonl"
REPORT_PATH = OUTPUT_DIR / "extraction-report.json"


def load_pdf_library():
    try:
        import fitz  # PyMuPDF
        return fitz
    except ImportError:
        print("Missing dependency. Run: python3 -m pip install -r requirements-extraction.txt", file=sys.stderr)
        raise SystemExit(2)


def is_lfs_pointer(path: Path) -> bool:
    try:
        with path.open("rb") as handle:
            head = handle.read(256)
        return head.startswith(b"version https://git-lfs.github.com/spec/v1")
    except OSError:
        return False


def infer_filename_hints(filename: str) -> dict:
    """Hints only: never use these guesses as approved curriculum metadata."""
    value = filename.lower()
    grade = None
    stage = None
    for pattern, candidate_stage, candidate_grade in [
        (r"(?:prim|primary|ابتدائي)[ _-]*([1-6])", "primary", None),
        (r"(?:prep|preparatory|اعدادي|إعدادي)[ _-]*([1-3])", "preparatory", None),
        (r"(?:sec|secondary|ثانوي)[ _-]*([1-3])", "secondary", None),
    ]:
        match = re.search(pattern, value)
        if match:
            stage, grade = candidate_stage, int(match.group(1))
            break
    if grade is None:
        arabic = re.search(r"(الأول|الاول|أولى|اولى|الثاني|الثانى|تانية|الثالث|الثالثة)", value)
        if arabic:
            token = arabic.group(1)
            grade = 1 if token in ("الأول", "الاول", "أولى", "اولى") else 2 if token in ("الثاني", "الثانى", "تانية") else 3
            stage = "preparatory" if ("اعدادي" in value or "إعدادي" in value or "prep" in value) else None
    path = "advanced" if ("connect plus" in value or "كونكت بلس" in value) else "general" if ("connect" in value or "كونكت" in value or "hello" in value or "هالو" in value) else None
    term_match = re.search(r"(?:term|tr|t)[ _-]*([12])", value)
    term = int(term_match.group(1)) if term_match else (1 if ("ترم 1" in value or "ترم_1" in value) else None)
    return {
        "stageHint": stage,
        "gradeHint": grade,
        "pathHint": path,
        "termHint": term,
        "hintStatus": "needs_review",
    }


def main():
    parser = argparse.ArgumentParser(description="Extract PDF text with source page references.")
    parser.add_argument("--books-dir", type=Path, default=BOOKS_DIR)
    parser.add_argument("--output-dir", type=Path, default=OUTPUT_DIR)
    parser.add_argument("--force", action="store_true", help="Replace generated extraction outputs.")
    args = parser.parse_args()

    books_dir = args.books_dir.resolve()
    output_dir = args.output_dir.resolve()
    catalog_path = books_dir / "catalog.json"
    pages_path = output_dir / "pages.jsonl"
    report_path = output_dir / "extraction-report.json"

    for output in (catalog_path, pages_path, report_path):
        if output.exists() and not args.force:
            parser.error(f"{output.relative_to(ROOT) if output.is_relative_to(ROOT) else output} already exists; use --force to replace generated output")

    fitz = load_pdf_library()
    pdfs = sorted(p for p in books_dir.glob("*.pdf") if p.is_file())
    catalog = []
    report = []
    page_records = []

    for index, pdf_path in enumerate(pdfs, start=1):
        relative_path = pdf_path.relative_to(ROOT).as_posix() if pdf_path.is_relative_to(ROOT) else pdf_path.name
        entry = {
            "id": f"book-{index:03d}",
            "sourceFilename": pdf_path.name,
            "sourcePath": relative_path,
            "sourceUrl": "/" + relative_path.replace("\\", "/"),
            "fileBytes": pdf_path.stat().st_size,
            "sha256": None,
            "pageCount": None,
            "status": "needs_review",
            **infer_filename_hints(pdf_path.name),
        }
        if is_lfs_pointer(pdf_path):
            entry["status"] = "lfs_pointer_not_downloaded"
            report.append({"sourceFilename": pdf_path.name, "status": entry["status"], "message": "This file is an LFS pointer, not the PDF bytes. Download the LFS object before extraction."})
            catalog.append(entry)
            continue
        try:
            digest = hashlib.sha256()
            with pdf_path.open("rb") as handle:
                for chunk in iter(lambda: handle.read(1024 * 1024), b""):
                    digest.update(chunk)
            entry["sha256"] = digest.hexdigest()
            document = fitz.open(pdf_path)
            entry["pageCount"] = document.page_count
            extracted_pages = 0
            ocr_pages = []
            for page_index in range(document.page_count):
                page = document.load_page(page_index)
                text = page.get_text("text", sort=True).strip()
                if text:
                    extracted_pages += 1
                else:
                    ocr_pages.append(page_index + 1)
                page_records.append({
                    "id": f"{entry['id']}-p{page_index + 1:04d}",
                    "sourceFilename": pdf_path.name,
                    "sourcePath": relative_path,
                    "sourceSha256": entry["sha256"],
                    "pageNumber": page_index + 1,
                    "text": text,
                    "extractionStatus": "text_extracted" if text else "needs_ocr",
                    "reviewStatus": "needs_review",
                })
            document.close()
            entry["status"] = "extracted_needs_review"
            report.append({
                "sourceFilename": pdf_path.name,
                "status": entry["status"],
                "pageCount": entry["pageCount"],
                "pagesWithText": extracted_pages,
                "pagesNeedingOcr": ocr_pages,
            })
        except Exception as exc:
            entry["status"] = "extraction_error"
            report.append({"sourceFilename": pdf_path.name, "status": entry["status"], "message": str(exc)})
        catalog.append(entry)

    books_dir.mkdir(parents=True, exist_ok=True)
    output_dir.mkdir(parents=True, exist_ok=True)
    catalog_path.write_text(json.dumps({
        "schemaVersion": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "sourcePolicy": "PDF files in public/books are the only source of extracted content.",
        "books": catalog,
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    with pages_path.open("w", encoding="utf-8") as handle:
        for record in page_records:
            handle.write(json.dumps(record, ensure_ascii=False) + "\n")
    report_path.write_text(json.dumps({
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "bookCount": len(catalog),
        "pageRecordCount": len(page_records),
        "results": report,
        "rules": [
            "Text is extracted as-is; no paraphrasing or curriculum completion is performed.",
            "Every page record retains the original filename and one-based PDF page number.",
            "All extracted content starts with reviewStatus=needs_review.",
            "Pages with no embedded text are marked needs_ocr; OCR is not silently fabricated.",
            "Filename metadata is a hint only and must be reviewed before curriculum assignment."
        ]
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"PDFs found: {len(pdfs)}")
    print(f"Page records: {len(page_records)}")
    print(f"Catalog: {catalog_path}")
    print(f"Extracted text: {pages_path}")
    print(f"Report: {report_path}")
    errors = sum(1 for item in report if item["status"] in ("lfs_pointer_not_downloaded", "extraction_error"))
    print(f"Files requiring download/error follow-up: {errors}")
    print("All extracted pages remain marked needs_review. No questions or answers were generated.")


if __name__ == "__main__":
    main()
