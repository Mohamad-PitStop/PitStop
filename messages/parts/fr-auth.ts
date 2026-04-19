export const frAuth = {
  auth: {
    sessionCheck: "Vérification de la session…",
    loginFail: "Impossible de se connecter.",
    connexionTitle: "Connexion",
    connexionDesc:
      "Connectez-vous pour accéder au diagnostic, à votre historique et à votre solde de crédits.",
    forgotPassword: "Mot de passe oublié ?",
    signingIn: "Connexion...",
    signIn: "Se connecter",
    noAccount: "Pas encore de compte ?",
    createAccount: "Créer un compte",
    garagePartnerHint: "Vous êtes garage partenaire ou employé ?",
    garagePartnerCta: "Inscription et espace professionnel",
    diagnosticBanner:
      "Connectez-vous pour lancer un diagnostic ou consulter une analyse déjà enregistrée. Pas encore de compte ? Utilisez le lien ci-dessous.",
    signupFail: "Impossible de créer le compte.",
    signupTitle: "Créer un compte",
    signupDesc:
      "Créez votre compte PitStop pour retrouver vos diagnostics et accéder aux prochaines fonctionnalités.",
    diagnosticNeedAccount:
      "Le diagnostic nécessite un compte PitStop. Inscrivez-vous, puis confirmez votre adresse e-mail depuis le message que nous vous envoyons.",
    verifyEmailTitle: "Vérifiez votre boîte mail",
    verifyEmailBody:
      "Un email de confirmation a été envoyé à {{email}}. Cliquez sur le lien dans cet email pour activer votre compte.",
    verifyEmailHint: "Le lien est valable 24 heures. Pensez à vérifier vos spams.",
    resendSent: "Email renvoyé ! Vérifiez votre boîte de réception.",
    resendFail: "Impossible d'envoyer l'email. Réessayez dans quelques instants.",
    resending: "Envoi en cours…",
    resendButton: "Renvoyer l'email de confirmation",
    wrongEmail: "Mauvais email ?",
    restartSignup: "Recommencer l'inscription",
    fullName: "Nom complet",
    namePlaceholder: "Ex : Marc Dupont",
    postalCode: "Code postal",
    city: "Commune ou ville",
    cityPlaceholder: "ex. Charleroi",
    postalTitle: "4 chiffres (Belgique)",
    belgiumOnlyLocation:
      "Malheureusement, PitStop n’est disponible qu’en Belgique pour le moment.",
    signupStatsNote:
      "Ces indications sont utilisées uniquement sous forme de statistiques globales pour adapter notre réseau de garages partenaires (voir notre",
    privacyLink: "politique de confidentialité",
    signupStatsNoteEnd: ").",
    passwordPlaceholder: "8 caractères minimum",
    creating: "Envoi en cours…",
    createMyAccount: "Créer mon compte",
    acceptTerms:
      "En créant un compte, vous acceptez nos",
    legalLink: "mentions légales",
    andOur: "et notre",
    alreadyAccount: "Déjà un compte ?",
    emailPlaceholder: "vous@exemple.be",
    oauthContinueWith: "Continuer avec {{provider}}",
    oauthSignupWith: "S'inscrire avec {{provider}}",
    oauthDivider: "ou",
    oauthAccessDenied: "Connexion annulée. Vous pouvez réessayer ou utiliser un email.",
    oauthEmailConflict:
      "Un compte PitStop existe déjà avec cette adresse email. Connectez-vous par email, puis liez Google depuis votre profil.",
    oauthMissingEmail:
      "Votre fournisseur n'a pas partagé d'adresse email. Autorisez le partage de l'email ou créez un compte classique.",
    oauthNotConfigured: "Cette méthode de connexion n'est pas encore disponible.",
    oauthGenericError: "La connexion a échoué. Réessayez ou utilisez votre email.",
  },
  complete: {
    title: "Finalisez votre inscription",
    description:
      "Indiquez votre code postal et votre commune pour que nous puissions adapter l'offre PitStop à votre région.",
    save: "Enregistrer et continuer",
    saving: "Enregistrement…",
    skip: "Passer cette étape",
    saveError: "Impossible d'enregistrer vos informations.",
    mandatoryWarning:
      "Votre inscription n'est pas encore finalisée. Tant que vous n'enregistrez pas, aucun compte n'est créé. Si vous quittez cette page, vous devrez recommencer depuis le début.",
    sessionExpired:
      "Votre session d'inscription a expiré. Recommencez avec Google pour finaliser.",
    emailAlreadyUsed:
      "Un compte utilise déjà cet email. Essayez de vous connecter.",
  },
} as const
