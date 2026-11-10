#!/usr/bin/env python3
"""OCR scanned PDF pages with resumable checkpoints and a second-pass retry for empty OCR pages."""
import json
import os
import queue
import re
import subprocess
import tempfile
from concurrent.futures import ThreadPoolExecutor
from collections import defaultdict
from datetime import datetime, timezone
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
TIMEOUT = max(10, int(os.environ.get("OCR_PAGE_TIMEOUT", "45")))
RETRY_EMPTY = os.environ.get("OCR_RETRY_EMPTY", "0") == "1"
DEFAULT_PSM = int(os.environ.get("OCR_PSM", "3"))
RETRY_PSMS = [
    int(value.strip())
    for value in os.environ.get("OCR_PSMS", "6,11,3").split(",")
    if value.strip().isdigit()
] or [6, 11, 3]

OCR_TEXT_STATUSES = {"ocr_extracted_needs_review", "ocr_unreliable_needs_visual_review"}
OCR_REVIEW_STATUSES = OCR_TEXT_STATUSES | {"ocr_empty_needs_manual_review"}

def save_pages(records):
    temp = PAGES.with_suffix(".jsonl.tmp")
    temp.write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in records), encoding="utf-8")
    temp.replace(PAGES)

def status_of(record):
    return str(record.get("extractionStatus", ""))

def save_manifest(records):
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    by_source = defaultdict(list)
    for rec in records:
        by_source[rec["source"]].append(rec)

    for book in manifest.get("books", []):
        pages = by_source.get(book.get("source"), [])
        if not pages:
            continue
        statuses = [status_of(page) for page in pages]
        book["ocrPages"] = sum(status in OCR_TEXT_STATUSES for status in statuses)
        book["ocrReliablePages"] = sum(status == "ocr_extracted_needs_review" for status in statuses)
        book["ocrUnreliablePages"] = sum(status == "ocr_unreliable_needs_visual_review" for status in statuses)
        book["ocrEmptyOrErrorPages"] = sum(
            status == "ocr_empty_needs_manual_review" or status.startswith("ocr_error")
            for status in statuses
        )
        book["extractedPagesAfterOcr"] = sum(len(page.get("text", "")) >= 20 for page in pages)

    totals = manifest.setdefault("totals", {})
    statuses = [status_of(page) for page in records]
    totals["ocrProcessedPages"] = sum(
        status in OCR_REVIEW_STATUSES or status.startswith("ocr_error")
        for status in statuses
    )
    totals["ocrExtractedPages"] = sum(status in OCR_TEXT_STATUSES for status in statuses)
    totals["ocrReliablePages"] = sum(status == "ocr_extracted_needs_review" for status in statuses)
    totals["ocrUnreliablePages"] = sum(status == "ocr_unreliable_needs_visual_review" for status in statuses)
    totals["ocrEmptyPages"] = sum(status == "ocr_empty_needs_manual_review" for status in statuses)
    totals["ocrErrorPages"] = sum(status.startswith("ocr_error") for status in statuses)
    totals["pagesNeedingOcrOrReviewAfterOcr"] = sum(
        status in OCR_REVIEW_STATUSES or status.startswith("ocr_error")
        for status in statuses
    )
    totals["pagesNeedingManualVisualReview"] = totals["pagesNeedingOcrOrReviewAfterOcr"]

    manifest["ocr"] = {
        "engine": "Tesseract",
        "languages": LANG,
        "dpi": DPI,
        "workers": WORKERS,
        "checkpointEvery": CHECKPOINT_EVERY,
        "retryEmpty": RETRY_EMPTY,
        "retryPsmCandidates": RETRY_PSMS if RETRY_EMPTY else [DEFAULT_PSM],
        "note": "OCR output is machine-recognized and remains needs_review; verify against original PDF."
    }
    temp = MANIFEST.with_suffix(".json.tmp")
    temp.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temp.replace(MANIFEST)

def score_text(text):
    value = " ".join(str(text or "").split())
    if not value:
        return 0.0
    words = re.findall(r"[A-Za-z0-9\u0600-\u06FF]+", value)
    readable = sum(
        char.isalnum() or "\u0600" <= char <= "\u06FF" or char.isspace() or char in ".,!?;:'\"()-/"
        for char in value
    )
    ratio = readable / max(1, len(value))
    score = min(len(value), 2000) * ratio + min(len(words), 100) * 2
    if any(len(word) > 40 and "-" not in word and "/" not in word for word in words):
        score -= 30
    if re.search(r"([^\s._-])\1{4,}", value):
        score -= 20
    if ratio < 0.50:
        score -= 50
    return score

