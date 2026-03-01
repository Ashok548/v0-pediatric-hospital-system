"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WardsService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@carenest/database");
let WardsService = class WardsService {
    async create(dto) {
        await this.assertFloorExists(dto.floorId);
        await this.assertUniqueWardNameInFloor(dto.name, dto.floorId);
        return database_1.prisma.ward.create({
            data: dto,
            include: { floor: { select: { id: true, name: true, floorNumber: true } } },
        });
    }
    async findAll(query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const skip = (page - 1) * limit;
        const where = {
            ...(query.search && {
                name: { contains: query.search, mode: "insensitive" },
            }),
            ...(query.floorId && { floorId: query.floorId }),
            ...(query.type && { type: query.type }),
            ...(query.status && { status: query.status }),
        };
        const [data, total] = await database_1.prisma.$transaction([
            database_1.prisma.ward.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    floor: { select: { id: true, name: true, floorNumber: true } },
                    _count: { select: { beds: true } },
                },
            }),
            database_1.prisma.ward.count({ where }),
        ]);
        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async findOne(id) {
        const ward = await database_1.prisma.ward.findUnique({
            where: { id },
            include: {
                floor: { select: { id: true, name: true, floorNumber: true } },
                _count: { select: { beds: true } },
            },
        });
        if (!ward)
            throw new common_1.NotFoundException(`Ward ${id} not found`);
        return ward;
    }
    async update(id, dto) {
        const existing = await this.findOne(id);
        if (dto.floorId)
            await this.assertFloorExists(dto.floorId);
        const targetFloorId = dto.floorId ?? existing.floorId;
        const targetName = dto.name ?? existing.name;
        if (dto.name || dto.floorId) {
            await this.assertUniqueWardNameInFloor(targetName, targetFloorId, id);
        }
        return database_1.prisma.ward.update({
            where: { id },
            data: dto,
            include: { floor: { select: { id: true, name: true, floorNumber: true } } },
        });
    }
    async softDelete(id) {
        await this.findOne(id);
        const bedCount = await database_1.prisma.bed.count({
            where: { wardId: id, status: { not: "MAINTENANCE" } },
        });
        if (bedCount > 0) {
            throw new common_1.ConflictException(`Cannot deactivate: this ward has ${bedCount} active bed(s). Set all beds to Maintenance first.`);
        }
        return database_1.prisma.ward.update({ where: { id }, data: { status: "INACTIVE" } });
    }
    async assertFloorExists(floorId) {
        const floor = await database_1.prisma.floor.findUnique({ where: { id: floorId } });
        if (!floor)
            throw new common_1.NotFoundException(`Floor ${floorId} not found`);
        if (floor.status === "INACTIVE") {
            throw new common_1.ConflictException(`Floor ${floorId} is inactive. Activate it before adding wards.`);
        }
    }
    async assertUniqueWardNameInFloor(name, floorId, excludeId) {
        const existing = await database_1.prisma.ward.findFirst({
            where: {
                name: { equals: name, mode: "insensitive" },
                floorId,
                ...(excludeId && { NOT: { id: excludeId } }),
            },
        });
        if (existing) {
            throw new common_1.ConflictException(`A ward named "${name}" already exists on this floor`);
        }
    }
};
exports.WardsService = WardsService;
exports.WardsService = WardsService = __decorate([
    (0, common_1.Injectable)()
], WardsService);
//# sourceMappingURL=wards.service.js.map