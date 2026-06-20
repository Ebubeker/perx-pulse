-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "CompanyRole" AS ENUM ('ADMIN', 'HR', 'FINANCE', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "OfferCategory" AS ENUM ('wellness', 'fitness', 'food', 'health', 'travel', 'learning', 'culture', 'telecom');

-- CreateEnum
CREATE TYPE "SettlementMethod" AS ENUM ('BANK', 'PERXCOIN');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED');

-- CreateEnum
CREATE TYPE "BudgetMode" AS ENUM ('SPEND_ALL', 'SAVE_SOME', 'TREAT_MYSELF', 'TEAM');

-- CreateEnum
CREATE TYPE "PackageStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PAID', 'REDEEMED');

-- CreateEnum
CREATE TYPE "CoinTxnKind" AS ENUM ('GRANT', 'KUDOS', 'SPEND', 'ADJUST');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "ownerClerkUserId" TEXT NOT NULL,
    "clerkOrgId" TEXT,
    "name" TEXT NOT NULL,
    "brandName" TEXT,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "industry" TEXT,
    "sizeBucket" TEXT,
    "website" TEXT,
    "nipt" TEXT,
    "vatRegistered" BOOLEAN NOT NULL DEFAULT false,
    "addressLine" TEXT,
    "city" TEXT,
    "country" TEXT NOT NULL DEFAULT 'AL',
    "billingContactName" TEXT,
    "billingContactEmail" TEXT,
    "defaultBudgetLek" INTEGER NOT NULL DEFAULT 12000,
    "currency" TEXT NOT NULL DEFAULT 'ALL',
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "billingStatus" TEXT,
    "billingPlan" TEXT,
    "lemonOrderId" TEXT,
    "lemonSubscriptionId" TEXT,
    "lemonCustomerId" TEXT,
    "subscribedAt" TIMESTAMP(3),

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeProfile" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "departmentId" TEXT,
    "role" "CompanyRole" NOT NULL DEFAULT 'EMPLOYEE',
    "displayName" TEXT NOT NULL,
    "jobTitle" TEXT,
    "workArea" TEXT,
    "avatarUrl" TEXT,
    "perksBudgetLek" INTEGER NOT NULL DEFAULT 12000,
    "recognitionCoins" INTEGER NOT NULL DEFAULT 0,
    "kudosMonthlyAllowance" INTEGER NOT NULL DEFAULT 100,
    "preferredCategories" TEXT[],
    "dietary" TEXT[],
    "wellnessGoals" TEXT[],
    "interests" TEXT[],
    "homeArea" TEXT,
    "languages" TEXT[],
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Provider" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "category" "OfferCategory" NOT NULL,
    "description" TEXT,
    "addressLine" TEXT,
    "city" TEXT,
    "areasServed" TEXT[],
    "openingHours" JSONB,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "nipt" TEXT,
    "vatRegistered" BOOLEAN NOT NULL DEFAULT false,
    "settlementMethod" "SettlementMethod" NOT NULL DEFAULT 'BANK',
    "bankIban" TEXT,
    "takeRatePct" INTEGER NOT NULL DEFAULT 15,
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "OfferCategory" NOT NULL,
    "priceLek" INTEGER NOT NULL,
    "area" TEXT,
    "taxFree" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "departmentId" TEXT,
    "role" "CompanyRole" NOT NULL DEFAULT 'EMPLOYEE',
    "clerkInvitationId" TEXT,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pulse" (
    "id" TEXT NOT NULL,
    "employeeProfileId" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "budgetMode" "BudgetMode" NOT NULL DEFAULT 'SPEND_ALL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pulse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL,
    "pulseId" TEXT NOT NULL,
    "employeeProfileId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "itemOfferIds" TEXT[],
    "totalLek" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerkPackage" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeProfileId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "itemOfferIds" TEXT[],
    "totalLek" INTEGER NOT NULL,
    "status" "PackageStatus" NOT NULL DEFAULT 'DRAFT',
    "decidedByClerkUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "PerkPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "employeeProfileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "grossLek" INTEGER NOT NULL,
    "takeRatePct" INTEGER NOT NULL,
    "feeLek" INTEGER NOT NULL,
    "netLek" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PAID',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "redeemedAt" TIMESTAMP(3),

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoinTxn" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "kind" "CoinTxnKind" NOT NULL,
    "fromEmployeeId" TEXT,
    "toEmployeeId" TEXT,
    "amount" INTEGER NOT NULL,
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoinTxn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Drop" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "OfferCategory" NOT NULL,
    "area" TEXT,
    "costCoins" INTEGER NOT NULL,
    "totalSlots" INTEGER NOT NULL,
    "claimedSlots" INTEGER NOT NULL DEFAULT 0,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Drop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DropClaim" (
    "id" TEXT NOT NULL,
    "dropId" TEXT NOT NULL,
    "employeeProfileId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DropClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamPack" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdByEmployeeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetSize" INTEGER NOT NULL DEFAULT 4,
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamPack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamPackMember" (
    "id" TEXT NOT NULL,
    "teamPackId" TEXT NOT NULL,
    "employeeProfileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamPackMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_ownerClerkUserId_key" ON "Company"("ownerClerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Company_clerkOrgId_key" ON "Company"("clerkOrgId");

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");

-- CreateIndex
CREATE INDEX "Department_companyId_idx" ON "Department"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_companyId_name_key" ON "Department"("companyId", "name");

-- CreateIndex
CREATE INDEX "EmployeeProfile_companyId_idx" ON "EmployeeProfile"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeProfile_clerkUserId_companyId_key" ON "EmployeeProfile"("clerkUserId", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Provider_clerkUserId_key" ON "Provider"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Provider_slug_key" ON "Provider"("slug");

-- CreateIndex
CREATE INDEX "Provider_category_idx" ON "Provider"("category");

-- CreateIndex
CREATE INDEX "Offer_providerId_idx" ON "Offer"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_clerkInvitationId_key" ON "Invitation"("clerkInvitationId");

-- CreateIndex
CREATE INDEX "Invitation_companyId_idx" ON "Invitation"("companyId");

-- CreateIndex
CREATE INDEX "Invitation_email_idx" ON "Invitation"("email");

-- CreateIndex
CREATE INDEX "Pulse_employeeProfileId_idx" ON "Pulse"("employeeProfileId");

-- CreateIndex
CREATE INDEX "Recommendation_employeeProfileId_idx" ON "Recommendation"("employeeProfileId");

-- CreateIndex
CREATE INDEX "PerkPackage_companyId_idx" ON "PerkPackage"("companyId");

-- CreateIndex
CREATE INDEX "PerkPackage_employeeProfileId_idx" ON "PerkPackage"("employeeProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_code_key" ON "Order"("code");

-- CreateIndex
CREATE INDEX "Order_providerId_idx" ON "Order"("providerId");

-- CreateIndex
CREATE INDEX "Order_companyId_idx" ON "Order"("companyId");

-- CreateIndex
CREATE INDEX "Order_packageId_idx" ON "Order"("packageId");

-- CreateIndex
CREATE INDEX "CoinTxn_companyId_idx" ON "CoinTxn"("companyId");

-- CreateIndex
CREATE INDEX "CoinTxn_toEmployeeId_idx" ON "CoinTxn"("toEmployeeId");

-- CreateIndex
CREATE INDEX "CoinTxn_fromEmployeeId_idx" ON "CoinTxn"("fromEmployeeId");

-- CreateIndex
CREATE INDEX "Drop_providerId_idx" ON "Drop"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "DropClaim_code_key" ON "DropClaim"("code");

-- CreateIndex
CREATE INDEX "DropClaim_employeeProfileId_idx" ON "DropClaim"("employeeProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "DropClaim_dropId_employeeProfileId_key" ON "DropClaim"("dropId", "employeeProfileId");

-- CreateIndex
CREATE INDEX "TeamPack_companyId_idx" ON "TeamPack"("companyId");

-- CreateIndex
CREATE INDEX "TeamPackMember_teamPackId_idx" ON "TeamPackMember"("teamPackId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamPackMember_teamPackId_employeeProfileId_key" ON "TeamPackMember"("teamPackId", "employeeProfileId");

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeProfile" ADD CONSTRAINT "EmployeeProfile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeProfile" ADD CONSTRAINT "EmployeeProfile_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pulse" ADD CONSTRAINT "Pulse_employeeProfileId_fkey" FOREIGN KEY ("employeeProfileId") REFERENCES "EmployeeProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_pulseId_fkey" FOREIGN KEY ("pulseId") REFERENCES "Pulse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_employeeProfileId_fkey" FOREIGN KEY ("employeeProfileId") REFERENCES "EmployeeProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerkPackage" ADD CONSTRAINT "PerkPackage_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerkPackage" ADD CONSTRAINT "PerkPackage_employeeProfileId_fkey" FOREIGN KEY ("employeeProfileId") REFERENCES "EmployeeProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "PerkPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_employeeProfileId_fkey" FOREIGN KEY ("employeeProfileId") REFERENCES "EmployeeProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoinTxn" ADD CONSTRAINT "CoinTxn_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoinTxn" ADD CONSTRAINT "CoinTxn_fromEmployeeId_fkey" FOREIGN KEY ("fromEmployeeId") REFERENCES "EmployeeProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoinTxn" ADD CONSTRAINT "CoinTxn_toEmployeeId_fkey" FOREIGN KEY ("toEmployeeId") REFERENCES "EmployeeProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Drop" ADD CONSTRAINT "Drop_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DropClaim" ADD CONSTRAINT "DropClaim_dropId_fkey" FOREIGN KEY ("dropId") REFERENCES "Drop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DropClaim" ADD CONSTRAINT "DropClaim_employeeProfileId_fkey" FOREIGN KEY ("employeeProfileId") REFERENCES "EmployeeProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPack" ADD CONSTRAINT "TeamPack_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPack" ADD CONSTRAINT "TeamPack_createdByEmployeeId_fkey" FOREIGN KEY ("createdByEmployeeId") REFERENCES "EmployeeProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPackMember" ADD CONSTRAINT "TeamPackMember_teamPackId_fkey" FOREIGN KEY ("teamPackId") REFERENCES "TeamPack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPackMember" ADD CONSTRAINT "TeamPackMember_employeeProfileId_fkey" FOREIGN KEY ("employeeProfileId") REFERENCES "EmployeeProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

