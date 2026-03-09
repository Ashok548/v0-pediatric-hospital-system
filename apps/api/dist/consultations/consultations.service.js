"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsultationsService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@carenest/database");
let ConsultationsService = class ConsultationsService {
    async create(dto, doctorId) {
        return database_1.prisma.consultation.create({
            data: {
                ...dto,
                doctorId,
            },
        });
    }
    async findByPatient(patientId) {
        return database_1.prisma.consultation.findMany({
            where: { patientId },
            include: {
                doctor: {
                    select: { id: true, name: true }
                },
                appointment: true,
                admission: true,
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    async findOne(id) {
        const consultation = await database_1.prisma.consultation.findUnique({
            where: { id },
            include: {
                doctor: {
                    select: { id: true, name: true }
                },
                patient: {
                    select: { id: true, firstName: true, lastName: true, uhid: true }
                }
            }
        });
        if (!consultation) {
            throw new common_1.NotFoundException(`Consultation with ID ${id} not found`);
        }
        return consultation;
    }
    async update(id, dto, doctorId) {
        const existing = await database_1.prisma.consultation.findUnique({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException(`Consultation with ID ${id} not found`);
        }
        if (existing.doctorId !== doctorId) {
            throw new common_1.UnauthorizedException("You can only edit your own consultation notes");
        }
        if (existing.admissionId && (dto.historyOfIllness || dto.examinationNotes || dto.plan || dto.chiefComplaint)) {
            const summaryList = [];
            const cc = dto.chiefComplaint ?? existing.chiefComplaint;
            const hopi = dto.historyOfIllness ?? existing.historyOfIllness;
            const oe = dto.examinationNotes ?? existing.examinationNotes;
            const plan = dto.plan ?? existing.plan;
            if (cc)
                summaryList.push(`C/O: ${cc}`);
            if (hopi)
                summaryList.push(`HOPI: ${hopi}`);
            if (oe)
                summaryList.push(`O/E: ${oe}`);
            if (plan)
                summaryList.push(`Plan: ${plan}`);
            const compiledNote = summaryList.join('\n\n');
            await database_1.prisma.admission.update({
                where: { id: existing.admissionId },
                data: { clinicalNote: compiledNote }
            });
        }
        return database_1.prisma.consultation.update({
            where: { id },
            data: dto,
        });
    }
};
exports.ConsultationsService = ConsultationsService;
exports.ConsultationsService = ConsultationsService = __decorate([
    (0, common_1.Injectable)()
], ConsultationsService);
//# sourceMappingURL=consultations.service.js.map