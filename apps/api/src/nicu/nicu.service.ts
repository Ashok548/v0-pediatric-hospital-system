import { Injectable, NotFoundException } from "@nestjs/common"
import { prisma } from "@carenest/database"
import { CreateVitalsDto } from "./dto/create-vitals.dto"
import { QueryNicuDto } from "./dto/query-nicu.dto"

@Injectable()
export class NicuService {

    /** List all ADMITTED admissions in the NICU department with latest vitals */
    async findNicuAdmissions(query: QueryNicuDto) {
        const { limit = 50, page = 1, search } = query
        const skip = (page - 1) * limit

        const where: any = {
            status: "ADMITTED",
            department: { contains: "NICU", mode: "insensitive" },
        }

        if (search) {
            where.patient = {
                OR: [
                    { firstName: { contains: search, mode: "insensitive" } },
                    { lastName: { contains: search, mode: "insensitive" } },
                    { uhid: { contains: search, mode: "insensitive" } },
                ],
            }
        }

        const [admissions, total] = await Promise.all([
            prisma.admission.findMany({
                where,
                skip,
                take: limit,
                orderBy: { admissionDate: "desc" },
                include: {
                    patient: {
                        select: {
                            id: true, uhid: true, firstName: true, lastName: true,
                            dateOfBirth: true, gender: true,
                        },
                    },
                    admittingDoctor: { select: { id: true, name: true } },
                    currentBed: {
                        select: {
                            id: true, bedNumber: true,
                            ward: { select: { id: true, name: true } },
                        },
                    },
                    vitalsRecords: {
                        orderBy: { recordedAt: "desc" },
                        take: 1,  // Only the latest vitals snapshot
                    },
                },
            }),
            prisma.admission.count({ where }),
        ])

        // Map latest vitals if present
        const data = admissions.map((a: any) => ({
            ...a,
            vitalsRecords: a.vitalsRecords.map((v: any) => this.mapToApi(v))
        }))

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
    }

    /** Get full vitals history for one NICU admission */
    async findVitals(admissionId: string) {
        const admission = await prisma.admission.findUnique({ where: { id: admissionId } })
        if (!admission) throw new NotFoundException(`Admission ${admissionId} not found`)
        const records = await prisma.nicuVitals.findMany({
            where: { admissionId },
            orderBy: { recordedAt: "desc" },
        })
        return records.map((v: any) => this.mapToApi(v))
    }

    /** Record new vitals for a NICU patient */
    async recordVitals(admissionId: string, dto: CreateVitalsDto, recordedBy?: string) {
        const admission = await prisma.admission.findUnique({ where: { id: admissionId } })
        if (!admission) throw new NotFoundException(`Admission ${admissionId} not found`)

        const record = await prisma.nicuVitals.create({
            data: {
                admissionId,
                recordedBy: dto.recordedBy ?? recordedBy ?? null,
                heartRate: dto.heartRate ?? null,
                spo2: dto.spo2 ?? null,
                temperature: dto.temperature != null ? dto.temperature : null,
                respRate: dto.respiratoryRate ?? null,
                bpSystolic: dto.bloodPressureSystolic ?? null,
                bpDiastolic: dto.bloodPressureDiastolic ?? null,
                weight: dto.weight != null ? dto.weight : null,
                notes: dto.notes ?? null,
                isCritical: dto.isCritical ?? false,
                alertMessage: dto.alertMessage ?? null,
            },
        })

        return this.mapToApi(record)
    }

    /** Delete a single vitals record */
    async deleteVitals(vitalsId: string) {
        const record = await prisma.nicuVitals.findUnique({ where: { id: vitalsId } })
        if (!record) throw new NotFoundException(`Vitals record ${vitalsId} not found`)
        return prisma.nicuVitals.delete({ where: { id: vitalsId } })
    }

    /** Get NICU patients with critical vital threshold breaches or manual alerts */
    async getCriticalAlerts() {
        const admissions = await prisma.admission.findMany({
            where: {
                status: 'ADMITTED',
                department: { contains: 'NICU', mode: 'insensitive' },
            },
            include: {
                patient: {
                    select: {
                        id: true, uhid: true, firstName: true, lastName: true,
                        dateOfBirth: true, gender: true,
                    },
                },
                currentBed: {
                    select: {
                        id: true, bedNumber: true,
                        ward: { select: { id: true, name: true } },
                    },
                },
                vitalsRecords: {
                    where: { acknowledgedAt: null }, // Only unacknowledged vitals
                    orderBy: { recordedAt: 'desc' },
                    take: 50, // Grab recent unacknowledged vitals for scanning
                },
            },
        });

        const activeAlerts: any[] = [];

        for (const a of admissions) {
            if (!a.vitalsRecords || a.vitalsRecords.length === 0) continue;

            // Look for the most recent unacknowledged vital that breaches threshold OR is explicitly flagged
            const v = a.vitalsRecords.find((record: any) => {
                return (
                    record.isCritical === true ||
                    (record.spo2 !== null && record.spo2 < 92) ||
                    (record.heartRate !== null && record.heartRate > 170) ||
                    (record.bpSystolic !== null && record.bpSystolic > 140) ||
                    (record.bpDiastolic !== null && record.bpDiastolic > 90)
                );
            });

            if (v) {
                // Determine severity
                const isCritical = v.isCritical || (v.spo2 !== null && v.spo2 < 90) || (v.heartRate !== null && v.heartRate > 180);

                let defaultMessage = '';
                if (v.spo2 !== null && v.spo2 < 90) defaultMessage = `SpO2: ${v.spo2}% (Critically Low)`;
                else if (v.spo2 !== null && v.spo2 < 92) defaultMessage = `SpO2: ${v.spo2}% (Low)`;
                else if (v.heartRate !== null && v.heartRate > 180) defaultMessage = `HR: ${v.heartRate} bpm (Critically High)`;
                else if (v.heartRate !== null && v.heartRate > 170) defaultMessage = `HR: ${v.heartRate} bpm (High)`;
                else if (v.bpSystolic !== null && v.bpSystolic > 140) defaultMessage = `BP: ${v.bpSystolic}/${v.bpDiastolic} (High)`;
                else if (v.isCritical) defaultMessage = 'Manually flagged as critical event.';

                activeAlerts.push({
                    id: a.id,
                    vitalsId: v.id, // ID of the specific vital record to acknowledge
                    patient: a.patient,
                    currentBed: a.currentBed,
                    severity: isCritical ? 'CRITICAL' : 'WARNING',
                    alertMessage: v.alertMessage || defaultMessage,
                    vitals: this.mapToApi(v),
                    recordedAt: v.recordedAt,
                });
            }
        }

        return activeAlerts.sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime());
    }

    /** Helper to map database fields to API names */
    private mapToApi(v: any) {
        if (!v) return v
        const { respRate, bpSystolic, bpDiastolic, ...rest } = v
        return {
            ...rest,
            respiratoryRate: respRate,
            bloodPressureSystolic: bpSystolic,
            bloodPressureDiastolic: bpDiastolic
        }
    }

    /** Acknowledge a critical NICU alert */
    async acknowledgeAlert(vitalsId: string, userId?: string) {
        const record = await prisma.nicuVitals.findUnique({ where: { id: vitalsId } })
        if (!record) throw new NotFoundException(`Vitals record ${vitalsId} not found`)

        return prisma.nicuVitals.update({
            where: { id: vitalsId },
            data: {
                acknowledgedAt: new Date(),
                acknowledgedBy: userId || null,
            }
        })
    }
}
