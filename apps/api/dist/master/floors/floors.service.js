"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FloorsService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@carenest/database");
let FloorsService = class FloorsService {
    async create(dto) {
        await this.assertUniqueFloorNumber(dto.floorNumber);
        return database_1.prisma.floor.create({ data: dto });
    }
    async findAll(query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const skip = (page - 1) * limit;
        const where = {
            ...(query.search && {
                OR: [
                    { name: { contains: query.search, mode: "insensitive" } },
                ],
            }),
            ...(query.status && { status: query.status }),
        };
        const [data, total] = await database_1.prisma.$transaction([
            database_1.prisma.floor.findMany({
                where,
                skip,
                take: limit,
                orderBy: { floorNumber: "asc" },
            }),
            database_1.prisma.floor.count({ where }),
        ]);
        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async findOne(id) {
        const floor = await database_1.prisma.floor.findUnique({
            where: { id },
            include: { _count: { select: { wards: true } } },
        });
        if (!floor)
            throw new common_1.NotFoundException(`Floor ${id} not found`);
        return floor;
    }
    async update(id, dto) {
        await this.findOne(id);
        if (dto.floorNumber !== undefined) {
            await this.assertUniqueFloorNumber(dto.floorNumber, id);
        }
        return database_1.prisma.floor.update({ where: { id }, data: dto });
    }
    async softDelete(id) {
        await this.findOne(id);
        const wardCount = await database_1.prisma.ward.count({
            where: { floorId: id, status: "ACTIVE" },
        });
        if (wardCount > 0) {
            throw new common_1.ConflictException(`Cannot deactivate: this floor has ${wardCount} active ward(s). Deactivate all wards first.`);
        }
        return database_1.prisma.floor.update({
            where: { id },
            data: { status: "INACTIVE" },
        });
    }
    async assertUniqueFloorNumber(floorNumber, excludeId) {
        const existing = await database_1.prisma.floor.findFirst({
            where: {
                floorNumber,
                ...(excludeId && { NOT: { id: excludeId } }),
            },
        });
        if (existing) {
            throw new common_1.ConflictException(`Floor number ${floorNumber} already exists`);
        }
    }
};
exports.FloorsService = FloorsService;
exports.FloorsService = FloorsService = __decorate([
    (0, common_1.Injectable)()
], FloorsService);
//# sourceMappingURL=floors.service.js.map