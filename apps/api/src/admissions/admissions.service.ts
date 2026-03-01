import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from "@nestjs/common";
import { prisma } from "@carenest/database";

// ─── Type aliases (pre-generation safe — string constants instead of enum refs) ─
type AdmissionStatusType = "DRAFT" | "BED_ASSIGNED" | "ADMITTED" | "DISCHARGED" | "CANCELLED";

// ─── Reusable Include Projection ───────────────────────────────────────────────
const ADMISSION_INCLUDE = {
    patient: {
        select: {
            id: true, uhid: true, firstName: true, lastName: true,
            dateOfBirth: true, gender: true, phone: true, guardianName: true,
        },
    },
    currentBed: {
        include: {
            ward: {
                select: {
                    id: true, name: true, type: true,
                    floor: { select: { id: true, name: true } },
                },
            },
        },
    },
    admittingDoctor: { select: { id: true, name: true } },
    transfers: {
        orderBy: { transferDate: "desc" as const },
        include: {
            fromBed: { select: { id: true, bedNumber: true } },
            toBed: { select: { id: true, bedNumber: true } },
        },
    },
} as const;

import {
    CreateAdmissionDto,
    BedTransferDto,
    DischargeClearanceDto,
    FinalizeDischargeDto,
    QueryAdmissionsDto,
} from "./dto/admissions.dto";

@Injectable()
export class AdmissionsService {

    // ─── Atomic Admission Number Generator ─────────────────────────────────────
    private async generateAdmissionNumber(): Promise<string> {
        const year = new Date().getFullYear();

        const updated = await prisma.$executeRaw`
            UPDATE admission_sequences
            SET last_value = last_value + 1, updated_at = NOW()
            WHERE id = 1 AND year = ${year}
        `;

        if (updated === 0) {
            await prisma.admissionSequence.upsert({
                where: { id_year: { id: 1, year } },
                update: { year, lastValue: 1 },
                create: { id: 1, year, lastValue: 1 },
            });
        }

        const seq = await prisma.admissionSequence.findUnique({
            where: { id_year: { id: 1, year } },
        });

        return `ADM-${year}-${String(seq!.lastValue).padStart(6, "0")}`;
    }

    // ─── Create Admission ───────────────────────────────────────────────────────
    async create(dto: CreateAdmissionDto, requestingUserId?: string) {
        const patient = await prisma.patient.findUnique({ where: { id: dto.patientId } });
        if (!patient) throw new NotFoundException(`Patient ${dto.patientId} not found`);

        // Prevent duplicate active admissions
        const existing = await prisma.admission.findFirst({
            where: {
                patientId: dto.patientId,
                status: { in: ["ADMITTED", "BED_ASSIGNED", "DRAFT"] as AdmissionStatusType[] },
            },
        });
        if (existing) {
            throw new ConflictException(
                `Patient already has an active admission (${existing.admissionNumber})`
            );
        }

        if (dto.bedId) return this.createWithBed(dto);

        const admissionNumber = await this.generateAdmissionNumber();
        return prisma.admission.create({
            data: {
                admissionNumber,
                patientId: dto.patientId,
                admissionType: dto.admissionType as any,
                priority: (dto.priority ?? "NORMAL") as any,
                department: dto.department,
                admittingDoctorId: dto.admittingDoctorId ?? null,
                admissionDate: new Date(dto.admissionDate),
                expectedDischarge: dto.expectedDischarge ? new Date(dto.expectedDischarge) : null,
                initialDiagnosis: dto.initialDiagnosis ?? null,
                gestationalAge: dto.gestationalAge ?? null,
                nicuRiskLevel: dto.nicuRiskLevel ?? null,
                status: "DRAFT" as any,
            },
            include: ADMISSION_INCLUDE,
        });
    }

