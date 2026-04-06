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
 * Mettre à `true` pour réactiver la vente de crédits (Stripe) lorsque tu es prêt côté exploitation. Les garde-fous UI
 * et API sont conditionnés à ce seul booléen ; le code de paiement (Stripe, CGV, promos) reste en place.
 *
 * À `false` (phase de test sans boutique), un utilisateur à 0 crédit est orienté vers `/merci` au lieu de `/credits`.
 */
export const CREDIT_PURCHASES_ENABLED = false

/**
 * Phase de test : à la vérification d’email, attribution systématique d’1 crédit diagnostic + modale de remerciement
 * sur l’accueil (`/?welcome_test=1`). Désactiver quand la politique commerciale définitive est en place.
 */
export const TEST_PHASE_SIGNUP_BONUS_ENABLED = true
