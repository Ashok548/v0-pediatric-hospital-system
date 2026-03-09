import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { ApptStatus, Prisma, prisma, Appointment, Patient, User } from '@carenest/database';
import { CreateAppointmentDto, UpdateAppointmentStatusDto } from './dto/create-appointment.dto';

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
            select: { id: true, name: true }
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

    async create(dto: CreateAppointmentDto) {
        const appointmentDate = new Date(dto.appointmentDate);

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

    async findAll(filters: { date?: string, status?: ApptStatus, doctorId?: string, search?: string, patientId?: string }) {
        const where: Prisma.AppointmentWhereInput = {};

        if (filters.date) {
            const d = new Date(filters.date);
            d.setHours(0, 0, 0, 0);
            where.appointmentDate = d;
        } else if (!filters.search && !filters.patientId) {
            // Default to today if no date, search, or patientId provided
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Need to just query the date part loosely or EXACT if JS Date matches
            where.appointmentDate = today;
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

        const appts = await this.prisma.appointment.findMany({
            where,
            include: { patient: true, doctor: true },
            orderBy: [{ appointmentDate: 'desc' }, { timeSlot: 'asc' }],
        });

        return appts.map((a: AppointmentWithRelations) => this.formatResponse(a));
    }

    async getStats(date?: string) {
        const queryDate = date ? new Date(date) : (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();

        const appts = await this.prisma.appointment.findMany({
            where: { appointmentDate: queryDate },
            select: { status: true },
        });

        const stats = {
            total: appts.length,
            scheduled: 0,
            inProgress: 0,
            completed: 0,
            cancelled: 0,
            noShow: 0,
        };

        for (const a of appts) {
            if (a.status === ApptStatus.SCHEDULED) stats.scheduled++;
            else if (a.status === ApptStatus.IN_PROGRESS) stats.inProgress++;
            else if (a.status === ApptStatus.COMPLETED) stats.completed++;
            else if (a.status === ApptStatus.CANCELLED) stats.cancelled++;
            else if (a.status === ApptStatus.NO_SHOW) stats.noShow++;
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

        const startDate = new Date(year, mon, 1);
        const endDate = new Date(year, mon + 1, 0, 23, 59, 59, 999);

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
}
