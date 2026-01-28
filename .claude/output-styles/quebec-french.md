---
name: quebec-french
description: Quebec-focused output style for French UI development. Enforces proper Quebec French grammar, idioms, and terminology.
keep-coding-instructions: true
---

# Quebec French Output Style

## Language Requirements

### French First
- ALL UI text MUST be in Quebec French
- Error messages in French for customers
- SMS templates in proper Quebec French
- Comments can be in English (for technical context)
- Code identifiers in English (functions, variables)

### Quebec Terminology
Use Quebec-specific terms, not European French:
- ✅ "Courriel" not "E-mail"
- ✅ "Téléphone" not "Téléphone mobile"
- ✅ "Clavardage" not "Chat"
- ✅ "Fin de semaine" not "Weekend"
- ✅ "Stationnement" not "Parking"
- ✅ "Magasinage" not "Shopping"

### Professional Tone
- Use formal "vous" for customer communications
- Professional but friendly tone
- Clear, concise instructions
- No slang or anglicisms

## UI Labels

### Forms
```tsx
// ✅ Correct
<label>Nom complet</label>
<input placeholder="Entrez votre nom" />
<button>Enregistrer</button>

// ❌ Wrong
<label>Full Name</label>
<input placeholder="Enter your name" />
<button>Save</button>
```

### Error Messages
```tsx
// ✅ Correct
"L'adresse courriel est requise"
"Le numéro de téléphone est invalide"
"Veuillez remplir tous les champs obligatoires"

// ❌ Wrong
"Email address is required"
"Phone number is invalid"
"Please fill all required fields"
```

### Status Messages
```tsx
// ✅ Correct
"En attente" // pending
"En cours" // in progress
"Terminé" // completed
"Annulé" // cancelled

// ❌ Wrong
"Pending"
"In Progress"
"Completed"
"Cancelled"
```

## SMS Templates

### Formatting
- Maximum 160 characters when possible
- Use proper accents (é, è, ê, à, ç)
- Professional but conversational
- Include clear call-to-action

### Examples
```typescript
// Job scheduled
"Bonjour {customerName}, votre service est prévu le {date} à {time}. Merci de nous contacter si vous avez des questions."

// Reminder
"Rappel: Votre nettoyage est prévu demain à {time}. À bientôt!"

// Completion
"Service terminé! Payez en ligne: {paymentLink}"
```

## Validation Messages

### Required Fields
```typescript
"Ce champ est obligatoire"
"Veuillez entrer {fieldName}"
```

### Format Errors
```typescript
"Format de courriel invalide"
"Le numéro de téléphone doit contenir 10 chiffres"
"La date doit être au format JJ/MM/AAAA"
```

### Business Rules
```typescript
"Le montant minimum est de {amount}$"
"La date doit être dans le futur"
"Ce client existe déjà"
```

## Documentation

### Code Comments
```typescript
// English for technical context is OK
// This function calculates pricing based on 5 factors

// French for business logic is preferred
// Calcule le prix avec rabais de volume (10% après 5 services)
```

### User-Facing Documentation
- MUST be in French
- Clear instructions
- Screenshots with French UI
- Quebec-specific examples

## Quality Checklist

Before submitting French content, verify:
- ✅ All customer-facing text is in French
- ✅ Quebec terminology used (not European French)
- ✅ Proper accents on all characters
- ✅ Professional "vous" form for customers
- ✅ No anglicisms or English phrases
- ✅ SMS templates under 160 chars when possible
- ✅ Error messages are user-friendly
- ✅ Status badges translated
- ✅ Button labels translated
- ✅ Form placeholders translated

## Common Mistakes to Avoid

### Anglicisms
❌ "Cliquez ici" → ✅ "Cliquez ici" (this one is OK)
❌ "Downloader" → ✅ "Télécharger"
❌ "Chatter" → ✅ "Clavarder"
❌ "Email" → ✅ "Courriel"

### European French
❌ "Mail" → ✅ "Courriel"
❌ "GSM" → ✅ "Téléphone"
❌ "Weekend" → ✅ "Fin de semaine"

### Informal Tone
❌ "T'as un problème?" → ✅ "Avez-vous un problème?"
❌ "Clique ici" → ✅ "Cliquez ici"
❌ "Ton compte" → ✅ "Votre compte"
