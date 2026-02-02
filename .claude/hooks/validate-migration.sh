#!/bin/bash
# Validate SQL migration file

FILE="$1"

# Skip if file doesn't exist
if [ ! -f "$FILE" ]; then
  exit 0
fi

# Skip if not a migration file
if [[ ! "$FILE" =~ \.sql$ ]]; then
  exit 0
fi

# Check SQL syntax (basic) - warnings only, never fail
if ! grep -q ";" "$FILE"; then
  echo "⚠️ Warning: No SQL statements detected in $FILE"
fi

# All checks are warnings only - never block the workflow
exit 0
