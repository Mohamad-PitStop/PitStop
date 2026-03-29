-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "vehicleMarque" TEXT,
    "vehicleModele" TEXT,
    "vehicleAnnee" INTEGER,
    "vehicleKm" INTEGER,
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME NOT NULL,
    "timeZone" TEXT NOT NULL DEFAULT 'Europe/Brussels',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "stripeSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "calendarId" TEXT,
    "calendarEventId" TEXT,
    "notes" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_stripeSessionId_key" ON "Reservation"("stripeSessionId");

-- CreateIndex
CREATE INDEX "Reservation_status_startAt_idx" ON "Reservation"("status", "startAt");
