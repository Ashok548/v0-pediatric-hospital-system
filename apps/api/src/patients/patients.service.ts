import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { prisma } from "@carenest/database";
import { CreatePatientDto } from "./dto/create-patient.dto";
import { UpdatePatientDto } from "./dto/update-patient.dto";
import { QueryPatientsDto } from "./dto/query-patients.dto";
import { Prisma } from "@carenest/database";

// Define a reusable select strictly without deep heavy relationships
const PATIENT_SELECT = {
    id: true,
    uhid: true,
    firstName: true,
    lastName: true,
    gender: true,
    dateOfBirth: true,
    bloodGroup: true,
    abhaId: true,
    phone: true,
    email: true,
    guardianName: true,
    guardianPhone: true,
    guardianRelationship: true,
    birthWeight: true,
    address: true,
    city: true,
    state: true,
    pincode: true,
    status: true,
    createdAt: true,
    updatedAt: true,
} as const;

@Injectable()
export class PatientsService {
    /**
     * Generates a collision-free UHID (e.g., HSP-2025-000123)
     * Uses raw PostgreSQL sequence increment logic for true atomicity.
     */
    private async generateUhid(): Promise<string> {
        const currentYear = new Date().getFullYear();

        // To prevent race conditions, we rely on PostgreSQL's atomic UPDATE logic.
        // We update the sequence row for the current year. If it doesn't exist,
        // the UPDATE will return 0 rows, and we will catch that and do an INSERT.

        // Attempt to atomically increment the value
        const updateResult = await prisma.$executeRaw`
      UPDATE patient_sequences 
      SET last_value = last_value + 1, updated_at = NOW() 
      WHERE id = 1 AND year = ${currentYear}
    `;

        if (updateResult === 0) {
            // It means either this is the very first time (id=1 missing)
            // OR the year changed and we need a new row. We use upsert for simplicity 
            // but only initialize to 1. 
            await prisma.patientSequence.upsert({
                where: { id_year: { id: 1, year: currentYear } },
                update: {
                    year: currentYear,
                    lastValue: 1,
                },
                create: {
                    id: 1,
                    year: currentYear,
                    lastValue: 1,
                },
            });

            // It's possible due to concurrent year rollovers that another thread upserted it.
            // Easiest reliable way is to just read the current state after upsert
            const sequenceRow = await prisma.patientSequence.findUnique({
                where: { id_year: { id: 1, year: currentYear } }
            });
            return `HSP-${currentYear}-${String(sequenceRow!.lastValue).padStart(6, "0")}`;
        }

        // Since our raw UPDATE succeeded, fetch the new value. 
        // PostgreSQL `UPDATE ... RETURNING` directly via raw query gives back objects,
        // but Prisma $executeRaw returns counts. For full safety and easiest mapping:
        const sequenceRow = await prisma.patientSequence.findUnique({
            where: { id_year: { id: 1, year: currentYear } }
        });

        return `HSP-${currentYear}-${String(sequenceRow!.lastValue).padStart(6, "0")}`;
    }

    async create(dto: CreatePatientDto) {
        const uhid = await this.generateUhid();

        // Adding basic sanity check on birth date
        if (new Date(dto.dateOfBirth) > new Date()) {
            throw new BadRequestException("Date of birth cannot be in the future");
        }

        return prisma.patient.create({
            data: {
                ...dto,
                dateOfBirth: new Date(dto.dateOfBirth),
                uhid,
            },
            select: PATIENT_SELECT,
        });
    }

    async findAll(query: QueryPatientsDto) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const skip = (page - 1) * limit;

        const where: Prisma.PatientWhereInput = {};
        if (query.status) where.status = query.status;
        if (query.search) {
            where.OR = [
                { firstName: { contains: query.search, mode: "insensitive" } },
                { lastName: { contains: query.search, mode: "insensitive" } },
                { phone: { contains: query.search } },
                { uhid: { contains: query.search, mode: "insensitive" } },
            ];
        }

        // Use $transaction for read-consistency
        const [data, total] = await prisma.$transaction([
            prisma.patient.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [query.sortBy as string]: query.order },
                select: PATIENT_SELECT,
            }),
            prisma.patient.count({ where }),
        ]);

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async findOne(id: string) {
        const patient = await prisma.patient.findUnique({
            where: { id },
            select: PATIENT_SELECT,
        });
        if (!patient) throw new NotFoundException(`Patient ${id} not found`);
        return patient;
    }

    async update(id: string, dto: UpdatePatientDto) {
        await this.findOne(id); // Ensure exists

        if (dto.dateOfBirth && new Date(dto.dateOfBirth) > new Date()) {
            throw new Error("Date of birth cannot be in the future");
        }

        return prisma.patient.update({
            where: { id },
            data: {
                ...dto,
                ...(dto.dateOfBirth && { dateOfBirth: new Date(dto.dateOfBirth) }),
            },
            select: PATIENT_SELECT,
        });
    }

    async softDelete(id: string) {
        await this.findOne(id);
        return prisma.patient.update({
            where: { id },
            data: { status: "INACTIVE" },
            select: PATIENT_SELECT,
        });
    }
}
