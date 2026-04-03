import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from "@nestjs/common";
import { prisma, Prisma } from "@carenest/database";
import { nextSequenceValue } from '../common/sequence.util';
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

    // ─── NEW: Tx-aware internal methods (used by BillingService) ────────────
    async createWithTx(tx: Prisma.TransactionClient, dto: CreateOPVisitDto, userId?: string): Promise<any> {
        const patient = await tx.patient.findUnique({ where: { id: dto.patientId } });
        if (!patient) throw new NotFoundException(`Patient ${dto.patientId} not found`);

        if (dto.appointmentId) {
            const appt = await tx.appointment.findUnique({ where: { id: dto.appointmentId } });
            if (!appt) throw new NotFoundException(`Appointment ${dto.appointmentId} not found`);
            if (appt.patientId !== dto.patientId)
                throw new BadRequestException('Appointment does not belong to this patient');
            const existing = await tx.oPVisit.findUnique({ where: { appointmentId: dto.appointmentId } });
            if (existing)
                throw new ConflictException(`OP visit already exists for this appointment: ${existing.opNumber}`);
        }

        const year = new Date().getFullYear();
        const seqVal = await nextSequenceValue(tx, 'op_visit_sequences', year);
        const opNumber = `OP-${year}-${String(seqVal).padStart(6, '0')}`;

        const opVisit = await tx.oPVisit.create({
            data: { opNumber, patientId: dto.patientId, appointmentId: dto.appointmentId, doctorId: dto.doctorId, department: dto.department, notes: dto.notes },
            include: OP_VISIT_INCLUDE,
        });

        await tx.auditLog.create({
            data: { entity: 'OPVisit', entityId: opVisit.id, action: 'CREATE', oldValue: null, newValue: 'REGISTERED', userId: userId ?? null }
        });
        return opVisit;
    }

    async updateStatusWithTx(tx: Prisma.TransactionClient, id: string, newStatus: string, userId?: string): Promise<any> {
        const visit = await tx.oPVisit.findUnique({ where: { id } });
        if (!visit) throw new NotFoundException(`OP Visit ${id} not found`);

        const allowed = OPVisitsService.ALLOWED_TRANSITIONS[visit.status] || [];
        if (!allowed.includes(newStatus))
            throw new BadRequestException(`Invalid transition from ${visit.status} to ${newStatus}`);

        const updated = await tx.oPVisit.update({
            where: { id },
            data: { status: newStatus as any },
            include: OP_VISIT_INCLUDE,
        });
        await tx.auditLog.create({
            data: { entity: 'OPVisit', entityId: id, action: 'STATUS_CHANGE', oldValue: visit.status, newValue: newStatus, userId: userId ?? null }
        });
        return updated;
    }

    // ─── Create OP Visit ─────────────────────────────────────────────────────────
    async create(dto: CreateOPVisitDto, userId?: string) {
        return prisma.$transaction(async (tx: any) => this.createWithTx(tx, dto, userId));
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
            const dateStr = query.date.split('T')[0];
            const start = new Date(`${dateStr}T00:00:00.000Z`);
            const end = new Date(`${dateStr}T23:59:59.999Z`);
            where.visitDate = { gte: start, lte: end };
        } else if (!query.patientId) {
            // Default to today mapped to UTC
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const start = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
            const end = new Date(`${year}-${month}-${day}T23:59:59.999Z`);
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
        return prisma.$transaction(async (tx: any) => this.updateStatusWithTx(tx, id, dto.status, userId));
    }
}
