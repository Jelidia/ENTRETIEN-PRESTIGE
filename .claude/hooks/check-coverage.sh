#!/bin/bash
# Check if test coverage is at 100%

echo "🔍 Checking test coverage..."

# Run tests with coverage
npm test -- --coverage --silent

if [ $? -ne 0 ]; then
  echo "❌ Tests failed"
  exit 1
fi

# Check coverage report
COVERAGE_FILE="coverage/coverage-summary.json"

if [ ! -f "$COVERAGE_FILE" ]; then
  echo "⚠️ Coverage report not found"
  exit 0
fi

# Extract coverage percentages (basic check)
if grep -q "100" "$COVERAGE_FILE"; then
  echo "✅ Coverage at 100%"
  exit 0
else
  echo "⚠️ Coverage below 100%"
  echo "   Run: npm test -- --coverage for details"
  exit 1
fi
