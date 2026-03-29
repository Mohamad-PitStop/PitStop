-- CreateTable
CREATE TABLE "DiagnosticRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "marque" TEXT NOT NULL,
    "modele" TEXT NOT NULL,
    "variante" TEXT,
    "carburant" TEXT,
    "transmission" TEXT,
    "annee" TEXT NOT NULL,
    "kilometrage" TEXT NOT NULL,
    "probleme" TEXT NOT NULL,
    "followUps" TEXT,
    "promptText" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "DiagnosticRequest_createdAt_idx" ON "DiagnosticRequest"("createdAt");
