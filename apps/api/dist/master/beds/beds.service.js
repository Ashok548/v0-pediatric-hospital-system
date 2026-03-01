"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BedsService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@carenest/database");
const database_2 = require("@carenest/database");
let BedsService = class BedsService {
    async create(dto) {
        await this.assertWardExists(dto.wardId);
        try {
            return await database_2.prisma.bed.create({
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
        }
        catch (error) {
            if (error instanceof database_1.Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
                throw new common_1.ConflictException(`Bed number "${dto.bedNumber}" already exists in this ward`);
            }
            throw error;
        }
    }
    async findAll(query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const skip = (page - 1) * limit;
        const where = {
            ...(query.search && {
                bedNumber: { contains: query.search, mode: "insensitive" },
            }),
            ...(query.wardId && { wardId: query.wardId }),
            ...(query.floorId && { ward: { floorId: query.floorId } }),
            ...(query.status && { status: query.status }),
        };
        const [data, total] = await database_2.prisma.$transaction([
            database_2.prisma.bed.findMany({
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
            database_2.prisma.bed.count({ where }),
        ]);
        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async findOne(id) {
        const bed = await database_2.prisma.bed.findUnique({
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
        if (!bed)
            throw new common_1.NotFoundException(`Bed ${id} not found`);
        return bed;
    }
    async update(id, dto) {
        const existing = await this.findOne(id);
        if (dto.wardId)
            await this.assertWardExists(dto.wardId);
        if (dto.bedNumber || dto.wardId) {
            const targetWardId = dto.wardId ?? existing.wardId;
            const targetBedNumber = dto.bedNumber ?? existing.bedNumber;
            await this.assertUniqueBedInWard(targetBedNumber, targetWardId, id);
        }
        try {
            return await database_2.prisma.bed.update({
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
        }
        catch (error) {
            if (error instanceof database_1.Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
                throw new common_1.ConflictException(`Bed number "${dto.bedNumber}" already exists in this ward`);
            }
            throw error;
        }
    }
    async softDelete(id) {
        await this.findOne(id);
        return database_2.prisma.bed.update({
            where: { id },
            data: { status: "MAINTENANCE" },
        });
    }
    async assertWardExists(wardId) {
        const ward = await database_2.prisma.ward.findUnique({ where: { id: wardId } });
        if (!ward)
            throw new common_1.NotFoundException(`Ward ${wardId} not found`);
        if (ward.status === "INACTIVE") {
            throw new common_1.ConflictException(`Ward ${wardId} is inactive`);
        }
    }
    async assertUniqueBedInWard(bedNumber, wardId, excludeId) {
        const existing = await database_2.prisma.bed.findFirst({
            where: {
                bedNumber,
                wardId,
                ...(excludeId && { NOT: { id: excludeId } }),
            },
        });
        if (existing) {
            throw new common_1.ConflictException(`Bed number "${bedNumber}" already exists in this ward`);
        }
    }
};
exports.BedsService = BedsService;
exports.BedsService = BedsService = __decorate([
    (0, common_1.Injectable)()
], BedsService);
//# sourceMappingURL=beds.service.js.map