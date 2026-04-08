/**
 * Parcours « Vente » (onglet, page `/vente`, estimateur, API `/api/vente/analyze`).
 *
 * Passer à `true` pour réactiver l’accès public : aucune autre modification nécessaire.
 */
export const VENTE_TAB_ENABLED = false

/**
 * Achat de crédits diagnostics (Stripe) : page `/credits`, packs sur `/profil`, bouton « Acheter »
 * dans la navbar, API `/api/credits/create-payment-intent` et `/api/credits/checkout`.
 *
 * Mettre à `false` pour désactiver temporairement la boutique (UI, API paiement, redirections vers `/credits`).
 *
 * À `true` : utilisateur à 0 crédit orienté vers `/credits` ; achat via Stripe soumis aux CGV.
 */
export const CREDIT_PURCHASES_ENABLED = true

/**
 * Phase de test : à la vérification d’email, attribution systématique d’1 crédit diagnostic + modale de remerciement
 * sur l’accueil (`/?welcome_test=1`). Désactiver quand la politique commerciale définitive est en place.
 */
export const TEST_PHASE_SIGNUP_BONUS_ENABLED = true
