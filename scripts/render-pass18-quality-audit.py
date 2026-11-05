#!/usr/bin/env python3
"""Render Pass 18 OCR-quality candidates from hydrated source PDFs."""
import json, os, re
from pathlib import Path
import fitz
ROOT=Path.cwd(); BOOKS=ROOT/"public"/"books"
SOURCE=ROOT/"src"/"data"/"extracted"/"ocr-quality-audit-pass18.jsonl"
OUT=ROOT/"review-pages-pass18"
DPI=int(os.environ.get("RENDER_DPI","240"))
if DPI not in (240,300): raise SystemExit("RENDER_DPI must be 240 or 300")
def main():
    rows=[json.loads(x) for x in SOURCE.read_text(encoding="utf-8").splitlines() if x.strip()]
    if len(rows)!=20: raise SystemExit(f"Expected 20 candidates, found {len(rows)}")
    ids=[r["recordId"] for r in rows]
    pages=[(r["sourceFilename"],r["pdfPage"]) for r in rows]
    if len(set(ids))!=20 or len(set(pages))!=20: raise SystemExit("Duplicate record IDs or source pages")
    OUT.mkdir(parents=True,exist_ok=True); docs={}; manifest=[]
    for i,r in enumerate(rows,1):
        p=BOOKS/r["sourceFilename"]
        if not p.is_file(): raise SystemExit(f"Missing PDF: {p}")
        with p.open("rb") as f: head=f.read(256)
        if not head.startswith(b"%PDF-"): raise SystemExit(f"Not hydrated PDF/LFS pointer: {p}")
        if r["sourceFilename"] not in docs: docs[r["sourceFilename"]]=fitz.open(p)
        doc=docs[r["sourceFilename"]]; page=int(r["pdfPage"])
        if page<1 or page>len(doc): raise SystemExit(f"Out-of-range page {page}: {p}")
        slug=re.sub(r"[^A-Za-z0-9_-]+","_",p.stem).strip("_")[:42] or "book"
        name=f"{i:02d}_{slug}_p{page:04d}_{DPI}dpi.png"
        pix=doc.load_page(page-1).get_pixmap(matrix=fitz.Matrix(DPI/72,DPI/72),colorspace=fitz.csRGB,alpha=False)
        pix.save(OUT/name); manifest.append({**r,"image":name,"dpi":DPI,"renderStatus":"pending_visual_review"})
    for d in docs.values(): d.close()
    (OUT/"manifest.json").write_text(json.dumps({"source":str(SOURCE.relative_to(ROOT)),"pageNumbering":"1-based physical PDF page","dpi":DPI,"totalPages":len(manifest),"sourceBooks":len(docs),"status":"pending_visual_review","pages":manifest},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(f"Rendered {len(manifest)} pages from {len(docs)} source PDFs at {DPI} DPI.")
if __name__=="__main__": main()
