"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentsService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@carenest/database");
let AppointmentsService = class AppointmentsService {
    prisma = database_1.prisma;
    constructor() { }
    calculateAge(dob) {
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
    mapStatus(s) {
        const map = {
            SCHEDULED: 'Scheduled',
            IN_PROGRESS: 'In Progress',
            COMPLETED: 'Completed',
            CANCELLED: 'Cancelled',
            NO_SHOW: 'No Show',
        };
        return map[s] || s;
    }
    mapInputStatus(s) {
        const map = {
            'Scheduled': database_1.ApptStatus.SCHEDULED,
            'In Progress': database_1.ApptStatus.IN_PROGRESS,
            'Completed': database_1.ApptStatus.COMPLETED,
            'Cancelled': database_1.ApptStatus.CANCELLED,
            'No Show': database_1.ApptStatus.NO_SHOW,
        };
        return map[s] || s;
    }
    formatResponse(appt) {
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
    async create(dto) {
        const appointmentDate = new Date(dto.appointmentDate);
        return this.prisma.$transaction(async (tx) => {
            const existing = await tx.appointment.findUnique({
                where: {
                    doctorId_appointmentDate_timeSlot: {
                        doctorId: dto.doctorId,
                        appointmentDate,
                        timeSlot: dto.timeSlot,
                    }
                }
            });
            if (existing && existing.status !== database_1.ApptStatus.CANCELLED) {
                throw new common_1.ConflictException(`Time slot ${dto.timeSlot} is already booked for this doctor.`);
            }
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
                    status: database_1.ApptStatus.SCHEDULED,
                },
                include: { patient: true, doctor: true },
            });
            return this.formatResponse(appt);
        });
    }
    async findAll(filters) {
        const where = {};
        if (filters.date) {
            const d = new Date(filters.date);
            d.setHours(0, 0, 0, 0);
            where.appointmentDate = d;
        }
        else if (!filters.search && !filters.patientId) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            where.appointmentDate = today;
        }
        if (filters.status)
            where.status = filters.status;
        if (filters.doctorId)
            where.doctorId = filters.doctorId;
        if (filters.patientId)
            where.patientId = filters.patientId;
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
        return appts.map((a) => this.formatResponse(a));
    }
    async getStats(date) {
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
            if (a.status === database_1.ApptStatus.SCHEDULED)
                stats.scheduled++;
            else if (a.status === database_1.ApptStatus.IN_PROGRESS)
                stats.inProgress++;
            else if (a.status === database_1.ApptStatus.COMPLETED)
                stats.completed++;
            else if (a.status === database_1.ApptStatus.CANCELLED)
                stats.cancelled++;
            else if (a.status === database_1.ApptStatus.NO_SHOW)
                stats.noShow++;
        }
        return stats;
    }
    async findOne(id) {
        const appt = await this.prisma.appointment.findUnique({
            where: { id },
            include: { patient: true, doctor: true },
        });
        if (!appt)
            throw new common_1.NotFoundException('Appointment not found');
        return this.formatResponse(appt);
    }
    async updateStatus(id, dto) {
        const existing = await this.prisma.appointment.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Appointment not found');
        const current = existing.status;
        const target = this.mapInputStatus(dto.status);
        if (current === database_1.ApptStatus.COMPLETED || current === database_1.ApptStatus.CANCELLED) {
            if (target !== current) {
                throw new common_1.BadRequestException(`Cannot change status from ${current} to ${target}`);
            }
        }
        const appt = await this.prisma.appointment.update({
            where: { id },
            data: { status: target },
            include: { patient: true, doctor: true },
        });
        return this.formatResponse(appt);
    }
};
exports.AppointmentsService = AppointmentsService;
exports.AppointmentsService = AppointmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], AppointmentsService);
//# sourceMappingURL=appointments.service.js.map