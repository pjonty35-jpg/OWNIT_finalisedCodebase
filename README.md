# OWNIT — Design It. Own It. Wear It.

A production-ready full-stack custom apparel platform: customers design artwork in a browser studio, preview it on interactive 3D garments, check out with a provider-abstracted payment flow, and OWNIT manufactures and ships one-of-one pieces. Includes a full admin/production dashboard.

## Stack

- **Next.js 15** (App Router, TypeScript strict) + **Tailwind CSS v4** (token-based dark editorial design system)
- **Prisma + SQLite** for local dev (schema is Postgres-compatible; swap the datasource to move to Postgres/Supabase)
- **React Three Fiber + Drei + Three.js** — parametric 3D garments, lazy-loaded with WebGL/static fallback
- **Zod** validation everywhere data enters the server, **bcrypt** password hashing, httpOnly session cookies
- **Zustand-free** editor state (custom hooks) — no extra deps beyond what's needed

## Quick start

```bash
npm install
npx prisma db push        # create dev.db
npm run db:seed           # catalog, creators, designs, orders, FAQs, journal
node scripts/gen-images.mjs   # placeholder product/design art into public/img
npm run dev               # http://localhost:3000
```

> If port 3000 is busy, Next picks another port — the URL is printed in the console.

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Customer | `jonty@ownit.test` | `ownit123` |
| Admin | `admin@ownit.test` | `ownit-admin-1` |

(All seeded creators share `ownit123`.)

## What actually works (end-to-end tested)

1. **Auth** — register, password sign-in, magic-link request + verify (console email provider prints the link), sign out, session restore.
2. **Design studio** (`/create`) — product/colour/size pickers, add text (font/size/colour/alignment), upload artwork (validated: type, size, low-res warning), draw freehand, shapes, stickers, templates, layers (reorder/hide/select), duplicate/delete, undo/redo (Ctrl+Z / Ctrl+Shift+Z, Delete), 2D precision mode and 3D preview with drag-rotate/zoom, front/back/left/right angles, autosave-able design name, Save (creates versioned design records), Share (copies link), Add to Cart.
3. **Design persistence** — structured JSON element model + per-save `DesignVersion` history; previews rendered client-side to data-URLs.
4. **Cart** — server-authoritative pricing (variant price + per-side customisation fee), quantity/merge rules, save-for-later, promo codes (`FIRSTOWN`, `CAMPUS100` seeded).
5. **Checkout** — 5-step flow, address save, shipping methods, server-side re-pricing on submit, order created as `pending_payment`.
6. **Payments** — provider abstraction (`PAYMENT_PROVIDER=mock|razorpay|stripe`). Mock gateway signs its confirmations with HMAC (dev-only challenge endpoint); Razorpay and Stripe implementations are real code paths activated by env credentials. Webhook endpoint verifies provider signatures over the raw body. The order only becomes `paid` after signature-verified confirmation — never from a frontend callback alone.
7. **Orders** — confirmation page with event timeline, shipment/tracking display, account order history.
8. **Account** — overview stats, designs grid (edit/duplicate/delete), orders, wishlist, addresses, notifications, profile settings, OWNIT points ledger.
9. **Inspiration** — category-filtered feed, featured/trending/community sections, detail page with like (persisted), save, and **Remix This** (copies the design into your studio with attribution tracked via `remixOfId`).
10. **Admin** (`/admin`, role-gated) — dashboard metrics, order management (status/payment/tracking with audit log + customer notifications), production kanban (queued → in_production → quality_check → packed → shipped), product inventory table, designs browser with **production artwork export** (client-rendered PNG at each product's configured print-area resolution), customers table.

## Security model

- All prices/totals computed server-side from catalog data; client-sent amounts are ignored.
- Role checks on every admin API (`requireAdmin`), ownership checks on designs/cart/orders.
- Uploads: magic-byte MIME sniffing (never trust declared MIME/filename), size caps, sanitized storage keys, private `.uploads/` served through a validating file API.
- Rate limiting on auth, uploads, checkout, contact. Zod schemas bound every payload (element counts, string lengths, numeric ranges).
- Sessions: hashed tokens in httpOnly/sameSite cookies. Admin role gate in `(admin)` layout + APIs.
- Payment state transitions only via verified provider responses or signed webhooks.

## Production notes

- Switch `prisma/schema.prisma` datasource to `postgresql`, set `DATABASE_URL`, `npx prisma db push`.
- Set `PAYMENT_PROVIDER=razorpay` + `RZP_KEY_ID`/`RZP_KEY_SECRET` (or Stripe) and `PAYMENT_WEBHOOK_SECRET`; point the provider dashboard at `/api/payments/webhook`.
- Set `EMAIL_PROVIDER=resend` + `RESEND_API_KEY` for transactional email.
- Replace the `local` storage provider in `src/lib/storage.ts` with S3/R2/Supabase Storage (interface is one file).
- The mock payment gateway and its challenge endpoint hard-return 404 unless `PAYMENT_PROVIDER=mock`.

## Environment

Copy `.env.example` → `.env`. Everything sensitive is env-driven; nothing secret ships to the client bundle.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run typecheck` | Strict TS check |
| `npm run db:push` | Sync Prisma schema |
| `npm run db:seed` | Reseed demo data |
| `node scripts/gen-images.mjs` | Regenerate placeholder art |
