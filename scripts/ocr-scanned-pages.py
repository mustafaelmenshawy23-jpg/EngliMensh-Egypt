#!/usr/bin/env python3
"""OCR pages that PDF.js could not extract; keep every result linked to its source page."""
import json, os, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
import fitz

ROOT = Path.cwd()
DATA = ROOT / "src/data/extracted"
BOOKS = ROOT / "public/books"
PAGES = DATA / "pages.jsonl"
MANIFEST = DATA / "manifest.json"
DPI = int(os.environ.get("OCR_DPI", "180"))
LANG = os.environ.get("OCR_LANG", "eng+ara")
WORKERS = int(os.environ.get("OCR_WORKERS", "3"))

raw_pages = PAGES.read_text(encoding="utf-8")
decoder = json.JSONDecoder()
records = []
cursor = 0
while cursor < len(raw_pages):
    while cursor < len(raw_pages) and raw_pages[cursor].isspace():
        cursor += 1
    if cursor >= len(raw_pages):
        break
    try:
        record, cursor = decoder.raw_decode(raw_pages, cursor)
    except json.JSONDecodeError as exc:
        preview = raw_pages[max(0, exc.pos - 80):min(len(raw_pages), exc.pos + 120)]
        raise RuntimeError(f"Cannot parse pages.jsonl near character {exc.pos}: {exc.msg}; preview={preview!r}") from exc
    if not isinstance(record, dict):
        raise RuntimeError("pages.jsonl contains a non-object record")
    records.append(record)
if not records:
    raise RuntimeError("pages.jsonl contains no page records")
print(f"Loaded {len(records)} valid page records from {PAGES.name}", flush=True)
todo = [i for i, r in enumerate(records) if r.get("extractionStatus") == "empty_or_scanned_needs_ocr"]
print(f"OCR queue: {len(todo)} pages; languages={LANG}; dpi={DPI}; workers={WORKERS}", flush=True)

def ocr_one(index):
    rec = records[index]
    pdf_path = ROOT / rec["source"]
    if not pdf_path.exists():
        return index, "", "source_pdf_missing"
    try:
        # Open per task so workers do not share PyMuPDF document handles.
        with fitz.open(pdf_path) as doc:
            page_no = rec["pdfPage"] - 1
            if page_no < 0 or page_no >= len(doc):
                return index, "", "page_out_of_range"
            page = doc.load_page(page_no)
            pix = page.get_pixmap(matrix=fitz.Matrix(DPI / 72, DPI / 72), colorspace=fitz.csGRAY, alpha=False)
            with tempfile.NamedTemporaryFile(suffix=".png") as img:
                pix.save(img.name)
                proc = subprocess.run(
                    ["tesseract", img.name, "stdout", "-l", LANG, "--psm", "3"],
                    capture_output=True, text=True, timeout=180
                )
            text = " ".join(proc.stdout.split())
            if proc.returncode != 0 and not text:
                return index, "", "ocr_error"
            return index, text, "ocr_extracted_needs_review" if len(text) >= 20 else "ocr_empty_needs_manual_review"
    except Exception as exc:
        return index, "", "ocr_error:" + str(exc)[:180]

done = 0
with ThreadPoolExecutor(max_workers=WORKERS) as pool:
    futures = [pool.submit(ocr_one, i) for i in todo]
    for future in as_completed(futures):
        i, text, status = future.result()
        if text:
            records[i]["text"] = text
        records[i]["extractionStatus"] = status
        records[i]["reviewStatus"] = "needs_review"
        done += 1
        if done % 50 == 0 or done == len(todo):
            print(f"OCR progress: {done}/{len(todo)}", flush=True)

PAGES.write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in records), encoding="utf-8")
manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
by_source = {}
for r in records:
    by_source.setdefault(r["source"], []).append(r)
for book in manifest["books"]:
    pages = by_source.get(book["source"], [])
    if not pages:
        continue
    book["ocrPages"] = sum(1 for p in pages if p.get("extractionStatus") == "ocr_extracted_needs_review")
    book["ocrEmptyOrErrorPages"] = sum(1 for p in pages if p.get("extractionStatus") in ("ocr_empty_needs_manual_review",) or str(p.get("extractionStatus","")).startswith("ocr_error"))
    book["extractedPagesAfterOcr"] = sum(1 for p in pages if len(p.get("text","")) >= 20)
manifest["totals"]["ocrProcessedPages"] = len(todo)
manifest["totals"]["ocrExtractedPages"] = sum(1 for p in records if p.get("extractionStatus") == "ocr_extracted_needs_review")
manifest["totals"]["pagesNeedingOcrOrReviewAfterOcr"] = sum(1 for p in records if len(p.get("text","")) < 20)
manifest["ocr"] = {"engine":"Tesseract","languages":LANG,"dpi":DPI,"note":"OCR output is machine-recognized and remains needs_review; verify against original PDF."}
MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps(manifest["totals"], ensure_ascii=False, indent=2), flush=True)
