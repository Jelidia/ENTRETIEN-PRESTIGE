#!/bin/bash
# Save important context before compacting

echo "💾 Saving context..."

# Create context backup directory
mkdir -p .claude/context-backups

# Save current state
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=".claude/context-backups/$TIMESTAMP"

mkdir -p "$BACKUP_DIR"

# Save git status
git status > "$BACKUP_DIR/git-status.txt" 2>&1

# Save recent commits
git log -10 --oneline > "$BACKUP_DIR/recent-commits.txt" 2>&1

# Save current branch
git branch --show-current > "$BACKUP_DIR/current-branch.txt" 2>&1

echo "✅ Context saved to $BACKUP_DIR"
