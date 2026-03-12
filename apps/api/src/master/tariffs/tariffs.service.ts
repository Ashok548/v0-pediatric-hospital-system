import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { prisma } from "@carenest/database";
import { CreateTariffPlanDto } from "./dto/create-tariff-plan.dto";
import { UpdateTariffPlanDto } from "./dto/update-tariff-plan.dto";
import { QueryTariffPlansDto } from "./dto/query-tariff-plans.dto";
import { UpsertTariffRateDto } from "./dto/upsert-tariff-rate.dto";

@Injectable()
export class TariffsService {

    // ─── Create Plan ───────────────────────────────────────────────────────────
    async createPlan(dto: CreateTariffPlanDto) {
        const existing = await prisma.tariffPlan.findUnique({ where: { code: dto.code } });
        if (existing) throw new ConflictException(`Tariff plan with code '${dto.code}' already exists`);

        const nameExists = await prisma.tariffPlan.findUnique({ where: { name: dto.name } });
        if (nameExists) throw new ConflictException(`Tariff plan with name '${dto.name}' already exists`);

        await this.assertNoDateOverlap(dto.effectiveFrom, dto.effectiveTo, dto.wardType);

        const { rates, wardType, ...planData } = dto;

        return prisma.tariffPlan.create({
            data: {
                ...planData,
                wardType: wardType as any,
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

    // ─── List Plans (paginated) ─────────────────────────────────────────────────
    async findAllPlans(query: QueryTariffPlansDto) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;

        const where = {
            ...(query.search && {
                OR: [
                    { name: { contains: query.search, mode: "insensitive" as const } },
                    { code: { contains: query.search, mode: "insensitive" as const } },
                ]
            }),
            ...(query.status && { status: query.status }),
            ...(query.wardType && { wardType: query.wardType as any }),
        };

        const [data, total] = await prisma.$transaction([
            prisma.tariffPlan.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: "asc" },
                include: { _count: { select: { rates: true } } }
            }),
            prisma.tariffPlan.count({ where }),
        ]);

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    // ─── Get One Plan with Rates ───────────────────────────────────────────────
    async findOnePlan(id: string) {
        const plan = await prisma.tariffPlan.findUnique({
            where: { id },
            include: {
                rates: {
                    orderBy: { createdAt: "asc" }
                }
            }
        });
        if (!plan) throw new NotFoundException(`Tariff plan ${id} not found`);
        return plan;
    }

    // ─── Update Plan ───────────────────────────────────────────────────────────
    async updatePlan(id: string, dto: UpdateTariffPlanDto) {
        const plan = await this.findOnePlan(id);

        const effectiveFrom = dto.effectiveFrom ?? plan.effectiveFrom;
        const effectiveTo = dto.effectiveTo !== undefined ? dto.effectiveTo : plan.effectiveTo;
        const wardType = dto.wardType !== undefined ? dto.wardType : plan.wardType;

        if (dto.effectiveFrom !== undefined || dto.effectiveTo !== undefined || dto.wardType !== undefined) {
            await this.assertNoDateOverlap(effectiveFrom, effectiveTo, wardType, id);
        }

        const { wardType: wType, ...rest } = dto;
        return prisma.tariffPlan.update({
            where: { id },
            data: { ...rest, wardType: wType as any }
        });
    }

    // ─── Toggle Status ─────────────────────────────────────────────────────────
    async toggleStatus(id: string) {
        const plan = await this.findOnePlan(id);
        const newStatus = plan.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
        return prisma.tariffPlan.update({ where: { id }, data: { status: newStatus } });
    }

    // ─── Upsert Rate ───────────────────────────────────────────────────────────
    async upsertRate(tariffPlanId: string, dto: UpsertTariffRateDto) {
        await this.findOnePlan(tariffPlanId);

        return prisma.tariffRate.upsert({
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

    // ─── Delete Rate ───────────────────────────────────────────────────────────
    async deleteRate(tariffPlanId: string, serviceId: string) {
        await this.findOnePlan(tariffPlanId);

        const rate = await prisma.tariffRate.findUnique({
            where: { tariffPlanId_serviceId: { tariffPlanId, serviceId } }
        });
        if (!rate) throw new NotFoundException(`Rate for service ${serviceId} not found in this tariff plan`);

        return prisma.tariffRate.update({
            where: { tariffPlanId_serviceId: { tariffPlanId, serviceId } },
            data: { status: "INACTIVE" }
        });
    }

    // ─── Helpers ───────────────────────────────────────────────────────────────
    private async assertNoDateOverlap(from: Date | string, to?: Date | string | null, wardType?: string | null, excludeId?: string) {
        const effectiveFrom = new Date(from);
        const effectiveTo = to ? new Date(to) : new Date("2099-12-31");

        const overlapping = await prisma.tariffPlan.findFirst({
            where: {
                status: "ACTIVE",
                wardType: wardType as any,
                ...(excludeId && { NOT: { id: excludeId } }),
                OR: [
                    { effectiveFrom: { lte: effectiveFrom }, effectiveTo: { gte: effectiveFrom } },
                    { effectiveFrom: { lte: effectiveFrom }, effectiveTo: null },
                    { effectiveFrom: { lte: effectiveTo }, effectiveTo: { gte: effectiveTo } },
                    { effectiveFrom: { lte: effectiveTo }, effectiveTo: null },
                    { effectiveFrom: { gte: effectiveFrom }, effectiveTo: { lte: effectiveTo } }
                ]
            }
        });

        if (overlapping) {
            throw new ConflictException(`Date range overlaps with existing active tariff plan: ${overlapping.name}`);
        }
    }
}
