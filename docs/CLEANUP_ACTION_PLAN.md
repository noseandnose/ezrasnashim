# Codebase Cleanup Action Plan

> **Created:** February 2026
> **Status:** Planning Phase
> **Risk Level Guide:** 🟢 Safe | 🟡 Low Risk | 🟠 Medium Risk | 🔴 High Risk

---

## Pre-Cleanup Checklist

Before starting ANY changes:

- [ ] Create a backup branch: `git checkout -b backup/pre-cleanup-$(date +%Y%m%d)`
- [ ] Document current working state
- [ ] Ensure all tests pass (if any exist)
- [ ] Have rollback plan ready
- [ ] Schedule changes during low-traffic period if possible

---

## Phase 1: Zero-Risk Cleanup (Dead Code Removal)

**Risk Level:** 🟢 Safe
**Estimated Impact:** None - removing code that is never executed
**Rollback:** Simple git revert

### 1.1 Remove Commented-Out Code

These are large blocks of commented code that add noise but have zero runtime impact.

#### Task 1.1.1: Clean `client/src/pages/donate.tsx`
- **What:** Remove ~404 lines of commented-out old Stripe implementation (lines 35-398)
- **Why:** This code is never executed, clutters the file, and the old implementation is in git history if ever needed
- **Risk:** 🟢 None - commented code
- **Verification:** Page loads, donations still work

#### Task 1.1.2: Clean `server/routes.ts` commented sections
- **What:** Remove ~429 lines of commented payment and Replit code
- **Sections to remove:**
  - Lines 2336-2363: Old payment intent creation
  - Lines 2546-2556: Replit domain redirect logic
  - Other scattered commented blocks
- **Risk:** 🟢 None - commented code
- **Verification:** Server starts, API endpoints respond

#### Task 1.1.3: Clean `server/storage.ts` commented sections
- **What:** Remove ~326 lines of commented analytics code
- **Risk:** 🟢 None - commented code
- **Verification:** Database operations work

---

### 1.2 Remove Unused Files

#### Task 1.2.1: Delete transpiled JS artifacts
- **Files to delete:**
  - `server/axiosClient.js` (transpiled, never imported)
  - `server/typeHelpers.js` (transpiled, never imported)
- **Risk:** 🟢 None - these files are not in the import chain
- **Verification:** `npm run build` succeeds, server starts

#### Task 1.2.2: Delete unused logger
- **File:** `client/src/lib/production-logger.ts`
- **Why:** Never imported anywhere in the codebase
- **Risk:** 🟢 None
- **Verification:** Build succeeds

---

### 1.3 Remove Replit Auth System (Confirmed Unused)

Since you confirmed Supabase is your auth system:

#### Task 1.3.1: Delete Replit auth directory
- **Directory:** `server/replit_integrations/` (entire directory)
- **Risk:** 🟢 None - code is never registered or called
- **Verification:** Server starts, auth still works via Supabase

#### Task 1.3.2: Remove Replit auth imports (if any)
- **Check:** `server/routes.ts` for any imports from replit_integrations
- **Risk:** 🟢 None

#### Task 1.3.3: Clean up unused Passport dependencies
- **Packages to remove from package.json:**
  - `passport-local` (not used, using OpenID Connect)
- **Note:** Keep `passport` and `openid-client` if any other auth uses them
- **Risk:** 🟢 None - not imported
- **Verification:** `npm install`, server starts

---

## Phase 2: Low-Risk Cleanup (Unused Dependencies & Types)

**Risk Level:** 🟡 Low
**Estimated Impact:** Minimal - dependency changes only
**Rollback:** Restore package.json, run npm install

### 2.1 Fix package.json Issues

#### Task 2.1.1: Move @types to devDependencies
Move these from `dependencies` to `devDependencies`:
```
@types/bcrypt
@types/compression
@types/dompurify
@types/jsonwebtoken
@types/memoizee
@types/pg
@types/web-push
```
- **Risk:** 🟡 Low - only affects TypeScript compilation
- **Verification:** `npm run build` succeeds, `npm run check` passes

#### Task 2.1.2: Remove unused dependencies
```
@googlemaps/js-api-loader  (uses script tag instead)
@google-cloud/storage      (uses Firebase URLs)
memorystore                (uses PostgreSQL sessions)
```
- **Risk:** 🟡 Low - grep confirms no imports
- **Verification:** Build succeeds, all features work

#### Task 2.1.3: Align React Query versions
Update `@tanstack/react-query` from `^5.60.5` to `^5.90.5` to match persist-client
- **Risk:** 🟡 Low - minor version bump, same major
- **Verification:** Data fetching works, no console errors

---

### 2.2 Remove Unused Exports

#### Task 2.2.1: Clean `server/typeHelpers.ts`
Remove unused exports:
- `safeCodePointAt()` - only used internally
- `memoize()` - never called
- `withRetry()` - never called
- `getEnvVar()` - never called

Keep only: `formatDate()` (used in storage.ts)
- **Risk:** 🟡 Low
- **Verification:** Build succeeds

