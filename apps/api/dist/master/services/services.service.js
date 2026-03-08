"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServicesService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@carenest/database");
let ServicesService = class ServicesService {
    async create(dto) {
        const code = dto.code || `${dto.category.substring(0, 3)}-${dto.name.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
        const existing = await database_1.prisma.service.findUnique({
            where: { name_category: { name: dto.name, category: dto.category } }
        });
        if (existing) {
            import('@nestjs/common').then(m => { throw new m.ConflictException(`Service with name '${dto.name}' already exists in category '${dto.category}'`); });
        }
        return database_1.prisma.service.create({
            data: { ...dto, code }
        });
    }
    async findAll(query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const skip = (page - 1) * limit;
        const where = {
            ...(query.search && {
                OR: [
                    { name: { contains: query.search, mode: "insensitive" } },
                    { code: { contains: query.search, mode: "insensitive" } }
                ]
            }),
            ...(query.category && { category: query.category }),
            ...(query.status && { status: query.status }),
        };
        const [data, total, categoryGroup] = await database_1.prisma.$transaction([
            database_1.prisma.service.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: "asc" },
            }),
            database_1.prisma.service.count({ where }),
            database_1.prisma.service.groupBy({
                by: ['category'],
                _count: { id: true }
            })
        ]);
        const categoryCounts = categoryGroup.reduce((acc, curr) => {
            acc[curr.category] = curr._count.id;
            return acc;
        }, {});
        return { data, total, page, limit, totalPages: Math.ceil(total / limit), categoryCounts };
    }
    async findOne(id) {
        const service = await database_1.prisma.service.findUnique({ where: { id } });
        if (!service)
            throw new common_1.NotFoundException(`Service ${id} not found`);
        return service;
    }
    async update(id, dto) {
        const service = await this.findOne(id);
        if (dto.name || dto.category) {
            const newName = dto.name || service.name;
            const newCategory = dto.category || service.category;
            const existing = await database_1.prisma.service.findUnique({
                where: { name_category: { name: newName, category: newCategory } }
            });
            if (existing && existing.id !== id) {
                import('@nestjs/common').then(m => { throw new m.ConflictException(`Service with name '${newName}' already exists in category '${newCategory}'`); });
            }
        }
        return database_1.prisma.service.update({ where: { id }, data: dto });
    }
    async softDelete(id) {
        const service = await this.findOne(id);
        const newStatus = service.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
        return database_1.prisma.service.update({
            where: { id },
            data: { status: newStatus },
        });
    }
};
exports.ServicesService = ServicesService;
exports.ServicesService = ServicesService = __decorate([
    (0, common_1.Injectable)()
], ServicesService);
//# sourceMappingURL=services.service.js.map