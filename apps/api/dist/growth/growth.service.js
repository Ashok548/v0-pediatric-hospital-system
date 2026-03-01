"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrowthService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@carenest/database");
let GrowthService = class GrowthService {
    async findByPatient(patientId) {
        const patient = await database_1.prisma.patient.findUnique({ where: { id: patientId } });
        if (!patient)
            throw new common_1.NotFoundException(`Patient ${patientId} not found`);
        return database_1.prisma.growthRecord.findMany({
            where: { patientId },
            orderBy: { recordedAt: "desc" },
        });
    }
    async create(patientId, dto, recordedBy) {
        const patient = await database_1.prisma.patient.findUnique({ where: { id: patientId } });
        if (!patient)
            throw new common_1.NotFoundException(`Patient ${patientId} not found`);
        return database_1.prisma.growthRecord.create({
            data: {
                patientId,
                recordedBy: dto.recordedBy ?? recordedBy ?? null,
                ageMonths: dto.ageMonths,
                weight: dto.weight != null ? dto.weight : null,
                height: dto.height != null ? dto.height : null,
                headCircumference: dto.headCircumference != null ? dto.headCircumference : null,
                notes: dto.notes ?? null,
            },
        });
    }
    async remove(recordId) {
        const record = await database_1.prisma.growthRecord.findUnique({ where: { id: recordId } });
        if (!record)
            throw new common_1.NotFoundException(`Growth record ${recordId} not found`);
        return database_1.prisma.growthRecord.delete({ where: { id: recordId } });
    }
};
exports.GrowthService = GrowthService;
exports.GrowthService = GrowthService = __decorate([
    (0, common_1.Injectable)()
], GrowthService);
//# sourceMappingURL=growth.service.js.map