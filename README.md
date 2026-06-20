# Perx Pulse

An AI-run, two-sided employee-benefits marketplace — built for Albania, ready for the world.
JunctionX Tirana 2026 · TeamSystem "Perx" challenge · Team Status 200.

## Stack

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript** (strict)
- **Clerk** — authentication & role metadata
- **Tailwind CSS v4** (CSS-first `@theme`)
- **Prisma + PostgreSQL** *(data layer — added with the first real feature)*
- **Gemini** (`@google/genai`) — server-side AI
- **Lemon Squeezy** (test) — employer subscription billing
- Deployed on **Coolify**

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (flat config) |

## Conventions

Engineering standards this repo follows are documented in **[STANDARDS.md](./STANDARDS.md)** —
read it before contributing. TL;DR: Server Components by default, server actions re-auth
internally, typed Clerk metadata (no casts), no deprecated Next/React patterns, secrets
never leave the server.

## Auth & roles

Sign up → onboarding picks a role (`employee` / `employer` / `provider`), stored in Clerk
`publicMetadata`. `/dashboard` routes to the role's dashboard; `proxy.ts` protects
`/dashboard` and `/onboarding`.
