# Git Workflow Guide

**Created:** October 2025
**Purpose:** Establish a safe staging workflow to test changes before production

## Overview

This project uses a **staging branch workflow** to ensure changes are tested before reaching production.

## Branch Structure

```
main (production)     ← Live production code
  └── staging         ← Test changes here before main
       └── feature/*  ← Individual feature branches
```

### Branch Purposes

- **`main`**: Production code deployed to https://ezrasnashim.app
- **`staging`**: Test environment deployed to https://staging.ezrasnashim.app
- **`feature/*`**: Individual features (e.g., `feature/add-tests`, `feature/route-refactor`)

## Initial Setup (One-Time)

Since this is a Replit environment, the Git workflow needs to be set up:

### Step 1: Initialize Git Repository

```bash
# If not already initialized
git init

# Set your identity
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

### Step 2: Add Remote Repository

```bash
# Add your GitHub/GitLab remote
git remote add origin https://github.com/your-username/ezras-nashim.git

# Verify remote
git remote -v
```

### Step 3: Create Staging Branch

```bash
# Ensure you're on main
git checkout main

# Create and push staging branch
git checkout -b staging
git push -u origin staging

# Return to main
git checkout main
```

## Daily Workflow

### Making Changes

1. **Always start from staging branch:**
```bash
# Switch to staging
git checkout staging

# Pull latest changes
git pull origin staging
```

2. **Create a feature branch (optional but recommended):**
```bash
# Create feature branch from staging
git checkout -b feature/your-feature-name
```

3. **Make your changes:**
```bash
# Edit files...
# Test locally...
```

4. **Commit changes:**
```bash
# Stage changes
git add .

# Or stage specific files
git add server/env.ts docs/SECURITY_MODEL.md

# Commit with descriptive message
git commit -m "Add environment variable validation

- Created server/env.ts with Zod schema
- Updated server/index.ts to use validated env
- Added comprehensive security documentation"
```

5. **Push to staging:**
```bash
# If on feature branch
git push origin feature/your-feature-name

# Or if directly on staging
git push origin staging
```

### Testing on Staging

1. **Deploy to staging environment**
   - Replit automatically deploys the `staging` branch
   - Or manually trigger GitHub Actions workflow

2. **Test thoroughly:**
   - ✅ All existing functionality works
   - ✅ New features work as expected
   - ✅ No errors in console/logs
   - ✅ Performance is acceptable
   - ✅ Mobile/desktop both work

3. **Get approval** (if team workflow requires it)

### Promoting to Production

Once staging is tested and approved:

```bash
# Switch to main branch
git checkout main

# Pull latest main
git pull origin main

# Merge staging into main
git merge staging

# Push to production
git push origin main
```

**Important:** After merging to main, sync staging:
```bash
git checkout staging
git merge main
git push origin staging
```

## Replit-Specific Workflow

### Using Replit Git UI

Replit has a built-in Git interface:

1. Click **Version Control** tab (left sidebar)
2. See your changes
3. Stage files you want to commit
4. Write commit message
5. Commit
6. Push to branch

### Switching Branches in Replit

```bash
# In Replit Shell
git checkout staging    # Switch to staging
git checkout main       # Switch to main
```

**Note:** Replit may need to reload after branch switch.

## Deployment Configuration

### GitHub Actions (Already Configured)

Your `.github/workflows/` already handles staging vs main:

**Frontend Deployment** (`deploy-frontend-to-s3.yml`):
- `main` branch → Production S3 bucket + CloudFront
- `staging` branch → Staging S3 bucket + CloudFront

**Backend Deployment** (`deploy-server.yml`):
- `main` branch → Production ECS service
- `staging` branch → Staging ECS service

### Environment Variables

Ensure staging uses different environment variables:

**Production (.env):**
```bash
DATABASE_URL=postgresql://prod-connection
STRIPE_SECRET_KEY=sk_live_...
ADMIN_PASSWORD=prod-password
```

**Staging (.env.staging):**
```bash
DATABASE_URL=postgresql://staging-connection
STRIPE_SECRET_KEY=sk_test_...
ADMIN_PASSWORD=staging-password
```

## Protection Rules (Recommended)

### GitHub Branch Protection

Set up on GitHub repository settings:

**Main Branch:**
- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass (build, tests)
- ✅ Require branches to be up to date
- ✅ Include administrators (no bypass)

**Staging Branch:**
- ✅ Require status checks to pass
- ❌ Don't require pull request (allow direct commits)

## Typical Scenarios

### Scenario 1: Bug Fix

```bash
# Start from staging
git checkout staging
git pull origin staging

# Create bug fix branch
git checkout -b fix/admin-auth-error

# Make fixes
# ... edit files ...

# Test locally
npm run build

# Commit
git add .
git commit -m "Fix admin authentication error

- Handle missing ADMIN_PASSWORD gracefully
- Add error message for misconfiguration"

# Push to staging
git push origin fix/admin-auth-error

# Test on staging deployment
# ... verify fix ...

# Merge to staging
git checkout staging
git merge fix/admin-auth-error
git push origin staging

