-- Baseline SQLite unique : schéma aligné sur prisma/schema.prisma (généré via prisma migrate diff).
-- Remplace les anciennes migrations fragmentées. En cas d’historique _prisma_migrations incompatible,
-- repartir d’une base neuve ou rebaseline selon votre hébergeur.

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
    "notes" TEXT,
    "cancelToken" TEXT,
    "userId" TEXT,
    "garageId" TEXT
);

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
    "promptText" TEXT NOT NULL,
    "userId" TEXT
);

-- CreateTable
CREATE TABLE "BlockedSlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME NOT NULL,
    "label" TEXT
);

-- CreateTable
CREATE TABLE "CustomSlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME NOT NULL,
    "label" TEXT
);

-- CreateTable
CREATE TABLE "UserAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "diagnosticCredits" INTEGER NOT NULL DEFAULT 0,
    "signupPostalCode" TEXT,
    "signupCity" TEXT,
    "garageId" TEXT
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PendingRoleAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "WelcomeCreditGrant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ipHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "StripeCreditApplied" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "credits" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "AdminCreditGrant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adminUserId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "targetEmail" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "reason" TEXT
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "used" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "PendingEmailVerification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "postalCode" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT ''
);

-- CreateTable
CREATE TABLE "PendingGarageRegistration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'owner',
    "garageData" TEXT,
    "garageId" TEXT
);

-- CreateTable
CREATE TABLE "Garage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "garageCode" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "bceTvaNumber" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'BE',
    "iban" TEXT NOT NULL,
    "professionalPhone" TEXT NOT NULL,
    "professionalEmail" TEXT NOT NULL,
    "managerName" TEXT NOT NULL,
    "managerUserId" TEXT,
    "specialties" TEXT NOT NULL DEFAULT '[]',
    "businessHours" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvedAt" DATETIME,
    "suspendedAt" DATETIME,
    "suspendedReason" TEXT
);

-- CreateTable
CREATE TABLE "GarageEmployee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "garageId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT,
    "invitedByUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'invited'
);

-- CreateTable
CREATE TABLE "GarageClosure" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "garageId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "reason" TEXT,
    "createdByUserId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "GarageBlockedSlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "garageId" TEXT NOT NULL,
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME NOT NULL,
    "label" TEXT,
    "createdByUserId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "GarageHoursChangeRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "garageId" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "currentHours" TEXT NOT NULL,
    "proposedHours" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "adminNote" TEXT,
    "processedAt" DATETIME,
    "processedByUserId" TEXT
);

-- CreateTable
CREATE TABLE "DepositPayout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "garageId" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "readyAt" DATETIME,
    "requestedAt" DATETIME,
    "transferredAt" DATETIME,
    "transferReference" TEXT,
    "processedByUserId" TEXT
);

-- CreateTable
CREATE TABLE "PromoCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "discountType" TEXT NOT NULL,
    "discountValue" INTEGER NOT NULL,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "active" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reservedForUserId" TEXT
);

-- CreateTable
CREATE TABLE "PromoCodeUsage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "promoCodeId" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "userId" TEXT,
    "context" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "CreditGiftCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "code" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "active" INTEGER NOT NULL DEFAULT 1,
    "label" TEXT
);

-- CreateTable
CREATE TABLE "CreditGiftRedemption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "giftCodeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "creditsGranted" INTEGER NOT NULL,
    "ipHash" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_stripeSessionId_key" ON "Reservation"("stripeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_cancelToken_key" ON "Reservation"("cancelToken");

-- CreateIndex
CREATE INDEX "Reservation_status_startAt_idx" ON "Reservation"("status", "startAt");

-- CreateIndex
CREATE INDEX "Reservation_cancelToken_idx" ON "Reservation"("cancelToken");

-- CreateIndex
CREATE INDEX "Reservation_userId_idx" ON "Reservation"("userId");

-- CreateIndex
CREATE INDEX "Reservation_garageId_startAt_idx" ON "Reservation"("garageId", "startAt");

-- CreateIndex
CREATE INDEX "DiagnosticRequest_createdAt_idx" ON "DiagnosticRequest"("createdAt");

-- CreateIndex
CREATE INDEX "BlockedSlot_startAt_idx" ON "BlockedSlot"("startAt");

-- CreateIndex
CREATE INDEX "CustomSlot_startAt_idx" ON "CustomSlot"("startAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserAccount_email_key" ON "UserAccount"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_tokenHash_key" ON "UserSession"("tokenHash");

-- CreateIndex
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PendingRoleAssignment_email_key" ON "PendingRoleAssignment"("email");

-- CreateIndex
CREATE INDEX "WelcomeCreditGrant_ipHash_idx" ON "WelcomeCreditGrant"("ipHash");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "PendingEmailVerification_email_key" ON "PendingEmailVerification"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PendingEmailVerification_tokenHash_key" ON "PendingEmailVerification"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "PendingGarageRegistration_email_key" ON "PendingGarageRegistration"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Garage_garageCode_key" ON "Garage"("garageCode");

-- CreateIndex
CREATE INDEX "Garage_status_idx" ON "Garage"("status");

-- CreateIndex
CREATE INDEX "Garage_postalCode_idx" ON "Garage"("postalCode");

-- CreateIndex
CREATE INDEX "GarageEmployee_email_idx" ON "GarageEmployee"("email");

-- CreateIndex
CREATE UNIQUE INDEX "GarageEmployee_garageId_email_key" ON "GarageEmployee"("garageId", "email");

-- CreateIndex
CREATE INDEX "GarageClosure_garageId_date_idx" ON "GarageClosure"("garageId", "date");

-- CreateIndex
CREATE INDEX "GarageBlockedSlot_garageId_startAt_idx" ON "GarageBlockedSlot"("garageId", "startAt");

-- CreateIndex
CREATE INDEX "GarageHoursChangeRequest_garageId_idx" ON "GarageHoursChangeRequest"("garageId");

-- CreateIndex
CREATE INDEX "GarageHoursChangeRequest_status_idx" ON "GarageHoursChangeRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DepositPayout_reservationId_key" ON "DepositPayout"("reservationId");

-- CreateIndex
CREATE INDEX "DepositPayout_garageId_idx" ON "DepositPayout"("garageId");

-- CreateIndex
CREATE INDEX "DepositPayout_status_idx" ON "DepositPayout"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_reservedForUserId_key" ON "PromoCode"("reservedForUserId");

-- CreateIndex
CREATE INDEX "PromoCodeUsage_promoCodeId_idx" ON "PromoCodeUsage"("promoCodeId");

-- CreateIndex
CREATE INDEX "PromoCodeUsage_ipHash_idx" ON "PromoCodeUsage"("ipHash");

-- CreateIndex
CREATE UNIQUE INDEX "CreditGiftCode_code_key" ON "CreditGiftCode"("code");

-- CreateIndex
CREATE INDEX "CreditGiftRedemption_userId_idx" ON "CreditGiftRedemption"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CreditGiftRedemption_giftCodeId_userId_key" ON "CreditGiftRedemption"("giftCodeId", "userId");
