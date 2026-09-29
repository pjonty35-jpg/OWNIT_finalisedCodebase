# OWNIT 2D Studio

Route: `/create`. This is a functional concept editor, not a production-proof or checkout system.

## Creative model

Four independent 1200 × 1500 coordinate spaces (front, back, left, right) contain typed design elements with positions, scale, rotation, opacity, visibility, locks and layer order. Views do not simulate continuous artwork across seams. Custom garment colours and free placements are design preferences until a production partner confirms feasibility.

The page retains the real catalogue, but does not claim that its base price covers printing. Review, local save and a versioned `.ownit.json` download are the completion actions. Payment and production must be integrated separately with server validation.

## Assets and provenance

Generated with the built-in image generation tool (not the CLI). The original reference remains unchanged. Assets are project-local:

- `public/img/studio/studio-background.png`: generated empty industrial-studio reconstruction inspired by `C:/Users/rabin/Downloads/OWNIT_StudioPage.png`.
- `public/img/studio/studio-background.webp`: optimised static background, approximately 54 KB.
- `public/img/studio/tshirt-views.png`: transparent four-view blank T-shirt atlas, approximately 897 KB. Illustrative imagery, not a supplier-verified garment photograph.

Background prompt specification: reconstruct only the empty architectural background from the supplied studio reference. Remove all UI, garment, floating artwork, labels, text, orbit lines and people. Preserve the dark charcoal industrial space, concrete floor, tall shadowed structural walls, warm side-lit floor patch, deep shadows and cinematic camera angle. Produce a seamless-looking clean photographic backdrop for a clothing design interface, with no text or objects in the central garment area.

T-shirt prompt specification: a single square transparent 2 × 2 sprite atlas containing the same blank ivory heavyweight oversized cotton T-shirt on an invisible ghost mannequin. Top left straight front; top right straight back; bottom left true left profile facing left; bottom right true right profile facing right. Equal square quadrants, one centred complete shirt per quadrant, consistent vertical scale and generous clear margins. Dense soft cotton, realistic folds, ribbed crew neck, dropped short sleeves, neutral soft upper-left studio light. White/light grey fabric suitable for recolouring. No logos, designs, text, tags, borders, labels, floor shadows or background. Genuine alpha transparency.

The generated atlas has a verified alpha channel. Artwork is rendered separately from the garment image so the design remains editable.

Archivo, Inter and Caveat are self-hosted from `public/fonts/` to prevent development builds falling back to system fonts when Google Fonts cannot be reached. The typeface choices remain unchanged.

## Validation

- `npm run test:studio`: 14 regression tests for document state, gesture undo/redo, side transfers, locks, product changes, safe variant selection, draft round-trips and storage failure handling.
- `npm run typecheck` and production compilation pass. The project has a pre-existing missing-ESLint warning; lint validation is not claimed.
- Browser checks: desktop/mobile layout, text edits, undo/redo, separate side content, custom garment colour, drawing, drag and single-step undo, draft save/reload, four-view review, and JSON download. The downloaded file was inspected and contains the versioned concept document and all tested layers.
- No claim of measured frame rate, retention impact or manufacturing readiness.

## Limitations before a commercial launch

- Verify actual blank garments, printable zones, colours, fit, size charts and physical dimensions with production partners.
- Preserve original uploads server-side with ownership checks, file scanning, storage policy and resolution checks before production export.
- Implement authenticated saved-design sync, multi-design library, print-ready exports, server-side pricing and payment verification.
- Add verified real garment photography for every catalogue category; non-T-shirt models currently use conceptual silhouette templates.
- Downloaded design data is not a print file, and colour appearance on screens is not a colour proof.
