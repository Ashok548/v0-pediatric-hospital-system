-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "allergies" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "consultations" (
    "id" TEXT NOT NULL,
    "patient_id" UUID NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "appointment_id" TEXT,
    "admission_id" TEXT,
    "chief_complaint" TEXT,
    "history_of_illness" TEXT,
    "examination_notes" TEXT,
    "diagnosis" TEXT,
    "plan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_order_sequences" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "year" INTEGER NOT NULL,
    "last_value" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_order_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_orders" (
    "id" TEXT NOT NULL,
    "order_number" VARCHAR(20) NOT NULL,
    "patient_id" UUID NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "order_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified_by" VARCHAR(100),
    "technician_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_result_panels" (
    "id" TEXT NOT NULL,
    "lab_order_id" TEXT NOT NULL,
    "panel_name" VARCHAR(100) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "sample_type" VARCHAR(50) NOT NULL,
    "collected_at" TIMESTAMP(3),
    "received_at" TIMESTAMP(3),
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "lab_result_panels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_result_items" (
    "id" TEXT NOT NULL,
    "panel_id" TEXT NOT NULL,
    "parameter_name" VARCHAR(100) NOT NULL,
    "value" VARCHAR(50),
    "unit" VARCHAR(20) NOT NULL,
    "ref_display" VARCHAR(50) NOT NULL,
    "ref_min" DOUBLE PRECISION,
    "ref_max" DOUBLE PRECISION,
    "critical_min" DOUBLE PRECISION,
    "critical_max" DOUBLE PRECISION,

    CONSTRAINT "lab_result_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_vaccines" (
    "id" TEXT NOT NULL,
    "patient_id" UUID NOT NULL,
    "vaccine_name" VARCHAR(100) NOT NULL,
    "dose" VARCHAR(20) NOT NULL,
    "age_label" VARCHAR(30) NOT NULL,
    "scheduled_date" DATE NOT NULL,
    "administered_date" TIMESTAMP(3),
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "site" VARCHAR(50),
    "batch_number" VARCHAR(50),
    "notes" TEXT,
    "administered_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_vaccines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "consultations_appointment_id_key" ON "consultations"("appointment_id");

-- CreateIndex
CREATE INDEX "consultations_patient_id_idx" ON "consultations"("patient_id");

-- CreateIndex
CREATE INDEX "consultations_doctor_id_idx" ON "consultations"("doctor_id");

-- CreateIndex
CREATE INDEX "consultations_admission_id_idx" ON "consultations"("admission_id");

-- CreateIndex
CREATE UNIQUE INDEX "lab_order_sequences_id_year_key" ON "lab_order_sequences"("id", "year");

-- CreateIndex
CREATE UNIQUE INDEX "lab_orders_order_number_key" ON "lab_orders"("order_number");

-- CreateIndex
CREATE INDEX "lab_orders_patient_id_idx" ON "lab_orders"("patient_id");

-- CreateIndex
CREATE INDEX "lab_orders_status_idx" ON "lab_orders"("status");

-- CreateIndex
CREATE INDEX "lab_orders_order_date_idx" ON "lab_orders"("order_date");

-- CreateIndex
CREATE INDEX "lab_result_panels_lab_order_id_idx" ON "lab_result_panels"("lab_order_id");

-- CreateIndex
CREATE INDEX "lab_result_items_panel_id_idx" ON "lab_result_items"("panel_id");

-- CreateIndex
CREATE INDEX "patient_vaccines_patient_id_idx" ON "patient_vaccines"("patient_id");

-- CreateIndex
CREATE INDEX "patient_vaccines_status_idx" ON "patient_vaccines"("status");

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_admission_id_fkey" FOREIGN KEY ("admission_id") REFERENCES "admissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_result_panels" ADD CONSTRAINT "lab_result_panels_lab_order_id_fkey" FOREIGN KEY ("lab_order_id") REFERENCES "lab_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_result_items" ADD CONSTRAINT "lab_result_items_panel_id_fkey" FOREIGN KEY ("panel_id") REFERENCES "lab_result_panels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_vaccines" ADD CONSTRAINT "patient_vaccines_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_vaccines" ADD CONSTRAINT "patient_vaccines_administered_by_id_fkey" FOREIGN KEY ("administered_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
