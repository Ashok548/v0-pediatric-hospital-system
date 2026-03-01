import { Injectable, NotFoundException } from "@nestjs/common"
import { prisma } from "@carenest/database"
import { CreateGrowthRecordDto } from "./dto/create-growth-record.dto"

@Injectable()
export class GrowthService {

    /** Get all growth records for a patient, sorted newest first */
    async findByPatient(patientId: string) {
        const patient = await prisma.patient.findUnique({ where: { id: patientId } })
        if (!patient) throw new NotFoundException(`Patient ${patientId} not found`)

        return prisma.growthRecord.findMany({
            where: { patientId },
            orderBy: { recordedAt: "desc" },
        })
    }

    /** Add a new growth measurement for a patient */
    async create(patientId: string, dto: CreateGrowthRecordDto, recordedBy?: string) {
        const patient = await prisma.patient.findUnique({ where: { id: patientId } })
        if (!patient) throw new NotFoundException(`Patient ${patientId} not found`)

        return prisma.growthRecord.create({
            data: {
                patientId,
                recordedBy: dto.recordedBy ?? recordedBy ?? null,
                ageMonths: dto.ageMonths,
                weight: dto.weight != null ? dto.weight : null,
                height: dto.height != null ? dto.height : null,
                headCircumference: dto.headCircumference != null ? dto.headCircumference : null,
                notes: dto.notes ?? null,
            },
        })
    }

    /** Delete a growth record */
    async remove(recordId: string) {
        const record = await prisma.growthRecord.findUnique({ where: { id: recordId } })
        if (!record) throw new NotFoundException(`Growth record ${recordId} not found`)
        return prisma.growthRecord.delete({ where: { id: recordId } })
    }
}
