# OWNIT — Clean Development Package

This archive contains the clean OWNIT source tree without `node_modules`, `.next`,
Git metadata, dev logs, build caches, or performance-pass notes.

## Setup

Open a terminal in this folder:

```powershell
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

Then open:

`http://localhost:3000`

## Environment

Create a `.env` file from `.env.example` for local development.

At minimum:

```env
DATABASE_URL="file:./dev.db"
```

Keep real API/payment secrets out of the repository and never commit them.

## Production

```powershell
npm run build
npm start
```

## Structure

- `src/` — application code
- `prisma/` — database schema and seed
- `public/` — static assets
- `scripts/` — project scripts
- `package.json` — dependencies and commands
- `next.config.ts` — Next.js configuration
- `tsconfig.json` — TypeScript configuration

The Studio remains 2D-only in this clean package, with the Front/Back/Left/Right workflow.
