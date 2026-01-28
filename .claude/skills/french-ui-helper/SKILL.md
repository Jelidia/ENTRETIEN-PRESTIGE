---
name: french-ui-helper
description: Generate French UI labels, validation messages, and SMS templates for Quebec. Converts English to proper Quebec French with correct grammar and idioms.
argument-hint: "English text to translate (e.g., 'Translate: Customer not found')"
user-invocable: true
allowed-tools:
  - Read
  - Write
model: claude-sonnet-4-5-20250929
context: fork
agent: feature-builder
hooks:
  - type: PostToolUse
    tool: Write
    script: !`.claude/hooks/validate-french-text.sh`
---

# french-ui-helper Skill
## Generate Quebec French UI text and translations

## When to use
Creating forms, buttons, error messages, SMS templates, or any user-facing text

## Example
`/french-ui-helper Translate these button labels: Save, Cancel, Delete, Edit, Create User, Reset Password`

## What it does
1. Converts English to Quebec French
2. Ensures grammatical correctness (gender agreement, accents)
3. Uses Quebec idioms and expressions
4. Provides context-appropriate formality
5. Returns JSON format for easy copy-paste

## Quality checks
- Proper accents (é, è, ê, à, ù, ô, etc.)
- Quebec-specific terms (not France French)
- Correct gender agreement
- Professional tone for business context
- Validation messages in user-friendly language

## Example output
```json
{
  "buttons": {
    "save": "Sauvegarder",
    "cancel": "Annuler",
    "delete": "Supprimer",
    "edit": "Modifier",
    "createUser": "Créer un utilisateur",
    "resetPassword": "Réinitialiser le mot de passe"
  },
  "validation": {
    "required": "Ce champ est requis",
    "emailInvalid": "Email invalide",
    "passwordTooShort": "Mot de passe trop court (min 8 caractères)",
    "passwordMismatch": "Les mots de passe ne correspondent pas"
  },
  "status": {
    "success": "Succès",
    "pending": "En attente",
    "failed": "Échec"
  }
}
```

## Common translations
- Create → Créer
- Update → Mettre à jour / Modifier
- Delete → Supprimer
- Save → Sauvegarder
- Cancel → Annuler
- Settings → Paramètres
- Profile → Profil
- Logout → Se déconnecter
- Login → Se connecter
- Password → Mot de passe
- Email → Courriel / Email
- Phone → Téléphone / Numéro
