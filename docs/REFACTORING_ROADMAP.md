# Refactoring Roadmap

**Created:** October 2025
**Status:** In Progress

## Overview

This document outlines the planned refactoring of the Ezras Nashim codebase to improve maintainability, testability, and scalability.

## Completed Improvements ✅

### 1. Environment Variable Validation
- **Status**: ✅ Complete
- **Files**: `server/env.ts`
- **Changes**:
  - Added Zod-based environment validation
  - Fail-fast on missing required variables
  - Warnings for optional but recommended variables
  - Type-safe environment access throughout server code
- **Impact**: Prevents runtime errors from missing configuration

### 2. Modular Route Infrastructure
- **Status**: ✅ Infrastructure Ready
- **Files**: `server/routes/`, `server/routes/middleware.ts`, `server/routes/types.ts`
- **Changes**:
  - Created routes directory structure
  - Extracted admin auth middleware
  - Added TypeScript types for route registration
  - Updated main routes.ts to use shared middleware
- **Impact**: Foundation for breaking up monolithic routes file

### 3. Dependency Updates
- **Status**: ✅ Complete
- **Changes**:
  - Updated @radix-ui components to latest stable versions
  - Updated @neondatabase/serverless from 0.10.4 to 1.0.2
  - Added test scripts to package.json
  - Added database migration scripts
- **Impact**: Security patches, bug fixes, and new features

### 4. Documentation
- **Status**: ✅ Complete
- **Files**:
  - `docs/SECURITY_MODEL.md` - Complete security documentation
  - `docs/DATABASE_MIGRATIONS.md` - Migration workflow guide
  - `docs/REFACTORING_ROADMAP.md` - This file
- **Impact**: Clear understanding of architecture and processes

## Pending Improvements 🔄

### 1. Route Modularization (Priority: High)

**Current State**:
- Single 4,040-line `routes.ts` file with 121 routes
- Difficult to navigate and maintain
- Risk of merge conflicts

**Target State**:
```
server/routes/
├── index.ts          # Main registration
├── middleware.ts     # Shared middleware
├── types.ts          # TypeScript types
├── torah.ts          # /api/torah/* routes
├── tefilla.ts        # Prayer routes
├── tzedaka.ts        # Donation routes
├── tehillim.ts       # Tehillim routes
├── admin.ts          # Admin routes
├── analytics.ts      # Analytics routes
├── media.ts          # Media proxy/upload
├── calendar.ts       # Calendar/zmanim
└── public.ts         # Public content
```

**Migration Plan**:
1. Start with smallest, most isolated routes (e.g., shop, sponsors)
2. Move to content routes (torah, tefilla)
3. Handle complex routes with shared state carefully
4. Test each migration thoroughly

**Estimated Effort**: 2-3 days
**Risk**: Medium (must ensure no routes break)

### 2. Test Suite Setup (Priority: High)

**Current State**:
- Only 1 actual test file (compass.test.ts)
- No test infrastructure configured
- No CI test runs

**Target State**:
```
├── vitest.config.ts
└── tests/
    ├── unit/
    │   ├── env.test.ts
    │   ├── middleware.test.ts
    │   └── utils/
    ├── integration/
    │   ├── api/
    │   └── database/
    └── e2e/
        └── critical-flows.test.ts
```

**Dependencies to Add**:
```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

**Priority Tests**:
1. Environment validation
2. Admin authentication middleware
3. Input validation schemas
4. Critical API endpoints
5. Payment flows

**Estimated Effort**: 3-4 days
**Risk**: Low (additive, doesn't change existing code)

### 3. Database Migration Baseline (Priority: Medium)

**Current State**:
- No migrations folder
- Tables exist but no version control
- Schema changes not tracked

**Target State**:
- Initial migration capturing current schema
- Migration workflow documented
- Staging environment for testing migrations

**Steps**:
1. Generate initial migration from schema
2. Document existing production schema
3. Mark as applied in production
4. Establish migration workflow

**Estimated Effort**: 1 day
**Risk**: Low (documentation + setup)

### 4. Admin Authentication Hardening (Priority: Medium)

**Current State**:
- Single shared password
- No session management
- No audit logging

**Options**:

**Option A: Supabase Auth** (Recommended)
- Use existing Supabase infrastructure
- Row Level Security integration
- Built-in session management
- Free tier sufficient

**Option B: Auth0 / Clerk**
- Managed auth service
- More features (MFA, social login)
- Additional cost

**Option C: JWT-based Custom Auth**
- More control
- More maintenance
- More security responsibility

**Estimated Effort**: 2-3 days
**Risk**: Medium (changes auth flow)

### 5. Error Monitoring Integration (Priority: Medium)

**Current State**:
- Console.log only
- No error aggregation
- Difficult to track production issues

**Recommended Solution**: Sentry

```bash
npm install @sentry/node @sentry/react
```

**Setup**:
1. Create Sentry project
2. Add DSN to environment variables
3. Initialize in server and client
4. Add error boundary integration

**Estimated Effort**: 4-6 hours
**Risk**: Low (additive)

### 6. Client-Side Optimization (Priority: Low)

**Current State**:
- 318MB node_modules
- Some component bundles may be large
- Bundle analyzer not configured

**Optimizations**:
1. Run bundle analyzer: `npm run build -- --analyze`
2. Tree-shake unused dependencies
3. Further code splitting
4. Lazy load heavy components

**Estimated Effort**: 1-2 days
**Risk**: Low (performance improvement)

### 7. API Versioning (Priority: Low)

**Current State**:
- All routes on `/api/*`
- No version prefix
- Breaking changes affect all clients immediately

**Target State**:
```
/api/v1/torah/*
/api/v1/tefilla/*
```

**Benefits**:
- Support multiple API versions
- Gradual migration for breaking changes
- Better backward compatibility

**Estimated Effort**: 1 day (after route modularization)
**Risk**: Low (can maintain both `/api/*` and `/api/v1/*`)

## Long-term Improvements 🔮

### 1. TypeScript Strict Mode

Currently using relaxed TypeScript settings. Enable:
```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true
}
```

**Benefit**: Catch more bugs at compile time
**Effort**: High (many fixes needed)

### 2. GraphQL API Layer

Consider GraphQL for more flexible data fetching:
- Reduces over-fetching
- Type-safe client queries
- Better for mobile app development

**Effort**: High (major architecture change)

### 3. Redis Caching Layer

Add Redis for distributed caching:
- Reduce database load
- Share cache across instances
- Support more concurrent users

**Effort**: Medium (infrastructure + code changes)

### 4. WebSocket Support

Real-time updates for:
- Tehillim progress
- Live donation counters
- Push notification delivery status

**Effort**: Medium

## Implementation Priority

1. **Week 1**: Route modularization (most impactful)
2. **Week 2**: Test suite setup
3. **Week 3**: Database migration baseline + Admin auth hardening
4. **Week 4**: Error monitoring + Client optimizations

## Success Metrics

- **Code Maintainability**: Lines per file < 300 average
- **Test Coverage**: >70% for critical paths
- **Build Time**: <30 seconds for full build
- **Bundle Size**: <500KB gzipped for initial load
- **Error Rate**: <0.1% of requests in production

## Risk Mitigation

1. **Always test in staging first**
2. **Maintain backward compatibility**
3. **Feature flags for major changes**
4. **Comprehensive manual testing checklist**
5. **Database backups before migrations**

## Notes

- Refactoring should be incremental and tested
- Don't refactor and add features simultaneously
- Document decisions and rationale
- Get code review on structural changes
- Keep main branch deployable at all times
