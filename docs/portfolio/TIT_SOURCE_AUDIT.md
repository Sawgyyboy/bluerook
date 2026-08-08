# TIT source audit

Read-only audit completed 2026-08-02. No source folder or Git state was changed.

## Primary source

`D:\01_Projects\TIT` is the instructed primary, but the current on-disk snapshot is incomplete: only 14 public/configuration files remain. Current `app/`, `components/`, `context/`, `lib/`, `public/` and generated application trees are absent. Documentation and historical TypeScript metadata mention Shopify/cart/admin modules, but missing source cannot verify an implementation.

The inspectable customer-facing file is a standalone HTML prototype that labels itself as in development.

## Large Copy comparison

`D:\01_Projects\TIT - Large Copy` is an older source-complete frontend prototype, not a second implementation to merge. It contains a small Next application plus stale generated/dependency folders. Its product state is hard-coded; there is no current Shopify client, catalogue API, inventory synchronization, order operation, automation, CRM or chatbot source.

The standalone `theinvisibletrace.html` file is byte-identical in both folders. The Large Copy is retained only as visual/frontend evidence.

## Classification

| Layer | Classification | Notes |
|---|---|---|
| Brand direction | DESIGN / PROTOTYPE | Visual direction exists; approval/version/permission evidence is absent. |
| Storefront | PROTOTYPE / PARTIAL | Multi-route browsing and local interface states exist; several controls are inert and product data is hard-coded. |
| Shopify/catalogue | UNVERIFIED | Current source does not support a live Shopify or synchronization claim. |
| Product descriptions | DESIGN ONLY / UNVERIFIED | Hard-coded copy only; no generation/review workflow. |
| Image discovery | UNVERIFIED | No approved-source search, validation, duplicate or approval system. |
| Orders/dashboard | UNVERIFIED | Historical names are not current source evidence. |
| Chatbot/CRM/handoff | UNVERIFIED | No current source verifies these modules. |

## Public decision

The route uses `FICTIONAL INTERACTIVE DEMONSTRATION` and an independent fictional retailer. The verified storefront prototype is cited only as limited Inspect-mode evidence. No customer identity, asset, product, metric, Shopify state or outcome is presented as implemented proof.

Neither TIT folder is a Git repository. No files were edited, installed, built, renamed or executed with write behavior.
