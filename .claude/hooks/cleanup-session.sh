#!/bin/bash
# Cleanup session hook

# Silent cleanup - only output on errors
# Clean up temporary files if they exist
if [ -d ".claude/tmp" ]; then
  find .claude/tmp -type f -delete 2>/dev/null || true
  rmdir .claude/tmp 2>/dev/null || true
fi

# Clear test cache if exists
if [ -d "node_modules/.vitest" ]; then
  find node_modules/.vitest -type f -delete 2>/dev/null || true
fi

exit 0
