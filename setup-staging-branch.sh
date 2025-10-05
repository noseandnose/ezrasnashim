#!/bin/bash

# Setup Staging Branch Workflow
# Run this script once to establish the staging branch

set -e  # Exit on error

echo "🌿 Setting up staging branch workflow..."
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "❌ Error: Not a git repository"
    echo "   Run: git init"
    exit 1
fi

# Check if we have a remote
if ! git remote | grep -q "origin"; then
    echo "❌ Error: No 'origin' remote configured"
    echo "   Run: git remote add origin <your-repo-url>"
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"
echo ""

# Check if staging branch exists
if git show-ref --verify --quiet refs/heads/staging; then
    echo "✅ Staging branch already exists locally"
else
    echo "🌱 Creating staging branch from $CURRENT_BRANCH..."
    git checkout -b staging
    echo "✅ Created staging branch"
fi

# Push staging branch to remote
echo ""
echo "📤 Pushing staging branch to remote..."
if git push -u origin staging; then
    echo "✅ Staging branch pushed to origin"
else
    echo "⚠️  Could not push staging branch (may already exist on remote)"
fi

# Switch back to original branch
echo ""
echo "🔄 Switching back to $CURRENT_BRANCH..."
git checkout "$CURRENT_BRANCH"

echo ""
echo "✨ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. For future work: git checkout staging"
echo "   2. Make changes on staging branch"
echo "   3. Test on staging deployment"
echo "   4. Merge to main when ready: git checkout main && git merge staging"
echo ""
echo "📖 See docs/GIT_WORKFLOW.md for detailed workflow guide"