---

## Phase 3: Medium-Risk Cleanup (Code Consolidation)

**Risk Level:** 🟠 Medium
**Estimated Impact:** Changes shared code paths
**Rollback:** Git revert, may need testing

### 3.1 Consolidate Duplicate Functions

#### Task 3.1.1: Centralize `getLocalDateString()`
- **Current state:** Defined in 4 files
- **Action:**
  1. Ensure it exists in `client/src/lib/dateUtils.ts`
  2. Update imports in:
     - `hooks/use-table-summary.ts`
     - `hooks/use-tzedaka-summary.ts`
     - `pages/donate.tsx`
     - `components/sections/tzedaka-section.tsx`
  3. Remove duplicate definitions
- **Risk:** 🟠 Medium - affects multiple components
- **Verification:** All date displays work correctly across the app

#### Task 3.1.2: Consolidate caching utilities
- **Current state:** 3 competing cache implementations
- **Recommended action:**
  1. Keep `client/src/lib/cache.ts` as primary
  2. Migrate usages from `request-cache.ts` to `cache.ts`
  3. Delete `request-cache.ts`
  4. Review `startup-performance.ts` for overlap
- **Risk:** 🟠 Medium - affects data loading
- **Verification:** All pages load data correctly, no stale data issues

#### Task 3.1.3: Remove duplicate logger
- **Action:** Delete `client/src/lib/logger.ts` if `production-logger.ts` is preferred, or vice versa
- **Risk:** 🟠 Medium - need to check all logging calls
- **Verification:** No console errors about missing logger

---

### 3.2 Schema Cleanup

#### Task 3.2.1: Handle schema-optimized.ts
**Options (choose one):**

**Option A: Delete schema-optimized.ts entirely** ✅ Recommended
- Since pirkeiAvotProgress and globalTehillimProgress are no longer needed
- The optimized schema was likely an experiment
- **Risk:** 🟡 Low if truly unused

**Option B: Merge needed changes into schema.ts**
- If any optimizations are valuable, merge them
- **Risk:** 🟠 Medium - database implications

#### Task 3.2.2: Investigate sponsors table conflict
- **Action needed:** Determine which schema is correct
- **Questions to answer:**
  - Is `sponsors` table actively used?
  - Which fields are needed: schema.ts version or schema-optimized.ts version?
  - Are there existing records that would break?
- **Risk:** 🟠 Medium to 🔴 High depending on usage

#### Task 3.2.3: Remove deprecated tehillim endpoints
After confirming they're not called by any client:
- `GET /api/tehillim/current-name`
- `GET /api/tehillim/names`
- `getProgressWithAssignedName()` in storage.ts
- **Risk:** 🟠 Medium - need to verify no client calls these
- **Verification:** Tehillim features still work

---

## Phase 4: Higher-Risk Refactoring (File Splitting)

**Risk Level:** 🔴 High
**Estimated Impact:** Major structural changes
**Rollback:** More complex, needs careful testing

> ⚠️ **Recommendation:** Do these one at a time with thorough testing between each

### 4.1 Split Large Component Files

#### Task 4.1.1: Split `tefilla-modals.tsx` (5,114 lines → ~8 files)
- **Current:** 28 components in one file
- **Proposed structure:**
  ```
  client/src/components/modals/tefilla/
  ├── index.ts                    (re-exports)
  ├── MinchaMaarivModal.tsx       (prayer modals)
  ├── BrochasModal.tsx            (blessings)
  ├── WomensPrayersModal.tsx      (women's prayers)
  ├── NishmasModal.tsx            (nishmas text)
  ├── MorningPrayersModal.tsx     (morning prayers)
  ├── TehillimModals.tsx          (tehillim-related)
  ├── PirkeiAvotModal.tsx         (if still needed)
  └── shared/                     (shared components)
  ```
- **Risk:** 🔴 High - many imports to update
- **Verification:** All prayer modals open and display correctly

#### Task 4.1.2: Split `admin.tsx` (2,894 lines → ~7 files)
- **Proposed structure:**
  ```
  client/src/pages/admin/
  ├── index.tsx                   (main container, tab routing)
  ├── ContentTab.tsx
  ├── DailyTab.tsx
  ├── NotificationsTab.tsx
  ├── TehillimTab.tsx
  ├── AnalyticsTab.tsx
  ├── MessagesTab.tsx
  └── hooks/                      (admin-specific hooks)
  ```
- **Risk:** 🔴 High - complex state management
- **Verification:** All admin functions work

---

### 4.2 Split Large Server Files

#### Task 4.2.1: Modularize `routes.ts` (4,000 lines)
- **Current:** 104 routes in one file
- **Proposed structure:**
  ```
  server/routes/
  ├── index.ts                    (route registration)
  ├── analytics.ts                ✅ Already exists
  ├── content.ts                  ✅ Already exists
  ├── tehillim.ts                 ✅ Already exists
  ├── push.ts                     ✅ Already exists
  ├── prayers.ts                  ✅ Already exists (expand this)
  ├── location.ts                 ✅ Already exists
  ├── utility.ts                  ✅ Already exists
  ├── donations.ts                NEW - extract from routes.ts
  ├── admin.ts                    NEW - extract from routes.ts
  └── user.ts                     NEW - extract from routes.ts
  ```
