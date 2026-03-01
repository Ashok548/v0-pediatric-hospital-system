"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientsService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@carenest/database");
const PATIENT_SELECT = {
    id: true,
    uhid: true,
    firstName: true,
    lastName: true,
    gender: true,
    dateOfBirth: true,
    bloodGroup: true,
    abhaId: true,
    phone: true,
    email: true,
    guardianName: true,
    guardianPhone: true,
    guardianRelationship: true,
    birthWeight: true,
    address: true,
    city: true,
    state: true,
    pincode: true,
    status: true,
    createdAt: true,
    updatedAt: true,
};
let PatientsService = class PatientsService {
    async generateUhid() {
        const currentYear = new Date().getFullYear();
        const updateResult = await database_1.prisma.$executeRaw `
      UPDATE patient_sequences 
      SET last_value = last_value + 1, updated_at = NOW() 
      WHERE id = 1 AND year = ${currentYear}
    `;
        if (updateResult === 0) {
            await database_1.prisma.patientSequence.upsert({
                where: { id_year: { id: 1, year: currentYear } },
                update: {
                    year: currentYear,
                    lastValue: 1,
                },
                create: {
                    id: 1,
                    year: currentYear,
                    lastValue: 1,
                },
            });
            const sequenceRow = await database_1.prisma.patientSequence.findUnique({
                where: { id_year: { id: 1, year: currentYear } }
            });
            return `HSP-${currentYear}-${String(sequenceRow.lastValue).padStart(6, "0")}`;
        }
        const sequenceRow = await database_1.prisma.patientSequence.findUnique({
            where: { id_year: { id: 1, year: currentYear } }
        });
        return `HSP-${currentYear}-${String(sequenceRow.lastValue).padStart(6, "0")}`;
    }
    async create(dto) {
        const uhid = await this.generateUhid();
        if (new Date(dto.dateOfBirth) > new Date()) {
            throw new common_1.BadRequestException("Date of birth cannot be in the future");
        }
        return database_1.prisma.patient.create({
            data: {
                ...dto,
                dateOfBirth: new Date(dto.dateOfBirth),
                uhid,
            },
            select: PATIENT_SELECT,
        });
    }
    async findAll(query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const skip = (page - 1) * limit;
        const where = {};
        if (query.status)
            where.status = query.status;
        if (query.search) {
            where.OR = [
                { firstName: { contains: query.search, mode: "insensitive" } },
                { lastName: { contains: query.search, mode: "insensitive" } },
                { phone: { contains: query.search } },
                { uhid: { contains: query.search, mode: "insensitive" } },
            ];
        }
        const [data, total] = await database_1.prisma.$transaction([
            database_1.prisma.patient.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [query.sortBy]: query.order },
                select: PATIENT_SELECT,
            }),
            database_1.prisma.patient.count({ where }),
        ]);
        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async findOne(id) {
        const patient = await database_1.prisma.patient.findUnique({
            where: { id },
            select: PATIENT_SELECT,
        });
        if (!patient)
            throw new common_1.NotFoundException(`Patient ${id} not found`);
        return patient;
    }
    async update(id, dto) {
        await this.findOne(id);
        if (dto.dateOfBirth && new Date(dto.dateOfBirth) > new Date()) {
            throw new Error("Date of birth cannot be in the future");
        }
        return database_1.prisma.patient.update({
            where: { id },
            data: {
                ...dto,
                ...(dto.dateOfBirth && { dateOfBirth: new Date(dto.dateOfBirth) }),
            },
            select: PATIENT_SELECT,
        });
    }
    async softDelete(id) {
        await this.findOne(id);
        return database_1.prisma.patient.update({
            where: { id },
            data: { status: "INACTIVE" },
            select: PATIENT_SELECT,
        });
    }
};
exports.PatientsService = PatientsService;
exports.PatientsService = PatientsService = __decorate([
    (0, common_1.Injectable)()
], PatientsService);
//# sourceMappingURL=patients.service.js.map