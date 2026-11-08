# Primary HTML source import

Place the owner-supplied archive here without renaming it:

`englimensh_primary_full_75_units_2026_2027.zip`

Then run:

```bash
npm run import:primary-html
```

The importer extracts only the `js/data.js` curriculum payload and writes a normalized JSON file under `src/data/curriculum/`. It validates the expected Connect and Connect Plus grade/unit inventory and answer-key bounds. It does not claim PDF page references, academic verification, or generate new questions. Keep the original archive unchanged.