- **Risk:** 🔴 High - affects all API endpoints
- **Verification:** All API endpoints respond correctly

#### Task 4.2.2: Split `storage.ts` (3,821 lines, 374 methods)
- **Proposed structure:**
  ```
  server/storage/
  ├── index.ts                    (re-exports, backwards compat)
  ├── BaseStorage.ts              (shared utilities)
  ├── ContentStorage.ts           (torah, emuna, halacha, etc.)
  ├── PrayerStorage.ts            (mincha, maariv, brochas)
  ├── TehillimStorage.ts          (chains, progress)
  ├── UserStorage.ts              (user data, completions)
  ├── DonationStorage.ts          (donations, campaigns)
  └── AdminStorage.ts             (admin operations)
  ```
- **Risk:** 🔴 High - affects all database operations
- **Verification:** All data operations work

---

## Phase 5: CSS Cleanup

**Risk Level:** 🟠 Medium
**Estimated Impact:** Visual changes possible
**Rollback:** Restore index.css

### 5.1 CSS Improvements

#### Task 5.1.1: Audit and reduce `!important` usage
- **Current:** 166 `!important` declarations
- **Target:** <20 (only where truly necessary)
- **Risk:** 🟠 Medium - may affect styling
- **Verification:** Visual regression testing on all pages

#### Task 5.1.2: Consolidate `:root` blocks
- **Current:** 3 separate `:root` blocks
- **Action:** Merge into single block
- **Risk:** 🟡 Low
- **Verification:** CSS variables work correctly

#### Task 5.1.3: Remove duplicate animations
- **Current:** 4+ duplicate animation keyframes
- **Action:** Consolidate into single parameterized versions
- **Risk:** 🟡 Low
- **Verification:** Animations play correctly

#### Task 5.1.4: Define missing CSS variable
- **Issue:** `--safe-bottom-total` used but never defined
- **Action:** Add definition or remove usages
- **Risk:** 🟡 Low
- **Verification:** Bottom spacing correct on all devices

---

## Phase 6: Security Improvements

**Risk Level:** 🟠 Medium
**Estimated Impact:** Auth flow changes

### 6.1 Security Fixes

#### Task 6.1.1: Move admin token to httpOnly cookie
- **Current:** Token in sessionStorage (XSS vulnerable)
- **Action:** Implement httpOnly cookie for admin sessions
- **Risk:** 🟠 Medium - affects admin auth flow
- **Verification:** Admin login/logout works, token not accessible via JS

#### Task 6.1.2: Remove console.log statements
- **Current:** 164 console.log in routes.ts
- **Action:** Remove or replace with proper logging
- **Risk:** 🟡 Low
- **Verification:** Server runs without excessive logging

---

## Recommended Execution Order

### Week 1: Safe Cleanup
1. ✅ Phase 1.1 - Remove commented code
2. ✅ Phase 1.2 - Remove unused files
3. ✅ Phase 1.3 - Remove Replit auth

### Week 2: Dependencies
4. ✅ Phase 2.1 - Fix package.json
5. ✅ Phase 2.2 - Remove unused exports

### Week 3: Consolidation
6. ⚠️ Phase 3.1.1 - Centralize getLocalDateString
7. ⚠️ Phase 3.2.1 - Handle schema files (after sponsor decision)
8. ⚠️ Phase 3.2.3 - Remove deprecated endpoints

### Week 4+: Major Refactoring (One at a time)
9. 🔴 Phase 4.1.1 - Split tefilla-modals.tsx
10. 🔴 Phase 4.2.1 - Modularize routes.ts
11. 🔴 Phase 4.2.2 - Split storage.ts
12. 🔴 Phase 4.1.2 - Split admin.tsx

### Ongoing
- Phase 5 - CSS cleanup (can be done incrementally)
- Phase 6 - Security improvements

---

## Questions to Answer Before Proceeding

1. **Sponsors table:** Which schema version is correct? Is this table actively used?

2. **pirkeiAvotProgress / globalTehillimProgress:**
   - Can we delete these tables from the database?
   - Or just remove from schema (leave data orphaned)?
   - Any client code still referencing these?

3. **Caching strategy:** Which approach do you prefer?
   - React Query only
   - Manual cache + React Query
   - Current mixed approach

4. **Testing:** Do you have any automated tests? Manual test checklist?

5. **Deployment:** What's your deployment process? Can we do staged rollouts?

6. **Rollback:** How quickly can you rollback if something breaks?

---

## Notes

- Each phase should be a separate PR/commit for easy rollback
- Test thoroughly after each phase before moving to next
- Keep the backup branch until all phases complete
- Document any unexpected issues encountered

---

*This plan prioritizes safety over speed. Better to take 4 weeks with zero downtime than rush and break the production app.*
