#!/usr/bin/env python3
"""
High-Resolution OCR & Visual Verification for:
Book: Baccalaureate Year 2 First Language Part 1 (Eng-L1-EB-Part1 (1).pdf)
Unit 4: The Power of Choice (Physical PDF pages 102–139, 38 pages)
Renders each page at 300 DPI, runs dual-language OCR (eng+ara), extracts confidence diagnostics,
and creates structured review artifacts.
"""

import json
import os
import re
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import pymupdf as fitz
import pytesseract
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PDF_PATH = Path("/tmp/Eng-L1-EB-Part1.pdf")
if not PDF_PATH.is_file():
    PDF_PATH = ROOT / "public/books/Eng-L1-EB-Part1 (1).pdf"

OUTPUT_IMG_DIR = ROOT / "artifacts/ocr-renders/unit4"
OUTPUT_REVIEW_DIR = ROOT / "artifacts/ocr-review"
OUTPUT_IMG_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_REVIEW_DIR.mkdir(parents=True, exist_ok=True)

START_PAGE = 102
END_PAGE = 139
DPI = 300
LANG = "eng+ara"

print(f"Loading PDF: {PDF_PATH}")
doc = fitz.open(PDF_PATH)
print(f"Total PDF pages: {len(doc)}. Processing Unit 4 range: {START_PAGE}–{END_PAGE} ({END_PAGE - START_PAGE + 1} pages) at {DPI} DPI...")

def process_single_page(pdf_page_num):
    zero_idx = pdf_page_num - 1
    page = doc.load_page(zero_idx)
    
    # Render at 300 DPI
    pix = page.get_pixmap(dpi=DPI)
    img_filename = f"page_{pdf_page_num:03d}_300dpi.png"
    img_path = OUTPUT_IMG_DIR / img_filename
    pix.save(img_path)
    
    # Run Tesseract with text and word-level data
    pil_img = Image.open(img_path)
    raw_text = pytesseract.image_to_string(pil_img, lang=LANG)
    data = pytesseract.image_to_data(pil_img, lang=LANG, output_type=pytesseract.Output.DICT)
    
    # Word-level confidence analysis
    words = []
    confs = []
    low_conf_words = []
    
    n_boxes = len(data['text'])
    for i in range(n_boxes):
        w = data['text'][i].strip()
        conf = int(data['conf'][i])
        if w and conf >= 0:
            words.append(w)
            confs.append(conf)
            if conf < 60:
                low_conf_words.append({'word': w, 'conf': conf, 'line': data['line_num'][i]})
                
    mean_conf = round(sum(confs) / len(confs), 1) if confs else 0.0
    cleaned_text = " ".join(raw_text.split())
    
    # Identify lines
    lines = [l.strip() for l in raw_text.splitlines() if l.strip()]
    
    # Readability ratio
    char_count = len(cleaned_text)
    readable_chars = len(re.findall(r'[a-zA-Z0-9\u0600-\u06FF\s.,!?;:\'"()/-]', cleaned_text))
    readable_ratio = round(readable_chars / char_count, 3) if char_count > 0 else 0.0
    
    # Check for long unbroken words
    long_words = [w for w in words if len(w) > 35 and '-' not in w and '/' not in w and not w.startswith('http')]
    
    # Classification
    status = "needs_review"
    if char_count == 0:
        status = "ocr_empty_needs_manual_review"
    elif readable_ratio < 0.40 or len(long_words) > 0 or mean_conf < 35:
        status = "ocr_unreliable_needs_visual_review"
    else:
        status = "ocr_extracted_needs_review"
        
    return {
        "pdfPage": pdf_page_num,
        "sourceFilename": "Eng-L1-EB-Part1 (1).pdf",
        "imageRef": f"artifacts/ocr-renders/unit4/{img_filename}",
        "charCount": char_count,
        "wordCount": len(words),
        "meanConfidence": mean_conf,
        "readableRatio": readable_ratio,
        "status": status,
        "reviewStatus": "needs_review",
        "longWords": long_words,
        "lowConfidenceCount": len(low_conf_words),
        "lowConfidenceWords": low_conf_words[:10],
        "lineCount": len(lines),
        "sampleLines": lines[:8],
        "fullText": cleaned_text
    }

results = []
with ThreadPoolExecutor(max_workers=4) as executor:
    page_numbers = list(range(START_PAGE, END_PAGE + 1))
    futures = [executor.submit(process_single_page, p) for p in page_numbers]
    for fut in futures:
        res = fut.result()
        results.append(res)
        print(f"Page {res['pdfPage']}: {res['wordCount']} words | Conf: {res['meanConfidence']}% | Status: {res['status']}")

