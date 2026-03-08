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
            },
        });
    }
    async deleteVitals(vitalsId) {
        const record = await database_1.prisma.nicuVitals.findUnique({ where: { id: vitalsId } });
        if (!record)
            throw new common_1.NotFoundException(`Vitals record ${vitalsId} not found`);
        return database_1.prisma.nicuVitals.delete({ where: { id: vitalsId } });
    }
};
exports.NicuService = NicuService;
exports.NicuService = NicuService = __decorate([
    (0, common_1.Injectable)()
], NicuService);
//# sourceMappingURL=nicu.service.js.map