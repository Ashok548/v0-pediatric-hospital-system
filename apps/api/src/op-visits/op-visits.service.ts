import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from "@nestjs/common";
import { prisma } from "@carenest/database";
import { CreateOPVisitDto, UpdateOPVisitStatusDto, QueryOPVisitsDto } from "./dto/op-visit.dto";

const OP_VISIT_INCLUDE = {
    patient: {
        select: { id: true, uhid: true, firstName: true, lastName: true, phone: true, gender: true, dateOfBirth: true },
    },
    appointment: {
        select: { id: true, token: true, timeSlot: true, type: true, status: true, department: true },
    },
    bill: {
        select: { id: true, billNumber: true, status: true, netAmount: true },
    },
} as const;

@Injectable()
export class OPVisitsService {

    // ─── Atomic OP Number Generator ─────────────────────────────────────────────
    private async generateOPNumber(): Promise<string> {
        const year = new Date().getFullYear();

        const updated = await prisma.$executeRaw`
            UPDATE op_visit_sequences
            SET last_value = last_value + 1, updated_at = NOW()
            WHERE id = 1 AND year = ${year}
        `;

        if (updated === 0) {
            await prisma.oPVisitSequence.upsert({
                where: { id_year: { id: 1, year } },
                update: { year, lastValue: 1 },
                create: { id: 1, year, lastValue: 1 },
            });
        }

        const seq = await prisma.oPVisitSequence.findUnique({
            where: { id_year: { id: 1, year } },
        });

        return `OP-${year}-${String(seq!.lastValue).padStart(6, "0")}`;
    }

    // ─── Create OP Visit ─────────────────────────────────────────────────────────
    async create(dto: CreateOPVisitDto, userId?: string) {
        // Validate patient
        const patient = await prisma.patient.findUnique({ where: { id: dto.patientId } });
        if (!patient) throw new NotFoundException(`Patient ${dto.patientId} not found`);

        // Validate appointment if provided & check for duplicate
        if (dto.appointmentId) {
            const appt = await prisma.appointment.findUnique({ where: { id: dto.appointmentId } });
            if (!appt) throw new NotFoundException(`Appointment ${dto.appointmentId} not found`);
            if (appt.patientId !== dto.patientId) {
                throw new BadRequestException("Appointment does not belong to this patient");
            }
            // Check if an OP visit already exists for this appointment
            const existing = await prisma.oPVisit.findUnique({ where: { appointmentId: dto.appointmentId } });
            if (existing) {
                throw new ConflictException(`OP visit already generated for this appointment: ${existing.opNumber}`);
            }
        }

        return prisma.$transaction(async (tx: any) => {
            const year = new Date().getFullYear();
            const updated = await tx.$executeRaw`
                UPDATE op_visit_sequences SET last_value = last_value + 1, updated_at = NOW() WHERE id = 1 AND year = ${year}
            `;

            if (updated === 0) {
                await tx.oPVisitSequence.upsert({
                    where: { id_year: { id: 1, year } },
                    update: { year, lastValue: 1 },
                    create: { id: 1, year, lastValue: 1 },
                });
            }

            const seq = await tx.oPVisitSequence.findUnique({
                where: { id_year: { id: 1, year } },
            });
            const opNumber = `OP-${year}-${String(seq!.lastValue).padStart(6, "0")}`;

            const opVisit = await tx.oPVisit.create({
                data: {
                    opNumber,
                    patientId: dto.patientId,
                    appointmentId: dto.appointmentId,
                    doctorId: dto.doctorId,
                    department: dto.department,
                    notes: dto.notes,
                },
                include: OP_VISIT_INCLUDE,
            });

            await tx.auditLog.create({
                data: {
                    entity: 'OPVisit',
                    entityId: opVisit.id,
                    action: 'CREATE',
                    oldValue: null,
                    newValue: 'REGISTERED',
                    userId: userId ?? null,
                }
            });

            return opVisit;
        });
    }

