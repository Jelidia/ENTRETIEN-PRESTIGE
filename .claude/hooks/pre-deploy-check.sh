#!/bin/bash
# Pre-deployment checks

echo "🚀 Running pre-deployment checks..."

ERRORS=0

# 1. Build check
echo "📦 Checking build..."
if npm run build > /dev/null 2>&1; then
  echo "✅ Build successful"
else
  echo "❌ Build failed"
  ERRORS=$((ERRORS + 1))
fi

# 2. Lint check
echo "🔍 Running linter..."
if npm run lint > /dev/null 2>&1; then
  echo "✅ Lint passed"
else
  echo "❌ Lint failed"
  ERRORS=$((ERRORS + 1))
fi

# 3. Test check
echo "🧪 Running tests..."
if npm test -- --run > /dev/null 2>&1; then
  echo "✅ Tests passed"
else
  echo "❌ Tests failed"
  ERRORS=$((ERRORS + 1))
fi

# 4. Environment variables check
echo "🔐 Checking environment variables..."
if [ -f ".env.example" ]; then
  echo "✅ .env.example exists"
else
  echo "⚠️ .env.example not found"
fi

# 5. Migrations check
echo "💾 Checking database migrations..."
if [ -d "db/migrations" ] && [ "$(ls -A db/migrations 2>/dev/null)" ]; then
  echo "✅ Migrations directory exists with files"
else
  echo "⚠️ No migrations found"
fi

# 6. Check for console.log
echo "🐛 Checking for console.log statements..."
if grep -r "console\.log" app/ --include="*.ts" --include="*.tsx" > /dev/null 2>&1; then
  echo "⚠️ console.log statements found in app/"
  echo "   Remove before deploying to production"
else
  echo "✅ No console.log in production code"
fi

# Summary
echo ""
echo "================================"
if [ $ERRORS -eq 0 ]; then
  echo "✅ All pre-deployment checks passed!"
  echo "================================"
  exit 0
else
  echo "❌ Pre-deployment checks failed: $ERRORS error(s)"
  echo "================================"
  exit 1
fi
