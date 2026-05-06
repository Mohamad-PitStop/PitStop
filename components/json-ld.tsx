/**
 * Composant générique pour injecter du JSON-LD côté serveur.
 * `dangerouslySetInnerHTML` est le pattern officiel Next pour les structured data.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
