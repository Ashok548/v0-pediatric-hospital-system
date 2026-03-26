import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { ApptStatus, Prisma, prisma, Appointment, Patient, User } from '@carenest/database';
import { CreateAppointmentDto, UpdateAppointmentStatusDto, RescheduleAppointmentDto } from './dto/create-appointment.dto';

type AppointmentWithRelations = Appointment & {
    patient: Patient;
    doctor: User;
};

@Injectable()
export class AppointmentsService {
    private readonly prisma = prisma;

    constructor() { }

    private calculateAge(dob: Date): string {
        const today = new Date();
        const m = today.getMonth() - dob.getMonth();
        let years = today.getFullYear() - dob.getFullYear();
        let months = m;

        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
            years--;
            months = 12 + m;
        }

        if (years === 0) {
            return `${months}mo`;
        }
        return `${years}y ${months > 0 ? months + 'mo' : ''}`.trim();
    }

    async getDoctors() {
        return this.prisma.user.findMany({
            where: { role: { name: 'DOCTOR' }, status: 'ACTIVE' },
            select: { id: true, name: true, consultationFee: true }
        });
    }

    private mapStatus(s: ApptStatus): string {
        const map: Record<string, string> = {
            SCHEDULED: 'Scheduled',
            IN_PROGRESS: 'In Progress',
            COMPLETED: 'Completed',
            CANCELLED: 'Cancelled',
            NO_SHOW: 'No Show',
        };
        return map[s] || s;
    }

    private mapInputStatus(s: string): ApptStatus {
        const map: Record<string, ApptStatus> = {
            'Scheduled': ApptStatus.SCHEDULED,
            'In Progress': ApptStatus.IN_PROGRESS,
            'Completed': ApptStatus.COMPLETED,
            'Cancelled': ApptStatus.CANCELLED,
            'No Show': ApptStatus.NO_SHOW,
        };
        return map[s] || (s as ApptStatus);
    }

    private formatResponse(appt: AppointmentWithRelations) {
        return {
            id: appt.id,
            patientId: appt.patientId,
            patientName: `${appt.patient.firstName} ${appt.patient.lastName}`,
            uhid: appt.patient.uhid,
            age: this.calculateAge(appt.patient.dateOfBirth),
            gender: appt.patient.gender === 'MALE' ? 'M' : appt.patient.gender === 'FEMALE' ? 'F' : 'O',
            doctor: appt.doctor.name,
            doctorId: appt.doctorId,
            department: appt.department,
            appointmentDate: appt.appointmentDate.toISOString(),
            time: appt.timeSlot,
            duration: appt.duration,
            status: this.mapStatus(appt.status),
            type: appt.type,
            token: appt.token,
            notes: appt.notes,
            chiefComplaint: appt.chiefComplaint,
        };
    }

    async create(dto: CreateAppointmentDto & { patientId?: string }) {
        let finalPatientId = dto.patientId;

        // If 'NEW', create a dummy patient or require patient creation logic first
        if (dto.patientId === 'NEW') {
            // ...
        }

        const dateStr = dto.appointmentDate.split('T')[0];
        const appointmentDate = new Date(`${dateStr}T00:00:00.000Z`);

        return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // Check double booking
            const existing = await tx.appointment.findUnique({
                where: {
                    doctorId_appointmentDate_timeSlot: {
                        doctorId: dto.doctorId,
                        appointmentDate,
                        timeSlot: dto.timeSlot,
                    }
                }
            });

            if (existing && existing.status !== ApptStatus.CANCELLED) {
                throw new ConflictException(`Time slot ${dto.timeSlot} is already booked for this doctor.`);
            }

            // Calculate daily token
            const lastAppt = await tx.appointment.findFirst({
                where: { doctorId: dto.doctorId, appointmentDate },
                orderBy: { token: 'desc' },
            });
            const nextToken = lastAppt ? lastAppt.token + 1 : 1;

            const appt = await tx.appointment.create({
                data: {
                    ...dto,
                    appointmentDate,
                    token: nextToken,
                    status: ApptStatus.SCHEDULED,
                },
                include: { patient: true, doctor: true },
            });

            return this.formatResponse(appt);
        });
    }

    async findAll(filters: { date?: string, status?: ApptStatus, doctorId?: string, search?: string, patientId?: string, page?: number, limit?: number }) {
        const where: Prisma.AppointmentWhereInput = {};

        if (filters.date) {
            // Force pure UTC midnight of the target date to match the DB Date field perfectly
            // For example, 2026-03-25T18:30:00.000Z -> 2026-03-25
            const dateStr = filters.date.split('T')[0]; 
            where.appointmentDate = new Date(`${dateStr}T00:00:00.000Z`);
        } else if (!filters.search && !filters.patientId) {
            // Default to today in local timezone mapped to UTC midnight
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            where.appointmentDate = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
        }

        if (filters.status) where.status = filters.status;
        if (filters.doctorId) where.doctorId = filters.doctorId;
        if (filters.patientId) where.patientId = filters.patientId;

        if (filters.search) {
            where.patient = {
                OR: [
                    { firstName: { contains: filters.search, mode: 'insensitive' } },
                    { lastName: { contains: filters.search, mode: 'insensitive' } },
                    { uhid: { contains: filters.search, mode: 'insensitive' } },
                ]
            };
        }

        const page = filters.page ? Number(filters.page) : 1;
        const limit = filters.limit ? Number(filters.limit) : 50;
        const skip = (page - 1) * limit;

        const [appts, total] = await Promise.all([
            this.prisma.appointment.findMany({
                where,
                include: { patient: true, doctor: true },
                orderBy: [{ appointmentDate: 'desc' }, { timeSlot: 'asc' }],
                skip,
                take: limit,
            }),
            this.prisma.appointment.count({ where })
        ]);

        return {
            data: appts.map((a: AppointmentWithRelations) => this.formatResponse(a)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async getStats(date?: string) {
        const queryDate = date ? (() => {
            const dateStr = date.split('T')[0];
            return new Date(`${dateStr}T00:00:00.000Z`);
        })() : (() => { 
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
        })();

        const counts = await this.prisma.appointment.groupBy({
            by: ['status'],
            where: { appointmentDate: queryDate },
            _count: { status: true },
        });

        const stats = {
            total: 0,
            scheduled: 0,
            inProgress: 0,
            completed: 0,
            cancelled: 0,
            noShow: 0,
        };

        for (const group of counts) {
            const count = group._count.status;
            stats.total += count;
            if (group.status === ApptStatus.SCHEDULED) stats.scheduled = count;
            else if (group.status === ApptStatus.IN_PROGRESS) stats.inProgress = count;
            else if (group.status === ApptStatus.COMPLETED) stats.completed = count;
            else if (group.status === ApptStatus.CANCELLED) stats.cancelled = count;
            else if (group.status === ApptStatus.NO_SHOW) stats.noShow = count;
        }

        return stats;
    }

    async findOne(id: string) {
        const appt = await this.prisma.appointment.findUnique({
            where: { id },
            include: { patient: true, doctor: true },
        });
        if (!appt) throw new NotFoundException('Appointment not found');
        return this.formatResponse(appt);
    }

    async getLastVisit(patientId: string) {
        const lastAppt = await this.prisma.appointment.findFirst({
            where: { 
                patientId,
                status: { in: [ApptStatus.COMPLETED, ApptStatus.SCHEDULED] }
            },
            orderBy: [{ appointmentDate: 'desc' }, { createdAt: 'desc' }],
            include: { doctor: true },
        });
        
        if (!lastAppt) return null;
        
        return {
            doctorId: lastAppt.doctorId,
            doctorName: lastAppt.doctor.name,
            department: lastAppt.department,
            type: lastAppt.type,
            appointmentDate: lastAppt.appointmentDate.toISOString(),
        };
    }

    async updateStatus(id: string, dto: UpdateAppointmentStatusDto) {
        const existing = await this.prisma.appointment.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Appointment not found');

        const current = existing.status;
        const target = this.mapInputStatus(dto.status);

        // Basic transition logic
        if (current === ApptStatus.COMPLETED || current === ApptStatus.CANCELLED) {
            if (target !== current) {
                // allow recovering cancelled perhaps, but for now block it
                throw new BadRequestException(`Cannot change status from ${current} to ${target}`);
            }
        }

        const appt = await this.prisma.appointment.update({
            where: { id },
            data: { status: target },
            include: { patient: true, doctor: true },
        });

        return this.formatResponse(appt);
    }

    async getCalendar(month?: string, doctorId?: string) {
        // month is expected as "YYYY-MM", e.g. "2026-03"
        const now = new Date();
        let year = now.getFullYear();
        let mon = now.getMonth(); // 0-based

        if (month && /^\d{4}-\d{2}$/.test(month)) {
            const [y, m] = month.split('-').map(Number);
            year = y;
            mon = m - 1;
        }

        const startDateStr = `${year}-${String(mon + 1).padStart(2, '0')}-01T00:00:00.000Z`;
        
        // Find the last day of the month by going to day 0 of the next month
        const nextMonthDate = new Date(Date.UTC(year, mon + 1, 0));
        const lastDayStr = String(nextMonthDate.getUTCDate()).padStart(2, '0');
        const endDateStr = `${year}-${String(mon + 1).padStart(2, '0')}-${lastDayStr}T23:59:59.999Z`;

        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        const where: Prisma.AppointmentWhereInput = {
            appointmentDate: {
                gte: startDate,
                lte: endDate,
            },
        };

        if (doctorId) {
            where.doctorId = doctorId;
        }

        const appts = await this.prisma.appointment.findMany({
            where,
            select: {
                appointmentDate: true,
            },
        });

        // Group by day number
        const dayCounts: Record<number, number> = {};
        for (const a of appts) {
            const day = new Date(a.appointmentDate).getDate();
            dayCounts[day] = (dayCounts[day] || 0) + 1;
        }

        return {
            year,
            month: mon + 1,
            days: dayCounts,
        };
    }

    async getDepartments() {
        const depts = await this.prisma.department.findMany({ 
            where: { status: 'ACTIVE' }, 
            orderBy: { name: 'asc' } 
        });
        return depts.map((d: { name: string }) => d.name);
    }

    getTypes() {
        return [
            "Consultation",
            "Follow-up",
            "Review",
            "Vaccination",
            "Procedure",
            "Emergency",
            "Routine Checkup"
        ];
    }

    async reschedule(id: string, dto: RescheduleAppointmentDto) {
        const existing = await this.prisma.appointment.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Appointment not found');

        if (existing.status !== ApptStatus.SCHEDULED) {
            throw new BadRequestException(`Cannot reschedule appointment in status: ${existing.status}`);
        }

        const dateStr = dto.appointmentDate.split('T')[0];
        const apptDate = new Date(`${dateStr}T00:00:00.000Z`);

        const appt = await this.prisma.appointment.update({
            where: { id },
            data: {
                appointmentDate: apptDate,
                timeSlot: dto.timeSlot,
                doctorId: dto.doctorId,
            },
            include: { patient: true, doctor: true },
        });

        return this.formatResponse(appt);
    }

    async remove(id: string) {
        const existing = await this.prisma.appointment.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Appointment not found');

        await this.prisma.appointment.delete({ where: { id } });
        return { success: true };
    }
}
