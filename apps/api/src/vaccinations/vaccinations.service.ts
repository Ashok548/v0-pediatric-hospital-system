import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@carenest/database';
import { AdministerVaccineDto } from './dto/administer-vaccine.dto';
import { addDays } from 'date-fns';

@Injectable()
export class VaccinationsService {

    async getDashboardSummary() {
        // We aggregate data similar to the mock UI
        const patientsWithVaccines = await prisma.patient.findMany({
            include: {
                vaccines: {
                    orderBy: { scheduledDate: 'asc' }
                }
            },
            where: {
                vaccines: { some: {} }
            }
        });

        return patientsWithVaccines.map((p: any) => {
            const completed = p.vaccines.filter((v: any) => v.status === 'COMPLETED').length;
            const total = p.vaccines.length;
            const nextDue = p.vaccines.find((v: any) => v.status === 'PENDING' || v.status === 'MISSED');

            let status = 'Up to Date';
            if (nextDue) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const schedDate = new Date(nextDue.scheduledDate);
                schedDate.setHours(0, 0, 0, 0);

                if (schedDate.getTime() === today.getTime()) {
                    status = 'Due Today';
                } else if (schedDate < today) {
                    status = 'Missed';
                } else {
                    status = 'Upcoming';
                }
            }

            // calculate age string roughly
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
                doctor: "Dr. Default", // Ideally assigned from admission/consultation
                completedCount: completed,
                totalCount: total,
                nextVaccine: nextDue ? nextDue.vaccineName : 'All doses completed',
                nextDate: nextDue ? nextDue.scheduledDate.toISOString().split('T')[0] : '—',
                status,
            }
        });
    }

    async findByPatient(patientId: string) {
        return prisma.patientVaccine.findMany({
            where: { patientId },
            orderBy: { scheduledDate: 'asc' },
            include: { administeredBy: { select: { id: true, name: true } } }
        });
    }

    async generateSchedule(patientId: string) {
        const patient = await prisma.patient.findUnique({ where: { id: patientId } });
        if (!patient) throw new NotFoundException('Patient not found');

        const existing = await prisma.patientVaccine.count({ where: { patientId } });
        if (existing > 0) throw new BadRequestException('Schedule already generated for this patient');

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
            scheduledDate: addDays(dob, s.offsetDays),
            status: 'PENDING',
        }));

        await prisma.patientVaccine.createMany({ data });
        return this.findByPatient(patientId);
    }

    async administerVaccine(id: string, dto: AdministerVaccineDto, userId: string) {
        return prisma.patientVaccine.update({
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
}
