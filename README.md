# Eaze Wellness Buddy Document Upload Tool

A standalone Next.js internal tool to collect ID proofs from wellness buddies via a simple, mobile-friendly upload page.

## Features Built
- Next.js 14, TailwindCSS styling simulating Eaze brand
- SQLite with PrismaORM schema per PRD requirements
- Mock seeded Session-based Authentication (`tc1`, `tc2`, `om1` Users)
- Telecaller Dashboard: Can create, view and copy link for their own document requests
- Operations Manager Dashboard: Can view team's requests, and securely preview uploaded files
- File Access restrictions: Files saved outside `public` and only accessible via OM session endpoint `GET /api/upload`
- Link expiry: Expired implicitly after 96 hours (or handled asynchronously during fetch requests if passed limit)
- Fresh Link logic (Replacement uploads delete local old files gracefully)

## How to run locally
Because this project does not have `node_modules` generated yet, you will need to:
1. Make sure Node.js is installed
2. Run `npm install`
3. Run `npm run postinstall` (to generate Prisma Client)
4. Run `npx prisma db push` to initialize the SQLite database
5. Run `npx tsx prisma/seed.ts` (or `npx ts-node`) to seed development user accounts
6. Run `npm run dev` to start locally
