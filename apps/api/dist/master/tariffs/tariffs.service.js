"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TariffsService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@carenest/database");
let TariffsService = class TariffsService {
    async createPlan(dto) {
        const existing = await database_1.prisma.tariffPlan.findUnique({ where: { code: dto.code } });
        if (existing)
            throw new common_1.ConflictException(`Tariff plan with code '${dto.code}' already exists`);
        const nameExists = await database_1.prisma.tariffPlan.findUnique({ where: { name: dto.name } });
        if (nameExists)
            throw new common_1.ConflictException(`Tariff plan with name '${dto.name}' already exists`);
        const { rates, wardType, ...planData } = dto;
        return database_1.prisma.tariffPlan.create({
            data: {
                ...planData,
                wardType: wardType,
                ...(rates && rates.length > 0 && {
                    rates: {
                        create: rates.map(r => ({
                            serviceId: r.serviceId,
                            priceOverride: r.priceOverride,
                            discountPercent: r.discountPercent ?? 0,
                        }))
                    }
                })
            },
            include: { rates: true }
        });
    }
    async findAllPlans(query) {
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
            ...(query.wardType && { wardType: query.wardType }),
        };
        const [data, total] = await database_1.prisma.$transaction([
            database_1.prisma.tariffPlan.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: "asc" },
                include: { _count: { select: { rates: true } } }
            }),
            database_1.prisma.tariffPlan.count({ where }),
        ]);
        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async findOnePlan(id) {
        const plan = await database_1.prisma.tariffPlan.findUnique({
            where: { id },
            include: {
                rates: {
                    orderBy: { createdAt: "asc" }
                }
            }
        });
        if (!plan)
            throw new common_1.NotFoundException(`Tariff plan ${id} not found`);
        return plan;
    }
    async updatePlan(id, dto) {
        await this.findOnePlan(id);
        const { wardType, ...rest } = dto;
        return database_1.prisma.tariffPlan.update({
            where: { id },
            data: { ...rest, wardType: wardType }
        });
    }
    async toggleStatus(id) {
        const plan = await this.findOnePlan(id);
        const newStatus = plan.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
        return database_1.prisma.tariffPlan.update({ where: { id }, data: { status: newStatus } });
    }
    async upsertRate(tariffPlanId, dto) {
        await this.findOnePlan(tariffPlanId);
        return database_1.prisma.tariffRate.upsert({
            where: { tariffPlanId_serviceId: { tariffPlanId, serviceId: dto.serviceId } },
            create: {
                tariffPlanId,
                serviceId: dto.serviceId,
                priceOverride: dto.priceOverride,
                discountPercent: dto.discountPercent ?? 0,
            },
            update: {
                priceOverride: dto.priceOverride,
                discountPercent: dto.discountPercent ?? 0,
            }
        });
    }
    async deleteRate(tariffPlanId, serviceId) {
        await this.findOnePlan(tariffPlanId);
        const rate = await database_1.prisma.tariffRate.findUnique({
            where: { tariffPlanId_serviceId: { tariffPlanId, serviceId } }
        });
        if (!rate)
            throw new common_1.NotFoundException(`Rate for service ${serviceId} not found in this tariff plan`);
        return database_1.prisma.tariffRate.delete({
            where: { tariffPlanId_serviceId: { tariffPlanId, serviceId } }
        });
    }
};
exports.TariffsService = TariffsService;
exports.TariffsService = TariffsService = __decorate([
    (0, common_1.Injectable)()
], TariffsService);
//# sourceMappingURL=tariffs.service.js.map