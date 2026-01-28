#!/bin/bash
# Session end hook

echo "📊 Session Summary"
echo ""

# Count modified files
if command -v git &> /dev/null; then
  MODIFIED=$(git status --short 2>/dev/null | wc -l)
  echo "📝 Modified files: $MODIFIED"

  if [ $MODIFIED -gt 0 ]; then
    echo ""
    echo "Changed files:"
    git status --short
  fi
fi

echo ""
echo "💡 Before you go:"
echo "   - Run tests: npm test"
echo "   - Check build: npm run build"
echo "   - Review changes: git diff"
echo "   - Update docs if needed"
echo ""
echo "👋 See you next time!"
