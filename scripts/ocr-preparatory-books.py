#!/usr/bin/env python3
"""OCR the six preparatory source books for internal curriculum mapping.

The output is source-linked review material only. OCR is never academic approval.
"""
import json
import re
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BOOKS = [
    "English_Prep1_T1 (1).pdf",
    "English_language_prep2_t1 (1).pdf",
    "English_language_prep3_t1 (1).pdf",
    "المعاصر_هالو_بلس_1_اعدادي_ترم_1_ذاكرولي.pdf",
    "المعاصر_هالو_بلس_تانية_إعدادي_كتاب_الشرح_1.pdf",
    "Hello plus prep 3 كامل(1).pdf",
]
BOOKS_DIR = ROOT / "public" / "books"
OUTPUT_DIR = ROOT / "src" / "data" / "extracted"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT = OUTPUT_DIR / "preparatory-ocr-pages.jsonl"
MANIFEST = OUTPUT_DIR / "preparatory-ocr-manifest.json"


def command_output(args):
    result = subprocess.run(args, check=True, capture_output=True, text=True)
    return result.stdout


def page_count(pdf_path):
    info = command_output(["pdfinfo", str(pdf_path)])
    match = re.search(r"^Pages:\s+(\d+)\s*$", info, re.MULTILINE)
    if not match:
        raise RuntimeError(f"Could not determine page count for {pdf_path.name}")
    return int(match.group(1))


def is_lfs_pointer(pdf_path):
    with pdf_path.open("rb") as stream:
        return stream.read(120).decode("utf-8", errors="ignore").startswith(
            "version https://git-lfs.github.com/spec/v1"
        )


def main():
    books = []
    with OUTPUT.open("w", encoding="utf-8") as out:
        for filename in BOOKS:
            pdf_path = BOOKS_DIR / filename
            if not pdf_path.exists():
                raise FileNotFoundError(f"Required source book is missing: {filename}")
            if is_lfs_pointer(pdf_path):
                raise RuntimeError(f"Source book is still an LFS pointer: {filename}")

            pages = page_count(pdf_path)
            extracted = 0
            empty = 0
            with tempfile.TemporaryDirectory(prefix="prep-ocr-") as temp_dir:
                prefix = Path(temp_dir) / "page"
                for page_number in range(1, pages + 1):
                    subprocess.run(
                        [
                            "pdftoppm", "-f", str(page_number), "-l", str(page_number),
                            "-r", "160", "-singlefile", "-png", str(pdf_path), str(prefix)
                        ],
                        check=True,
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.PIPE,
                        text=True,
                    )
                    image_path = prefix.with_suffix(".png")
                    result = subprocess.run(
                        ["tesseract", str(image_path), "stdout", "-l", "eng+ara", "--psm", "6"],
                        check=True,
                        capture_output=True,
                        text=True,
                    )
                    text = re.sub(r"\s+", " ", result.stdout).strip()
                    status = "ocr_extracted_needs_review" if len(text) >= 20 else "ocr_empty_needs_visual_review"
                    if len(text) >= 20:
                        extracted += 1
                    else:
                        empty += 1
                    out.write(json.dumps({
                        "source": f"public/books/{filename}",
                        "sourceFilename": filename,
                        "pdfPage": page_number,
                        "printedPage": None,
                        "text": text,
                        "extractionMethod": "tesseract-eng+ara-160dpi",
                        "extractionStatus": status,
                        "reviewStatus": "needs_review"
                    }, ensure_ascii=False) + "\n")
                    image_path.unlink(missing_ok=True)

            books.append({
                "source": f"public/books/{filename}",
                "status": "ocr_processed",
                "pages": pages,
                "ocrPagesWithText": extracted,
                "emptyPagesNeedingVisualReview": empty
            })
            print(f"OCR {filename}: {pages} pages, {extracted} with text, {empty} need visual review")

    manifest = {
        "schemaVersion": 1,
        "sourceOfTruth": "original_uploaded_preparatory_pdf_books",
        "method": "Tesseract OCR at 160 dpi using English and Arabic models",
        "contentPolicy": "OCR is unreviewed source extraction only; it is not academic approval and must not be shipped verbatim.",
        "books": books,
        "totals": {
            "books": len(books),
            "pages": sum(item["pages"] for item in books),
            "pagesWithOcrText": sum(item["ocrPagesWithText"] for item in books),
            "pagesNeedingVisualReview": sum(item["emptyPagesNeedingVisualReview"] for item in books)
        }
    }
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("OCR finished. All pages remain needs_review.")
    print(json.dumps(manifest["totals"], ensure_ascii=False))


if __name__ == "__main__":
    main()
