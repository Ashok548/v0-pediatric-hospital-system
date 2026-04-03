import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { prisma } from '@carenest/database';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';
import { OPVisitsService } from '../op-visits/op-visits.service';

export const ConsultationStatus = {
    DRAFT: 'DRAFT',
    SIGNED: 'SIGNED',
    AMENDED: 'AMENDED'
} as const;

@Injectable()
export class ConsultationsService {
    // Audit log on initial creation
    async create(dto: CreateConsultationDto, doctorId: string) {
        return prisma.$transaction(async (tx: any) => {
            const consultation = await tx.consultation.create({
                data: { ...dto, doctorId },
            });
            await tx.auditLog.create({
                data: { entity: 'Consultation', entityId: consultation.id, action: 'CREATE', oldValue: null, newValue: ConsultationStatus.DRAFT, userId: doctorId }
            });

            // Automate OPVisit state to CONSULTING when doctor starts writing notes
            if (dto.opVisitId) {
                const visit = await tx.oPVisit.findUnique({ where: { id: dto.opVisitId } });
                if (visit && OPVisitsService.ALLOWED_TRANSITIONS[visit.status]?.includes('CONSULTING')) {
                    await tx.oPVisit.update({
                        where: { id: dto.opVisitId },
                        data: { status: 'CONSULTING' }
                    });
                    await tx.auditLog.create({
                        data: {
                            entity: 'OPVisit', entityId: dto.opVisitId, action: 'STATUS_CHANGE',
                            oldValue: visit.status, newValue: 'CONSULTING', userId: doctorId,
                        }
                    });
                }
            }

            return consultation;
        });
    }

    async findByPatient(patientId: string, pageParam?: string, limitParam?: string) {
        const page = Number(pageParam ?? 1);
        const limit = Number(limitParam ?? 50);
        const skip = (page - 1) * limit;

        const [data, total] = await prisma.$transaction([
            prisma.consultation.findMany({
                where: { patientId },
                skip,
                take: limit,
                include: {
                    doctor: {
                        select: { id: true, name: true }
                    },
                    appointment: true,
                    admission: {
                        select: { id: true, admissionDate: true, dischargeDate: true, status: true }
                    },
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.consultation.count({ where: { patientId } })
        ]);

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
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
        return prisma.$transaction(async (tx: any) => {
            const existing = await tx.consultation.findUnique({ where: { id } });
            if (!existing) {
                throw new NotFoundException(`Consultation with ID ${id} not found`);
            }

            if (existing.doctorId !== doctorId) {
                throw new UnauthorizedException("You can only edit your own consultation notes");
            }

            if (existing.status !== ConsultationStatus.DRAFT) {
                throw new BadRequestException("Cannot edit a signed consultation. Please create an amendment.");
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

                await tx.admission.update({
                    where: { id: existing.admissionId },
                    data: { clinicalNote: compiledNote }
                });
            }

            const updated = await tx.consultation.update({
                where: { id },
                data: dto,
            });

            await tx.auditLog.create({
                data: {
                    entity: 'Consultation', entityId: id, action: 'UPDATE',
                    oldValue: 'DRAFT', newValue: 'EDITED', userId: doctorId
                }
            });

            return updated;
        });
    }

    async signConsultation(id: string, doctorId: string) {
        return prisma.$transaction(async (tx: any) => {
            const existing = await tx.consultation.findUnique({ where: { id } });
            if (!existing) throw new NotFoundException(`Consultation with ID ${id} not found`);
            if (existing.doctorId !== doctorId) throw new UnauthorizedException("You can only sign your own consultation notes");
            if (existing.status !== ConsultationStatus.DRAFT) {
                throw new BadRequestException(`Consultation is already ${existing.status}`);
            }

            const signed = await tx.consultation.update({
                where: { id },
                data: { status: ConsultationStatus.SIGNED, signedAt: new Date() },
                include: {
                    doctor: { select: { id: true, name: true } },
                    patient: { select: { id: true, firstName: true, lastName: true, uhid: true } }
                }
            });

            await tx.auditLog.create({
                data: {
                    entity: 'Consultation', entityId: id, action: 'STATUS_CHANGE',
                    oldValue: ConsultationStatus.DRAFT, newValue: ConsultationStatus.SIGNED, userId: doctorId,
                }
            });

            // Write OrdersSigned outbox event — BillingService will listen and auto-draft an invoice
            await tx.outboxEvent.create({
                data: {
                    aggregateType: 'Consultation',
                    aggregateId: id,
                    eventType: 'OrdersSigned',
                    payload: {
                        consultationId: id,
                        opVisitId: existing.opVisitId,
                        patientId: existing.patientId,
                        doctorId,
                    },
                }
            });

            // Smart Completion Cascade: Check if Patient actually has active orders
            if (existing.opVisitId) {
                const visit = await tx.oPVisit.findUnique({ where: { id: existing.opVisitId } });
                if (visit) {
                    const allowedTransitions = OPVisitsService.ALLOWED_TRANSITIONS[visit.status] || [];
                    
                    const pendingPrescriptions = await tx.prescription.count({
                        where: { opVisitId: existing.opVisitId, status: { in: ['PENDING', 'PARTIAL'] } }
                    });
                    const pendingLabs = await tx.labOrder.count({
                        where: { opVisitId: existing.opVisitId, status: { in: ['PENDING', 'SAMPLE_COLLECTED', 'READY_FOR_VERIFICATION'] } }
                    });

                    const hasPendingOrders = (pendingPrescriptions > 0 || pendingLabs > 0);
                    const targetStatus = hasPendingOrders ? 'ORDERS_PLACED' : 'COMPLETED';

                    if (allowedTransitions.includes(targetStatus)) {
                        await tx.oPVisit.update({
                            where: { id: existing.opVisitId },
                            data: { status: targetStatus }
                        });
                        await tx.auditLog.create({
                            data: {
                                entity: 'OPVisit', entityId: existing.opVisitId, action: 'STATUS_CHANGE',
                                oldValue: visit.status, newValue: targetStatus, userId: doctorId,
                            }
                        });
                    }
                }
            }

            return signed;
        });
    }
}
