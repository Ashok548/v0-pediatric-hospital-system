import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { prisma } from '@carenest/database';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';

@Injectable()
export class ConsultationsService {
    async create(dto: CreateConsultationDto, doctorId: string) {
        return prisma.consultation.create({
            data: {
                ...dto,
                doctorId,
            },
        });
    }

    async findByPatient(patientId: string) {
        return prisma.consultation.findMany({
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

    async findOne(id: string) {
        const consultation = await prisma.consultation.findUnique({
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
            throw new NotFoundException(`Consultation with ID ${id} not found`);
        }
        return consultation;
    }

    async update(id: string, dto: UpdateConsultationDto, doctorId: string) {
        const existing = await prisma.consultation.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException(`Consultation with ID ${id} not found`);
        }

        if (existing.doctorId !== doctorId) {
            throw new UnauthorizedException("You can only edit your own consultation notes");
        }

        // Sync back to admission's clinicalNote if admissionId is present
        if (existing.admissionId && (dto.historyOfIllness || dto.examinationNotes || dto.plan || dto.chiefComplaint)) {
            const summaryList = [];
            const cc = dto.chiefComplaint ?? existing.chiefComplaint;
            const hopi = dto.historyOfIllness ?? existing.historyOfIllness;
            const oe = dto.examinationNotes ?? existing.examinationNotes;
            const plan = dto.plan ?? existing.plan;

            if (cc) summaryList.push(`C/O: ${cc}`);
            if (hopi) summaryList.push(`HOPI: ${hopi}`);
            if (oe) summaryList.push(`O/E: ${oe}`);
            if (plan) summaryList.push(`Plan: ${plan}`);

            const compiledNote = summaryList.join('\n\n');

            await prisma.admission.update({
                where: { id: existing.admissionId },
                data: { clinicalNote: compiledNote }
            });
        }

        return prisma.consultation.update({
            where: { id },
            data: dto,
        });
    }
}