    // ─── Create With Atomic Bed Assignment (concurrency safe) ──────────────────
    private async createWithBed(dto: CreateAdmissionDto) {
        const admissionNumber = await this.generateAdmissionNumber();

        return prisma.$transaction(async (tx: any) => {
            // Re-fetch inside transaction = optimistic lock
            const bed = await tx.bed.findUnique({ where: { id: dto.bedId } });
            if (!bed) throw new NotFoundException(`Bed ${dto.bedId} not found`);
            if (bed.status !== "AVAILABLE") {
                throw new ConflictException(
                    `Bed ${bed.bedNumber} is no longer available (status: ${bed.status}). Please select another.`
                );
            }

            await tx.bed.update({ where: { id: dto.bedId }, data: { status: "OCCUPIED" } });

            return tx.admission.create({
                data: {
                    admissionNumber,
                    patientId: dto.patientId,
                    admissionType: dto.admissionType,
                    priority: dto.priority ?? "NORMAL",
                    department: dto.department,
                    admittingDoctorId: dto.admittingDoctorId ?? null,
                    admissionDate: new Date(dto.admissionDate),
                    expectedDischarge: dto.expectedDischarge ? new Date(dto.expectedDischarge) : null,
                    initialDiagnosis: dto.initialDiagnosis ?? null,
                    gestationalAge: dto.gestationalAge ?? null,
                    nicuRiskLevel: dto.nicuRiskLevel ?? null,
                    status: "ADMITTED",
                    currentBedId: dto.bedId,
                    transfers: {
                        create: { fromBedId: null, toBedId: dto.bedId!, reason: "Initial admission" },
                    },
                },
                include: ADMISSION_INCLUDE,
            });
        });
    }

