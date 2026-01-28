#!/bin/bash
# Project setup hook

echo "🔧 Setting up Claude Code for Entretien Prestige..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
else
  echo "✅ Dependencies already installed"
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
  echo "⚠️ .env.local not found"
  echo "   Copy .env.example to .env.local and fill in values"
else
  echo "✅ .env.local exists"
fi

# Verify key files exist
echo "🔍 Verifying project structure..."

KEY_FILES=(
  "CLAUDE.md"
  "ENTRETIEN_PRESTIGE_FINAL_SPEC-1.md"
  "package.json"
  "tsconfig.json"
  "vitest.config.ts"
  ".claude/agents"
  ".claude/skills"
)

for file in "${KEY_FILES[@]}"; do
  if [ -e "$file" ]; then
    echo "✅ $file"
  else
    echo "❌ Missing: $file"
  fi
done

echo ""
echo "✅ Setup complete!"
