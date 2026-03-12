import {
    Injectable,
    NotFoundException,
    ConflictException,
} from "@nestjs/common";
import { Prisma } from "@carenest/database";
import { prisma } from "@carenest/database";
import { CreateBedDto } from "./dto/create-bed.dto";
import { UpdateBedDto } from "./dto/update-bed.dto";
import { QueryBedsDto } from "./dto/query-beds.dto";
import { BatchCreateBedsDto } from "./dto/batch-create-beds.dto";

@Injectable()
export class BedsService {

    // ─── Create ────────────────────────────────────────────────────────────────
    async create(dto: CreateBedDto) {
        await this.assertWardExists(dto.wardId);
        try {
            return await prisma.bed.create({
                data: dto,
                include: {
                    ward: {
                        select: {
                            id: true, name: true,
                            floor: { select: { id: true, name: true, floorNumber: true } },
                        },
                    },
                },
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
                throw new ConflictException(
                    `Bed number "${dto.bedNumber}" already exists in this ward`
                );
            }
            throw error;
        }
    }

    // ─── Batch Create ──────────────────────────────────────────────────────────
    async batchCreate(dto: BatchCreateBedsDto) {
        await this.assertWardExists(dto.wardId);

        if (dto.startNumber > dto.endNumber) {
            throw new ConflictException("Start number cannot be greater than end number");
        }

        const maxBatchSize = 100;
        if (dto.endNumber - dto.startNumber + 1 > maxBatchSize) {
            throw new ConflictException(`Cannot create more than ${maxBatchSize} beds at once`);
        }

        const bedsToCreate = [];
        for (let i = dto.startNumber; i <= dto.endNumber; i++) {
            // Pad with leading zero if < 10 (e.g., NICU-01, NICU-10)
            const paddedNumber = i < 10 ? `0${i}` : `${i}`;
            const bedNumber = `${dto.prefix}-${paddedNumber}`;
            
            bedsToCreate.push({
                wardId: dto.wardId,
                bedNumber,
                status: "AVAILABLE",
            });
        }

        const result = await prisma.bed.createMany({
            data: bedsToCreate as any,
            skipDuplicates: true, // If bed already exists in ward, skip it instead of throwing
        });

        const totalAttempted = dto.endNumber - dto.startNumber + 1;
        return {
            created: result.count,
            skipped: totalAttempted - result.count,
            total: totalAttempted
        };
    }

    // ─── List (paginated) ──────────────────────────────────────────────────────
    async findAll(query: QueryBedsDto) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const skip = (page - 1) * limit;

        const where = {
            ...(query.search && {
                bedNumber: { contains: query.search, mode: "insensitive" as const },
            }),
            ...(query.wardId && { wardId: query.wardId }),
            // Cross-join: filter by floor through ward relation
            ...(query.floorId && { ward: { floorId: query.floorId } }),
            ...(query.status && { status: query.status }),
        };

        const [data, total] = await prisma.$transaction([
            prisma.bed.findMany({
                where,
                skip,
                take: limit,
                orderBy: [{ wardId: "asc" }, { bedNumber: "asc" }],
                include: {
                    ward: {
                        select: {
                            id: true, name: true,
                            floor: { select: { id: true, name: true, floorNumber: true } },
                        },
                    },
                },
            }),
            prisma.bed.count({ where }),
        ]);

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    // ─── Get One ───────────────────────────────────────────────────────────────
    async findOne(id: string) {
        const bed = await prisma.bed.findUnique({
            where: { id },
            include: {
                ward: {
                    select: {
                        id: true, name: true,
                        floor: { select: { id: true, name: true, floorNumber: true } },
                    },
                },
            },
        });
        if (!bed) throw new NotFoundException(`Bed ${id} not found`);
        return bed;
    }

    // ─── Update ────────────────────────────────────────────────────────────────
    async update(id: string, dto: UpdateBedDto) {
        const existing = await this.findOne(id);
        if (dto.wardId) await this.assertWardExists(dto.wardId);

        // If bedNumber or wardId changes, check uniqueness
        if (dto.bedNumber || dto.wardId) {
            const targetWardId = dto.wardId ?? existing.wardId;
            const targetBedNumber = dto.bedNumber ?? existing.bedNumber;
            await this.assertUniqueBedInWard(targetBedNumber, targetWardId, id);
        }

        try {
            return await prisma.bed.update({
                where: { id },
                data: dto,
                include: {
                    ward: {
                        select: {
                            id: true, name: true,
                            floor: { select: { id: true, name: true, floorNumber: true } },
                        },
                    },
                },
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
                throw new ConflictException(
                    `Bed number "${dto.bedNumber}" already exists in this ward`
                );
            }
            throw error;
        }
    }

    // ─── Soft Delete (sets MAINTENANCE) ────────────────────────────────────────
    async softDelete(id: string) {
        const bed = await this.findOne(id);
        
        if (bed.status === "OCCUPIED") {
            throw new ConflictException("Cannot set to maintenance: bed is currently occupied");
        }
        
        return prisma.bed.update({
            where: { id },
            data: { status: "MAINTENANCE" },
        });
    }

    // ─── Helpers ───────────────────────────────────────────────────────────────
    private async assertWardExists(wardId: string) {
        const ward = await prisma.ward.findUnique({ where: { id: wardId } });
        if (!ward) throw new NotFoundException(`Ward ${wardId} not found`);
        if (ward.status === "INACTIVE") {
            throw new ConflictException(`Ward ${wardId} is inactive`);
        }
    }

    private async assertUniqueBedInWard(bedNumber: string, wardId: string, excludeId?: string) {
        const existing = await prisma.bed.findFirst({
            where: {
                bedNumber,
                wardId,
                ...(excludeId && { NOT: { id: excludeId } }),
            },
        });
        if (existing) {
            throw new ConflictException(
                `Bed number "${bedNumber}" already exists in this ward`
            );
        }
    }
}