    // ─── List (paginated + filtered) ────────────────────────────────────────────
    async findAll(query: QueryAdmissionsDto) {
        const page = Number(query.page ?? 1);
        const limit = Number(query.limit ?? 10);
        const skip = (page - 1) * limit;

        const where: any = {};
        if (query.status) where.status = query.status;
        if (query.department) where.department = query.department;
        if (query.patientId) where.patientId = query.patientId;
        if (query.search) {
            where.OR = [
                { admissionNumber: { contains: query.search, mode: "insensitive" } },
                { patient: { firstName: { contains: query.search, mode: "insensitive" } } },
                { patient: { lastName: { contains: query.search, mode: "insensitive" } } },
                { patient: { uhid: { contains: query.search, mode: "insensitive" } } },
            ];
        }

        const [data, total] = await prisma.$transaction([
            prisma.admission.findMany({
                where, skip, take: limit,
                orderBy: { admissionDate: "desc" },
                include: ADMISSION_INCLUDE,
            }),
            prisma.admission.count({ where }),
        ]);

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    // ─── Get One ────────────────────────────────────────────────────────────────
    async findOne(id: string) {
        const admission = await prisma.admission.findUnique({
            where: { id }, include: ADMISSION_INCLUDE,
        });
        if (!admission) throw new NotFoundException(`Admission ${id} not found`);
        return admission;
    }

    // ─── Patient Admission History ──────────────────────────────────────────────
    async findByPatient(patientId: string) {
        const patient = await prisma.patient.findUnique({ where: { id: patientId } });
        if (!patient) throw new NotFoundException(`Patient ${patientId} not found`);
        return prisma.admission.findMany({
            where: { patientId },
            orderBy: { admissionDate: "desc" },
            include: ADMISSION_INCLUDE,
        });
    }

    // ─── Bed Transfer ───────────────────────────────────────────────────────────
    async transferBed(id: string, dto: BedTransferDto, requestingUserId?: string) {
        return prisma.$transaction(async (tx: any) => {
            const admission = await tx.admission.findUnique({ where: { id } });
            if (!admission) throw new NotFoundException(`Admission ${id} not found`);
            if (admission.status !== "ADMITTED") {
                throw new BadRequestException("Can only transfer beds for actively admitted patients");
            }

            const newBed = await tx.bed.findUnique({ where: { id: dto.toBedId } });
            if (!newBed) throw new NotFoundException(`Bed ${dto.toBedId} not found`);
            if (newBed.status !== "AVAILABLE") {
                throw new ConflictException(`Bed ${newBed.bedNumber} is not available (${newBed.status})`);
            }

            const oldBedId = admission.currentBedId;
            if (oldBedId) {
                await tx.bed.update({ where: { id: oldBedId }, data: { status: "CLEANING" } });
                await tx.bedActivityLog.create({
                    data: {
                        bedId: oldBedId,
                        action: "MARKED_CLEANING",
                        notes: `Patient transferred to bed ${newBed.bedNumber}`,
                        performedBy: requestingUserId ?? null,
                    },
                });
            }

            await tx.bed.update({ where: { id: dto.toBedId }, data: { status: "OCCUPIED" } });

            return tx.admission.update({
                where: { id },
                data: {
                    currentBedId: dto.toBedId,
                    transfers: {
                        create: {
                            fromBedId: oldBedId ?? null,
                            toBedId: dto.toBedId,
                            reason: dto.reason ?? null,
                            transferredBy: requestingUserId ?? null,
                        },
                    },
                },
                include: ADMISSION_INCLUDE,
            });
        });
    }

    // ─── Discharge Clearance ────────────────────────────────────────────────────
    async updateDischargeClearance(id: string, dto: DischargeClearanceDto, requestingUserId?: string) {
        const admission = await this.findOne(id);
        if (admission.status === "DISCHARGED") {
            throw new BadRequestException("Patient is already discharged");
        }

        const now = new Date();
        const update: any = { dischargeStatus: "IN_PROGRESS" };

        if (dto.step === "clinical") {
            Object.assign(update, {
                clinicalCleared: true, clinicalNote: dto.note ?? null,
                clinicalClearedAt: now, clinicalClearedBy: requestingUserId ?? null,
            });
        } else if (dto.step === "pharmacy") {
            Object.assign(update, {
                pharmacyCleared: true,
                pharmacyClearedAt: now, pharmacyClearedBy: requestingUserId ?? null,
            });
        } else if (dto.step === "billing") {
            Object.assign(update, {
                billingCleared: true,
                billingClearedAt: now, billingClearedBy: requestingUserId ?? null,
            });
        }

        return prisma.admission.update({ where: { id }, data: update, include: ADMISSION_INCLUDE });
    }

    // ─── Finalize Discharge ─────────────────────────────────────────────────────
    async finalizeDischarge(id: string, dto: FinalizeDischargeDto, requestingUserId?: string) {
        return prisma.$transaction(async (tx: any) => {
            const admission = await tx.admission.findUnique({ where: { id } });
            if (!admission) throw new NotFoundException(`Admission ${id} not found`);
            if (!admission.clinicalCleared) throw new BadRequestException("Clinical clearance pending");
            if (!admission.pharmacyCleared) throw new BadRequestException("Pharmacy clearance pending");
            if (!admission.billingCleared) throw new BadRequestException("Billing clearance pending");

            if (admission.currentBedId) {
                await tx.bed.update({ where: { id: admission.currentBedId }, data: { status: "CLEANING" } });
                await tx.bedActivityLog.create({
                    data: {
                        bedId: admission.currentBedId,
                        action: "MARKED_CLEANING",
                        notes: `Patient discharged (${dto.dischargeType})`,
                        performedBy: requestingUserId ?? null,
                    },
                });
                await tx.bedTransfer.create({
                    data: {
                        admissionId: id,
                        fromBedId: admission.currentBedId,
                        toBedId: null,
                        reason: `Discharge: ${dto.dischargeType}`,
                        transferredBy: requestingUserId ?? null,
                    },
                });
            }

            return tx.admission.update({
                where: { id },
                data: {
                    status: "DISCHARGED",
                    dischargeStatus: "COMPLETED",
                    dischargeType: dto.dischargeType,
                    dischargeSummary: dto.dischargeSummary ?? null,
                    dischargeDate: new Date(),
                    currentBedId: null,
                },
                include: ADMISSION_INCLUDE,
            });
        });
    }

    // ─── Cancel ─────────────────────────────────────────────────────────────────
    async cancel(id: string) {
        return prisma.$transaction(async (tx: any) => {
            const admission = await tx.admission.findUnique({ where: { id } });
            if (!admission) throw new NotFoundException(`Admission ${id} not found`);
            if (admission.status === "DISCHARGED") {
                throw new BadRequestException("Cannot cancel a discharged admission");
            }
            if (admission.currentBedId) {
                await tx.bed.update({
                    where: { id: admission.currentBedId }, data: { status: "AVAILABLE" },
                });
            }
            return tx.admission.update({
                where: { id },
                data: { status: "CANCELLED", currentBedId: null },
                include: ADMISSION_INCLUDE,
            });
        });
    }
}