    // ─── Find All ────────────────────────────────────────────────────────────────
    async findAll(query: QueryOPVisitsDto) {
        const page = Number(query.page ?? 1);
        const limit = Number(query.limit ?? 50);
        const skip = (page - 1) * limit;

        const where: any = {};

        if (query.patientId) where.patientId = query.patientId;
        if (query.status) where.status = query.status;

        if (query.date) {
            const start = new Date(query.date);
            start.setUTCHours(0, 0, 0, 0);
            const end = new Date(start);
            end.setUTCHours(23, 59, 59, 999);
            where.visitDate = { gte: start, lte: end };
        } else if (!query.patientId) {
            // Default to today in UTC
            const start = new Date();
            start.setUTCHours(0, 0, 0, 0);
            const end = new Date(start);
            end.setUTCHours(23, 59, 59, 999);
            where.visitDate = { gte: start, lte: end };
        }

        const [data, total] = await prisma.$transaction([
            prisma.oPVisit.findMany({
                where,
                skip,
                take: limit,
                include: OP_VISIT_INCLUDE,
                orderBy: { visitDate: "desc" },
            }),
            prisma.oPVisit.count({ where }),
        ]);

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    // ─── Find One ────────────────────────────────────────────────────────────────
    async findOne(id: string) {
        const visit = await prisma.oPVisit.findUnique({ where: { id }, include: OP_VISIT_INCLUDE });
        if (!visit) throw new NotFoundException(`OP Visit ${id} not found`);
        return visit;
    }

    public static readonly ALLOWED_TRANSITIONS: Record<string, string[]> = {
        REGISTERED:     ['TRIAGED', 'CANCELLED', 'BILLED'],
        TRIAGED:        ['PRE_CONSULT', 'CONVERTED_TO_ER', 'CANCELLED', 'BILLED'],
        PRE_CONSULT:    ['CONSULTING', 'CANCELLED', 'BILLED'],
        CONSULTING:     ['ORDERS_PLACED', 'COMPLETED', 'CANCELLED', 'BILLED'],
        ORDERS_PLACED:  ['COMPLETED', 'BILLED'],
        IN_PROGRESS:    ['COMPLETED', 'CANCELLED', 'BILLED'], // legacy compat
        COMPLETED:      ['BILLED'],
        BILLED:         [],
        CANCELLED:      [],
        CONVERTED_TO_ER:[],
    };

    // ─── Update Status ───────────────────────────────────────────────────────────
    async updateStatus(id: string, dto: UpdateOPVisitStatusDto, userId?: string) {
        return prisma.$transaction(async (tx: any) => {
            const visit = await tx.oPVisit.findUnique({ where: { id } });
            if (!visit) throw new NotFoundException(`OP Visit ${id} not found`);

            const currentStatus = visit.status;
            const newStatus = dto.status;

            if (currentStatus === newStatus) {
                await tx.auditLog.create({
                    data: {
                        entity: 'OPVisit',
                        entityId: id,
                        action: 'STATUS_NOOP',
                        oldValue: currentStatus,
                        newValue: newStatus,
                        userId: userId,
                    }
                });
                return tx.oPVisit.findUnique({ where: { id }, include: OP_VISIT_INCLUDE });
            }

            const allowed = OPVisitsService.ALLOWED_TRANSITIONS[currentStatus] || [];
            if (!allowed.includes(newStatus)) {
                throw new BadRequestException(`Invalid transition from ${currentStatus} to ${newStatus}`);
            }

            const updatedVisit = await tx.oPVisit.update({
                where: { id },
                data: { status: newStatus as any },
                include: OP_VISIT_INCLUDE,
            });

            await tx.auditLog.create({
                data: {
                    entity: 'OPVisit',
                    entityId: id,
                    action: 'STATUS_CHANGE',
                    oldValue: currentStatus,
                    newValue: newStatus,
                    userId: userId,
                }
            });

            return updatedVisit;
        });
    }
}
