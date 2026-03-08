-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('CASH', 'CARD', 'UPI', 'ONLINE', 'INSURANCE', 'CHEQUE');

-- CreateTable
CREATE TABLE "insurance_providers" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name" TEXT NOT NULL,
    "contact_email" VARCHAR(255),
    "contact_phone" VARCHAR(20),
    "claim_prefix" VARCHAR(10) NOT NULL DEFAULT 'CLM',
    "discount_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "max_cover_limit" DECIMAL(12,2),
    "status" "MasterStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tariff_plans" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "ward_type" "WardType",
    "status" "MasterStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tariff_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tariff_rates" (
    "id" TEXT NOT NULL,
    "tariff_plan_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "price_override" DECIMAL(10,2) NOT NULL,
    "discount_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tariff_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "insurance_providers_code_key" ON "insurance_providers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_providers_name_key" ON "insurance_providers"("name");

-- CreateIndex
CREATE INDEX "insurance_providers_status_idx" ON "insurance_providers"("status");

-- CreateIndex
CREATE UNIQUE INDEX "tariff_plans_code_key" ON "tariff_plans"("code");

-- CreateIndex
CREATE UNIQUE INDEX "tariff_plans_name_key" ON "tariff_plans"("name");

-- CreateIndex
CREATE INDEX "tariff_plans_status_idx" ON "tariff_plans"("status");

-- CreateIndex
CREATE INDEX "tariff_plans_ward_type_idx" ON "tariff_plans"("ward_type");

-- CreateIndex
CREATE INDEX "tariff_rates_tariff_plan_id_idx" ON "tariff_rates"("tariff_plan_id");

-- CreateIndex
CREATE INDEX "tariff_rates_service_id_idx" ON "tariff_rates"("service_id");

-- CreateIndex
CREATE UNIQUE INDEX "tariff_rates_tariff_plan_id_service_id_key" ON "tariff_rates"("tariff_plan_id", "service_id");

-- AddForeignKey
ALTER TABLE "tariff_rates" ADD CONSTRAINT "tariff_rates_tariff_plan_id_fkey" FOREIGN KEY ("tariff_plan_id") REFERENCES "tariff_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
