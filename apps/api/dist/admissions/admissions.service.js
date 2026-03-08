"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdmissionsService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@carenest/database");
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
        orderBy: { transferDate: "desc" },
        include: {
            fromBed: { select: { id: true, bedNumber: true } },
            toBed: { select: { id: true, bedNumber: true } },
        },
    },
    vitalsRecords: {
        take: 1,
        orderBy: { recordedAt: "desc" },
    },
};
let AdmissionsService = class AdmissionsService {
    async generateAdmissionNumber() {
        const year = new Date().getFullYear();
        const updated = await database_1.prisma.$executeRaw `
            UPDATE admission_sequences
            SET last_value = last_value + 1, updated_at = NOW()
            WHERE id = 1 AND year = ${year}
        `;
        if (updated === 0) {
            await database_1.prisma.admissionSequence.upsert({
                where: { id_year: { id: 1, year } },
                update: { year, lastValue: 1 },
                create: { id: 1, year, lastValue: 1 },
            });
        }
        const seq = await database_1.prisma.admissionSequence.findUnique({
            where: { id_year: { id: 1, year } },
        });
        return `ADM-${year}-${String(seq.lastValue).padStart(6, "0")}`;
    }
    async create(dto, requestingUserId) {
        const patient = await database_1.prisma.patient.findUnique({ where: { id: dto.patientId } });
        if (!patient)
            throw new common_1.NotFoundException(`Patient ${dto.patientId} not found`);
        const existing = await database_1.prisma.admission.findFirst({
            where: {
                patientId: dto.patientId,
                status: { in: ["ADMITTED", "BED_ASSIGNED", "DRAFT"] },
            },
        });
        if (existing) {
            throw new common_1.ConflictException(`Patient already has an active admission (${existing.admissionNumber})`);
        }
        if (dto.bedId)
            return this.createWithBed(dto);
        const admissionNumber = await this.generateAdmissionNumber();
        return database_1.prisma.admission.create({
            data: {
                admissionNumber,
                patientId: dto.patientId,
                admissionType: dto.admissionType,
                priority: (dto.priority ?? "NORMAL"),
                department: dto.department,
                admittingDoctorId: dto.admittingDoctorId ?? null,
                admissionDate: new Date(dto.admissionDate),
                expectedDischarge: dto.expectedDischarge ? new Date(dto.expectedDischarge) : null,
                initialDiagnosis: dto.initialDiagnosis ?? null,
                gestationalAge: dto.gestationalAge ?? null,
                nicuRiskLevel: dto.nicuRiskLevel ?? null,
                status: "DRAFT",
            },
            include: ADMISSION_INCLUDE,
        });
    }
    async createWithBed(dto) {
        const admissionNumber = await this.generateAdmissionNumber();
        return database_1.prisma.$transaction(async (tx) => {
            const bed = await tx.bed.findUnique({ where: { id: dto.bedId } });
            if (!bed)
                throw new common_1.NotFoundException(`Bed ${dto.bedId} not found`);
            if (bed.status !== "AVAILABLE") {
                throw new common_1.ConflictException(`Bed ${bed.bedNumber} is no longer available (status: ${bed.status}). Please select another.`);
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
                        create: { fromBedId: null, toBedId: dto.bedId, reason: "Initial admission" },
                    },
                },
                include: ADMISSION_INCLUDE,
            });
        });
    }
    async findAll(query) {
        const page = Number(query.page ?? 1);
        const limit = Number(query.limit ?? 10);
        const skip = (page - 1) * limit;
        const where = {};
        if (query.status)
            where.status = query.status;
        if (query.department)
            where.department = query.department;
        if (query.patientId)
            where.patientId = query.patientId;
        if (query.search) {
            where.OR = [
                { admissionNumber: { contains: query.search, mode: "insensitive" } },
                { patient: { firstName: { contains: query.search, mode: "insensitive" } } },
                { patient: { lastName: { contains: query.search, mode: "insensitive" } } },
                { patient: { uhid: { contains: query.search, mode: "insensitive" } } },
            ];
        }
        const [data, total] = await database_1.prisma.$transaction([
            database_1.prisma.admission.findMany({
                where, skip, take: limit,
                orderBy: { admissionDate: "desc" },
                include: ADMISSION_INCLUDE,
            }),
            database_1.prisma.admission.count({ where }),
        ]);
        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async findOne(id) {
        const admission = await database_1.prisma.admission.findUnique({
            where: { id }, include: ADMISSION_INCLUDE,
        });
        if (!admission)
            throw new common_1.NotFoundException(`Admission ${id} not found`);
        return admission;
    }
    async findByPatient(patientId) {
        const patient = await database_1.prisma.patient.findUnique({ where: { id: patientId } });
        if (!patient)
            throw new common_1.NotFoundException(`Patient ${patientId} not found`);
        return database_1.prisma.admission.findMany({
            where: { patientId },
            orderBy: { admissionDate: "desc" },
            include: ADMISSION_INCLUDE,
        });
    }
    async transferBed(id, dto, requestingUserId) {
        return database_1.prisma.$transaction(async (tx) => {
            const admission = await tx.admission.findUnique({ where: { id } });
            if (!admission)
                throw new common_1.NotFoundException(`Admission ${id} not found`);
            if (admission.status !== "ADMITTED") {
                throw new common_1.BadRequestException("Can only transfer beds for actively admitted patients");
            }
            const newBed = await tx.bed.findUnique({ where: { id: dto.toBedId } });
            if (!newBed)
                throw new common_1.NotFoundException(`Bed ${dto.toBedId} not found`);
            if (newBed.status !== "AVAILABLE") {
                throw new common_1.ConflictException(`Bed ${newBed.bedNumber} is not available (${newBed.status})`);
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
    async updateDischargeClearance(id, dto, requestingUserId) {
        const admission = await this.findOne(id);
        if (admission.status === "DISCHARGED") {
            throw new common_1.BadRequestException("Patient is already discharged");
        }
        const now = new Date();
        const update = { dischargeStatus: "IN_PROGRESS" };
        if (dto.step === "clinical") {
            Object.assign(update, {
                clinicalCleared: true, clinicalNote: dto.note ?? null,
                clinicalClearedAt: now, clinicalClearedBy: requestingUserId ?? null,
            });
        }
        else if (dto.step === "pharmacy") {
            Object.assign(update, {
                pharmacyCleared: true,
                pharmacyClearedAt: now, pharmacyClearedBy: requestingUserId ?? null,
            });
        }
        else if (dto.step === "billing") {
            Object.assign(update, {
                billingCleared: true,
                billingClearedAt: now, billingClearedBy: requestingUserId ?? null,
            });
        }
        return database_1.prisma.admission.update({ where: { id }, data: update, include: ADMISSION_INCLUDE });
    }
    async finalizeDischarge(id, dto, requestingUserId) {
        return database_1.prisma.$transaction(async (tx) => {
            const admission = await tx.admission.findUnique({ where: { id } });
            if (!admission)
                throw new common_1.NotFoundException(`Admission ${id} not found`);
            if (!admission.clinicalCleared)
                throw new common_1.BadRequestException("Clinical clearance pending");
            if (!admission.pharmacyCleared)
                throw new common_1.BadRequestException("Pharmacy clearance pending");
            if (!admission.billingCleared)
                throw new common_1.BadRequestException("Billing clearance pending");
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
    async cancel(id) {
        return database_1.prisma.$transaction(async (tx) => {
            const admission = await tx.admission.findUnique({ where: { id } });
            if (!admission)
                throw new common_1.NotFoundException(`Admission ${id} not found`);
            if (admission.status === "DISCHARGED") {
                throw new common_1.BadRequestException("Cannot cancel a discharged admission");
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
};
exports.AdmissionsService = AdmissionsService;
exports.AdmissionsService = AdmissionsService = __decorate([
    (0, common_1.Injectable)()
], AdmissionsService);
//# sourceMappingURL=admissions.service.js.map