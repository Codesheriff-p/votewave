# VoteWave — Next.js Student Voting System

A full-stack school election platform built with Next.js 16, JWT auth, and a file-based database.

## Stack
- **Frontend**: Next.js 16 App Router, React 19
- **Backend**: Next.js API Routes
- **Auth**: JWT via `jose` + bcrypt password hashing
- **Database**: JSON file (swap `lib/db.js` for Prisma + PostgreSQL in production)
- **Icons**: lucide-react

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Default Admin Password
`admin123` — change this in `/app/admin/page.js` for production.

## Upgrade to PostgreSQL
1. `npm install prisma @prisma/client`
2. Replace `lib/db.js` with Prisma queries
3. Update `DATABASE_URL` in `.env.local`

## Project Structure
```
app/
  auth/page.js        ← Registration & Login
  dashboard/page.js   ← Voter Dashboard
  vote/[id]/page.js   ← Ballot Page
  results/[id]/page.js← Results Charts
  admin/page.js       ← Admin Panel
  api/
    auth/             ← register, login, logout, me
    elections/        ← CRUD + results
    vote/             ← cast vote
    admin/voters/     ← manage students
lib/
  db.js               ← Database layer (JSON file)
  auth.js             ← JWT + bcrypt utilities
middleware.js         ← Route protection
```
