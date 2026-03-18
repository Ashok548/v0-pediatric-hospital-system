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
    async create(dto: CreateOPVisitDto) {
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

        const opNumber = await this.generateOPNumber();

        return prisma.oPVisit.create({
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
    }

    // ─── Find All ────────────────────────────────────────────────────────────────
    async findAll(query: QueryOPVisitsDto) {
        const where: any = {};

        if (query.patientId) where.patientId = query.patientId;
        if (query.status) where.status = query.status;

        if (query.date) {
            const d = new Date(query.date);
            d.setHours(0, 0, 0, 0);
            const end = new Date(d);
            end.setHours(23, 59, 59, 999);
            where.visitDate = { gte: d, lte: end };
        } else if (!query.patientId) {
            // Default to today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const end = new Date(today);
            end.setHours(23, 59, 59, 999);
            where.visitDate = { gte: today, lte: end };
        }

        return prisma.oPVisit.findMany({
            where,
            include: OP_VISIT_INCLUDE,
            orderBy: { visitDate: "desc" },
        });
    }

    // ─── Find One ────────────────────────────────────────────────────────────────
    async findOne(id: string) {
        const visit = await prisma.oPVisit.findUnique({ where: { id }, include: OP_VISIT_INCLUDE });
        if (!visit) throw new NotFoundException(`OP Visit ${id} not found`);
        return visit;
    }

    // ─── Update Status ───────────────────────────────────────────────────────────
    async updateStatus(id: string, dto: UpdateOPVisitStatusDto) {
        const visit = await prisma.oPVisit.findUnique({ where: { id } });
        if (!visit) throw new NotFoundException(`OP Visit ${id} not found`);

        return prisma.oPVisit.update({
            where: { id },
            data: { status: dto.status },
            include: OP_VISIT_INCLUDE,
        });
    }
}
