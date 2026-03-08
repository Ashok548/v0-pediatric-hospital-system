import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { prisma } from '@carenest/database';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { CreateNursingNoteDto, CreateIoRecordDto, UpdateNursingNoteDto, UpdateIoRecordDto } from './dto/create-nursing-note.dto';

@Injectable()
export class NursingService {
    /** Find an admission (throws if not found) */
    private async getAdmission(id: string) {
        const admission = await prisma.admission.findUnique({
            where: { id },
            include: { patient: true, currentBed: { include: { ward: true } } },
        });
        if (!admission) throw new NotFoundException(`Admission ID ${id} not found`);
        return admission;
    }

    // ─── Nursing Notes ────────────────────────────────────────────────────────

    async getNotesByAdmission(admissionId: string) {
        return prisma.nursingNote.findMany({
            where: { admissionId },
            orderBy: { recordedAt: 'desc' },
        });
    }

    async createNote(admissionId: string, dto: CreateNursingNoteDto, userName: string) {
        await this.getAdmission(admissionId);
        return prisma.nursingNote.create({
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

    async updateNote(id: string, dto: UpdateNursingNoteDto) {
        try {
            return await prisma.nursingNote.update({
                where: { id },
                data: {
                    ...(dto.noteType && { noteType: dto.noteType }),
                    ...(dto.content && { content: dto.content }),
                    ...(dto.priority && { priority: dto.priority }),
                    ...(dto.shiftPeriod !== undefined && { shiftPeriod: dto.shiftPeriod }),
                },
            });
        } catch (e) {
            if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025') {
                throw new NotFoundException(`NursingNote ID ${id} not found`);
            }
            throw new InternalServerErrorException('Failed to update nursing note');
        }
    }

    async deleteNote(id: string) {
        try {
            await prisma.nursingNote.delete({ where: { id } });
        } catch (e) {
            if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025') {
                throw new NotFoundException(`NursingNote ID ${id} not found`);
            }
            throw new InternalServerErrorException('Failed to delete nursing note');
        }
    }

    // ─── IO Records ───────────────────────────────────────────────────────────

    async getIoRecordsByAdmission(admissionId: string) {
        return prisma.ioRecord.findMany({
            where: { admissionId },
            orderBy: { recordedAt: 'desc' },
        });
    }

    async createIoRecord(admissionId: string, dto: CreateIoRecordDto, userName: string) {
        await this.getAdmission(admissionId);
        return prisma.ioRecord.create({
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

    async deleteIoRecord(id: string) {
        try {
            await prisma.ioRecord.delete({ where: { id } });
        } catch (e) {
            if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025') {
                throw new NotFoundException(`IoRecord ID ${id} not found`);
            }
            throw new InternalServerErrorException('Failed to delete I/O record');
        }
    }

    async updateIoRecord(id: string, dto: UpdateIoRecordDto) {
        try {
            return await prisma.ioRecord.update({
                where: { id },
                data: {
                    ...(dto.ioType && { ioType: dto.ioType }),
                    ...(dto.route && { route: dto.route }),
                    ...(dto.volumeMl !== undefined && { volumeMl: dto.volumeMl }),
                    ...(dto.notes !== undefined && { notes: dto.notes }),
                },
            });
        } catch (e) {
            if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025') {
                throw new NotFoundException(`IoRecord ID ${id} not found`);
            }
            throw new InternalServerErrorException('Failed to update I/O record');
        }
    }

    async deleteVitalRecord(id: string) {
        try {
            await prisma.vitalRecord.delete({ where: { id } });
        } catch (e) {
            if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025') {
                throw new NotFoundException(`VitalRecord ID ${id} not found`);
            }
            throw new InternalServerErrorException('Failed to delete vital record');
        }
    }

    // ─── Handover Summary ──────────────────────────────────────────────────────

    /**
     * Retrieves a shift handover summary for a given department.
     * Gets all currently admitted patients in that dept, along with their:
     * 1. Latest vitals (specifically from the last 24h)
     * 2. Notes from the current selected shift
     */
    async getDepartmentHandover(department: string, shiftPeriod: string) {
        // 1. Get admitted patients for the department
        const admissions = await prisma.admission.findMany({
            where: { department, status: 'ADMITTED' },
            include: {
                patient: true,
                currentBed: { include: { ward: true } },
                // Latest vitals snapshot
                vitalsRecords: {
                    take: 1,
                    orderBy: { recordedAt: 'desc' },
                },
                // Notes from this shift to highlight in handover
                nursingNotes: {
                    where: { shiftPeriod },
                    orderBy: { recordedAt: 'desc' },
                    take: 5, // Top 5 recent notes per patient for the shift
                },
            },
        });

        return admissions;
    }
}
