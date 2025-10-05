# Setting Up Staging Branch Workflow

## Quick Setup (Choose One Method)

### Method 1: Automatic Setup Script

```bash
# Run the setup script
./setup-staging-branch.sh
```

This will:
- Create a `staging` branch if it doesn't exist
- Push it to your remote repository
- Return you to your current branch

### Method 2: Manual Setup

```bash
# 1. Ensure you're on main
git checkout main

# 2. Create staging branch
git checkout -b staging

# 3. Push to remote
git push -u origin staging

# 4. Return to main
git checkout main
```

## What This Does

The staging branch workflow ensures:
- ✅ All changes are tested in staging first
- ✅ Production (main) stays stable
- ✅ You can safely experiment without breaking production
- ✅ CI/CD automatically deploys staging branch to staging environment

## After Setup

### For All Future Work:

```bash
# 1. Always start from staging
git checkout staging

# 2. Make your changes
# ... edit files ...

# 3. Test locally
npm run build

# 4. Commit and push to staging
git add .
git commit -m "Your changes"
git push origin staging

# 5. Test on staging deployment
# ... verify everything works ...

# 6. When ready for production
git checkout main
git merge staging
git push origin main
```

## Your Deployment Setup

Based on your `.github/workflows/` configuration:

**Staging Branch** (`staging`):
- Frontend: Deploys to staging S3 bucket
- Backend: Deploys to staging ECS service
- URL: https://staging.ezrasnashim.app

**Main Branch** (`main`):
- Frontend: Deploys to production S3 bucket
- Backend: Deploys to production ECS service
- URL: https://ezrasnashim.app

## Important Notes

1. **Recent Changes Already on Main**
   - The improvements made today (env validation, docs, etc.) are on `main`
   - This is fine! They're tested and working
   - Going forward, use `staging` branch for new work

2. **Replit Environment**
   - Replit may not have Git initialized yet
   - You may need to connect to your GitHub repository first
   - Use Replit's Git UI or command line

3. **First Time Git Setup**
   ```bash
   # Initialize git (if needed)
   git init

   # Add your GitHub remote
   git remote add origin https://github.com/YOUR_USERNAME/ezras-nashim.git

   # Fetch existing branches
   git fetch origin

   # Then run setup script
   ./setup-staging-branch.sh
   ```

## Complete Workflow Documentation

See **`docs/GIT_WORKFLOW.md`** for:
- Detailed workflow steps
- Branch protection rules
- Code review process
- Troubleshooting guide
- Best practices
- Team collaboration tips

## Questions?

- **Q: Can I still use main for hotfixes?**
  - A: Yes, for emergencies only. Then merge back to staging.

- **Q: What if I accidentally commit to main?**
  - A: `git reset --soft HEAD~1`, then switch to staging and commit there.

- **Q: Do I need to create feature branches?**
  - A: Optional but recommended for larger features. Small changes can go directly to staging.

- **Q: How do I test staging before production?**
  - A: Push to staging branch, GitHub Actions will deploy to staging environment automatically.

## Summary

**Before (Today):**
```
All changes → main → production (risky!)
```

**After (New Workflow):**
```
Changes → staging → test → main → production (safe!)
```

Now you have a safety net! 🎉
