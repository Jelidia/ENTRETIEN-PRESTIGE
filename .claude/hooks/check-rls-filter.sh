#!/bin/bash
# Check if API route queries include company_id filter

FILE="$1"

# Skip if file doesn't exist or isn't an API route
if [ ! -f "$FILE" ] || [[ ! "$FILE" =~ app/api/ ]]; then
  exit 0
fi

# Skip auth routes - they don't need company_id filtering
if [[ "$FILE" =~ app/api/auth/ ]]; then
  exit 0
fi

# Skip if no database queries
if ! grep -q "\.from(" "$FILE"; then
  exit 0
fi

# Check for company_id filtering or service role usage
if grep -q "\.from(" "$FILE"; then
  if ! grep -q "company_id" "$FILE" && ! grep -q "createAdminClient" "$FILE"; then
    echo "⚠️ WARNING: Database query without company_id filter in: $FILE"
    echo "   Consider adding: .eq('company_id', profile.company_id)"
    # Warning only, don't fail
    exit 0
  fi
fi

exit 0
