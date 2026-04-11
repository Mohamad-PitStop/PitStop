/**
 * La page diagnostic est accessible à tous les utilisateurs connectés, quel que soit leur solde.
 * Les utilisateurs sans crédits voient un message inline dans le formulaire qui leur permet d'acheter
 * sans être redirigés. Les non-connectés sont gérés côté client (DiagnosticGuestGate).
 */
export async function ensureDiagnosticPageAccess(): Promise<void> {
  // No-op : plus de redirection basée sur le solde.
}
