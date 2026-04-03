-- AlterTable
ALTER TABLE "prescription_items" ADD COLUMN     "route" VARCHAR(20);

-- AlterTable
ALTER TABLE "prescriptions" ADD COLUMN     "advice" TEXT,
ADD COLUMN     "follow_up_days" INTEGER;

