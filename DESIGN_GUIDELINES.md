# OWNIT design direction

User-approved priorities for future work: an international premium clothing-brand feel, glass-inspired controls, refined glow feedback, and exceptionally smooth interaction. These are design targets, not measured retention or performance claims.

## Identity

- Use the supplied `public/img/brand/OWNIT_logo.png`, not a typeset replacement. The Logo component crops its transparent margins with CSS and preserves the artwork.
- Charcoal foundations, warm ivory type, restrained sage accents. Archivo for campaign headlines, Inter for interfaces, Caveat only for occasional editorial annotations.
- Bold campaign art, generous negative space, clear hierarchy, and consistent rounded corners. Avoid filling every surface with glass or ornament.
- Reuse the supplied hero, architectural background, and footer artwork. Optimised WebP copies are available. Current catalogue/gallery illustrations are seed assets; replace them with approved photography before a public brand launch.

## Motion and performance

- Keep backgrounds static. The user explicitly rejected scroll-reactive light and continuous background animation because of slowness.
- Content must be visible on the initial server render. Do not hide landing sections behind hydration, intersection observers, timers, or entrance sequences.
- Limit glass blur to small chrome surfaces. Use gradients and thin illuminated borders elsewhere.
- Hover feedback: short opacity/transform transitions, soft ivory glow, no perpetual animation or pointer-tracking light. Respect reduced-motion and touch input.
- Reserve image dimensions, prioritise the hero, lazy-load below-the-fold imagery. Do not introduce a 3D bundle on the homepage.
- Verify in production mode as well as checking types; development compilation is not representative of production speed. Do not claim a frame rate, Lighthouse score, conversion increase, or retention improvement without measurements.

## Interaction and returning visitors

- A clear primary path: choose a product → customise → preview → save or order.
- Promote useful return paths: saved designs and inspiration. Never fabricate activity, popularity, stock pressure, reviews, or community counts.
- Real links, accurate feature claims, readable labels, visible keyboard focus, comfortable touch targets, and understandable empty/loading/error states.
- Search must cancel stale requests, support Escape, trap focus while modal, restore focus when closed, and provide an explicit close control.
- Preserve working shopping/account flows when changing visuals. Match new screens to this system without blindly applying landing-page styling to the studio.

## Current implementation

- Campaign page: `src/app/(site)/page.tsx`
- Scoped brand styles: `src/app/brand.css`
- Shared controls: `src/components/ui.tsx`
- Navigation and search: `src/components/navbar.tsx`
- Logo and footer: `src/components/logo.tsx`, `src/components/footer.tsx`
- Pre-refinement source copies: `backups/ui-before-glass-refinement/` (not a full-project backup).

## Studio direction

- Reference: the supplied `OWNIT_StudioPage.png`; a dark photographic workspace, quiet glass panels, a large garment canvas, and clearly grouped contextual controls.
- Four independent 2D views: front, back, left, right. Keep creative placement and custom colour unrestricted; the mockup clips artwork to the garment silhouette, not an approved rectangular print zone.
- Creative freedom is not a manufacturing guarantee. Until production is set up, describe designs as concepts, show base garment prices separately from unconfirmed print pricing, and save/review rather than offer a misleading checkout.
- No 3D or AR claims for this 2D workspace. Alternative garment illustrations are conceptual templates, not verified supplier blanks.
- Save structured, versioned design data (including every view and transform). Local drafts are device/browser-specific; downloads are editable concept data, not print-ready production artwork.
- Use a static, optimised studio background, bounded upload editing copies, and no continuously running render loop. Keep original high-resolution uploads for a later production-file workflow.
- Rebuild source copies: `backups/studio-before-rebuild/`; asset provenance and validation notes: `STUDIO_IMPLEMENTATION.md`.
