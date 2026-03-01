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

        return { data: admissions, total, page, limit, totalPages: Math.ceil(total / limit) }
    }

    /** Get full vitals history for one NICU admission */
    async findVitals(admissionId: string) {
        const admission = await prisma.admission.findUnique({ where: { id: admissionId } })
        if (!admission) throw new NotFoundException(`Admission ${admissionId} not found`)
        return prisma.nicuVitals.findMany({
            where: { admissionId },
            orderBy: { recordedAt: "desc" },
        })
    }

    /** Record new vitals for a NICU patient */
    async recordVitals(admissionId: string, dto: CreateVitalsDto, recordedBy?: string) {
        const admission = await prisma.admission.findUnique({ where: { id: admissionId } })
        if (!admission) throw new NotFoundException(`Admission ${admissionId} not found`)

        return prisma.nicuVitals.create({
            data: {
                admissionId,
                recordedBy: dto.recordedBy ?? recordedBy ?? null,
                heartRate: dto.heartRate ?? null,
                spo2: dto.spo2 ?? null,
                temperature: dto.temperature != null ? dto.temperature : null,
                respiratoryRate: dto.respiratoryRate ?? null,
                bloodPressureSystolic: dto.bloodPressureSystolic ?? null,
                bloodPressureDiastolic: dto.bloodPressureDiastolic ?? null,
                weight: dto.weight != null ? dto.weight : null,
                notes: dto.notes ?? null,
            },
        })
    }

    /** Delete a single vitals record */
    async deleteVitals(vitalsId: string) {
        const record = await prisma.nicuVitals.findUnique({ where: { id: vitalsId } })
        if (!record) throw new NotFoundException(`Vitals record ${vitalsId} not found`)
        return prisma.nicuVitals.delete({ where: { id: vitalsId } })
    }
}
