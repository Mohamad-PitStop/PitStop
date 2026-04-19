/**
 * Test manuel : simule l'inscription d'un garage et envoie la notification admin.
 * Usage : npx tsx --env-file=.env.local scripts/test-garage-signup-admin-email.ts
 */
import { sendGarageSignupAdminEmail } from "../lib/email-garage-signup-admin"

async function main() {
  const to = process.env.PARTNER_CONTACT_TO || "pitstopbelgique@gmail.com"
  console.log(`[test] envoi vers : ${to}`)
  console.log(`[test] SMTP host  : ${process.env.SMTP_HOST ?? "(manquant)"}`)

  await sendGarageSignupAdminEmail({
    garageId: "test-" + Date.now().toString(36),
    companyName: "Garage Démo Test",
    bceTvaNumber: "BE 0123.456.789",
    street: "Rue de l'Essai 42",
    postalCode: "1050",
    city: "Bruxelles",
    professionalPhone: "+32 2 555 01 23",
    professionalEmail: "contact@garage-demo-test.be",
    managerName: "Jean Démo",
    ownerAccountEmail: "owner@garage-demo-test.be",
    specialties: ["Mécanique", "Diagnostic électronique", "Pneus"],
    createdAt: new Date(),
  })

  console.log("[test] OK — e-mail admin envoyé.")
}

main().catch((err) => {
  console.error("[test] échec :", err)
  process.exit(1)
})
