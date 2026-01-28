#!/bin/bash
# Check if API route queries include company_id filter

FILE="$1"

echo "🔍 Checking RLS filtering: $FILE"

# Check if file contains Supabase queries
if ! grep -q "\.from(" "$FILE"; then
  echo "✅ No database queries found"
  exit 0
fi

# Check for company_id filtering
if grep -q "\.from(" "$FILE"; then
  if ! grep -q "company_id" "$FILE"; then
    echo "⚠️ WARNING: Database query without company_id filter detected"
    echo "   This could leak data across companies!"
    echo "   Add: .eq('company_id', profile.company_id)"
    exit 1
  fi
fi

echo "✅ company_id filtering present"
exit 0
