"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NursingService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@carenest/database");
const library_1 = require("@prisma/client/runtime/library");
let NursingService = class NursingService {
    async getAdmission(id) {
        const admission = await database_1.prisma.admission.findUnique({
            where: { id },
            include: { patient: true, currentBed: { include: { ward: true } } },
        });
        if (!admission)
            throw new common_1.NotFoundException(`Admission ID ${id} not found`);
        return admission;
    }
    async getNotesByAdmission(admissionId) {
        return database_1.prisma.nursingNote.findMany({
            where: { admissionId },
            orderBy: { recordedAt: 'desc' },
        });
    }
    async createNote(admissionId, dto, userName) {
        await this.getAdmission(admissionId);
        return database_1.prisma.nursingNote.create({
            data: {
                admissionId,
                noteType: dto.noteType,
                content: dto.content,
                priority: dto.priority,
                shiftPeriod: dto.shiftPeriod,
                recordedBy: userName,
            },
        });
    }
    async updateNote(id, dto) {
        try {
            return await database_1.prisma.nursingNote.update({
                where: { id },
                data: {
                    ...(dto.noteType && { noteType: dto.noteType }),
                    ...(dto.content && { content: dto.content }),
                    ...(dto.priority && { priority: dto.priority }),
                    ...(dto.shiftPeriod !== undefined && { shiftPeriod: dto.shiftPeriod }),
                },
            });
        }
        catch (e) {
            if (e instanceof library_1.PrismaClientKnownRequestError && e.code === 'P2025') {
                throw new common_1.NotFoundException(`NursingNote ID ${id} not found`);
            }
            throw new common_1.InternalServerErrorException('Failed to update nursing note');
        }
    }
    async deleteNote(id) {
        try {
            await database_1.prisma.nursingNote.delete({ where: { id } });
        }
        catch (e) {
            if (e instanceof library_1.PrismaClientKnownRequestError && e.code === 'P2025') {
                throw new common_1.NotFoundException(`NursingNote ID ${id} not found`);
            }
            throw new common_1.InternalServerErrorException('Failed to delete nursing note');
        }
    }
    async getIoRecordsByAdmission(admissionId) {
        return database_1.prisma.ioRecord.findMany({
            where: { admissionId },
            orderBy: { recordedAt: 'desc' },
        });
    }
    async createIoRecord(admissionId, dto, userName) {
        await this.getAdmission(admissionId);
        return database_1.prisma.ioRecord.create({
            data: {
                admissionId,
                ioType: dto.ioType,
                route: dto.route,
                volumeMl: dto.volumeMl,
                notes: dto.notes,
                recordedBy: userName,
            },
        });
    }
    async deleteIoRecord(id) {
        try {
            await database_1.prisma.ioRecord.delete({ where: { id } });
        }
        catch (e) {
            if (e instanceof library_1.PrismaClientKnownRequestError && e.code === 'P2025') {
                throw new common_1.NotFoundException(`IoRecord ID ${id} not found`);
            }
            throw new common_1.InternalServerErrorException('Failed to delete I/O record');
        }
    }
    async updateIoRecord(id, dto) {
        try {
            return await database_1.prisma.ioRecord.update({
                where: { id },
                data: {
                    ...(dto.ioType && { ioType: dto.ioType }),
                    ...(dto.route && { route: dto.route }),
                    ...(dto.volumeMl !== undefined && { volumeMl: dto.volumeMl }),
                    ...(dto.notes !== undefined && { notes: dto.notes }),
                },
            });
        }
        catch (e) {
            if (e instanceof library_1.PrismaClientKnownRequestError && e.code === 'P2025') {
                throw new common_1.NotFoundException(`IoRecord ID ${id} not found`);
            }
            throw new common_1.InternalServerErrorException('Failed to update I/O record');
        }
    }
    async deleteVitalRecord(id) {
        try {
            await database_1.prisma.vitalRecord.delete({ where: { id } });
        }
        catch (e) {
            if (e instanceof library_1.PrismaClientKnownRequestError && e.code === 'P2025') {
                throw new common_1.NotFoundException(`VitalRecord ID ${id} not found`);
            }
            throw new common_1.InternalServerErrorException('Failed to delete vital record');
        }
    }
    async getDepartmentHandover(department, shiftPeriod) {
        const admissions = await database_1.prisma.admission.findMany({
            where: { department, status: 'ADMITTED' },
            include: {
                patient: true,
                currentBed: { include: { ward: true } },
                vitalsRecords: {
                    take: 1,
                    orderBy: { recordedAt: 'desc' },
                },
                nursingNotes: {
                    where: { shiftPeriod },
                    orderBy: { recordedAt: 'desc' },
                    take: 5,
                },
            },
        });
        return admissions;
    }
};
exports.NursingService = NursingService;
exports.NursingService = NursingService = __decorate([
    (0, common_1.Injectable)()
], NursingService);
//# sourceMappingURL=nursing.service.js.map