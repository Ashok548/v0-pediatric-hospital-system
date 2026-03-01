import {
    Injectable,
    NotFoundException,
    ConflictException,
} from "@nestjs/common";
import { prisma } from "@carenest/database";
import { CreateWardDto } from "./dto/create-ward.dto";
import { UpdateWardDto } from "./dto/update-ward.dto";
import { QueryWardsDto } from "./dto/query-wards.dto";

@Injectable()
export class WardsService {

    // ─── Create ────────────────────────────────────────────────────────────────
    async create(dto: CreateWardDto) {
        await this.assertFloorExists(dto.floorId);
        await this.assertUniqueWardNameInFloor(dto.name, dto.floorId);
        return prisma.ward.create({
            data: dto,
            include: { floor: { select: { id: true, name: true, floorNumber: true } } },
        });
    }

    // ─── List (paginated) ──────────────────────────────────────────────────────
    async findAll(query: QueryWardsDto) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const skip = (page - 1) * limit;

        const where = {
            ...(query.search && {
                name: { contains: query.search, mode: "insensitive" as const },
            }),
            ...(query.floorId && { floorId: query.floorId }),
            ...(query.type && { type: query.type }),
            ...(query.status && { status: query.status }),
        };

        const [data, total] = await prisma.$transaction([
            prisma.ward.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    floor: { select: { id: true, name: true, floorNumber: true } },
                    _count: { select: { beds: true } },
                },
            }),
            prisma.ward.count({ where }),
        ]);

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    // ─── Get One ───────────────────────────────────────────────────────────────
    async findOne(id: string) {
        const ward = await prisma.ward.findUnique({
            where: { id },
            include: {
                floor: { select: { id: true, name: true, floorNumber: true } },
                _count: { select: { beds: true } },
            },
        });
        if (!ward) throw new NotFoundException(`Ward ${id} not found`);
        return ward;
    }

    // ─── Update ────────────────────────────────────────────────────────────────
    async update(id: string, dto: UpdateWardDto) {
        const existing = await this.findOne(id);

        if (dto.floorId) await this.assertFloorExists(dto.floorId);

        const targetFloorId = dto.floorId ?? existing.floorId;
        const targetName = dto.name ?? existing.name;

        // Only check uniqueness if name or floor changed
        if (dto.name || dto.floorId) {
            await this.assertUniqueWardNameInFloor(targetName, targetFloorId, id);
        }

        return prisma.ward.update({
            where: { id },
            data: dto,
            include: { floor: { select: { id: true, name: true, floorNumber: true } } },
        });
    }

    // ─── Soft Delete ───────────────────────────────────────────────────────────
    async softDelete(id: string) {
        await this.findOne(id);
        const bedCount = await prisma.bed.count({
            where: { wardId: id, status: { not: "MAINTENANCE" } },
        });
        if (bedCount > 0) {
            throw new ConflictException(
                `Cannot deactivate: this ward has ${bedCount} active bed(s). Set all beds to Maintenance first.`
            );
        }
        return prisma.ward.update({ where: { id }, data: { status: "INACTIVE" } });
    }

    // ─── Helpers ───────────────────────────────────────────────────────────────
    private async assertFloorExists(floorId: string) {
        const floor = await prisma.floor.findUnique({ where: { id: floorId } });
        if (!floor) throw new NotFoundException(`Floor ${floorId} not found`);
        if (floor.status === "INACTIVE") {
            throw new ConflictException(`Floor ${floorId} is inactive. Activate it before adding wards.`);
        }
    }

    private async assertUniqueWardNameInFloor(name: string, floorId: string, excludeId?: string) {
        const existing = await prisma.ward.findFirst({
            where: {
                name: { equals: name, mode: "insensitive" },
                floorId,
                ...(excludeId && { NOT: { id: excludeId } }),
            },
        });
        if (existing) {
            throw new ConflictException(`A ward named "${name}" already exists on this floor`);
        }
    }
}
