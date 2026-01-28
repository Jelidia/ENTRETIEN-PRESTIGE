#!/bin/bash
# Validate SQL migration file

FILE="$1"

echo "🔍 Validating migration: $FILE"

# Check if file exists
if [ ! -f "$FILE" ]; then
  echo "❌ File not found: $FILE"
  exit 1
fi

# Check for RLS policies
if ! grep -q "ENABLE ROW LEVEL SECURITY" "$FILE"; then
  echo "⚠️ Warning: No RLS policies found in migration"
  echo "   Consider adding: ALTER TABLE [table] ENABLE ROW LEVEL SECURITY;"
fi

# Check for company_id column in CREATE TABLE statements
if grep -q "CREATE TABLE" "$FILE"; then
  if ! grep -q "company_id" "$FILE"; then
    echo "⚠️ Warning: CREATE TABLE without company_id column"
    echo "   Multi-tenancy requires company_id on all tables"
  fi
fi

# Check for indexes
if ! grep -q "CREATE INDEX" "$FILE"; then
  echo "⚠️ Warning: No indexes found"
  echo "   Consider adding indexes for frequently queried columns"
fi

# Check for rollback instructions
if ! grep -q -i "rollback\|drop\|remove" "$FILE"; then
  echo "⚠️ Warning: No rollback instructions found"
  echo "   Add comments explaining how to undo this migration"
fi

# Check SQL syntax (basic)
if grep -q ";" "$FILE"; then
  echo "✅ SQL statements found"
else
  echo "❌ No SQL statements detected (missing semicolons?)"
  exit 1
fi

echo "✅ Migration validation complete"
exit 0
