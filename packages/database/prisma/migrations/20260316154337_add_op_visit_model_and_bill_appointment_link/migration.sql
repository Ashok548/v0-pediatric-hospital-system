/*
  Warnings:

  - You are about to drop the column `verified_by` on the `lab_orders` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[appointment_id]` on the table `bills` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[op_visit_id]` on the table `bills` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "BillingType" AS ENUM ('DAY', 'HOUR', 'TEST', 'PROCEDURE', 'VISIT');

-- CreateEnum
CREATE TYPE "OPVisitStatus" AS ENUM ('REGISTERED', 'IN_PROGRESS', 'COMPLETED', 'BILLED', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ServiceCategory" ADD VALUE 'RESPIRATORY';
ALTER TYPE "ServiceCategory" ADD VALUE 'MONITORING';
ALTER TYPE "ServiceCategory" ADD VALUE 'THERAPY';
ALTER TYPE "ServiceCategory" ADD VALUE 'INFUSION';
ALTER TYPE "ServiceCategory" ADD VALUE 'FEEDING';
ALTER TYPE "ServiceCategory" ADD VALUE 'IMAGING';

-- AlterTable
ALTER TABLE "bed_transfers" ADD COLUMN     "from_department" VARCHAR(50),
ADD COLUMN     "to_department" VARCHAR(50);

-- AlterTable
ALTER TABLE "bills" ADD COLUMN     "appointment_id" TEXT,
ADD COLUMN     "op_visit_id" TEXT;

-- AlterTable
ALTER TABLE "lab_orders" DROP COLUMN "verified_by",
ADD COLUMN     "admission_id" TEXT,
ADD COLUMN     "appointment_id" TEXT,
ADD COLUMN     "patient_type" VARCHAR(20) NOT NULL DEFAULT 'INPATIENT',
ADD COLUMN     "verified_by_id" TEXT;

-- AlterTable
ALTER TABLE "lab_result_items" ADD COLUMN     "test_parameter_id" TEXT;

-- AlterTable
ALTER TABLE "lab_result_panels" ADD COLUMN     "test_profile_id" TEXT;

-- AlterTable
ALTER TABLE "nicu_vitals" ADD COLUMN     "acknowledged_at" TIMESTAMP(3),
ADD COLUMN     "acknowledged_by" TEXT,
ADD COLUMN     "alert_message" VARCHAR(255),
ADD COLUMN     "is_critical" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "prescription_items" ADD COLUMN     "dose" VARCHAR(100),
ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "frequency" VARCHAR(100),
ADD COLUMN     "instructions" TEXT;

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "billing_type" "BillingType" NOT NULL DEFAULT 'DAY';

-- AlterTable
ALTER TABLE "tariff_rates" ADD COLUMN     "status" "MasterStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "op_visit_sequences" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "year" INTEGER NOT NULL,
    "last_value" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "op_visit_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "op_visits" (
    "id" TEXT NOT NULL,
    "op_number" VARCHAR(20) NOT NULL,
    "patient_id" UUID NOT NULL,
    "appointment_id" TEXT,
    "doctor_id" TEXT,
    "department" VARCHAR(100) NOT NULL,
    "visit_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "OPVisitStatus" NOT NULL DEFAULT 'REGISTERED',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "op_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_adjustments" (
    "id" TEXT NOT NULL,
    "medication_id" TEXT NOT NULL,
    "adjustmentType" VARCHAR(20) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "batch_number" VARCHAR(50),
    "expiry_date" DATE,
    "reason" TEXT,
    "performed_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_test_profiles" (
    "id" TEXT NOT NULL,
    "panel_name" VARCHAR(100) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "sample_type" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_test_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_test_parameters" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "parameter_name" VARCHAR(100) NOT NULL,
    "unit" VARCHAR(20) NOT NULL,
    "ref_display" VARCHAR(50) NOT NULL,
    "ref_min" DOUBLE PRECISION,
    "ref_max" DOUBLE PRECISION,
    "critical_min" DOUBLE PRECISION,
    "critical_max" DOUBLE PRECISION,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "lab_test_parameters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hospital_settings" (
    "id" TEXT NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hospital_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings_audit_log" (
    "id" TEXT NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT NOT NULL,
    "changed_by" TEXT NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "settings_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_orders" (
    "id" TEXT NOT NULL,
    "order_number" VARCHAR(20) NOT NULL,
    "patient_id" UUID NOT NULL,
    "admission_id" TEXT,
    "service_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "priority" VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    "notes" TEXT,
    "order_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_order_sequences" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "year" INTEGER NOT NULL,
    "last_value" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_order_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "op_visit_sequences_id_year_key" ON "op_visit_sequences"("id", "year");

-- CreateIndex
CREATE UNIQUE INDEX "op_visits_op_number_key" ON "op_visits"("op_number");

-- CreateIndex
CREATE UNIQUE INDEX "op_visits_appointment_id_key" ON "op_visits"("appointment_id");

-- CreateIndex
CREATE INDEX "op_visits_patient_id_idx" ON "op_visits"("patient_id");

-- CreateIndex
CREATE INDEX "op_visits_visit_date_idx" ON "op_visits"("visit_date");

-- CreateIndex
CREATE INDEX "op_visits_status_idx" ON "op_visits"("status");

-- CreateIndex
CREATE INDEX "stock_adjustments_medication_id_idx" ON "stock_adjustments"("medication_id");

-- CreateIndex
CREATE INDEX "lab_test_profiles_category_idx" ON "lab_test_profiles"("category");

-- CreateIndex
CREATE INDEX "lab_test_profiles_is_active_idx" ON "lab_test_profiles"("is_active");

-- CreateIndex
CREATE INDEX "lab_test_parameters_profile_id_idx" ON "lab_test_parameters"("profile_id");

-- CreateIndex
CREATE INDEX "lab_test_parameters_is_active_idx" ON "lab_test_parameters"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "hospital_settings_category_key_key" ON "hospital_settings"("category", "key");

-- CreateIndex
CREATE UNIQUE INDEX "service_orders_order_number_key" ON "service_orders"("order_number");

-- CreateIndex
CREATE INDEX "service_orders_patient_id_idx" ON "service_orders"("patient_id");

-- CreateIndex
CREATE INDEX "service_orders_admission_id_idx" ON "service_orders"("admission_id");

-- CreateIndex
CREATE INDEX "service_orders_service_id_idx" ON "service_orders"("service_id");

-- CreateIndex
CREATE INDEX "service_orders_status_idx" ON "service_orders"("status");

-- CreateIndex
CREATE UNIQUE INDEX "service_order_sequences_id_year_key" ON "service_order_sequences"("id", "year");

-- CreateIndex
CREATE UNIQUE INDEX "bills_appointment_id_key" ON "bills"("appointment_id");

-- CreateIndex
CREATE UNIQUE INDEX "bills_op_visit_id_key" ON "bills"("op_visit_id");

-- CreateIndex
CREATE INDEX "bills_appointment_id_idx" ON "bills"("appointment_id");

-- CreateIndex
CREATE INDEX "lab_orders_admission_id_idx" ON "lab_orders"("admission_id");

-- CreateIndex
CREATE INDEX "lab_orders_appointment_id_idx" ON "lab_orders"("appointment_id");

-- CreateIndex
CREATE INDEX "nicu_vitals_is_critical_acknowledged_at_idx" ON "nicu_vitals"("is_critical", "acknowledged_at");

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_op_visit_id_fkey" FOREIGN KEY ("op_visit_id") REFERENCES "op_visits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "op_visits" ADD CONSTRAINT "op_visits_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "op_visits" ADD CONSTRAINT "op_visits_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "op_visits" ADD CONSTRAINT "op_visits_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_medication_id_fkey" FOREIGN KEY ("medication_id") REFERENCES "medications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_test_parameters" ADD CONSTRAINT "lab_test_parameters_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "lab_test_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_admission_id_fkey" FOREIGN KEY ("admission_id") REFERENCES "admissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_verified_by_id_fkey" FOREIGN KEY ("verified_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_result_panels" ADD CONSTRAINT "lab_result_panels_test_profile_id_fkey" FOREIGN KEY ("test_profile_id") REFERENCES "lab_test_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_result_items" ADD CONSTRAINT "lab_result_items_test_parameter_id_fkey" FOREIGN KEY ("test_parameter_id") REFERENCES "lab_test_parameters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_admission_id_fkey" FOREIGN KEY ("admission_id") REFERENCES "admissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
