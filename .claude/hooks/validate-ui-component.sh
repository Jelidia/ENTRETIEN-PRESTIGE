#!/bin/bash
# Validate UI component follows mobile-first and French UI requirements

FILE="$1"

echo "🔍 Validating UI component: $FILE"

WARNINGS=0

# Check for max-width constraint
if ! grep -q "max-w-\[640px\]\|max-w-2xl" "$FILE"; then
  echo "⚠️ Missing max-width constraint (should be 640px)"
  echo "   Add: className=\"max-w-[640px] mx-auto\""
  WARNINGS=$((WARNINGS + 1))
fi

# Check for French text (basic check)
if grep -q -E ">(Save|Cancel|Submit|Delete|Edit|Create|Update|Close|Open)" "$FILE"; then
  echo "⚠️ English button text detected"
  echo "   Use French: Enregistrer, Annuler, Soumettre, Supprimer, Modifier, Créer, Mettre à jour, Fermer, Ouvrir"
  WARNINGS=$((WARNINGS + 1))
fi

# Check for accessibility
if grep -q "<button" "$FILE"; then
  if ! grep -q "aria-label\|aria-describedby" "$FILE"; then
    echo "⚠️ Buttons without aria-label detected"
    echo "   Add aria-label for accessibility"
    WARNINGS=$((WARNINGS + 1))
  fi
fi

# Check for responsive classes
if ! grep -q "md:\|lg:\|sm:" "$FILE"; then
  echo "⚠️ No responsive breakpoints found"
  echo "   Consider adding responsive classes (md:, lg:, etc.)"
  WARNINGS=$((WARNINGS + 1))
fi

if [ $WARNINGS -gt 0 ]; then
  echo "⚠️ Component validation completed with $WARNINGS warning(s)"
else
  echo "✅ Component validation passed"
fi

exit 0
