import {
    Injectable,
    NotFoundException,
    ConflictException,
} from "@nestjs/common";
import { prisma } from "@carenest/database";
import { CreateFloorDto } from "./dto/create-floor.dto";
import { UpdateFloorDto } from "./dto/update-floor.dto";
import { QueryFloorsDto } from "./dto/query-floors.dto";

@Injectable()
export class FloorsService {

    // ─── Create ────────────────────────────────────────────────────────────────
    async create(dto: CreateFloorDto) {
        await this.assertUniqueFloorNumber(dto.floorNumber);
        return prisma.floor.create({ data: dto });
    }

    // ─── List (paginated) ──────────────────────────────────────────────────────
    async findAll(query: QueryFloorsDto) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const skip = (page - 1) * limit;

        const where = {
            ...(query.search && {
                OR: [
                    { name: { contains: query.search, mode: "insensitive" as const } },
                ],
            }),
            ...(query.status && { status: query.status }),
        };

        const [data, total] = await prisma.$transaction([
            prisma.floor.findMany({
                where,
                skip,
                take: limit,
                orderBy: { floorNumber: "asc" },
            }),
            prisma.floor.count({ where }),
        ]);

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    // ─── Full Hierarchy (for Bed Management UI) ────────────────────────────────
    async findHierarchy() {
        return prisma.floor.findMany({
            where: { status: "ACTIVE" },
            orderBy: { floorNumber: "asc" },
            include: {
                wards: {
                    where: { status: "ACTIVE" },
                    orderBy: { name: "asc" },
                    include: {
                        beds: {
                            orderBy: { bedNumber: "asc" },
                        },
                    },
                },
            },
        });
    }

    // ─── Get One ───────────────────────────────────────────────────────────────
    async findOne(id: string) {
        const floor = await prisma.floor.findUnique({
            where: { id },
            include: { _count: { select: { wards: true } } },
        });
        if (!floor) throw new NotFoundException(`Floor ${id} not found`);
        return floor;
    }

    // ─── Update ────────────────────────────────────────────────────────────────
    async update(id: string, dto: UpdateFloorDto) {
        await this.findOne(id);
        if (dto.floorNumber !== undefined) {
            await this.assertUniqueFloorNumber(dto.floorNumber, id);
        }
        return prisma.floor.update({ where: { id }, data: dto });
    }

    // ─── Soft Delete ───────────────────────────────────────────────────────────
    async softDelete(id: string) {
        await this.findOne(id);
        const wardCount = await prisma.ward.count({
            where: { floorId: id, status: "ACTIVE" },
        });
        if (wardCount > 0) {
            throw new ConflictException(
                `Cannot deactivate: this floor has ${wardCount} active ward(s). Deactivate all wards first.`
            );
        }
        return prisma.floor.update({
            where: { id },
            data: { status: "INACTIVE" },
        });
    }

    // ─── Helpers ───────────────────────────────────────────────────────────────
    private async assertUniqueFloorNumber(floorNumber: number, excludeId?: string) {
        const existing = await prisma.floor.findFirst({
            where: {
                floorNumber,
                ...(excludeId && { NOT: { id: excludeId } }),
            },
        });
        if (existing) {
            throw new ConflictException(`Floor number ${floorNumber} already exists`);
        }
    }
}
