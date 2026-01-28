#!/bin/bash
# Generate subagent completion report

AGENT_NAME="$1"

echo "📋 Subagent Report: $AGENT_NAME"
echo "================================"
echo ""
echo "Completed at: $(date)"
echo ""

# Check for modified files
if command -v git &> /dev/null; then
  MODIFIED=$(git status --short 2>/dev/null | wc -l)

  if [ $MODIFIED -gt 0 ]; then
    echo "Files modified:"
    git status --short
    echo ""
  fi
fi

echo "✅ $AGENT_NAME completed successfully"
