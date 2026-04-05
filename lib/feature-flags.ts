/**
 * Parcours « Vente » (onglet, page `/vente`, estimateur, API `/api/vente/analyze`).
 *
 * Passer à `true` pour réactiver l’accès public : aucune autre modification nécessaire.
 */
export const VENTE_TAB_ENABLED = false

/**
 * Achat de crédits diagnostics (Stripe) : page `/credits`, packs sur `/profil`, bouton « Acheter »
 * dans la navbar, paiement invité après diagnostic gratuit épuisé, API `/api/credits/create-payment-intent`
 * et `/api/credits/checkout`.
 *
 * Mettre à `true` lorsque la structure juridique permet la vente conformément aux CGV. Les garde-fous UI
 * et API sont conditionnés à ce seul booléen ; le code de paiement (Stripe, CGV, promos) reste en place.
 */
export const CREDIT_PURCHASES_ENABLED = false