# After staging verification, merge to main
git checkout main
git merge staging
git push origin main
```

### Scenario 2: New Feature

```bash
# Create feature branch from staging
git checkout staging
git pull origin staging
git checkout -b feature/payment-receipts

# Develop feature over multiple days
# ... work, commit, push ...

git add .
git commit -m "Add payment receipt generation"
git push origin feature/payment-receipts

# When ready, merge to staging
git checkout staging
git merge feature/payment-receipts
git push origin staging

# Test thoroughly on staging

# Deploy to production when approved
git checkout main
git merge staging
git push origin main
```

### Scenario 3: Hotfix (Emergency Production Fix)

```bash
# For urgent production fixes, branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-payment-error

# Make minimal fix
# ... edit files ...

# Test locally
npm run build

# Commit
git add .
git commit -m "Hotfix: Fix critical payment processing error"

# Merge directly to main
git checkout main
git merge hotfix/critical-payment-error
git push origin main

# IMPORTANT: Backport to staging
git checkout staging
git merge main
git push origin staging
```

## Best Practices

### Commit Messages

Good commit format:
```
Short summary (50 chars or less)

More detailed explanation if needed. Wrap at 72 characters.
Explain the problem this solves, not just what changed.

- Bullet points are ok
- Reference issue numbers if applicable: Fixes #123
```

Examples:
- ✅ `Add environment variable validation with Zod`
- ✅ `Fix: Prevent crash when ADMIN_PASSWORD missing`
- ✅ `Refactor: Extract admin auth to shared middleware`
- ❌ `fix stuff`
- ❌ `wip`
- ❌ `updates`

### When to Commit

- ✅ Logical units of work
- ✅ Working code (builds successfully)
- ✅ After testing locally
- ❌ Broken code
- ❌ Commented-out experiments
- ❌ Debug console.logs everywhere

### What to Commit

**Always commit:**
- Source code (.ts, .tsx, .js)
- Configuration files
- Documentation (.md)
- Package files (package.json, package-lock.json)

**Never commit:**
- `.env` files with secrets
- `node_modules/`
- `dist/` or `build/` folders
- IDE settings (unless team agrees)
- Log files
- Temporary files

**Already configured in `.gitignore`:**
```
node_modules/
dist/
.env
.env.local
*.log
```

## Troubleshooting

### Merge Conflicts

If you get conflicts when merging:

```bash
# Git will mark conflicted files
git status

# Edit files to resolve conflicts
# Look for <<<<<<< HEAD markers

# After resolving
git add resolved-file.ts
git commit -m "Resolve merge conflicts"
```

### Accidentally Committed to Main

If you committed to main instead of staging:

```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Switch to staging
git checkout staging

# Commit there instead
git add .
git commit -m "Your commit message"
git push origin staging
```

### Lost Changes

If you need to recover uncommitted changes:

```bash
# Stash changes
git stash

# Switch branches
git checkout staging

# Restore changes
git stash pop
```

## Team Collaboration

### Pull Before Push

Always pull before pushing to avoid conflicts:

```bash
git pull origin staging    # Pull latest
# ... make changes ...
git push origin staging    # Push your changes
```

### Code Review Process

1. Push feature branch to GitHub
2. Create Pull Request: `feature/xyz → staging`
3. Request review from team member
4. Address feedback
5. Merge after approval
6. Delete feature branch

## Automation

### Pre-commit Hooks (Optional)

Install Husky for automatic checks:

```bash
npm install --save-dev husky lint-staged

# Add to package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run check && npm run build"
    }
  }
}
```

This runs TypeScript check and build before every commit.

## Summary

**Development Flow:**
```
1. git checkout staging
2. git pull origin staging
3. Make changes
4. npm run build (test locally)
5. git add .
6. git commit -m "Descriptive message"
7. git push origin staging
8. Test on staging deployment
9. When approved:
   - git checkout main
   - git merge staging
   - git push origin main
```

**Key Rules:**
- ✅ Always work in `staging` or feature branches
- ✅ Test in staging before merging to main
- ✅ Keep main deployable at all times
- ✅ Write good commit messages
- ✅ Pull before push
- ❌ Never push broken code to main
- ❌ Never commit secrets/credentials

## Quick Reference

```bash
# Daily workflow
git checkout staging              # Start from staging
git pull origin staging           # Get latest
# ... make changes ...
git add .                         # Stage changes
git commit -m "Message"           # Commit
git push origin staging           # Push to staging
# ... test on staging ...
git checkout main                 # Switch to main
git merge staging                 # Merge tested changes
git push origin main              # Deploy to production

# Check status
git status                        # See changes
git log --oneline -10             # Recent commits
git branch                        # List branches

# Undo operations
git reset --soft HEAD~1           # Undo last commit
git checkout -- file.ts           # Discard file changes
git stash                         # Save changes temporarily
git stash pop                     # Restore stashed changes
```

---

**Need Help?**
- Git documentation: https://git-scm.com/docs
- GitHub guides: https://guides.github.com
- Ask team members for review
