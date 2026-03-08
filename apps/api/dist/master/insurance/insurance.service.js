"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InsuranceService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@carenest/database");
let InsuranceService = class InsuranceService {
    async create(dto) {
        const existing = await database_1.prisma.insuranceProvider.findUnique({ where: { code: dto.code } });
        if (existing)
            throw new common_1.ConflictException(`Insurance provider with code '${dto.code}' already exists`);
        const nameExists = await database_1.prisma.insuranceProvider.findUnique({ where: { name: dto.name } });
        if (nameExists)
            throw new common_1.ConflictException(`Insurance provider with name '${dto.name}' already exists`);
        return database_1.prisma.insuranceProvider.create({ data: dto });
    }
    async findAll(query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;
        const where = {
            ...(query.search && {
                OR: [
                    { name: { contains: query.search, mode: "insensitive" } },
                    { code: { contains: query.search, mode: "insensitive" } },
                ]
            }),
            ...(query.status && { status: query.status }),
        };
        const [data, total] = await database_1.prisma.$transaction([
            database_1.prisma.insuranceProvider.findMany({ where, skip, take: limit, orderBy: { name: "asc" } }),
            database_1.prisma.insuranceProvider.count({ where }),
        ]);
        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async findOne(id) {
        const provider = await database_1.prisma.insuranceProvider.findUnique({ where: { id } });
        if (!provider)
            throw new common_1.NotFoundException(`Insurance provider ${id} not found`);
        return provider;
    }
    async update(id, dto) {
        await this.findOne(id);
        if (dto.code) {
            const clash = await database_1.prisma.insuranceProvider.findUnique({ where: { code: dto.code } });
            if (clash && clash.id !== id)
                throw new common_1.ConflictException(`Code '${dto.code}' already taken`);
        }
        if (dto.name) {
            const clash = await database_1.prisma.insuranceProvider.findUnique({ where: { name: dto.name } });
            if (clash && clash.id !== id)
                throw new common_1.ConflictException(`Name '${dto.name}' already taken`);
        }
        return database_1.prisma.insuranceProvider.update({ where: { id }, data: dto });
    }
    async toggleStatus(id) {
        const provider = await this.findOne(id);
        const newStatus = provider.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
        return database_1.prisma.insuranceProvider.update({ where: { id }, data: { status: newStatus } });
    }
};
exports.InsuranceService = InsuranceService;
exports.InsuranceService = InsuranceService = __decorate([
    (0, common_1.Injectable)()
], InsuranceService);
//# sourceMappingURL=insurance.service.js.map