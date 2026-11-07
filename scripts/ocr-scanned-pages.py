#!/usr/bin/env python3
"""OCR scanned PDF pages efficiently, one open PDF per worker, with resumable checkpoints."""
import json
import os
import queue
import re
import subprocess
import tempfile
from concurrent.futures import ThreadPoolExecutor
from collections import defaultdict
from pathlib import Path
import fitz

ROOT = Path.cwd()
DATA = ROOT / "src/data/extracted"
PAGES = DATA / "pages.jsonl"
MANIFEST = DATA / "manifest.json"
DPI = int(os.environ.get("OCR_DPI", "150"))
LANG = os.environ.get("OCR_LANG", "eng+ara")
WORKERS = max(1, min(int(os.environ.get("OCR_WORKERS", "6")), 8))
CHECKPOINT_EVERY = max(1, int(os.environ.get("OCR_CHECKPOINT_EVERY", "25")))
TIMEOUT = max(10, int(os.environ.get("OCR_PAGE_TIMEOUT", "30")) )

def save_pages(records):
    temp = PAGES.with_suffix(".jsonl.tmp")
    temp.write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in records), encoding="utf-8")
    temp.replace(PAGES)

def save_manifest(records):
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    by_source = defaultdict(list)
    for rec in records:
        by_source[rec["source"]].append(rec)
    for book in manifest["books"]:
        pages = by_source.get(book["source"], [])
        if pages:
            book["ocrPages"] = sum(p.get("extractionStatus") == "ocr_extracted_needs_review" for p in pages)
            book["ocrEmptyOrErrorPages"] = sum(
                p.get("extractionStatus") == "ocr_empty_needs_manual_review"
                or str(p.get("extractionStatus", "")).startswith("ocr_error") for p in pages
            )
            book["extractedPagesAfterOcr"] = sum(len(p.get("text", "")) >= 20 for p in pages)
    manifest["totals"]["ocrProcessedPages"] = sum(
        p.get("extractionStatus") != "empty_or_scanned_needs_ocr" for p in records
    )
    manifest["totals"]["ocrExtractedPages"] = sum(
        p.get("extractionStatus") == "ocr_extracted_needs_review" for p in records
    )
    manifest["totals"]["pagesNeedingOcrOrReviewAfterOcr"] = sum(
        len(p.get("text", "")) < 20 for p in records
    )
    manifest["ocr"] = {
        "engine": "Tesseract", "languages": LANG, "dpi": DPI, "workers": WORKERS,
        "checkpointEvery": CHECKPOINT_EVERY,
        "note": "OCR output is machine-recognized and remains needs_review; verify against original PDF."
    }
    temp = MANIFEST.with_suffix(".json.tmp")
    temp.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temp.replace(MANIFEST)

# raw_decode also tolerates legacy checkpoints that used a literal backslash-n separator.
raw = PAGES.read_text(encoding="utf-8")
decoder = json.JSONDecoder()
records, cursor = [], 0
while cursor < len(raw):
    while cursor < len(raw) and raw[cursor].isspace():
        cursor += 1
    if raw.startswith("\\n", cursor):
        cursor += 2
        continue
    if cursor >= len(raw):
        break
    record, cursor = decoder.raw_decode(raw, cursor)
    if not isinstance(record, dict):
        raise RuntimeError("pages.jsonl contains a non-object record")
    records.append(record)
if not records:
    raise RuntimeError("pages.jsonl contains no page records")

todo_by_source = defaultdict(list)
for i, rec in enumerate(records):
    if rec.get("extractionStatus") == "empty_or_scanned_needs_ocr":
        todo_by_source[rec["source"]].append(i)
total = sum(map(len, todo_by_source.values()))
print(f"OCR queue: {total} pages across {len(todo_by_source)} PDFs | {LANG} | {DPI} DPI | {WORKERS} workers", flush=True)

results = queue.Queue()
def process_pdf(source, indices):
    pdf_path = ROOT / source
    try:
        if not pdf_path.is_file():
            for i in indices:
                results.put((i, "", "source_pdf_missing"))
            return
        with fitz.open(pdf_path) as doc:
            for i in indices:
                rec = records[i]
                try:
                    page_no = int(rec["pdfPage"]) - 1
                    if page_no < 0 or page_no >= len(doc):
                        results.put((i, "", "page_out_of_range"))
                        continue
                    pix = doc.load_page(page_no).get_pixmap(
                        matrix=fitz.Matrix(DPI / 72, DPI / 72),
                        colorspace=fitz.csGRAY, alpha=False
                    )
                    with tempfile.NamedTemporaryFile(suffix=".png") as img:
                        pix.save(img.name)
                        proc = subprocess.run(
                            ["tesseract", img.name, "stdout", "-l", LANG, "--psm", "3"],
                            capture_output=True, text=True, timeout=TIMEOUT,
                            env={**os.environ, "OMP_THREAD_LIMIT": "1"}
                        )
                    extracted = " ".join(proc.stdout.split())
                    if proc.returncode != 0 and not extracted:
                        status = "ocr_error:" + (proc.stderr or "tesseract_failed")[:140]
                    elif len(extracted) < 20:
                        status = "ocr_empty_needs_manual_review"
                    else:
                        words = extracted.split()
                        readable = len(re.findall(r'[a-zA-Z0-9\u0600-\u06FF\s.,!?;:\'"()/-]', extracted))
                        ratio = readable / len(extracted) if len(extracted) > 0 else 0
                        has_long_word = any(len(w) > 40 and '-' not in w and '/' not in w for w in words)
                        has_char_repeat = bool(re.search(r'([^\s._\-])\1{4,}', extracted))
                        if ratio < 0.50 or has_long_word or has_char_repeat:
                            status = "ocr_unreliable_needs_visual_review"
                        else:
                            status = "ocr_extracted_needs_review"
                    results.put((i, extracted, status))
                except subprocess.TimeoutExpired:
                    results.put((i, "", "ocr_error:page_timeout"))
                except Exception as exc:
                    results.put((i, "", "ocr_error:" + str(exc)[:160]))
    except Exception as exc:
        for i in indices:
            results.put((i, "", "ocr_error:pdf_open:" + str(exc)[:120]))

completed = 0
with ThreadPoolExecutor(max_workers=WORKERS) as pool:
    futures = [pool.submit(process_pdf, source, indices) for source, indices in todo_by_source.items()]
    while completed < total:
        index, extracted, status = results.get()
        if extracted:
            records[index]["text"] = extracted
        records[index]["extractionStatus"] = status
        records[index]["reviewStatus"] = "needs_review"
        completed += 1
        if completed % 10 == 0 or completed == total:
            print(f"OCR progress: {completed}/{total} pages completed", flush=True)
        if completed % CHECKPOINT_EVERY == 0:
            save_pages(records)
            save_manifest(records)
            print(f"Checkpoint saved at {completed}/{total}", flush=True)
    for future in futures:
        future.result()

save_pages(records)
save_manifest(records)
manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
print("OCR finished. Final totals:", flush=True)
print(json.dumps(manifest["totals"], ensure_ascii=False, indent=2), flush=True)
