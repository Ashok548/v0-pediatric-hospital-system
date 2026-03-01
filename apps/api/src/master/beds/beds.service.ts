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
        await this.findOne(id);
        // Future-safe: placeholder for checking bill_item or admission assignment
        // if (assigned) throw new ConflictException(...)
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
