import fs from "node:fs"
import path from "node:path"
import PDFDocument from "pdfkit"

const outputPath = path.resolve(process.cwd(), "Contrat_vierge_partenariat_PitStop.pdf")

const doc = new PDFDocument({
  size: "A4",
  margin: 48,
  info: {
    Title: "Contrat de partenariat vierge - PitStop",
    Author: "PitStop",
  },
})

doc.pipe(fs.createWriteStream(outputPath))

const title = "CONTRAT DE PARTENARIAT (MODELE VIERGE)"
const subtitle = "PitStop x Garage Partenaire"

doc.font("Helvetica-Bold").fontSize(14).text(title, { align: "center" })
doc.moveDown(0.2)
doc.font("Helvetica").fontSize(11).text(subtitle, { align: "center" })
doc.moveDown(1)

const sections = [
  "Date de signature : ____ / ____ / ______",
  "Lieu de signature : ______________________________",
  "",
  "ENTRE LES SOUSSIGNES",
  "",
  "1) PitStop",
  "Nom legal / nom commercial : ______________________________",
  "Representant : ______________________________",
  "Adresse : ______________________________",
  "Email : ______________________________",
  "",
  "ET",
  "",
  "2) Garage partenaire",
  "Raison sociale : ______________________________",
  "Numero d'entreprise : ______________________________",
  "Representant legal : ______________________________",
  "Adresse du siege : ______________________________",
  "Adresse de l'atelier : ______________________________",
  "Email : ______________________________",
  "Telephone : ______________________________",
  "",
  "Les parties conviennent des clauses suivantes :",
  "",
  "Article 1 - Objet",
  "Le present contrat encadre le partenariat entre PitStop et le Garage partenaire pour la mise en relation",
  "de clients, la prise de rendez-vous et l'execution des prestations de reparation/entretien automobile.",
  "",
  "Article 2 - Nature de la relation",
  "PitStop agit comme intermediaire numerique. Le Garage demeure seul prestataire des interventions en atelier.",
  "",
  "Article 3 - Duree",
  "Date de debut : ____ / ____ / ______",
  "Duree initiale : ______________________________",
  "Renouvellement : ______________________________",
  "",
  "Article 4 - Conditions economiques",
  "Mensualite de partenariat (HTVA) : ______________________________",
  "Modalites de facturation : ______________________________",
  "Modalites de paiement : ______________________________",
  "",
  "Article 5 - Acompte client",
  "Montant de l'acompte applique via la plateforme : ______________________________",
  "Regles d'annulation/no-show applicables : ______________________________",
  "",
  "Article 6 - Engagement de transparence",
  "Le Garage s'engage a justifier tout ecart substantiel entre l'estimation communiquee au client et le devis final.",
  "",
  "Article 7 - Obligations du Garage",
  "- Disposer des autorisations et assurances requises.",
  "- Fournir des prestations conformes aux regles de l'art.",
  "- Maintenir des informations de disponibilite exactes.",
  "",
  "Article 8 - Donnees personnelles",
  "Chaque partie s'engage a respecter le RGPD et la legislation belge applicable.",
  "",
  "Article 9 - Responsabilite",
  "Chaque partie repond de ses propres fautes et manquements dans le cadre de ses obligations contractuelles.",
  "",
  "Article 10 - Suspension et resiliation",
  "Motifs de suspension/resiliation : ______________________________",
  "Preavis : ______________________________",
  "",
  "Article 11 - Droit applicable et juridiction",
  "Le contrat est soumis au droit belge.",
  "Juridiction competente : ______________________________",
  "",
  "Article 12 - Documents contractuels",
  "Le Garage declare avoir pris connaissance et accepte :",
  "- les CGP B2B PitStop ;",
  "- l'annexe SLA ;",
  "- l'annexe Procedure litige / annulation / retard / no-show ;",
  "- tout avenant signe ulterieurement.",
  "",
  "Signatures",
  "",
  "Pour PitStop",
  "Nom : ______________________________",
  "Fonction : ______________________________",
  "Signature et cachet :",
  "",
  "",
  "Pour le Garage partenaire",
  "Nom : ______________________________",
  "Fonction : ______________________________",
  "Signature et cachet :",
]

doc.font("Helvetica").fontSize(10)

for (const line of sections) {
  if (doc.y > 760) {
    doc.addPage()
    doc.font("Helvetica").fontSize(10)
  }
  doc.text(line, { align: "left" })
}

doc.end()

doc.on("finish", () => {
  process.stdout.write(`PDF generated: ${outputPath}\n`)
})

