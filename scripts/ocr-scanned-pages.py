#!/usr/bin/env python3
"""OCR scanned PDF pages with confidence scoring, quality flags, and resumable checkpoints."""
import csv
import io
import json
import os
import queue
import re
import subprocess
import tempfile
import unicodedata
from concurrent.futures import ThreadPoolExecutor
from collections import defaultdict
from pathlib import Path

import fitz

ROOT = Path.cwd()
DATA = ROOT / "src/data/extracted"
PAGES = DATA / "pages.jsonl"
MANIFEST = DATA / "manifest.json"
DPI = int(os.environ.get("OCR_DPI", "300"))
LANG = os.environ.get("OCR_LANG", "eng+ara")
WORKERS = max(1, min(int(os.environ.get("OCR_WORKERS", "4")), 8))
CHECKPOINT_EVERY = max(1, int(os.environ.get("OCR_CHECKPOINT_EVERY", "25")))
TIMEOUT = max(10, int(os.environ.get("OCR_PAGE_TIMEOUT", "45")))


def save_pages(records):
    temp = PAGES.with_suffix(".jsonl.tmp")
    temp.write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in records), encoding="utf-8")
    temp.replace(PAGES)


def parse_tsv(raw):
    words = []
    confidences = []
    reader = csv.DictReader(io.StringIO(raw), delimiter="\t")
    for row in reader:
        if row.get("level") != "5":
            continue
        token = (row.get("text") or "").strip()
        if token:
            words.append(token)
        try:
            confidence = float(row.get("conf", "-1"))
            if confidence >= 0:
                confidences.append(confidence)
        except (TypeError, ValueError):
            pass
    text = " ".join(words)
    average = round(sum(confidences) / len(confidences), 1) if confidences else None
    return text, average, len(words)


def quality_flags(text, confidence):
    flags = []
    if len(text.strip()) < 20:
        flags.append("text_missing_or_too_short")
    if "\ufffd" in text:
        flags.append("unicode_replacement_character")
    if re.search(r"(.)\1{5,}", text):
        flags.append("repeated_character_run")
    tokens = re.findall(r"[\w]+", text, flags=re.UNICODE)
    if any(len(token) > 40 for token in tokens):
        flags.append("unbroken_token_over_40_characters")
    readable = sum(
        character.isalnum() or character.isspace() or unicodedata.category(character).startswith("P")
        for character in text
    )
    ratio = readable / len(text) if text else 0
    if len(text) >= 20 and ratio < 0.55:
        flags.append("low_readable_character_ratio")
    if confidence is not None and confidence < 45:
        flags.append("low_ocr_confidence")
    return flags


def save_manifest(records):
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    by_source = defaultdict(list)
    for record in records:
        by_source[record["source"]].append(record)

    for book in manifest["books"]:
        book_pages = by_source.get(book["source"], [])
        if not book_pages:
            continue
        statuses = [page.get("extractionStatus", "") for page in book_pages]
        confidences = [
            page["ocrConfidence"] for page in book_pages
            if isinstance(page.get("ocrConfidence"), (int, float))
        ]
        book["ocrPages"] = sum(status == "ocr_extracted_needs_review" for status in statuses)
        book["ocrUnreliablePages"] = sum(status == "ocr_unreliable_needs_visual_review" for status in statuses)
        book["ocrEmptyOrErrorPages"] = sum(
            status == "ocr_empty_needs_manual_review" or status.startswith("ocr_error")
            for status in statuses
        )
        book["extractedPagesAfterOcr"] = sum(len(page.get("text", "")) >= 20 for page in book_pages)
        book["averageOcrConfidence"] = round(sum(confidences) / len(confidences), 1) if confidences else None

    statuses = [record.get("extractionStatus", "") for record in records]
    confidences = [
        record["ocrConfidence"] for record in records
        if isinstance(record.get("ocrConfidence"), (int, float))
    ]
    manifest["totals"]["ocrProcessedPages"] = sum(
        not (status == "empty_or_scanned_needs_ocr" or status.startswith("ocr_error"))
        for status in statuses
    )
    manifest["totals"]["ocrExtractedPages"] = statuses.count("ocr_extracted_needs_review")
    manifest["totals"]["ocrUnreliablePages"] = statuses.count("ocr_unreliable_needs_visual_review")
    manifest["totals"]["pagesNeedingOcrOrReviewAfterOcr"] = sum(
        status != "ocr_extracted_needs_review" for status in statuses
    )
    manifest["totals"]["averageOcrConfidence"] = (
        round(sum(confidences) / len(confidences), 1) if confidences else None
    )
    manifest["ocr"] = {
        "engine": "Tesseract TSV",
        "languages": LANG,
        "dpi": DPI,
        "workers": WORKERS,
        "checkpointEvery": CHECKPOINT_EVERY,
        "confidenceScale": "0-100 average of recognized word confidence values",
        "note": "OCR remains machine-recognized and needs_review; confidence is not academic verification."
    }
    temp = MANIFEST.with_suffix(".json.tmp")
    temp.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temp.replace(MANIFEST)


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

