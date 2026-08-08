# Technical portfolio export guide

Use this guide to create a local PDF of `/technical-portfolio/`. The export is a technical dossier, not a replacement for the interactive portfolio routes.

## Before exporting

1. Open PowerShell in `C:\Users\ROG\Bluerook`.
2. Start the static preview:

   ```powershell
   python -m http.server 5173 --bind 127.0.0.1
   ```

3. Open `http://localhost:5173/technical-portfolio/` in a current Chromium-based browser.
4. Confirm the page identifies `Hatim Beid · Bluerook` and that the project cards retain their public status labels.
5. Check `docs/portfolio/CLAIM_LEDGER.md` before sharing. Do not add client names, outcomes, rates, production claims or private implementation details to the export.

## Create the PDF

1. Select **Print / save PDF** on the page, or press `Ctrl+P`.
2. Choose **Save to PDF**.
3. Use A4 paper, portrait orientation and default scale.
4. Turn browser headers and footers off. The print stylesheet already supplies the portfolio identity and contact details.
5. Leave background graphics on only if the print preview remains clear. The print stylesheet converts the dossier to a light, ink-friendly layout.
6. Save as `Hatim-Beid-Technical-Portfolio.pdf`.

The print stylesheet removes navigation, playback controls, the chapter rail and the screen-only summary. It prints the complete technical dossier regardless of the currently selected Story, Inspect or Summary mode.

## Export review

Review every PDF page before sending:

- Hatim's name, Bluerook and `hatim@bluerook.co` are legible.
- No heading, project label, table or URL is clipped.
- Links are readable and their printed destinations do not collide with body copy.
- Commerce remains a **FICTIONAL INTERACTIVE DEMONSTRATION** informed only by an available storefront prototype.
- Sports enrollment remains a synthetic reconstruction with section-level **IMPLEMENTED SYSTEM · ANONYMIZED** and **CAPABILITY PROTOTYPE** boundaries.
- Sports Operations OS remains a **FICTIONAL INTERACTIVE DEMONSTRATION** with browser-local state and no external connection.
- Follow-Up Gap Detector and Process to SOP remain **BLUEROOK PRODUCT** entries with their current inactive or local-validation limitations.
- Voice and lead scenes remain **CAPABILITY PROTOTYPE** work; managed operations remains a **MANAGED SERVICE** illustrated with synthetic data.
- No fixed rate, invented outcome, testimonial or production-status claim appears.

## Share with the interactive link

When the portfolio is intentionally published in a later, separately approved step, send the PDF with the matching technical-portfolio URL. Until then, treat the PDF and all route URLs as local review artifacts. This portfolio task does not authorize a push or deployment.
