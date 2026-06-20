-- PerxCoin becomes the primary currency: offers can carry a discount, and the employee
-- wallet (recognitionCoins) now seeds with the monthly employer allowance.
ALTER TABLE "Offer" ADD COLUMN "discountPct" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "EmployeeProfile" ALTER COLUMN "recognitionCoins" SET DEFAULT 120;
