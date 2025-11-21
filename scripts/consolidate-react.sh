#!/bin/bash

# Architecture Consolidation Script: React Framework Selection
# This script helps consolidate the codebase after choosing React over Angular

set -e

echo "🏗️  Starting React Architecture Consolidation..."

# Check if Angular directory exists
if [ -d "frontend" ]; then
    echo "🗑️  Removing deprecated Angular frontend..."
    rm -rf frontend/
    echo "✅ Angular frontend removed"
else
    echo "ℹ️  Angular frontend already removed"
fi

# Update package.json scripts to remove Angular references
echo "📝 Updating package.json scripts..."
# Remove Angular-specific scripts if they exist
jq 'del(.scripts."ng", .scripts."start:angular", .scripts."build:angular")' package.json > package.json.tmp && mv package.json.tmp package.json

echo "🧹 Cleaning up build artifacts..."
# Remove any Angular build outputs
rm -rf cmd/server/dist/
rm -rf dist/ 2>/dev/null || true

echo "📚 Updating documentation..."
# The README.md and ARCHITECTURE.md have already been updated

echo "🔧 Verifying React setup..."
# Ensure React dependencies are properly installed
npm install

echo "✅ Architecture consolidation complete!"
echo ""
echo "Next steps:"
echo "1. Run 'npm run build' to verify React build works"
echo "2. Run 'npm run dev' to start development server"
echo "3. Run 'npm test' to verify all tests pass"
echo "4. Commit changes: 'git add . && git commit -m \"feat: consolidate on React framework\"'"

echo ""
echo "🎉 Your codebase now uses React as the single frontend framework!"
