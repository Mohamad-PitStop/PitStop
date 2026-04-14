import nextPlugin from "eslint-config-next"

export default [
  ...nextPlugin,
  {
    settings: {
      // Empêche eslint-plugin-react d'auto-détecter la version React via
      // une API supprimée dans ESLint 9+ (contextOrFilename.getFilename)
      react: { version: "19.2.4" },
    },
    rules: {
      // Autorise les any explicites (raw queries Prisma, LibSQL)
      "@typescript-eslint/no-explicit-any": "off",

      // Faux positifs systématiques sur du texte français (apostrophes)
      "react/no-unescaped-entities": "off",

      // Trop strict : setState dans useEffect est un pattern valide
      // (ex: initialisation depuis localStorage, réponse à un fetch)
      "react-hooks/set-state-in-effect": "off",

      // Faux positif : Math.random() dans useMemo(()=>{}, []) est safe
      "react-hooks/purity": "off",
    },
  },
]
