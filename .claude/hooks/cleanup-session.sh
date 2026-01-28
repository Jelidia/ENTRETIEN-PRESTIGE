#!/bin/bash
# Cleanup session hook

echo "🧹 Cleaning up session..."

# Clean up temporary files
if [ -d ".claude/tmp" ]; then
  rm -rf .claude/tmp
  echo "✅ Cleaned temporary files"
fi

# Clear test cache if exists
if [ -d "node_modules/.vitest" ]; then
  rm -rf node_modules/.vitest
  echo "✅ Cleared test cache"
fi

echo "✅ Cleanup complete"
