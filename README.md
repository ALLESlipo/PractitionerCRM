# PractitionerCRM — Gut Health Practitioner Platform

Platform for gut health practitioners working with Mimatest kits. Built to the specs
`gut_platform_software_flows_v0.2.pdf` and `schema_v0.2.sql`.

| Flow | Status |
| --- | --- |
| A. Practitioner onboarding (sign up, credentials, admin review, verification) | Done |
| C. Client management (create with kit, view, edit, archive/restore, extra kits) | Done |
| D. Mimatest report, food guide and secure email | Next |
| B. Professional profile and public page | Planned |
| E. Chatbot over results and knowledge base | Planned |

## Stack

- Next.js 16 (App Router, Server Actions, Cache Components) + TypeScript + Tailwind CSS 4
- PostgreSQL 17 with pgvector (Docker), via Prisma 7 and `@prisma/adapter-pg`

## Getting started

Requires Node 24 and Docker.

```bash
npm install                 # also generates the Prisma client
cp .env.example .env        # then set the database password and the two keys (see comments)
npm run db:up               # start PostgreSQL on localhost:5433
npm run db:migrate          # create the tables
npm run admin:create -- admin@example.com "Admin Name"   # first admin account
npm run dev                 # http://localhost:3000
```

Practitioners sign up at `/signup`, upload credentials, and are verified by an admin at `/admin`.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` / `lint` | Usual Next.js commands |
| `npm run db:up` | Start the PostgreSQL container |
| `npm run db:migrate` | Apply schema changes (`prisma migrate dev`) |
| `npm run db:studio` | Browse data in Prisma Studio (client fields show as encrypted bytes) |
| `npm run admin:create -- <email> "<name>"` | Create or promote an admin |

## Differences from schema v0.2

- `practitioners.role` (`practitioner` / `admin`): admins are practitioners with the admin role.
- `result_flag` has the report's five levels: `low`, `below_optimal`, `optimal`, `above_optimal`, `high`.
- New `sessions` table for logins (token stored as SHA-256 hash).
- `practitioner_credentials.reviewed_by` records which admin reviewed a file.
- The pgvector HNSW index on `knowledge_chunks` is added together with flow E.

## Security notes

- Client personal fields and kit access codes are encrypted with AES-256-GCM (`src/lib/crypto.ts`).
  The key is `CLIENT_DATA_KEY` in `.env`; **if it's lost, client data can't be recovered**, so back it up
  separately from the database.
- Every client query is scoped to the logged-in practitioner on the server (`src/lib/clients.ts`).
- Uploaded files live in `storage/` (git-ignored, never public) and are served only after an access check.
- Emails are written to `storage/outbox/` until an email provider is chosen.
- Rate limiting is in-memory, which is fine for one local process.
