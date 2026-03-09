-- CreateEnum
CREATE TYPE "ApptStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('PENDING', 'PARTIAL', 'DISPENSED', 'RETURNED', 'CANCELLED');

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "patient_id" UUID NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "department" VARCHAR(100) NOT NULL,
    "appointment_date" DATE NOT NULL,
    "time_slot" VARCHAR(10) NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 20,
    "status" "ApptStatus" NOT NULL DEFAULT 'SCHEDULED',
    "type" VARCHAR(50) NOT NULL,
    "token" INTEGER NOT NULL,
    "notes" TEXT,
    "chief_complaint" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescription_sequences" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "year" INTEGER NOT NULL,
    "last_value" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prescription_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medications" (
    "id" TEXT NOT NULL,
    "drug_name" TEXT NOT NULL,
    "generic_name" TEXT NOT NULL,
    "form" VARCHAR(30) NOT NULL,
    "strength" VARCHAR(50) NOT NULL,
    "unit" VARCHAR(20) NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "stock_available" INTEGER NOT NULL DEFAULT 0,
    "reorder_level" INTEGER NOT NULL DEFAULT 10,
    "status" "MasterStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescriptions" (
    "id" TEXT NOT NULL,
    "prescription_number" VARCHAR(20) NOT NULL,
    "patient_id" UUID NOT NULL,
    "admission_id" TEXT,
    "doctor_id" TEXT NOT NULL,
    "status" "PrescriptionStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "ordered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dispensed_at" TIMESTAMP(3),
    "dispensed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescription_items" (
    "id" TEXT NOT NULL,
    "prescription_id" TEXT NOT NULL,
    "medication_id" TEXT NOT NULL,
    "prescribed_qty" INTEGER NOT NULL,
    "dispensed_qty" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prescription_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "appointments_appointment_date_idx" ON "appointments"("appointment_date");

-- CreateIndex
CREATE INDEX "appointments_patient_id_idx" ON "appointments"("patient_id");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_doctor_id_appointment_date_time_slot_key" ON "appointments"("doctor_id", "appointment_date", "time_slot");

-- CreateIndex
CREATE UNIQUE INDEX "prescription_sequences_id_year_key" ON "prescription_sequences"("id", "year");

-- CreateIndex
CREATE INDEX "medications_status_idx" ON "medications"("status");

-- CreateIndex
CREATE UNIQUE INDEX "prescriptions_prescription_number_key" ON "prescriptions"("prescription_number");

-- CreateIndex
CREATE INDEX "prescriptions_patient_id_idx" ON "prescriptions"("patient_id");

-- CreateIndex
CREATE INDEX "prescriptions_admission_id_idx" ON "prescriptions"("admission_id");

-- CreateIndex
CREATE INDEX "prescriptions_status_idx" ON "prescriptions"("status");

-- CreateIndex
CREATE INDEX "prescription_items_prescription_id_idx" ON "prescription_items"("prescription_id");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_admission_id_fkey" FOREIGN KEY ("admission_id") REFERENCES "admissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "prescriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_medication_id_fkey" FOREIGN KEY ("medication_id") REFERENCES "medications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
