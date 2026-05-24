# Ezras Nashim — Systems Audit

**Date:** 2026-05-24
**Branch:** `claude/lucid-allen-fZbML`
**Auditor:** Senior code review pass
**Scope:** Type safety, security, performance, architecture, reliability, PWA/mobile, Supabase/DB, dead code
**Stack reviewed:** React 18 + Vite (PWA) frontend, Express 4 backend, Drizzle ORM on PostgreSQL via Supabase, Supabase Auth, Stripe payments, AWS S3 storage. *Not* Expo/React Native — this is a web app wrapped for store distribution.

**Repo size at audit:** ~62K LOC across ~200 TS/TSX files; `server/routes.ts` 4,333 lines; `server/storage.ts` 3,881 lines; `client/src/components/modals/tefilla-modals.tsx` 5,138 lines; `shared/schema.ts` 1,102 lines.

---

## Executive Summary — Top 5 Risks

1. **Supabase RLS is effectively off across the entire database.** Of 33 tables in `server/supabase/migrations/20251015141352_remote_schema.sql`, only 2 have RLS enabled (`Meditations`, `brochas`) and **zero `CREATE POLICY` statements exist anywhere**. Anyone holding the anon key (which is committed to the repo — see #2) can read/write any user's gratitude entries, push subscriptions, donations, mitzvah completions, and analytics.
2. **Live secrets are committed to git.** `.env.staging.remote` and `.env.replit` are tracked, containing the production Supabase anon JWT (same in both), a live Stripe public key, and the raw backend IP `18.193.108.87`. `.gitignore` only excludes generic `.env`, not `.env.*` patterns.
3. **Open redirect + missing amount validation in Stripe checkout.** `server/routes.ts:2690-2706` reads `req.body.returnUrl` and passes it straight to Stripe `return_url`, and `req.body.amount` is `parseFloat`'d into `unit_amount_decimal` with no bounds. Donors can be redirected to phishing pages after payment; negative/extreme amounts are accepted.
4. **9 high + 16 moderate npm vulnerabilities, dominated by axios.** `axios@^1.10.0` is affected by ~10 CVEs including SSRF (CWE-918), prototype-pollution-driven auth bypass, CRLF injection, and DoS. Fix: bump to `1.15.2+`. Also undici, ws, yaml have moderate issues. Run `npm audit fix`.
5. **No production observability.** No Sentry/Bugsnag, no structured logging (67+ raw `console.error` calls in server), no APM. With hundreds of DAU, regressions and active exploitation would be invisible. ErrorBoundary is wired but doesn't cover lazy-loaded routes or the huge modal components.

---

## Critical Issues — fix before next release

### C-1. Supabase Row-Level Security is missing on 31 of 33 tables
- **Severity:** Critical
- **Category:** Security / Supabase
- **Location:** `server/supabase/migrations/20251015141352_remote_schema.sql` (verified: `grep -c "ENABLE ROW LEVEL SECURITY"` → 2 hits; `CREATE POLICY` → 0 hits; `^CREATE TABLE` → 33 hits)
- **Why it matters:** The committed anon key (see C-2) plus `GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated` means any visitor can read or modify rows in `donations`, `gratitude_journal`, `push_subscriptions`, `analytics_events`, `mitzvah_completions`, `tehillim_names`, `acts`, `nishmas_challenges`, `daily_stats`, etc. The two tables that *do* have RLS enabled have no policies, which under default-deny means they're inaccessible — but the other 31 are wide open. Even tables you don't read from the client directly are reachable from any browser anyone owns.
- **Recommended fix:**
  1. Enable RLS on every table: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
  2. For user-scoped tables (`gratitude_journal`, `mitzvah_completions`, `nishmas_challenges`, `push_subscriptions`, `tehillim_chains`), write `USING (auth.uid()::text = user_id)` policies for SELECT/UPDATE/DELETE and matching `WITH CHECK` for INSERT.
  3. For server-only tables (`donations`, `analytics_events`, `daily_stats`), grant only the service role — these should never be reached from the anon client.
  4. For public content (Tehillim text, prayers, recipes, sponsors), allow `SELECT` to `anon` only.
  5. Audit Supabase logs for unauthorized reads since launch.
- **Effort:** L (1–2 days to write and review policies for 33 tables, then a careful staged rollout)

### C-2. Live secrets committed to the repository
- **Severity:** Critical
- **Category:** Security
- **Location:** `.env.staging.remote`, `.env.replit`, `.gitignore`
- **Why it matters:** Both files are tracked. They expose:
  - `VITE_SUPABASE_ANON_KEY` — production anon JWT, identical in both files (decodes to project `jmimavnryovxveyxqxco`)
  - `VITE_STRIPE_PUBLIC_KEY=pk_live_z2A68FnHtTevkkES3i5pZUmM` — the live Stripe publishable key, identifying the Stripe account for fraud / social engineering
  - `VITE_API_URL=http://18.193.108.87` — bare EU-Frankfurt IP, allows attackers to bypass DNS-level protections and probe directly
  - Plus `DATABASE_URL` placeholder pointing at the real `supabase.co` host
- **Recommended fix:** (1) `git rm --cached .env.replit .env.staging.remote`, (2) add `.env*` (with `!` exceptions for any example files) to `.gitignore`, (3) purge from history with `git filter-repo`, (4) rotate the Supabase anon key, (5) move secrets to deployment env-vars (already used at runtime — these files appear to be local-dev defaults), (6) front the backend with DNS + Cloudflare (or equivalent) and reject non-CDN traffic.
- **Effort:** S (mechanical), but coordinating the key rotation with mobile-app clients is M.

### C-3. Open redirect in `/api/create-session-checkout`
- **Severity:** Critical
- **Category:** Security
- **Location:** `server/routes.ts:2689-2706` (verified: `const returnUrl = req.body.returnUrl;` is passed verbatim into `stripe.checkout.sessions.create({ return_url: returnUrl })`)
- **Why it matters:** After payment, Stripe redirects the user to `returnUrl`. An attacker can send a victim a donation link whose body includes `returnUrl: "https://attacker-fake-ezras-nashim.example"`. The donor pays the real Stripe checkout, then lands on a phishing page that asks for credentials or re-prompts another "donation." Trust transfer from a successful payment is high — this is a credible phish.
- **Recommended fix:** Validate `returnUrl` against an allowlist (e.g., `["ezrasnashim.app", "www.ezrasnashim.app"]`). If invalid or missing, default to the canonical success URL. Use `URL.hostname` parsing, not `startsWith`.
- **Effort:** XS

### C-4. Server-side donation amount is not validated
- **Severity:** Critical
- **Category:** Security
- **Location:** `server/routes.ts:2689,2697` (`Math.round(parseFloat(amount) * 100)`)
- **Why it matters:** `amount` from the client is parsed without checking it's a positive finite number, has a sensible upper bound, or is a number at all. `parseFloat("-5")` → -5 (Stripe rejects negative, but `parseFloat("1e10")` is 10 billion). Beyond Stripe's own validation, this enables creation of $0 checkouts as a low-effort DoS / fraud vector and writes garbage into your records.
- **Recommended fix:** Add a Zod schema at the top of the handler (`z.object({ amount: z.coerce.number().positive().lte(100000), returnUrl: z.string().url().optional(), donationType: z.string().max(50).optional(), metadata: z.record(z.string(), z.string().max(1000)).optional() })`) and `safeParse` before touching Stripe.
- **Effort:** XS

### C-5. `axios@^1.10.0` has multiple high/moderate CVEs including SSRF and prototype-pollution auth bypass
- **Severity:** Critical (dependency)
- **Category:** Security / Dependencies
- **Location:** `package.json:57`, `npm audit` output
- **Why it matters:** Verified `npm audit` flags 8+ separate axios advisories: SSRF via `NO_PROXY` bypass (CVSS 7.2, GHSA-pmwg-cvhr-8vh7), prototype-pollution auth bypass (GHSA-w9j2-pvgh-6h63), invisible JSON-response tampering (GHSA-3w6x-2g7m-8v23), CRLF injection in multipart (GHSA-445q-vr5w-6q77), unbounded recursion DoS (CVSS 7.5, GHSA-62hf-57xw-28j9), null-byte URL injection (GHSA-xhjh-pmcv-23jw). The server uses axios for outbound calls to Hebcal/Nominatim/Sefaria with cached responses — the response-tampering and SSRF vectors are directly reachable.
- **Recommended fix:** Bump axios to `^1.15.2` (latest patched). Run `npm audit fix` for the remaining 24 (also fixes `undici`, `ws`, `yaml`, drizzle-kit's bundled esbuild).
- **Effort:** XS

### C-6. JWT `ADMIN_JWT_SECRET` fallback / weak validation path
- **Severity:** High → Critical depending on env
- **Category:** Security / Auth
- **Location:** `server/auth.ts` (read by audit), `server/routes.ts:197` (admin middleware typed as `any`)
- **Why it matters:** Admin tokens (24h expiry) are minted from `ADMIN_JWT_SECRET`. If that env var is unset in any environment, the import path needs verifying — `isJwtConfigured()` is checked in some routes but the broader admin login surface assumes it's set. Combine with the `req: any, res: any, next: any` middleware signature in `routes.ts:197` and the lack of input length validation on admin-login password (`server/routes.ts:595-635`) and you have a fragile auth surface. **Action:** verify `ADMIN_JWT_SECRET` is required-at-boot (throw if missing in production) and that all admin routes use the typed middleware.
- **Recommended fix:** At startup in `server/index.ts`, validate required env vars with Zod and throw. Type the middleware as `(req: Request, res: Response, next: NextFunction) => void`. Cap password length at 200 chars before bcrypt to prevent CPU-DoS via huge inputs.
- **Effort:** S

---

## High Priority — fix this sprint

### H-1. Backend monoliths block testability and onboarding
- **Severity:** High
- **Category:** Architecture
- **Location:** `server/routes.ts` (4,333 lines, ~150 handlers + cache infra), `server/storage.ts` (3,881 lines, single `DatabaseStorage` class with hundreds of methods), `client/src/components/modals/tefilla-modals.tsx` (5,138 lines, 39 `useQuery`s, 26 raw `axios` calls)
- **Why it matters:** These files exceed the threshold where humans can reason about them. `routes.ts` already has companion files in `server/routes/*.ts` — the split was started but never finished. `tefilla-modals.tsx` blocks any meaningful refactor of the most-used flow in the app. Cognitive load + merge conflicts + bug surface scale with file size.
- **Recommended fix:** (1) Move every remaining handler in `routes.ts` into a domain file under `server/routes/`; leave `routes.ts` as the registrar. (2) Split `storage.ts` into per-domain repositories (`TehillimRepository`, `PrayerRepository`, `DonationRepository`, `AnalyticsRepository`, `NotificationRepository`, `UserRepository`) sharing a single `db` connection. (3) Split `tefilla-modals.tsx` by modal (`TehillimSelectionModal`, `TehillimReaderModal`, `TehillimCompletionModal`, etc.) and extract shared logic into hooks.
- **Effort:** L (multi-week, do incrementally — start with the biggest domain in storage.ts and one modal at a time)

### H-2. ~40 ad-hoc `axiosClient` calls bypass TanStack Query
- **Severity:** High
- **Category:** Performance / Architecture
- **Location:** 26 calls inside `client/src/components/modals/tefilla-modals.tsx` alone; also `gratitude-journal-bar.tsx:30-46`, `community-challenge-modal.tsx:102-146`, several other modals
- **Why it matters:** TanStack Query is configured (`client/src/lib/queryClient.ts`) with 15-minute stale time, dedup, retries, and persistence — but the giant modal components fire raw `axiosClient.get/post` in `useEffect` and event handlers. That bypasses cache (repeat fetches on re-mount), bypasses retry, and forces manual loading-state plumbing. With `replit.md` noting ~30–40 API calls per page load, fixing this could meaningfully shrink the network waterfall.
- **Recommended fix:** Convert each raw axios call to `useQuery`/`useMutation`. For mutations, invalidate the relevant query keys instead of manually re-fetching.
- **Effort:** M

### H-3. N+1 on `getLibrarySpeakers` and unbounded list endpoints
- **Severity:** High
- **Category:** Performance / DB
- **Location:** `server/storage.ts:1859-1900` (one query per speaker inside `Promise.all`), and unbounded selects in `getAllShopItems` and admin endpoints (`server/routes.ts:3921`)
- **Why it matters:** Library opens trigger ~20 DB round-trips. Admin list pages render every row in state even when only displaying 10–15. The DB and pg-pool will struggle once content grows.
- **Recommended fix:** Replace the per-speaker query with a single grouped query (`SELECT speaker, json_agg(...) FROM torah_classes GROUP BY speaker`). Add `LIMIT`/`OFFSET` (or keyset pagination) to all list endpoints serving > 50 rows.
- **Effort:** S

### H-4. Service worker serves stale prayer/Torah content indefinitely (cache-first, no TTL)
- **Severity:** High
- **Category:** PWA / Reliability
- **Location:** `client/public/sw.js:273-302` (cache-first for `/api/...prayers` and `/api/torah/...`)
- **Why it matters:** When admins update prayer text or Torah content, users on devices with a populated cache see the old version until cache eviction (kept across 2 versions per `sw.js:76-129`) or a manual hard reload. For a content-driven prayer app, this is a real correctness issue.
- **Recommended fix:** Switch prayer and Torah content to stale-while-revalidate (you already do this for "critical APIs" at `sw.js:357-389`). Or include a content version in the query string driven by the `/api/content-versions` endpoint that's already wired into the API surface.
- **Effort:** S

### H-5. `jsdom` in production dependencies
- **Severity:** High
- **Category:** Performance / Bundle
- **Location:** `package.json` (in `dependencies`, not `devDependencies`)
- **Why it matters:** `jsdom@28` is ~2.5 MB and exists for Node-side HTML parsing (used by `isomorphic-dompurify` on the server and by your vitest config). Vite will not bundle it into the client (no client code imports it directly) — but having it in `dependencies` means it's installed on the backend image and may be pulled in by `isomorphic-dompurify` on cold start. More importantly, you also ship both `dompurify` (used by the client) and `isomorphic-dompurify`. Pick one.
- **Recommended fix:** Move `jsdom` to `devDependencies` (it's a vitest/test concern). Consolidate on `isomorphic-dompurify` everywhere (it works in browsers) OR drop the isomorphic one and use `dompurify` on the client + an explicit jsdom wrapper on the server.
- **Effort:** S

### H-6. No crash reporting or structured logging in production
- **Severity:** High
- **Category:** Reliability / Observability
- **Location:** No Sentry/Bugsnag in `package.json`. `client/src/lib/logger.ts` exists but only gates `console` in dev; server-side has 67+ raw `console.error` calls (e.g., `server/routes/analytics.ts:32-34`, `server/routes/push.ts:124`)
- **Why it matters:** With hundreds of DAU on a PWA running on a long tail of devices, you cannot debug what you cannot see. Today, a regression in tefilla-modals or a Stripe edge case is invisible unless a user emails you. No way to detect mass data exfiltration if the RLS gap is exploited (#C-1).
- **Recommended fix:** Add Sentry on client (`@sentry/react`) and server (`@sentry/node`). Wire `ErrorBoundary` and Express's error middleware to `Sentry.captureException`. Replace `console.error` with `pino` (very small, JSON output) — pipe to your log aggregator.
- **Effort:** S to install/wire, M to refactor logging across the codebase

### H-7. `ErrorBoundary` doesn't wrap lazy routes or the heavy modals
- **Severity:** High
- **Category:** Reliability
- **Location:** `client/src/components/ui/error-boundary.tsx`, deployed only around home-page section components (`client/src/pages/home.tsx:133-164`)
- **Why it matters:** A `ChunkLoadError` while opening any lazy page (Donate, Profile, Admin, Settings, Login, Feed, etc.) white-screens the app — exactly the failure mode replit.md says is being worked around with cache clearing in `App.tsx`. The 5,000-line tefilla modal also lacks per-modal boundaries.
- **Recommended fix:** Wrap every `<Suspense>` around a lazy route in an `ErrorBoundary` with a friendly retry. Add narrower boundaries around the modals.
- **Effort:** S

### H-8. Test coverage is essentially zero on critical paths
- **Severity:** High
- **Category:** Reliability
- **Location:** `client/src/lib/__tests__/{sanitize,text-formatter,compass}.test.ts` are the only tests. No tests for auth, donation flow, completion tracking, or the Tehillim state machine.
- **Why it matters:** Without tests, every fix to the items above ships on hope. The completion-tracking flow (idempotency-keyed offline queue) is the kind of thing that silently rots.
- **Recommended fix:** Add vitest + RTL smoke tests for: (a) admin login validates correctly, (b) `create-session-checkout` rejects bad inputs, (c) the completion-tracking analytics flow handles offline → online sync without double-counting, (d) tehillim chain creation enforces ownership. Wire `npm run test` into CI.
- **Effort:** M for first batch (cover the 4 above), L for meaningful coverage.

### H-9. Push retry queue is unbounded
- **Severity:** High
- **Category:** Performance / Reliability
- **Location:** `server/pushRetryQueue.ts:25-37`
- **Why it matters:** If a campaign of push notifications hits a wave of failures (e.g., expired endpoints), the Map grows without bound. Multi-day failures = GB of RAM held in process memory and eventually OOM-killed ECS tasks.
- **Recommended fix:** Cap size (e.g., 10K) with LRU eviction. Add a `maxRetries` per entry and dead-letter to DB once exceeded so you can re-investigate.
- **Effort:** S

### H-10. CI/CD has no checks; tsc strict surfaces real errors but isn't gated
- **Severity:** High
- **Category:** Reliability / Process
- **Location:** `.github/workflows/deploy-frontend-to-s3.yml`, `.github/workflows/deploy-server.yml`
- **Why it matters:** I ran `npx tsc --noEmit` against your current branch — it surfaced two errors (`client/src/pages/auth-callback.tsx:57:50` "supabase is possibly null", `server/routes.ts:2593:27` unused `donationType`). Those slipped through to deployment. `vite build` doesn't fail on type errors. No lint, no tests in CI.
- **Recommended fix:** Add a `ci.yml` workflow that runs `npm run check` (already defined as `tsc`), `npm run test` (once H-8 has content), and (once added) `eslint`. Block PR merges on failure.
- **Effort:** XS for tsc gating; S for the rest.

### H-11. Foreign keys are missing on user-scoped tables
- **Severity:** High
- **Category:** Data integrity / Schema
- **Location:** `shared/schema.ts:1002` (`gratitudeJournal.userId`), `1038-1039` (`mitzvahCompletions.userId/deviceId`), `1056-1057` (`nishmasChallenges.userId/deviceId`), `524` (`acts.userId`)
- **Why it matters:** When a user account is deleted, orphan rows remain. Joins are slower because PG can't use FK assumptions. Combined with the no-RLS finding, orphan rows are unreachable noise.
- **Recommended fix:** Add `.references(() => profiles.id, { onDelete: "cascade" })` where appropriate. For `deviceId` columns there's no user table, but at least add indexes.
- **Effort:** M (requires data backfill for any orphans first)

### H-12. No env-var validation at boot (silent runtime failures)
- **Severity:** High
- **Category:** Reliability / Config
- **Location:** `client/env.d.ts` only declares `VITE_GA_MEASUREMENT_ID`; missing `VITE_API_URL`, `VITE_STRIPE_PUBLIC_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GOOGLE_MAPS_API_KEY`. Server uses `process.env.SUPABASE_URL || '' ` fallback patterns (`server/routes.ts:257-264`) that fail at first call instead of at boot.
- **Recommended fix:** Declare every `VITE_*` in `env.d.ts`. Add a `validateEnv()` call at the top of `client/src/main.tsx` and `server/index.ts` that throws (Zod or hand-rolled) when required vars are missing or look wrong (URL parses, JWT decodes).
- **Effort:** XS

---

## Medium Priority — fix this quarter

### M-1. Schema drift between Drizzle and Supabase migrations
- **Severity:** Medium
- **Category:** Architecture / DB
- **Location:** `shared/schema.ts` is the Drizzle source of truth (1102 lines); `server/supabase/migrations/` contains exactly one 2,180-line dump from 2025-10-15. There are no incremental migrations.
- **Why it matters:** `drizzle-kit push` (still in `package.json:db:push`) makes destructive schema changes against the live DB. Without versioned migrations, two engineers can't safely converge; and you'll never reproduce production schema in CI.
- **Recommended fix:** Move to `drizzle-kit generate` to produce versioned SQL migrations checked into the repo. Run them via `supabase db push` in CI. Remove `db:push` from `package.json` (or rename to `db:push:DANGEROUS:local-only`).
- **Effort:** M

### M-2. CSP is loose in development and `frameguard` is fully off
- **Severity:** Medium
- **Category:** Security
- **Location:** `server/index.ts:36-58`
- **Why it matters:** In dev the CSP allows `'unsafe-inline'` and `'unsafe-eval'`. If a staging build ever runs with `NODE_ENV !== 'production'`, XSS is trivial. `frameguard: false` is set explicitly to allow embedding for "mobile app wrappers" — but that means anyone can iframe the app for clickjacking (e.g., overlay a fake donation prompt). The native-wrapper use case can be served by `Content-Security-Policy: frame-ancestors 'self' <known-wrapper-origins>` instead.
- **Recommended fix:** Verify the deploy pipeline sets `NODE_ENV=production`. Replace `frameguard: false` with a CSP `frame-ancestors` allowlist tied to the actual native-wrapper origins.
- **Effort:** S

### M-3. `'unsafe-inline'` in `styleSrc` (production)
- **Severity:** Medium
- **Category:** Security
- **Location:** `server/index.ts:44`
- **Why it matters:** Tailwind plus inline-styled DOMPurify allowlist (`sanitize.ts:11-18` permits `style` attribute) means a sanitization bypass becomes CSS-based XSS in older browsers. Style allowlist is unnecessary for your content.
- **Recommended fix:** Remove `style` from DOMPurify's `ALLOWED_ATTR`. Move any inline styles to classes. Then drop `'unsafe-inline'` from `styleSrc` and use nonces.
- **Effort:** M

### M-4. CORS regex allows any `*.replit.dev/*.replit.app/*.repl.co`
- **Severity:** Medium
- **Category:** Security
- **Location:** `server/index.ts:193-200`
- **Why it matters:** Any other Replit user can host an attacker app on `evil.replit.dev` and make authenticated requests to your API from any signed-in user's browser. This is a CSRF vector even with cookies marked SameSite.
- **Recommended fix:** Allowlist the specific staging/dev subdomains you actually use. Wildcard them only behind a Vercel-style preview pattern you control.
- **Effort:** S

### M-5. `req.body`/`req.params` Express handlers typed as `any`
- **Severity:** Medium
- **Category:** Type Safety
- **Location:** `server/routes.ts:197` (`requireAdminAuth(req: any, res: any, next: any)`), pattern repeats; numerous routes do `parseInt(req.params.id)` with only `isNaN` guard (`server/routes.ts:1614, 2040, 2083, 2147, 2175, ...`)
- **Why it matters:** Loss of type inference across the auth surface; typos in `req.body.foo` go undetected; integer overflow/negative IDs reach storage.
- **Recommended fix:** Adopt a small wrapper helper: `validate(schema, "body" | "query" | "params")` that returns a typed `RequestHandler`. Use Zod `z.coerce.number().int().positive()` for IDs.
- **Effort:** M (large surface, but mechanical)

### M-6. Mixed `.parse` vs `.safeParse`; some routes throw raw ZodError
- **Severity:** Medium
- **Category:** Reliability / Type Safety
- **Location:** `server/routes.ts:1956, 2017, 2133, 2273, 2340` (use `.parse`, throw on failure); `657, 2557, 2589` (use `.safeParse`, graceful)
- **Why it matters:** `.parse` errors throw `ZodError`. Without a typed error handler (see C-2 / H-6), these become 500s with leaked stack traces.
- **Recommended fix:** Standardize on `.safeParse` + uniform 400 response shape, or add an Express error-middleware that knows about ZodError and renders 400.
- **Effort:** S

### M-7. `'as any'` casts after Zod validation
- **Severity:** Medium
- **Category:** Type Safety
- **Location:** `server/routes.ts:2051, 2152, 2289, 2356, 2484, 4197` — e.g., `storage.updateParshaVort(id, cleanedData as any)`
- **Why it matters:** Defeats the validation immediately. If the storage signature drifts, errors surface only at runtime.
- **Recommended fix:** Type `cleanedData` properly (Drizzle infers `typeof tableName.$inferInsert`). Remove the casts.
- **Effort:** S

### M-8. tsconfig is strict but missing some flags
- **Severity:** Medium
- **Category:** Type Safety
- **Location:** `tsconfig.json`
- **Why it matters:** Already strong (`strict`, `exactOptionalPropertyTypes`, `noImplicitReturns`). Missing: `noUncheckedIndexedAccess` (catches `arr[i]` assuming non-undefined), `noFallthroughCasesInSwitch`, `noImplicitOverride`, `forceConsistentCasingInFileNames`. `useUnknownInCatchVariables` is on by default with `strict` but worth setting explicitly.
- **Recommended fix:** Add all five flags. Expect ~20–50 new errors — fix in a single dedicated pass.
- **Effort:** S to flip, M to fix the resulting errors.

### M-9. `server/routes/mobile.ts` re-proxies via localhost HTTP
- **Severity:** Medium
- **Category:** Architecture / Performance
- **Location:** `server/routes/mobile.ts:43-85`
- **Why it matters:** Aliases like `/api/zmanim` are implemented by `serverAxiosClient.get("http://localhost:5000/api/...")` — an internal HTTP loop that doubles cost (serialization, request parsing, axios overhead, network stack) and hard-codes the port. If `PORT` changes or the app runs behind a non-localhost listener, these break silently.
- **Recommended fix:** Refactor the underlying handlers into reusable functions and call them directly. Keep `mobile.ts` as a thin parameter-translation layer.
- **Effort:** M

### M-10. `gemsOfGratitude`, `nishmasChallenges`, `mitzvahCompletions` jsonb without Zod shape
- **Severity:** Medium
- **Category:** Schema / Type Safety
- **Location:** `shared/schema.ts:180` (`push_notifications.data`), `295` (`donations.rawData`), `303` (`donations.metadata`), `509-510` (`analyticsEvents.eventData`), `542` (`dailyStats.modalCompletions`)
- **Why it matters:** jsonb columns can hold anything; reads need to be parsed defensively or you accumulate runtime KeyErrors over months.
- **Recommended fix:** Define a Zod schema per jsonb column in `shared/schema.ts` and parse at read time. Validate at write time too.
- **Effort:** M

### M-11. Acts table missing `userId` index
- **Severity:** Medium
- **Category:** Performance / DB
- **Location:** `shared/schema.ts:522-530`
- **Why it matters:** `acts` is queried per user for tzedaka history. With no index, every read becomes a sequential scan as the table grows.
- **Recommended fix:** Add `userIdIdx: index("acts_user_id_idx").on(table.userId)`.
- **Effort:** XS

### M-12. `mitzvah_completions` lacks compound `(deviceId, date)` index
- **Severity:** Medium
- **Category:** Performance / DB
- **Location:** `shared/schema.ts:1038-1047`
- **Why it matters:** Common query pattern is `WHERE (userId = ? OR deviceId = ?) AND date BETWEEN ...`. Separate single-column indexes can't be combined as efficiently as a compound index.
- **Recommended fix:** Add `dateDeviceIdx: index("mitzvah_completions_device_date_idx").on(table.deviceId, table.date)`.
- **Effort:** XS

### M-13. Unbounded image uploads (no client-side resize)
- **Severity:** Medium
- **Category:** Performance / UX
- **Location:** `client/src/components/InlineImageUploader.tsx`
- **Why it matters:** Phone-camera photos at 3–5 MB upload through Uppy → S3 directly. Slow on 4G, expensive on S3, and the bandwidth dent matters for an app whose target users are sometimes on tethered shul wifi.
- **Recommended fix:** Add Uppy's image-editor or a pre-upload `<canvas>` resize step that caps at ~1600px on the long edge and re-encodes as JPEG ~0.85.
- **Recommended fix:** Add Uppy's image-editor plugin or `compressor.js` pre-upload step.
- **Effort:** S

### M-14. SearchContext fetches 15+ queries on mount, regardless of usage
- **Severity:** Medium
- **Category:** Performance
- **Location:** `client/src/contexts/SearchContext.tsx:20-80`
- **Why it matters:** Every user pays the cost of building the search index, even those who never tap the search icon. Plus the context value isn't memoized (line 527) so all consumers re-render on each parent render.
- **Recommended fix:** (1) Wrap the context value in `useMemo`. (2) Build the search index lazily the first time the search modal is opened; show a brief "preparing search" state.
- **Effort:** S

### M-15. Apple-Care/`apiCache` Map can grow unboundedly under cardinality
- **Severity:** Medium
- **Category:** Performance
- **Location:** `server/routes.ts:46-76`
- **Why it matters:** Cleanup interval only removes expired entries. With per-user/per-date keys (e.g., zmanim cached per `(lat,lng,date)`), the cardinality explodes and steady-state memory grows.
- **Recommended fix:** Cap with a small LRU (`lru-cache` is already battle-tested) or evict-oldest when `size > 5000`.
- **Effort:** S

### M-16. `setInterval` in `fullscreen-modal.tsx` may leak
- **Severity:** Medium
- **Category:** Performance
- **Location:** `client/src/components/ui/fullscreen-modal.tsx:178`
- **Why it matters:** Interval set without an obvious `clearInterval` path under error. If users rapidly open/close modals, ghost intervals accumulate.
- **Recommended fix:** Store the handle and clear on unmount.
- **Effort:** XS

### M-17. Admin pages render full lists in state but show only top 10–15
- **Severity:** Medium
- **Category:** Performance / Architecture
- **Location:** `client/src/pages/admin.tsx:1593, 2353, 2426, 2575`
- **Why it matters:** State holds 100 items, UI renders 15; cost of mounting all of them is borne anyway.
- **Recommended fix:** Use TanStack Table or react-window once lists exceed 50 rows. Or paginate at the API.
- **Effort:** M

### M-18. `gratitude-history.tsx` lacks virtualization
- **Severity:** Medium
- **Category:** Performance
- **Location:** `client/src/pages/gratitude-history.tsx:139`
- **Why it matters:** Users with 200+ entries will see noticeable scroll jank on mid-range Android.
- **Recommended fix:** `@tanstack/react-virtual` is small and easy. Or paginate.
- **Effort:** S

### M-19. Push subscription cleanup never runs
- **Severity:** Medium
- **Category:** Reliability / DB
- **Location:** `shared/schema.ts:158-171` (table tracks `validationFailures`, `lastErrorCode`, `lastValidatedAt`, but no job acts on them)
- **Why it matters:** Stale subscriptions clog `web-push` send loops, slow notification fan-out, and eat memory.
- **Recommended fix:** Periodic cleanup job: delete or disable subscriptions with `validationFailures > 5` and `lastValidatedAt < now() - 30 days`.
- **Effort:** S

### M-20. `objectAcl.ts` ACL framework is half-implemented
- **Severity:** Medium
- **Category:** Security / Architecture
- **Location:** `server/objectAcl.ts:86-104` (switch with only a default branch that throws)
- **Why it matters:** Anything that calls `createObjectAccessGroup` falls through to the throw, meaning ACL checks effectively default to "deny" (good) or "skipped" (bad) depending on caller. Either commit to the framework or remove it.
- **Recommended fix:** Decide: if ACLs are needed, implement the access-group classes; otherwise rip out the abstraction so a future engineer doesn't think it's working.
- **Effort:** M

### M-21. SearchContext + home-summary fetch overlapping content with diverging stale times
- **Severity:** Medium
- **Category:** Performance / Reliability
- **Location:** `client/src/contexts/SearchContext.tsx:20-80` (Halacha 15min, Mincha prayers 12h, etc.)
- **Why it matters:** Admin updates prayers → users see stale text for up to 12 hours because the prayer endpoint has a 12-hour staleTime in TanStack Query AND the SW caches the same response cache-first.
- **Recommended fix:** Reduce prayer staleTime to ~1h and invalidate via `/api/content-versions` polling (or push) when admin changes content.
- **Effort:** S

### M-22. Loading/empty states inconsistent across pages
- **Severity:** Medium
- **Category:** Reliability / UX
- **Location:** Spot-check `client/src/pages/profile.tsx`, `client/src/pages/admin.tsx`
- **Why it matters:** Some pages assume data is present; on slow networks the user sees a partial page or a console error.
- **Recommended fix:** Establish a `<QueryStates>` wrapper (loading/error/empty/data) and use it consistently.
- **Effort:** M

### M-23. `passport`, `passport-local`, `openid-client`, `connect-pg-simple`, `express-session` are unused
- **Severity:** Medium
- **Category:** Dead code / Bundle
- **Location:** `package.json`
- **Why it matters:** ~500 KB of legacy session-auth dependencies installed on every backend deploy. Auth is now JWT + Supabase, none of these are imported.
- **Recommended fix:** Remove them after a final `grep -r` to confirm zero imports. (My audit found zero.)
- **Effort:** XS

### M-24. `attached_assets/` is 57 MB tracked in git
- **Severity:** Medium
- **Category:** Dead code / Repo hygiene
- **Location:** `attached_assets/`
- **Why it matters:** Inflates clone time, pollutes blame, and the dir is referenced only by a static route in `server/index.ts:185` — most of it is screenshots and design files.
- **Recommended fix:** Move to S3/CDN. Add `attached_assets/` to `.gitignore`. Purge from history with BFG/`filter-repo` if you ever go public.
- **Effort:** S

### M-25. 16+ stale audit docs in `docs/`
- **Severity:** Medium
- **Category:** Documentation / Hygiene
- **Location:** `docs/AUDIT_*.md`, `docs/COMPREHENSIVE_*.md`, `docs/OPTIMIZATION_*.md`, plus `CODEBASE_AUDIT_REPORT.md` at the root
- **Why it matters:** Future engineers (including future you and future Claude) read these and act on advice that's been outdated for months. Many recommend changes that were never made or were partially made.
- **Recommended fix:** Move all dated audits to `docs/archive/`. Keep `STYLE_GUIDE.md`, `TEXT_FORMATTING_GUIDE.md`, `DEPLOYMENT.md`. This AUDIT.md replaces the latest. Adopt a convention: one active audit doc, replaced (not appended) each pass.
- **Effort:** XS

### M-26. Rate limit of 2000 req/min/IP is generous given the actual user base
- **Severity:** Medium
- **Category:** Security / Performance
- **Location:** `server/index.ts:63-65`
- **Why it matters:** The justification (50+ concurrent users × ~40 API calls/page) is sound for legit traffic, but a single attacker can still hit 2000/min/IP and run for hours before being rate-limited. Combined with the open redirect (C-3) or missing donation validation (C-4), this is a real ratio.
- **Recommended fix:** Lower to 600/min for most endpoints, keep a higher tier for `/api/content-versions` and similar polled endpoints. Add per-user (not just per-IP) limits via session ID.
- **Effort:** S

### M-27. Bundling `hls.js` globally for one modal
- **Severity:** Medium
- **Category:** Performance / Bundle
- **Location:** `client/src/components/modals/table-modals.tsx:16`
- **Why it matters:** ~95 KB gzipped of HLS code ships to every user. Most never play an HLS video.
- **Recommended fix:** Dynamic import inside the playback effect: `const { default: Hls } = await import("hls.js")`.
- **Effort:** XS

### M-28. Stripe API version is `as any` cast
- **Severity:** Medium
- **Category:** Type Safety / Reliability
- **Location:** `server/routes.ts:162`
- **Why it matters:** Cast bypasses Stripe's strict version union; a typo or sunset version will surface at runtime.
- **Recommended fix:** Use a valid pinned version from `@stripe/stripe-js` typings, or omit `apiVersion` to use the SDK default.
- **Effort:** XS

### M-29. OAuth callback doesn't verify token presence before routing to reset
- **Severity:** Medium
- **Category:** Security / UX
- **Location:** `client/src/pages/auth-callback.tsx:16-27`
- **Why it matters:** A crafted URL with `type=recovery` but no real Supabase token routes the user to the reset-password page in a confused state. Not a credential leak, but a phishing pivot.
- **Recommended fix:** Require both `type=recovery` AND a Supabase-validated `access_token`/`code` before redirecting.
- **Effort:** S

### M-30. Direct Supabase client query risk is currently hypothetical
- **Severity:** Medium (downgraded after verification)
- **Category:** Security / Architecture
- **Location:** `client/src/lib/supabase.ts` (client exported), `grep "supabase\.from\|supabase\.rpc" client/src` → 0 hits
- **Why it matters:** No client code calls `.from()` or `.rpc()` today, but the client is exported globally so future authors will inevitably reach for it. Combined with #C-1, that would be catastrophic.
- **Recommended fix:** Wrap the export so only the auth surface (`supabase.auth.*`) is reachable from the rest of the app; keep `db` access strictly server-side. Add an ESLint rule (once ESLint exists) banning `supabase.from`.
- **Effort:** S

---

## Low Priority / Tech Debt

- **L-1.** `client/src/test-formatting.html` is unreferenced dev cruft. Delete.
- **L-2.** `jsonwebtoken`'s `parseInt(req.params.id)` blocks could use `z.coerce.number().int().positive()` everywhere. (See M-5.)
- **L-3.** `prepTime`/`cookTime` in `shared/schema.ts:15-16` are marked legacy. Stop reading them, then schedule a column drop migration.
- **L-4.** Admin JWT lifetime of 24h with no refresh token. Reduce to 1h with a refresh path. (`server/auth.ts`)
- **L-5.** Admin login (`server/routes.ts:595-635`) accepts unbounded password length — cap at 200 chars to prevent bcrypt-CPU DoS.
- **L-6.** No ESLint/Prettier configured. Add ESLint with `@typescript-eslint`, `eslint-plugin-react`, `eslint-plugin-react-hooks`. Wire into CI (H-10).
- **L-7.** `bcrypt` (`^6.0.0`) is fine but slow to install on Alpine — consider `bcryptjs` if container build time becomes an issue.
- **L-8.** `compass.ts:409` uses `(event as any).webkitCompassHeading`. Define a typed shim once.
- **L-9.** `MiniSearch<any>` in `SearchContext.tsx:9` loses generic type info. Define a `SearchRecord` interface.
- **L-10.** `setInterval` health-check in `App.tsx:206` doesn't use `AbortSignal.timeout` — under slow 3G it can overlap.
- **L-11.** Compression middleware uses gzip defaults; enabling Brotli at the edge or via the `shrink-ray-current` package nets ~15% on JSON.
- **L-12.** Images mostly use `loading="lazy"` but skip `width`/`height` → CLS regressions on slow networks.
- **L-13.** Multiple comments still say "FlutterFlow"; rename to "native wrapper" for clarity. (`use-install-highlight.ts`, `use-safe-area.ts`, `resume-manager.ts`)
- **L-14.** Several `fetch()` calls in `sponsorship-bar.tsx` and `tzedaka-modals.tsx` should use TanStack Query (subset of H-2).
- **L-15.** Service worker cache version cleanup uses regex parsing of the version string — fragile if the format changes.
- **L-16.** Color contrast in the pink/blush palette has not been verified against WCAG AA. Run a contrast audit in Chrome DevTools or Stark.
- **L-17.** Font scaling: per-page `fontSize` state (e.g., `challenge.tsx:17`) isn't applied to the actual rendered text. Use a CSS variable on a parent container.
- **L-18.** Service worker doesn't auto-prompt users to update when a new version is detected — relies on the user closing tabs.
- **L-19.** `featured_content` schema columns (`fromDate`/`untilDate` in `shared/schema.ts:391-409`) may not match the remote DB (the Supabase migration shows a single `date` column). Verify, then either fix Drizzle or write a migration.

---

## Positive Findings — don't regress

These are real strengths I want to flag so they don't get refactored away:

- **TypeScript is already strict.** `strict`, `noImplicitAny`, `noUnusedLocals/Parameters`, `exactOptionalPropertyTypes`, `noImplicitReturns` are all on. `npx tsc --noEmit` produced only 2 errors on the current branch — that's exceptional for a codebase this size.
- **Helmet + CSP + rate limiting are wired correctly** in `server/index.ts`, with thoughtful per-endpoint tiers (auth = 10/15min, expensive = 30/min, general = 2000/min). Tightening the values is small work.
- **DOMPurify is used for HTML rendering** (`client/src/lib/sanitize.ts` + `text-formatter.ts:366`) — `dangerouslySetInnerHTML` is not raw.
- **Lazy-loaded route splitting** in `client/src/App.tsx` for every page reduces TTI. The chunk-load error recovery in `error-boundary.tsx` shows you've thought about the failure mode.
- **TanStack Query is centrally configured** (`queryClient.ts`) with sensible defaults (15min stale time, no refetch-on-focus, persistence).
- **The PWA service worker is sophisticated** — separate caches for shells/APIs/audio, range-request bypass for audio, version-aware. Just needs the prayer-content fix (H-4).
- **Compass and text-formatter have actual unit tests** — extend this pattern, don't rip it out.
- **`drizzle-zod` is used to generate insert schemas** from Drizzle tables (`shared/schema.ts`) — propagate this discipline through to client-side response validation.
- **Audio-Cache strategy** correctly skips caching range requests (`sw.js:149-157`) — don't "fix" this.
- **The `optionalAuth` middleware pattern** (`server/supabase-auth.ts`) is a cleaner separation than alternatives I see in similar codebases.
- **`zustand` is used sparingly**, not as a god-store — keep it that way.
- **OpenAPI spec is generated** and the live `/api/spec.json` endpoint exists — useful for the mobile-app integration.

---

## Suggested Next Steps — ordered action plan

This is the order I'd run if you sign off. Each batch is meant to be one or two PRs.

### Sprint 0 (this week, blocking) — Stop the bleed
1. **C-2**: Remove committed env files, update `.gitignore`, rotate the Supabase anon key, force-push history clean.
2. **C-5**: `npm audit fix` (axios → 1.15.2+, undici, ws, yaml). Verify tests/build still pass.
3. **C-3**: Add `returnUrl` allowlist on `/api/create-session-checkout`.
4. **C-4**: Add Zod schema to `/api/create-session-checkout` for `amount`/`metadata`.
5. **H-12**: Fix the two `tsc` errors on `claude/lucid-allen-fZbML`. Add `npm run check` to `.github/workflows/ci.yml` and gate PRs.
6. **L-1**: Delete `client/src/test-formatting.html`.

### Sprint 1 (next 1–2 weeks) — RLS + observability
7. **C-1**: Roll out RLS. Start with the most sensitive tables (`donations`, `gratitude_journal`, `push_subscriptions`, `mitzvah_completions`, `nishmas_challenges`) — enable RLS, add policies, verify the app still works. Then sweep the rest.
8. **H-6**: Wire Sentry (client + server). Configure release tagging from the version endpoint already in place.
9. **C-6**: Validate `ADMIN_JWT_SECRET` at boot; type the admin middleware.
10. **H-7**: Wrap every lazy route in `ErrorBoundary`. Add one around the tefilla modals.
11. **M-3, M-4**: Tighten CSP `styleSrc` (remove `'unsafe-inline'` from prod) and CORS allowlist.

### Sprint 2 (rest of the month) — Foundations
12. **H-1**: Begin the routes.ts / storage.ts split. Do one domain end-to-end (suggest Tehillim) as a pattern.
13. **H-2**: Convert tefilla-modals's 26 raw axios calls to TanStack Query.
14. **H-3**: Fix `getLibrarySpeakers` N+1; add LIMIT to unbounded list endpoints.
15. **H-4**: Switch prayer/Torah SW caching to stale-while-revalidate.
16. **H-8**: Add the four smoke tests (admin login, donation, completion sync, chain ownership).
17. **H-9**: Bound the push retry queue.
18. **H-11**: Add the missing foreign keys and the missing indexes (M-11, M-12).
19. **M-25**: Archive old audit docs.

### Quarter — Cleanup + maturity
20. **H-1 continued**: Finish splitting routes.ts/storage.ts; tackle `tefilla-modals.tsx`.
21. **M-1**: Move to generated SQL migrations; retire `drizzle-kit push`.
22. **M-5, M-6, M-7, M-8**: Type Express handlers, standardize on `safeParse`, remove `as any` after validation, flip `noUncheckedIndexedAccess` and fix fallout.
23. **M-9**: Refactor `mobile.ts` to call handler functions directly.
24. **M-13, M-14, M-17, M-18**: Image resize, lazy SearchContext, virtualized admin tables, virtualized gratitude history.
25. **M-19**: Push-subscription cleanup job.
26. **M-23, M-24**: Remove dead deps; move `attached_assets` to S3.
27. **L-6**: ESLint + Prettier.

---

## Coverage notes / what I did NOT cover

- **Live database inspection.** I didn't query the Supabase project directly (no access). The RLS finding is from the SQL migration file — verify against the live database, in case ad-hoc policies have been added through the Supabase dashboard.
- **iOS/Android native wrapper code.** This is a web app shipped via wrappers (formerly FlutterFlow). I reviewed the web side only.
- **Stripe webhook handlers** — I noted the checkout creation path but didn't trace the success/failure webhooks end-to-end. Worth a separate pass.
- **OpenAPI spec accuracy.** `openapi.json` exists; I didn't diff it against actual handlers.
- **CDN/CloudFront caching headers** — out of scope for source-only audit.
- **Penetration testing** — this is a code audit, not a pen test. A focused pen test on the donation flow and the (post-fix) RLS surface is worth budget.
- **Accessibility was sampled** — buttons and aria-labels look correct in spot-checks, but a full a11y audit (axe-core, screen-reader walkthrough) is its own pass.
