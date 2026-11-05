#!/usr/bin/env python3
"""OCR scanned PDF pages with bounded parallelism and resumable checkpoints."""
import json
import os
import subprocess
import tempfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
import fitz

ROOT = Path.cwd()
DATA = ROOT / "src/data/extracted"
BOOKS = ROOT / "public/books"
PAGES = DATA / "pages.jsonl"
MANIFEST = DATA / "manifest.json"
DPI = int(os.environ.get("OCR_DPI", "150"))
LANG = os.environ.get("OCR_LANG", "eng+ara")
WORKERS = max(1, min(int(os.environ.get("OCR_WORKERS", "6")), 8))
CHECKPOINT_EVERY = max(1, int(os.environ.get("OCR_CHECKPOINT_EVERY", "25")))
TIMEOUT = max(30, int(os.environ.get("OCR_PAGE_TIMEOUT", "90")))

def save_pages(records):
    temp = PAGES.with_suffix(".jsonl.tmp")
    temp.write_text("".join(json.dumps(r, ensure_ascii=False) + "\\n" for r in records), encoding="utf-8")
    temp.replace(PAGES)

def save_manifest(records, final=False):
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    by_source = {}
    for rec in records:
        by_source.setdefault(rec["source"], []).append(rec)
    for book in manifest["books"]:
        pages = by_source.get(book["source"], [])
        if not pages:
            continue
        book["ocrPages"] = sum(p.get("extractionStatus") == "ocr_extracted_needs_review" for p in pages)
        book["ocrEmptyOrErrorPages"] = sum(
            p.get("extractionStatus") == "ocr_empty_needs_manual_review"
            or str(p.get("extractionStatus", "")).startswith("ocr_error")
            for p in pages
        )
        book["extractedPagesAfterOcr"] = sum(len(p.get("text", "")) >= 20 for p in pages)
    processed = sum(p.get("extractionStatus") != "empty_or_scanned_needs_ocr" for p in records)
    manifest["totals"]["ocrProcessedPages"] = processed
    manifest["totals"]["ocrExtractedPages"] = sum(p.get("extractionStatus") == "ocr_extracted_needs_review" for p in records)
    manifest["totals"]["pagesNeedingOcrOrReviewAfterOcr"] = sum(len(p.get("text", "")) < 20 for p in records)
    manifest["ocr"] = {
        "engine": "Tesseract", "languages": LANG, "dpi": DPI, "workers": WORKERS,
        "note": "OCR output is machine-recognized and remains needs_review; verify against original PDF."
    }
    temp = MANIFEST.with_suffix(".json.tmp")
    temp.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\\n", encoding="utf-8")
    temp.replace(MANIFEST)

raw = PAGES.read_text(encoding="utf-8")
decoder = json.JSONDecoder()
records, cursor = [], 0
while cursor < len(raw):
    while cursor < len(raw) and raw[cursor].isspace():
        cursor += 1
    if cursor >= len(raw):
        break
    record, cursor = decoder.raw_decode(raw, cursor)
    if not isinstance(record, dict):
        raise RuntimeError("pages.jsonl contains a non-object record")
    records.append(record)
if not records:
    raise RuntimeError("pages.jsonl contains no page records")

todo = [i for i, rec in enumerate(records) if rec.get("extractionStatus") == "empty_or_scanned_needs_ocr"]
print(f"OCR queue: {len(todo)} pages | {LANG} | {DPI} DPI | {WORKERS} workers | checkpoint every {CHECKPOINT_EVERY}", flush=True)

def ocr_one(index):
    rec = records[index]
    pdf_path = ROOT / rec["source"]
    if not pdf_path.is_file():
        return index, "", "source_pdf_missing"
    try:
        with fitz.open(pdf_path) as doc:
            page_no = int(rec["pdfPage"]) - 1
            if page_no < 0 or page_no >= len(doc):
                return index, "", "page_out_of_range"
            pix = doc.load_page(page_no).get_pixmap(
                matrix=fitz.Matrix(DPI / 72, DPI / 72),
                colorspace=fitz.csGRAY, alpha=False
            )
            with tempfile.NamedTemporaryFile(suffix=".png") as img:
                pix.save(img.name)
                proc = subprocess.run(
                    ["tesseract", img.name, "stdout", "-l", LANG, "--psm", "3"],
                    capture_output=True, text=True, timeout=TIMEOUT
                )
            extracted = " ".join(proc.stdout.split())
            if proc.returncode != 0 and not extracted:
                return index, "", "ocr_error:" + (proc.stderr or "tesseract_failed")[:140]
            status = "ocr_extracted_needs_review" if len(extracted) >= 20 else "ocr_empty_needs_manual_review"
            return index, extracted, status
    except subprocess.TimeoutExpired:
        return index, "", "ocr_error:page_timeout"
    except Exception as exc:
        return index, "", "ocr_error:" + str(exc)[:160]

completed = 0
with ThreadPoolExecutor(max_workers=WORKERS) as pool:
    futures = [pool.submit(ocr_one, i) for i in todo]
    for future in as_completed(futures):
        index, extracted, status = future.result()
        if extracted:
            records[index]["text"] = extracted
        records[index]["extractionStatus"] = status
        records[index]["reviewStatus"] = "needs_review"
        completed += 1
        if completed % 10 == 0 or completed == len(todo):
            print(f"OCR progress: {completed}/{len(todo)} pages completed", flush=True)
        if completed % CHECKPOINT_EVERY == 0:
            save_pages(records)
            save_manifest(records)
            print(f"Checkpoint saved at {completed}/{len(todo)}", flush=True)

save_pages(records)
save_manifest(records, final=True)
manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
print("OCR finished. Final totals:", flush=True)
print(json.dumps(manifest["totals"], ensure_ascii=False, indent=2), flush=True)