results.sort(key=lambda x: x['pdfPage'])

# Save JSON manifest
manifest_path = OUTPUT_REVIEW_DIR / "unit4-pages-ocr-manifest.json"
manifest_data = {
    "bookId": "baccalaureate-y2-first-language-part1",
    "unitNumber": 4,
    "unitTitle": "The Power of Choice",
    "sourceFile": "Eng-L1-EB-Part1 (1).pdf",
    "renderedDpi": DPI,
    "ocrLanguages": LANG,
    "pageRange": {"start": START_PAGE, "end": END_PAGE, "total": len(results)},
    "summary": {
        "totalPages": len(results),
        "averageConfidence": round(sum(r['meanConfidence'] for r in results) / len(results), 1),
        "extractedNeedsReview": sum(r['status'] == 'ocr_extracted_needs_review' for r in results),
        "unreliableNeedsVisual": sum(r['status'] == 'ocr_unreliable_needs_visual_review' for r in results),
        "emptyNeedsManual": sum(r['status'] == 'ocr_empty_needs_manual_review' for r in results),
        "totalWordsRecognized": sum(r['wordCount'] for r in results)
    },
    "pages": results
}
manifest_path.write_text(json.dumps(manifest_data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"\nManifest saved to {manifest_path}")

# Build comprehensive human-readable Markdown review document
md_path = ROOT / "docs/visual-ocr-review-pass-unit4.md"
md_lines = [
    "# Visual and High-Resolution OCR Review — Unit 4: The Power of Choice",
    "",
    "**Book:** Baccalaureate Year 2 First Language Part 1 (`Eng-L1-EB-Part1 (1).pdf`)  ",
    f"**Physical PDF Pages:** {START_PAGE}–{END_PAGE} ({len(results)} pages)  ",
    f"**Rendering Resolution:** {DPI} DPI  ",
    f"**OCR Engine:** Tesseract 5.3.0 (`{LANG}`)  ",
    "**Review Policy:** All records remain `needs_review`. Unverified text is not promoted to approved curriculum.  ",
    "",
    "## 1. Summary Statistics",
    "",
    f"- Total Pages Processed: **{len(results)}**",
    f"- Total Words Recognized: **{manifest_data['summary']['totalWordsRecognized']}**",
    f"- Average OCR Confidence: **{manifest_data['summary']['averageConfidence']}%**",
    f"- Usable Pages with Extraction: **{manifest_data['summary']['extractedNeedsReview']}**",
    f"- Pages Needing Targeted Visual Attention: **{manifest_data['summary']['unreliableNeedsVisual']}**",
    f"- Empty / Minimal Scans: **{manifest_data['summary']['emptyNeedsManual']}**",
    "",
    "## 2. Page-by-Page Audit Table",
    "",
    "| PDF Page | Words | Mean Conf (%) | Readable Ratio | Status | Visible Headings / Content Summary |",
    "|---|---|---|---|---|---|"
]

for r in results:
    preview = " / ".join(r['sampleLines'][:3]).replace("|", "-")
    if len(preview) > 80:
        preview = preview[:77] + "..."
    md_lines.append(f"| {r['pdfPage']} | {r['wordCount']} | {r['meanConfidence']}% | {r['readableRatio']} | `{r['status']}` | {preview or '*(No text recognized)*'} |")

md_lines.append("")
md_lines.append("## 3. Detailed Page Records")
md_lines.append("")

for r in results:
    md_lines.append(f"### PDF Page {r['pdfPage']}")
    md_lines.append(f"- **Image Artifact:** `{r['imageRef']}`")
    md_lines.append(f"- **Word Count:** {r['wordCount']} | **Confidence:** {r['meanConfidence']}% | **Status:** `{r['status']}`")
    if r['longWords']:
        md_lines.append(f"- **Flagged Long Words:** {', '.join(r['longWords'])}")
    if r['lowConfidenceWords']:
        low_samples = [f"\"{w['word']}\" ({w['conf']}%)" for w in r['lowConfidenceWords'][:5]]
        md_lines.append(f"- **Low Confidence Samples:** {', '.join(low_samples)}")
    md_lines.append("- **Extracted OCR Text Preview:**")
    md_lines.append("```text")
    md_lines.append(r['fullText'][:500] + ("..." if len(r['fullText']) > 500 else ""))
    md_lines.append("```")
    md_lines.append("")

md_path.write_text("\n".join(md_lines) + "\n", encoding="utf-8")
print(f"Markdown review document saved to {md_path}")
