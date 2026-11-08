# Approved unit content

Only unit JSON files that passed source-linked quality validation and a manual visual review may be placed in this folder.

- Drafts stay in `artifacts/unit-drafts/` and are never imported into the student application.
- Use the GitHub Actions workflow **Approve reviewed unit draft** after checking every cited PDF page and confirming the wording, answers, and supplementary labels.
- The workflow requires a reviewer name and an explicit visual-review confirmation.
- The approval script rechecks the source fingerprint, PDF range, source coverage, nine-section schema, answer keys, and item provenance before copying the approved version here.
- The student application imports only JSON files from this folder.
