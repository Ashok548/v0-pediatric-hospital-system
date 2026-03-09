"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VaccinationsService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@carenest/database");
const date_fns_1 = require("date-fns");
let VaccinationsService = class VaccinationsService {
    async getDashboardSummary() {
        const patientsWithVaccines = await database_1.prisma.patient.findMany({
            include: {
                vaccines: {
                    orderBy: { scheduledDate: 'asc' }
                }
            },
            where: {
                vaccines: { some: {} }
            }
        });
        return patientsWithVaccines.map((p) => {
            const completed = p.vaccines.filter((v) => v.status === 'COMPLETED').length;
            const total = p.vaccines.length;
            const nextDue = p.vaccines.find((v) => v.status === 'PENDING' || v.status === 'MISSED');
            let status = 'Up to Date';
            if (nextDue) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const schedDate = new Date(nextDue.scheduledDate);
                schedDate.setHours(0, 0, 0, 0);
                if (schedDate.getTime() === today.getTime()) {
                    status = 'Due Today';
                }
                else if (schedDate < today) {
                    status = 'Missed';
                }
                else {
                    status = 'Upcoming';
                }
            }
            const ageMs = Date.now() - new Date(p.dateOfBirth).getTime();
            const ageMonths = Math.floor(ageMs / (1000 * 60 * 60 * 24 * 30));
            const ageStr = ageMonths >= 12 ? `${Math.floor(ageMonths / 12)}y ${ageMonths % 12}mo` : `${ageMonths}mo`;
            return {
                id: p.id,
                uhid: p.uhid,
                name: `${p.firstName} ${p.lastName}`,
                dob: p.dateOfBirth.toISOString().split('T')[0],
                age: ageStr,
                gender: p.gender === 'MALE' ? 'M' : 'F',
                guardian: p.guardianName,
                doctor: "Dr. Default",
                completedCount: completed,
                totalCount: total,
                nextVaccine: nextDue ? nextDue.vaccineName : 'All doses completed',
                nextDate: nextDue ? nextDue.scheduledDate.toISOString().split('T')[0] : '—',
                status,
            };
        });
    }
    async findByPatient(patientId) {
        return database_1.prisma.patientVaccine.findMany({
            where: { patientId },
            orderBy: { scheduledDate: 'asc' },
            include: { administeredBy: { select: { id: true, name: true } } }
        });
    }
    async generateSchedule(patientId) {
        const patient = await database_1.prisma.patient.findUnique({ where: { id: patientId } });
        if (!patient)
            throw new common_1.NotFoundException('Patient not found');
        const existing = await database_1.prisma.patientVaccine.count({ where: { patientId } });
        if (existing > 0)
            throw new common_1.BadRequestException('Schedule already generated for this patient');
        const dob = new Date(patient.dateOfBirth);
        const schedule = [
            { name: 'BCG', dose: 'Dose 1', offsetDays: 0, ageLabel: 'At Birth' },
            { name: 'OPV 0', dose: 'Dose 1', offsetDays: 0, ageLabel: 'At Birth' },
            { name: 'Hepatitis B 1', dose: 'Dose 1', offsetDays: 0, ageLabel: 'At Birth' },
            { name: 'Pentavalent 1', dose: 'Dose 1', offsetDays: 42, ageLabel: '6 Weeks' },
            { name: 'Rotavirus 1', dose: 'Dose 1', offsetDays: 42, ageLabel: '6 Weeks' },
            { name: 'IPV 1', dose: 'Dose 1', offsetDays: 42, ageLabel: '6 Weeks' },
            { name: 'PCV 1', dose: 'Dose 1', offsetDays: 42, ageLabel: '6 Weeks' },
            { name: 'Pentavalent 2', dose: 'Dose 1', offsetDays: 70, ageLabel: '10 Weeks' },
            { name: 'Rotavirus 2', dose: 'Dose 1', offsetDays: 70, ageLabel: '10 Weeks' },
            { name: 'IPV 2', dose: 'Dose 1', offsetDays: 70, ageLabel: '10 Weeks' },
            { name: 'PCV 2', dose: 'Dose 1', offsetDays: 70, ageLabel: '10 Weeks' },
            { name: 'Pentavalent 3', dose: 'Dose 1', offsetDays: 98, ageLabel: '14 Weeks' },
            { name: 'Rotavirus 3', dose: 'Dose 1', offsetDays: 98, ageLabel: '14 Weeks' },
            { name: 'IPV 3', dose: 'Dose 1', offsetDays: 98, ageLabel: '14 Weeks' },
            { name: 'PCV 3', dose: 'Dose 1', offsetDays: 98, ageLabel: '14 Weeks' },
            { name: 'Measles / MR 1', dose: 'Dose 1', offsetDays: 270, ageLabel: '9 Months' },
            { name: 'Vitamin A 1', dose: 'Dose 1', offsetDays: 270, ageLabel: '9 Months' },
            { name: 'Hepatitis A 1', dose: 'Dose 1', offsetDays: 365, ageLabel: '12 Months' },
            { name: 'MMR 1', dose: 'Dose 1', offsetDays: 450, ageLabel: '15 Months' },
            { name: 'Varicella 1', dose: 'Dose 1', offsetDays: 450, ageLabel: '15 Months' },
            { name: 'PCV Booster', dose: 'Booster 1', offsetDays: 450, ageLabel: '15 Months' },
            { name: 'DPT Booster 1', dose: 'Booster 1', offsetDays: 540, ageLabel: '18 Months' },
            { name: 'OPV Booster 1', dose: 'Booster 1', offsetDays: 540, ageLabel: '18 Months' },
            { name: 'Hepatitis A 2', dose: 'Dose 2', offsetDays: 540, ageLabel: '18 Months' },
            { name: 'Typhoid Conjugate', dose: 'Dose 1', offsetDays: 730, ageLabel: '24 Months' },
            { name: 'DPT Booster 2', dose: 'Booster 2', offsetDays: 1460, ageLabel: '4-6 Years' },
            { name: 'OPV Booster 2', dose: 'Booster 2', offsetDays: 1460, ageLabel: '4-6 Years' },
            { name: 'MMR 2', dose: 'Dose 2', offsetDays: 1460, ageLabel: '4-6 Years' },
            { name: 'Varicella 2', dose: 'Dose 2', offsetDays: 1460, ageLabel: '4-6 Years' },
            { name: 'Tdap / Td', dose: 'Dose 1', offsetDays: 3650, ageLabel: '10-12 Years' },
            { name: 'HPV (Girls)', dose: 'Dose 1', offsetDays: 3650, ageLabel: '10-12 Years' },
        ];
        const data = schedule.map(s => ({
            patientId,
            vaccineName: s.name,
            dose: s.dose,
            ageLabel: s.ageLabel,
            scheduledDate: (0, date_fns_1.addDays)(dob, s.offsetDays),
            status: 'PENDING',
        }));
        await database_1.prisma.patientVaccine.createMany({ data });
        return this.findByPatient(patientId);
    }
    async administerVaccine(id, dto, userId) {
        return database_1.prisma.patientVaccine.update({
            where: { id },
            data: {
                status: 'COMPLETED',
                administeredDate: new Date(dto.dateAdministered),
                site: dto.site,
                batchNumber: dto.batchNumber,
                notes: dto.notes,
                administeredById: userId,
            }
        });
    }
};
exports.VaccinationsService = VaccinationsService;
exports.VaccinationsService = VaccinationsService = __decorate([
    (0, common_1.Injectable)()
], VaccinationsService);
//# sourceMappingURL=vaccinations.service.js.map