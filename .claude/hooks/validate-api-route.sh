#!/bin/bash
# Validate API route has proper auth, validation, and error handling

FILE="$1"

echo "🔍 Validating API route: $FILE"

ERRORS=0

# Check for authentication
if ! grep -q "requireUser\|requireRole\|requirePermission" "$FILE"; then
  echo "❌ Missing authentication check (requireUser/requireRole/requirePermission)"
  ERRORS=$((ERRORS + 1))
fi

# Check for input validation
if grep -q "request\.json()" "$FILE"; then
  if ! grep -q "safeParse\|parse" "$FILE"; then
    echo "❌ Missing Zod validation (use .safeParse())"
    ERRORS=$((ERRORS + 1))
  fi
fi

# Check for error handling
if ! grep -q "try.*catch\|if.*error" "$FILE"; then
  echo "⚠️ Warning: No error handling detected"
fi

# Check for proper error responses
if ! grep -q "status.*400\|status.*401\|status.*403\|status.*500" "$FILE"; then
  echo "⚠️ Warning: No error status codes found"
fi

# Check for NextResponse usage
if ! grep -q "NextResponse" "$FILE"; then
  echo "❌ Missing NextResponse import"
  ERRORS=$((ERRORS + 1))
fi

if [ $ERRORS -gt 0 ]; then
  echo "❌ Validation failed with $ERRORS error(s)"
  exit 1
fi

echo "✅ API route validation passed"
exit 0
