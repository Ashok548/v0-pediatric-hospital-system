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
        return database_1.prisma.service.create({ data: dto });
    }
    async findAll(query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const skip = (page - 1) * limit;
        const where = {
            ...(query.search && {
                name: { contains: query.search, mode: "insensitive" },
            }),
            ...(query.category && { category: query.category }),
            ...(query.status && { status: query.status }),
        };
        const [data, total] = await database_1.prisma.$transaction([
            database_1.prisma.service.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: "asc" },
            }),
            database_1.prisma.service.count({ where }),
        ]);
        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async findOne(id) {
        const service = await database_1.prisma.service.findUnique({ where: { id } });
        if (!service)
            throw new common_1.NotFoundException(`Service ${id} not found`);
        return service;
    }
    async update(id, dto) {
        await this.findOne(id);
        return database_1.prisma.service.update({ where: { id }, data: dto });
    }
    async softDelete(id) {
        await this.findOne(id);
        return database_1.prisma.service.update({
            where: { id },
            data: { status: "INACTIVE" },
        });
    }
};
exports.ServicesService = ServicesService;
exports.ServicesService = ServicesService = __decorate([
    (0, common_1.Injectable)()
], ServicesService);
//# sourceMappingURL=services.service.js.map