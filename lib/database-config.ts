/**
 * Aucune base SQLite locale par défaut : l’URL doit être fournie explicitement
 * (ex. Turso / libSQL distant, ou chemin fichier uniquement si vous choisissez ce mode).
 */
export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim()
  if (!url) {
    throw new Error(
      "DATABASE_URL est obligatoire. Définissez-le dans .env.local (voir .env.example), par exemple l’URL libSQL/Turso du projet."
    )
  }
  return url
}

export function getTursoAuthToken(): string | undefined {
  const t = process.env.TURSO_AUTH_TOKEN?.trim()
  return t || undefined
}
