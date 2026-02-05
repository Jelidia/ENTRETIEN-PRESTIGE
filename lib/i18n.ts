/**
 * Internationalization (i18n) — Field Service Management Platform
 * Default: French (fr)
 * Supported: French (fr), English (en)
 */

export type Language = "fr" | "en";

type TranslationKey = string;
type Translations = Record<Language, Record<TranslationKey, string>>;

export const translations: Translations = {
  fr: {
    // Common
    "common.loading": "Chargement...",
    "common.save": "Sauvegarder",
    "common.cancel": "Annuler",
    "common.delete": "Supprimer",
    "common.edit": "Modifier",
    "common.create": "Créer",
    "common.close": "Fermer",
    "common.confirm": "Confirmer",
    "common.yes": "Oui",
    "common.no": "Non",
    "common.search": "Rechercher",
    "common.filter": "Filtrer",
    "common.export": "Exporter",
    "common.import": "Importer",
    "common.upload": "Télécharger",
    "common.download": "Télécharger",
    "common.back": "Retour",
    "common.next": "Suivant",
    "common.previous": "Précédent",
    "common.submit": "Soumettre",
    "common.reset": "Réinitialiser",

    // Navigation
    "nav.dashboard": "Tableau de bord",
    "nav.dispatch": "Répartition",
    "nav.jobs": "Travaux",
    "nav.customers": "Clients",
    "nav.invoices": "Factures",
    "nav.sales": "Ventes",
    "nav.operations": "Opérations",
    "nav.reports": "Rapports",
    "nav.team": "Équipe",
    "nav.notifications": "Notifications",
    "nav.settings": "Paramètres",
    "nav.technician": "Technicien",

    // Settings
    "settings.title": "Paramètres",
    "settings.subtitle": "Gérez votre profil et vos préférences",
    "settings.profile": "Mon profil",
    "settings.security": "Sécurité",
    "settings.documents": "Documents",
    "settings.language": "Langue",
    "settings.language.french": "Français",
    "settings.language.english": "English",
    "settings.notifications": "Notifications",
    "settings.territory": "Territoire assigné",

    // Profile
    "profile.name": "Nom",
    "profile.email": "Email",
    "profile.phone": "Téléphone",
    "profile.role": "Rôle",
    "profile.status": "Statut",
    "profile.created": "Inscrit le",
    "profile.avatar": "Photo de profil",
    "profile.edit": "Modifier le profil",
    "profile.edit.name": "Modifier le nom",

    // Security
    "security.password": "Mot de passe",
    "security.password.current": "Mot de passe actuel",
    "security.password.new": "Nouveau mot de passe",
    "security.password.confirm": "Confirmer le mot de passe",
    "security.password.change": "Changer le mot de passe",
    "security.password.strength": "Force du mot de passe",
    "security.password.strength.weak": "Faible",
    "security.password.strength.medium": "Moyen",
    "security.password.strength.strong": "Fort",
    "security.2fa": "Authentification à deux facteurs",
    "security.2fa.enable": "Activer 2FA",
    "security.2fa.disable": "Désactiver 2FA",

    // Documents
    "documents.contract": "Contrat signé",
    "documents.id": "Pièce d'identité",
    "documents.id.front": "Recto",
    "documents.id.back": "Verso",
    "documents.upload": "Télécharger un document",
    "documents.view": "Afficher le document",
    "documents.status.signed": "Signé",
    "documents.status.pending": "En attente",

    // Team
    "team.title": "Équipe",
    "team.members": "membres",
    "team.member": "membre",
    "team.add": "Ajouter membre",
    "team.edit": "Modifier membre",
    "team.delete": "Supprimer membre",
    "team.permissions": "Permissions",
    "team.permissions.edit": "Modifier les permissions",
    "team.role": "Rôle",
    "team.status": "Statut",

    // Roles
    "role.admin": "Administrateur",
    "role.manager": "Gestionnaire",
    "role.sales_rep": "Représentant",
    "role.technician": "Technicien",
    "role.dispatcher": "Répartiteur",

    // Status
    "status.active": "Actif",
    "status.inactive": "Inactif",
    "status.suspended": "Suspendu",
    "status.pending": "En attente",

    // Logout
    "logout.title": "Se déconnecter",
    "logout.confirm": "Confirmer la déconnexion",
    "logout.message": "Êtes-vous sûr? Vous serez déconnecté.",

    // Errors
    "error.session.expired": "Votre session a expiré. Veuillez vous reconnecter.",
    "error.forbidden": "Vous n'avez pas la permission d'accéder à cette page.",
    "error.not.found": "Page introuvable.",
    "error.server": "Une erreur serveur s'est produite.",
    "error.network": "Erreur de connexion réseau.",
    "error.unknown": "Une erreur inconnue s'est produite.",
  },
  en: {
    // Common
    "common.loading": "Loading...",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.create": "Create",
    "common.close": "Close",
    "common.confirm": "Confirm",
    "common.yes": "Yes",
    "common.no": "No",
    "common.search": "Search",
    "common.filter": "Filter",
    "common.export": "Export",
    "common.import": "Import",
    "common.upload": "Upload",
    "common.download": "Download",
    "common.back": "Back",
    "common.next": "Next",
    "common.previous": "Previous",
    "common.submit": "Submit",
    "common.reset": "Reset",

    // Navigation
    "nav.dashboard": "Dashboard",
    "nav.dispatch": "Dispatch",
    "nav.jobs": "Jobs",
    "nav.customers": "Customers",
    "nav.invoices": "Invoices",
    "nav.sales": "Sales",
    "nav.operations": "Operations",
    "nav.reports": "Reports",
    "nav.team": "Team",
    "nav.notifications": "Notifications",
    "nav.settings": "Settings",
    "nav.technician": "Technician",

    // Settings
    "settings.title": "Settings",
    "settings.subtitle": "Manage your profile and preferences",
    "settings.profile": "My profile",
    "settings.security": "Security",
    "settings.documents": "Documents",
    "settings.language": "Language",
    "settings.language.french": "Français",
    "settings.language.english": "English",
    "settings.notifications": "Notifications",
    "settings.territory": "Assigned territory",

    // Profile
    "profile.name": "Name",
    "profile.email": "Email",
    "profile.phone": "Phone",
    "profile.role": "Role",
    "profile.status": "Status",
    "profile.created": "Joined on",
    "profile.avatar": "Profile photo",
    "profile.edit": "Edit profile",
    "profile.edit.name": "Edit name",

    // Security
    "security.password": "Password",
    "security.password.current": "Current password",
    "security.password.new": "New password",
    "security.password.confirm": "Confirm password",
    "security.password.change": "Change password",
    "security.password.strength": "Password strength",
    "security.password.strength.weak": "Weak",
    "security.password.strength.medium": "Medium",
    "security.password.strength.strong": "Strong",
    "security.2fa": "Two-factor authentication",
    "security.2fa.enable": "Enable 2FA",
    "security.2fa.disable": "Disable 2FA",

    // Documents
    "documents.contract": "Signed contract",
    "documents.id": "ID document",
    "documents.id.front": "Front",
    "documents.id.back": "Back",
    "documents.upload": "Upload document",
    "documents.view": "View document",
    "documents.status.signed": "Signed",
    "documents.status.pending": "Pending",

    // Team
    "team.title": "Team",
    "team.members": "members",
    "team.member": "member",
    "team.add": "Add member",
    "team.edit": "Edit member",
    "team.delete": "Delete member",
    "team.permissions": "Permissions",
    "team.permissions.edit": "Edit permissions",
    "team.role": "Role",
    "team.status": "Status",

    // Roles
    "role.admin": "Administrator",
    "role.manager": "Manager",
    "role.sales_rep": "Sales Representative",
    "role.technician": "Technician",
    "role.dispatcher": "Dispatcher",

    // Status
    "status.active": "Active",
    "status.inactive": "Inactive",
    "status.suspended": "Suspended",
    "status.pending": "Pending",

    // Logout
    "logout.title": "Logout",
    "logout.confirm": "Confirm logout",
    "logout.message": "Are you sure? You will be logged out.",

    // Errors
    "error.session.expired": "Your session has expired. Please login again.",
    "error.forbidden": "You don't have permission to access this page.",
    "error.not.found": "Page not found.",
    "error.server": "A server error occurred.",
    "error.network": "Network connection error.",
    "error.unknown": "An unknown error occurred.",
  },
};

export function getTranslation(language: Language, key: TranslationKey): string {
  return translations[language][key] || key;
}

export function getDefaultLanguage(): Language {
  if (typeof window === "undefined") {
    return "fr";
  }
  const stored = localStorage.getItem("ep_language");
  if (stored === "en" || stored === "fr") {
    return stored;
  }
  return "fr";
}

export function setLanguage(language: Language): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("ep_language", language);
  }
}
