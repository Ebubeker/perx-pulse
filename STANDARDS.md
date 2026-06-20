# Engineering Standards — Perx Pulse

> The judges are TeamSystem engineers who **open the repo**. This file is our contract:
> modern, idiomatic, zero deprecated patterns. Verified against official docs (June 2026).
> **✅ applied · ◻️ to-do · 📌 decision**

---

## Next.js 16 (App Router)

- ✅ **`proxy.ts`, not `middleware.ts`.** Next 16 renamed the convention; `middleware.ts` is deprecated. We use `src/proxy.ts` with Clerk's default-exported `clerkMiddleware()`. ([proxy](https://nextjs.org/docs/app/api-reference/file-conventions/proxy) · [why](https://nextjs.org/docs/messages/middleware-to-proxy))
- ✅ **`turbopack.root` pinned** in `next.config.ts` → kills the multi-lockfile workspace warning. Turbopack is the default bundler — **no `--turbopack` flag** in scripts. ([turbopack](https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack))
- ✅ **`viewport`/`themeColor` are a separate `export const viewport: Viewport`** — never keys on `metadata`. `metadataBase` set in the root layout. ([generateViewport](https://nextjs.org/docs/app/api-reference/functions/generate-viewport))
- ◻️ **`params`/`searchParams` are `Promise`s — always `await`.** No sync access (removed in 16). Type pages/handlers with generated `PageProps<'…'>` / `RouteContext<'…'>` (run `npx next typegen`). ([v16 upgrade](https://nextjs.org/docs/app/guides/upgrading/version-16))
- ◻️ **Co-locate `loading.tsx` / `error.tsx` / `not-found.tsx`** per segment for streaming + graceful errors. Parallel-route slots **must** have `default.tsx` (build fails otherwise).
- 📌 **Caching: leave dynamic by default.** Don't sprinkle `force-dynamic`. If we want caching later, opt in with `cacheComponents: true` + `'use cache'` + `cacheTag`/`cacheLife` (stable, no `unstable_` prefix; `revalidateTag(tag, profile)` needs the 2nd arg). ([use cache](https://nextjs.org/docs/app/api-reference/directives/use-cache))
- **Avoid (reviewer red flags):** `middleware.ts`, `experimental.dynamicIO/ppr/turbo`, `unstable_cacheLife`, sync params, `themeColor` in `metadata`, `images.domains` (use `remotePatterns`), `next lint`, custom `webpack` config (build fails without `--webpack`).

## React 19

- ✅ **Server Components by default.** `"use client"` only on the smallest interactive leaf (buttons/forms/toggles), never on a page/layout that doesn't need it.
- ◻️ **Forms call server actions directly** (`<form action={fn}>`). For pending/error UI use `useActionState` (not the old `useFormState`) + `useFormStatus` (from `react-dom`) in a child. Return errors as state; don't throw. ([useActionState](https://react.dev/reference/react/useActionState))
- ◻️ **`ref` is a plain prop — no `forwardRef`.** It's deprecated in 19. ([ref as prop](https://react.dev/blog/2024/12/05/react-19))
- ◻️ **`cache()`** for shared server loaders (user/session) to de-dupe within a request. **`use()`** + `<Suspense>` to stream slow data. **`useOptimistic`** for instant feedback.
- ◻️ **Context as provider:** `<Ctx value={…}>`, not `<Ctx.Provider>`.
- **Avoid:** `forwardRef`, `propTypes`, `defaultProps` on functions, string refs, `ReactDOM.render`/`findDOMNode`, `useFormState`.

## Clerk (auth)

- ✅ **`clerkMiddleware()` + `createRouteMatcher`** in `proxy.ts`; `await auth.protect()`. No `authMiddleware` (removed). Matcher includes `/__clerk/(.*)`.
- ✅ **Everything async:** `await auth()`, `await currentUser()`, `await clerkClient()`.
- ✅ **Typed metadata globally** (`src/types/globals.d.ts` → `Roles`, `UserPublicMetadata`, `CustomJwtSessionClaims`) — **no `as` casts.** Custom-metadata roles are the canonical pattern for our (non-Organization) B2C roles; compare `metadata.role` directly — **don't** use `has({ role })` (that's Organizations only). ([RBAC](https://clerk.com/docs/guides/secure/basic-rbac))
- ✅ **Redirect env uses current names:** `…_SIGN_IN_FALLBACK_REDIRECT_URL`, `…_SIGN_UP_FORCE_REDIRECT_URL` (not the deprecated `afterSignInUrl`).
- 📌 **Role reads via `currentUser()`** (always fresh) to avoid the ~60s session-token staleness loop after `updateUserMetadata`. **Scale path:** add the `{"metadata":"{{user.public_metadata}}"}` claim in the Clerk Dashboard → read `sessionClaims.metadata` in `proxy.ts` (no API call) + call `user.reload()` after the write. ([onboarding guide](https://clerk.com/docs/guides/development/add-onboarding-flow))
- ✅ **Server actions re-auth internally** (`completeOnboarding` calls `auth()` before writing).

## Prisma + PostgreSQL  *(when the data layer lands)*

- ✅ **Prisma v6, deliberately + consistently** (`prisma-client-js` generator + `binaryTargets = ["native","debian-openssl-3.0.x"]` for the Coolify/Debian deploy + `globalThis` singleton + package.json seed). Chosen over v7 for stability — v7's mandatory ESM + `@prisma/adapter-pg` + `prisma.config.ts` setup isn't worth the mid-hackathon risk, and the standards research confirmed **v6-consistent is fine; the reviewer flag is inconsistency, not the version**. The app is isolated in its own Postgres **`perx` schema** (`?schema=perx`) so it never touches the old scrapped tables in `public`. ([singleton](https://www.prisma.io/docs/orm/more/troubleshooting/nextjs))
- **Singleton** via `globalForPrisma` (never `new PrismaClient()` per request). `"postinstall": "prisma generate"`.
- **Migrations:** `migrate dev` local only; **`migrate deploy`** in CI/prod. Seed explicitly (`prisma db seed`).
- **Query discipline:** `@@index` on FK/filter/sort cols; `select` over `include`; nested reads (no N+1); interactive `$transaction` for read-modify-write with an atomic guard. Push DB logic into a `server-only` DAL; return narrow DTOs, never raw rows.

## TypeScript

- ✅ **`strict` + `noUncheckedIndexedAccess` + `noImplicitOverride` + `noFallthroughCasesInSwitch`.** `moduleResolution: bundler`, `@/*` path alias. ([tsconfig](https://www.typescriptlang.org/tsconfig/))
- No `any` without a written reason; prefer `unknown` + narrowing. Types from Prisma/Clerk, not hand-rolled.

## ESLint / Prettier · Tailwind v4

- ✅ **Flat config** (`eslint.config.mjs`, ESLint 9) via `eslint-config-next` — bundles `jsx-a11y`, react-hooks, core-web-vitals. Run `eslint`, **not `next lint`** (removed in 16).
- ◻️ Add `eslint-config-prettier` (last in the array) + Prettier as the formatter; optional `lint-staged` + Husky pre-commit.
- ✅ **Tailwind v4 CSS-first:** `@import "tailwindcss"` + `@theme` tokens in `globals.css`. **No `tailwind.config.js`, no `@tailwind` directives** (v3-era). ([v4](https://tailwindcss.com/blog/tailwindcss-v4))

## Environment & Security

- ✅ **Secrets server-only.** Only `NEXT_PUBLIC_*` reach the browser. `.env*` gitignored; **`.env.example` committed** (no secrets).
- ✅ **Baseline security headers** in `next.config.ts` (`X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, HSTS). ◻️ Full nonce-based CSP is a follow-up. ([CSP](https://nextjs.org/docs/app/guides/content-security-policy))
- ◻️ **Validated env** with `@t3-oss/env-nextjs` + Zod once env usage grows (build fails on missing/bad vars; structurally blocks reading server secrets on the client). ([t3-env](https://env.t3.gg/docs/nextjs))
- **Server actions are public POST endpoints:** re-auth + ownership check (prevent IDOR) + validate every arg (Zod) + return only what the UI needs. ([data security](https://nextjs.org/blog/security-nextjs-server-components-actions))

## Accessibility

- ◻️ Semantic HTML (`<button>`/`<nav>`/`<main>`/`<h1>`), labelled inputs (`htmlFor`/`aria-label`), visible focus rings, WCAG AA contrast (4.5:1), `alt` on all images, unique page `<title>`, respect `prefers-reduced-motion`. `<html lang="en">` ✅. `jsx-a11y` lint is the automated floor. ([a11y](https://nextjs.org/docs/architecture/accessibility))

## Repo hygiene

- ✅ `.env` gitignored + `.env.example`; ✅ README with 3-command setup; ✅ this STANDARDS.md.
- ◻️ **Conventional commits** (`feat:`/`fix:`/`chore:`/`docs:`). ◻️ A green CI workflow (`tsc --noEmit`, `eslint .`, `prettier --check`, `next build`) on PRs reads as "this team ships clean."

---

### Pre-submission grep (easy reviewer dings to catch)
`forwardRef` · `propTypes` · `defaultProps =` · `useFormState` · `<.*\.Provider` · `middleware.ts` · `themeColor:` inside metadata · `params\.` without `await` · `as any` · `process.env` outside the DAL/config · `tailwind.config` · `next lint`.