def classify_text(text):
    value = " ".join(str(text or "").split())
    if len(value) < 20:
        return "ocr_empty_needs_manual_review"
    words = value.split()
    readable = sum(
        char.isalnum() or "\u0600" <= char <= "\u06FF" or char.isspace() or char in ".,!?;:'\"()-/"
        for char in value
    )
    ratio = readable / max(1, len(value))
    has_long_word = any(len(word) > 40 and "-" not in word and "/" not in word for word in words)
    has_char_repeat = bool(re.search(r"([^\s._-])\1{4,}", value))
    if ratio < 0.50 or has_long_word or has_char_repeat:
        return "ocr_unreliable_needs_visual_review"
    return "ocr_extracted_needs_review"

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
for index, record in enumerate(records):
    status = status_of(record)
    if status == "empty_or_scanned_needs_ocr" or (
        RETRY_EMPTY and status == "ocr_empty_needs_manual_review"
    ):
        todo_by_source[record["source"]].append(index)
total = sum(map(len, todo_by_source.values()))
print(
    f"OCR queue: {total} pages across {len(todo_by_source)} PDFs | {LANG} | {DPI} DPI | "
    f"{WORKERS} workers | retry-empty={RETRY_EMPTY}",
    flush=True
)

results = queue.Queue()

def process_pdf(source, indices):
    pdf_path = ROOT / source
    try:
        if not pdf_path.is_file():
            for index in indices:
                old = records[index]
                retry = status_of(old) == "ocr_empty_needs_manual_review"
                results.put((index, old.get("text", "") if retry else "", "ocr_error:source_pdf_missing", None))
            return

        with fitz.open(pdf_path) as document:
            for index in indices:
                record = records[index]
                old_text = " ".join(str(record.get("text", "")).split())
                retry = status_of(record) == "ocr_empty_needs_manual_review"
                psms = RETRY_PSMS if retry else [DEFAULT_PSM]
                best_text = old_text if retry else ""
                best_score = score_text(best_text)
                best_psm = None
                errors = []

                try:
                    page_number = int(record["pdfPage"]) - 1
                    if page_number < 0 or page_number >= len(document):
                        results.put((index, old_text, "ocr_error:page_out_of_range", None))
                        continue

                    pixmap = document.load_page(page_number).get_pixmap(
                        matrix=fitz.Matrix(DPI / 72, DPI / 72),
                        colorspace=fitz.csGRAY,
                        alpha=False
                    )
                    with tempfile.NamedTemporaryFile(suffix=".png") as image_file:
                        pixmap.save(image_file.name)
                        for psm in psms:
                            try:
                                process = subprocess.run(
                                    ["tesseract", image_file.name, "stdout", "-l", LANG, "--psm", str(psm)],
                                    capture_output=True,
                                    text=True,
                                    timeout=TIMEOUT,
                                    env={**os.environ, "OMP_THREAD_LIMIT": "1"}
                                )
                                candidate = " ".join(process.stdout.split())
                                if process.returncode != 0 and not candidate:
                                    errors.append((process.stderr or "tesseract_failed")[:160])
                                    continue
                                candidate_score = score_text(candidate)
                                if candidate_score > best_score or (
                                    candidate_score == best_score and len(candidate) > len(best_text)
                                ):
                                    best_text = candidate
                                    best_score = candidate_score
                                    best_psm = psm
                            except subprocess.TimeoutExpired:
                                errors.append("page_timeout_psm_" + str(psm))
                            except Exception as error:
                                errors.append(str(error)[:160])

                    final_status = classify_text(best_text)
                    retry_meta = None
                    if retry:
                        retry_meta = {
                            "attemptedAt": datetime.now(timezone.utc).isoformat(),
                            "dpi": DPI,
                            "psmCandidates": psms,
                            "bestPsm": best_psm,
                            "previousTextLength": len(old_text),
                            "finalTextLength": len(best_text),
                            "errors": errors[:3]
                        }
                    elif not best_text and errors:
                        final_status = "ocr_error:" + errors[0][:140]
                    results.put((index, best_text, final_status, retry_meta))
                except Exception as error:
                    if retry:
                        retry_meta = {
                            "attemptedAt": datetime.now(timezone.utc).isoformat(),
                            "dpi": DPI,
                            "psmCandidates": psms,
                            "bestPsm": None,
                            "previousTextLength": len(old_text),
                            "finalTextLength": len(old_text),
                            "errors": [str(error)[:160]]
                        }
                        results.put((index, old_text, "ocr_empty_needs_manual_review", retry_meta))
                    else:
                        results.put((index, "", "ocr_error:" + str(error)[:160], None))
    except Exception as error:
        for index in indices:
            record = records[index]
            retry = status_of(record) == "ocr_empty_needs_manual_review"
            results.put((
                index,
                record.get("text", "") if retry else "",
                "ocr_empty_needs_manual_review" if retry else "ocr_error:pdf_open:" + str(error)[:120],
                {"attemptedAt": datetime.now(timezone.utc).isoformat(), "errors": [str(error)[:160]]} if retry else None
            ))

completed = 0
with ThreadPoolExecutor(max_workers=WORKERS) as pool:
    futures = [
        pool.submit(process_pdf, source, indices)
        for source, indices in todo_by_source.items()
    ]
    while completed < total:
        index, extracted, status, retry_meta = results.get()
        records[index]["text"] = extracted
        records[index]["extractionStatus"] = status
        records[index]["reviewStatus"] = "needs_review"
        if retry_meta:
            records[index]["ocrRetry"] = retry_meta
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
