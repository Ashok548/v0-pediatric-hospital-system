"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentsService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@carenest/database");
let DepartmentsService = class DepartmentsService {
    async create(dto) {
        await this.assertUniqueDeptName(dto.name);
        return database_1.prisma.department.create({ data: dto });
    }
    async findAll(query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const skip = (page - 1) * limit;
        const where = {
            ...(query.search && {
                OR: [
                    { name: { contains: query.search, mode: "insensitive" } },
                    { description: { contains: query.search, mode: "insensitive" } },
                ],
            }),
            ...(query.status && { status: query.status }),
        };
        const [data, total] = await database_1.prisma.$transaction([
            database_1.prisma.department.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: "asc" },
            }),
            database_1.prisma.department.count({ where }),
        ]);
        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async findOne(id) {
        const dept = await database_1.prisma.department.findUnique({ where: { id } });
        if (!dept)
            throw new common_1.NotFoundException(`Department ${id} not found`);
        return dept;
    }
    async update(id, dto) {
        await this.findOne(id);
        if (dto.name)
            await this.assertUniqueDeptName(dto.name, id);
        return database_1.prisma.department.update({ where: { id }, data: dto });
    }
    async softDelete(id) {
        await this.findOne(id);
        return database_1.prisma.department.update({
            where: { id },
            data: { status: "INACTIVE" },
        });
    }
    async assertUniqueDeptName(name, excludeId) {
        const existing = await database_1.prisma.department.findFirst({
            where: {
                name: { equals: name, mode: "insensitive" },
                ...(excludeId && { NOT: { id: excludeId } }),
            },
        });
        if (existing) {
            throw new common_1.ConflictException(`Department named "${name}" already exists`);
        }
    }
};
exports.DepartmentsService = DepartmentsService;
exports.DepartmentsService = DepartmentsService = __decorate([
    (0, common_1.Injectable)()
], DepartmentsService);
//# sourceMappingURL=departments.service.js.map