retry_statuses = {
    "empty_or_scanned_needs_ocr",
    "ocr_empty_needs_manual_review",
    "ocr_unreliable_needs_visual_review"
}
todo_by_source = defaultdict(list)
for index, record in enumerate(records):
    status = str(record.get("extractionStatus", ""))
    if status in retry_statuses or status.startswith("ocr_error"):
        todo_by_source[record["source"]].append(index)

total = sum(map(len, todo_by_source.values()))
print(f"OCR queue: {total} pages across {len(todo_by_source)} PDFs | {LANG} | {DPI} DPI | {WORKERS} workers", flush=True)

results = queue.Queue()


def process_pdf(source, indices):
    pdf_path = ROOT / source
    try:
        if not pdf_path.is_file():
            for index in indices:
                results.put((index, "", "source_pdf_missing", None, 0, ["source_pdf_missing"]))
            return
        with fitz.open(pdf_path) as document:
            for index in indices:
                record = records[index]
                try:
                    page_number = int(record["pdfPage"]) - 1
                    if page_number < 0 or page_number >= len(document):
                        results.put((index, "", "page_out_of_range", None, 0, ["page_out_of_range"]))
                        continue
                    pixmap = document.load_page(page_number).get_pixmap(
                        matrix=fitz.Matrix(DPI / 72, DPI / 72),
                        colorspace=fitz.csGRAY,
                        alpha=False
                    )
                    with tempfile.NamedTemporaryFile(suffix=".png") as image:
                        pixmap.save(image.name)
                        process = subprocess.run(
                            ["tesseract", image.name, "stdout", "-l", LANG, "--psm", "3", "tsv"],
                            capture_output=True,
                            text=True,
                            timeout=TIMEOUT,
                            env={**os.environ, "OMP_THREAD_LIMIT": "1"}
                        )
                    extracted, confidence, word_count = parse_tsv(process.stdout)
                    flags = quality_flags(extracted, confidence)
                    if process.returncode != 0 and not extracted:
                        status = "ocr_error:" + (process.stderr or "tesseract_failed")[:140]
                    elif len(extracted.strip()) < 20:
                        status = "ocr_empty_needs_manual_review"
                    elif flags:
                        status = "ocr_unreliable_needs_visual_review"
                    else:
                        status = "ocr_extracted_needs_review"
                    results.put((index, extracted, status, confidence, word_count, flags))
                except subprocess.TimeoutExpired:
                    results.put((index, "", "ocr_error:page_timeout", None, 0, ["page_timeout"]))
                except Exception as error:
                    results.put((index, "", "ocr_error:" + str(error)[:160], None, 0, ["ocr_exception"]))
    except Exception as error:
        for index in indices:
            results.put((index, "", "ocr_error:pdf_open:" + str(error)[:120], None, 0, ["pdf_open_error"]))


completed = 0
with ThreadPoolExecutor(max_workers=WORKERS) as pool:
    futures = [pool.submit(process_pdf, source, indices) for source, indices in todo_by_source.items()]
    while completed < total:
        index, extracted, status, confidence, word_count, flags = results.get()
        records[index]["text"] = extracted
        records[index]["extractionStatus"] = status
        records[index]["reviewStatus"] = "needs_review"
        records[index]["ocrConfidence"] = confidence
        records[index]["ocrWordCount"] = word_count
        records[index]["ocrQualityFlags"] = flags
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
