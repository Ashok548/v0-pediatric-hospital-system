"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NicuService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@carenest/database");
let NicuService = class NicuService {
    async findNicuAdmissions(query) {
        const { limit = 50, page = 1, search } = query;
        const skip = (page - 1) * limit;
        const where = {
            status: "ADMITTED",
            department: { contains: "NICU", mode: "insensitive" },
        };
        if (search) {
            where.patient = {
                OR: [
                    { firstName: { contains: search, mode: "insensitive" } },
                    { lastName: { contains: search, mode: "insensitive" } },
                    { uhid: { contains: search, mode: "insensitive" } },
                ],
            };
        }
        const [admissions, total] = await Promise.all([
            database_1.prisma.admission.findMany({
                where,
                skip,
                take: limit,
                orderBy: { admissionDate: "desc" },
                include: {
                    patient: {
                        select: {
                            id: true, uhid: true, firstName: true, lastName: true,
                            dateOfBirth: true, gender: true,
                        },
                    },
                    admittingDoctor: { select: { id: true, name: true } },
                    currentBed: {
                        select: {
                            id: true, bedNumber: true,
                            ward: { select: { id: true, name: true } },
                        },
                    },
                    vitalsRecords: {
                        orderBy: { recordedAt: "desc" },
                        take: 1,
                    },
                },
            }),
            database_1.prisma.admission.count({ where }),
        ]);
        return { data: admissions, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async findVitals(admissionId) {
        const admission = await database_1.prisma.admission.findUnique({ where: { id: admissionId } });
        if (!admission)
            throw new common_1.NotFoundException(`Admission ${admissionId} not found`);
        return database_1.prisma.nicuVitals.findMany({
            where: { admissionId },
            orderBy: { recordedAt: "desc" },
        });
    }
    async recordVitals(admissionId, dto, recordedBy) {
        const admission = await database_1.prisma.admission.findUnique({ where: { id: admissionId } });
        if (!admission)
            throw new common_1.NotFoundException(`Admission ${admissionId} not found`);
        return database_1.prisma.nicuVitals.create({
            data: {
                admissionId,
                recordedBy: dto.recordedBy ?? recordedBy ?? null,
                heartRate: dto.heartRate ?? null,
                spo2: dto.spo2 ?? null,
                temperature: dto.temperature != null ? dto.temperature : null,
                respRate: dto.respRate ?? null,
                bpSystolic: dto.bpSystolic ?? null,
                bpDiastolic: dto.bpDiastolic ?? null,
                weight: dto.weight != null ? dto.weight : null,
                notes: dto.notes ?? null,
                isCritical: dto.isCritical ?? false,
                alertMessage: dto.alertMessage ?? null,
            },
        });
    }
    async deleteVitals(vitalsId) {
        const record = await database_1.prisma.nicuVitals.findUnique({ where: { id: vitalsId } });
        if (!record)
            throw new common_1.NotFoundException(`Vitals record ${vitalsId} not found`);
        return database_1.prisma.nicuVitals.delete({ where: { id: vitalsId } });
    }
    async getCriticalAlerts() {
        const admissions = await database_1.prisma.admission.findMany({
            where: {
                status: 'ADMITTED',
                department: { contains: 'NICU', mode: 'insensitive' },
            },
            include: {
                patient: {
                    select: {
                        id: true, uhid: true, firstName: true, lastName: true,
                        dateOfBirth: true, gender: true,
                    },
                },
                currentBed: {
                    select: {
                        id: true, bedNumber: true,
                        ward: { select: { id: true, name: true } },
                    },
                },
                vitalsRecords: {
                    where: { acknowledgedAt: null },
                    orderBy: { recordedAt: 'desc' },
                    take: 50,
                },
            },
        });
        const activeAlerts = [];
        for (const a of admissions) {
            if (!a.vitalsRecords || a.vitalsRecords.length === 0)
                continue;
            const v = a.vitalsRecords.find((record) => {
                return (record.isCritical === true ||
                    (record.spo2 !== null && record.spo2 < 92) ||
                    (record.heartRate !== null && record.heartRate > 170) ||
                    (record.bpSystolic !== null && record.bpSystolic > 140) ||
                    (record.bpDiastolic !== null && record.bpDiastolic > 90));
            });
            if (v) {
                const isCritical = v.isCritical || (v.spo2 !== null && v.spo2 < 90) || (v.heartRate !== null && v.heartRate > 180);
                let defaultMessage = '';
                if (v.spo2 !== null && v.spo2 < 90)
                    defaultMessage = `SpO2: ${v.spo2}% (Critically Low)`;
                else if (v.spo2 !== null && v.spo2 < 92)
                    defaultMessage = `SpO2: ${v.spo2}% (Low)`;
                else if (v.heartRate !== null && v.heartRate > 180)
                    defaultMessage = `HR: ${v.heartRate} bpm (Critically High)`;
                else if (v.heartRate !== null && v.heartRate > 170)
                    defaultMessage = `HR: ${v.heartRate} bpm (High)`;
                else if (v.bpSystolic !== null && v.bpSystolic > 140)
                    defaultMessage = `BP: ${v.bpSystolic}/${v.bpDiastolic} (High)`;
                else if (v.isCritical)
                    defaultMessage = 'Manually flagged as critical event.';
                activeAlerts.push({
                    id: a.id,
                    vitalsId: v.id,
                    patient: a.patient,
                    currentBed: a.currentBed,
                    severity: isCritical ? 'CRITICAL' : 'WARNING',
                    alertMessage: v.alertMessage || defaultMessage,
                    vitals: v,
                    recordedAt: v.recordedAt,
                });
            }
        }
        return activeAlerts.sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime());
    }
    async acknowledgeAlert(vitalsId, userId) {
        const record = await database_1.prisma.nicuVitals.findUnique({ where: { id: vitalsId } });
        if (!record)
            throw new common_1.NotFoundException(`Vitals record ${vitalsId} not found`);
        return database_1.prisma.nicuVitals.update({
            where: { id: vitalsId },
            data: {
                acknowledgedAt: new Date(),
                acknowledgedBy: userId || null,
            }
        });
    }
};
exports.NicuService = NicuService;
exports.NicuService = NicuService = __decorate([
    (0, common_1.Injectable)()
], NicuService);
//# sourceMappingURL=nicu.service.js.map