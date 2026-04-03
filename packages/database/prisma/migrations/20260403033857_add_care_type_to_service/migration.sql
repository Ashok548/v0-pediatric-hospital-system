/*
  Warnings:

  - The `status` column on the `lab_orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `lab_result_panels` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "CareType" AS ENUM ('OP', 'IP', 'BOTH');

-- CreateEnum
CREATE TYPE "AutoAddTrigger" AS ENUM ('NONE', 'ON_OP_CREATION', 'ON_IP_ADMISSION', 'ON_NICU_ADMISSION', 'ON_DISCHARGE');

-- CreateEnum
CREATE TYPE "RecurrenceUnit" AS ENUM ('HOURLY', 'DAILY', 'PER_SHIFT');

-- CreateEnum
CREATE TYPE "ServiceIntent" AS ENUM ('FACILITY_CHARGE', 'PROFESSIONAL_FEE', 'CLINICAL_PROCEDURE', 'DIAGNOSTIC', 'CONSUMABLE', 'THERAPEUTIC', 'PHARMACY');

-- CreateEnum
CREATE TYPE "ConsultationStatus" AS ENUM ('DRAFT', 'SIGNED', 'AMENDED');

-- CreateEnum
CREATE TYPE "LabOrderStatus" AS ENUM ('DRAFT', 'PENDING_CLEARANCE', 'AWAITING_SAMPLE', 'SAMPLE_COLLECTED', 'PROCESSING', 'PARTIAL', 'RESULT_ENTERED', 'VERIFIED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LabPanelStatus" AS ENUM ('PENDING', 'SAMPLE_COLLECTED', 'SAMPLE_REJECTED', 'PROCESSING', 'COMPLETED', 'VERIFIED');

-- CreateEnum
CREATE TYPE "ConsentStatus" AS ENUM ('GIVEN', 'REFUSED', 'WITHDRAWN');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OPVisitStatus" ADD VALUE 'TRIAGED';
ALTER TYPE "OPVisitStatus" ADD VALUE 'PRE_CONSULT';
ALTER TYPE "OPVisitStatus" ADD VALUE 'CONSULTING';
ALTER TYPE "OPVisitStatus" ADD VALUE 'ORDERS_PLACED';
ALTER TYPE "OPVisitStatus" ADD VALUE 'CONVERTED_TO_ER';

-- AlterTable
ALTER TABLE "consultations" ADD COLUMN     "op_visit_id" TEXT,
ADD COLUMN     "signed_at" TIMESTAMP(3),
ADD COLUMN     "status" "ConsultationStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "lab_orders" ADD COLUMN     "op_visit_id" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "LabOrderStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "lab_result_panels" DROP COLUMN "status",
ADD COLUMN     "status" "LabPanelStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "op_visits" ADD COLUMN     "triage_level" VARCHAR(20),
ADD COLUMN     "triage_notes" TEXT,
ADD COLUMN     "triaged_at" TIMESTAMP(3),
ADD COLUMN     "triaged_by" TEXT;

-- AlterTable
ALTER TABLE "prescriptions" ADD COLUMN     "op_visit_id" TEXT;

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "auto_add_priority" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "auto_add_trigger" "AutoAddTrigger" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "care_type" "CareType" NOT NULL DEFAULT 'BOTH',
ADD COLUMN     "conflict_group_code" VARCHAR(30),
ADD COLUMN     "department_codes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "display_order" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "hsn_sac_code" VARCHAR(20),
ADD COLUMN     "intent" "ServiceIntent" NOT NULL DEFAULT 'FACILITY_CHARGE',
ADD COLUMN     "is_default" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_group_header" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_mandatory" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_recurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_selectable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "max_qty_per_day" INTEGER,
ADD COLUMN     "parent_service_id" TEXT,
ADD COLUMN     "recurrence_cap" INTEGER,
ADD COLUMN     "recurrence_unit" "RecurrenceUnit",
ADD COLUMN     "requires_approval" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sub_category" VARCHAR(50),
ADD COLUMN     "ui_group" VARCHAR(50) NOT NULL DEFAULT 'General';

-- CreateTable
CREATE TABLE "service_departments" (
    "id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,

    CONSTRAINT "service_departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_dependencies" (
    "id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "depends_on_service_id" TEXT NOT NULL,
    "is_auto_add" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "service_dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consents" (
    "id" TEXT NOT NULL,
    "patient_id" UUID NOT NULL,
    "op_visit_id" TEXT,
    "admission_id" TEXT,
    "consent_type" VARCHAR(50) NOT NULL,
    "status" "ConsentStatus" NOT NULL DEFAULT 'GIVEN',
    "given_by" VARCHAR(200) NOT NULL,
    "relationship" VARCHAR(30),
    "witness_name" VARCHAR(200),
    "notes" TEXT,
    "signed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "entity" VARCHAR(50) NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" VARCHAR(30) NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "user_id" TEXT,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" TEXT NOT NULL,
    "aggregate_type" VARCHAR(50) NOT NULL,
    "aggregate_id" TEXT NOT NULL,
    "event_type" VARCHAR(100) NOT NULL,
    "payload" JSONB NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "error_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "service_departments_service_id_department_id_key" ON "service_departments"("service_id", "department_id");

-- CreateIndex
CREATE UNIQUE INDEX "service_dependencies_service_id_depends_on_service_id_key" ON "service_dependencies"("service_id", "depends_on_service_id");

-- CreateIndex
CREATE INDEX "consents_patient_id_idx" ON "consents"("patient_id");

-- CreateIndex
CREATE INDEX "consents_op_visit_id_idx" ON "consents"("op_visit_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "outbox_events_status_created_at_idx" ON "outbox_events"("status", "created_at");

-- CreateIndex
CREATE INDEX "lab_orders_status_idx" ON "lab_orders"("status");

-- CreateIndex
CREATE INDEX "services_care_type_idx" ON "services"("care_type");

-- CreateIndex
CREATE INDEX "services_auto_add_trigger_idx" ON "services"("auto_add_trigger");

-- CreateIndex
CREATE INDEX "services_ui_group_idx" ON "services"("ui_group");

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_parent_service_id_fkey" FOREIGN KEY ("parent_service_id") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_departments" ADD CONSTRAINT "service_departments_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_departments" ADD CONSTRAINT "service_departments_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_dependencies" ADD CONSTRAINT "service_dependencies_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_dependencies" ADD CONSTRAINT "service_dependencies_depends_on_service_id_fkey" FOREIGN KEY ("depends_on_service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_op_visit_id_fkey" FOREIGN KEY ("op_visit_id") REFERENCES "op_visits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_op_visit_id_fkey" FOREIGN KEY ("op_visit_id") REFERENCES "op_visits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_op_visit_id_fkey" FOREIGN KEY ("op_visit_id") REFERENCES "op_visits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consents" ADD CONSTRAINT "consents_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consents" ADD CONSTRAINT "consents_op_visit_id_fkey" FOREIGN KEY ("op_visit_id") REFERENCES "op_visits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consents" ADD CONSTRAINT "consents_admission_id_fkey" FOREIGN KEY ("admission_id") REFERENCES "admissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
