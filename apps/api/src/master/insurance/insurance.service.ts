import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { prisma } from "@carenest/database";
import { CreateInsuranceDto } from "./dto/create-insurance.dto";
import { UpdateInsuranceDto } from "./dto/update-insurance.dto";
import { QueryInsuranceDto } from "./dto/query-insurance.dto";

@Injectable()
export class InsuranceService {

    // ─── Create ────────────────────────────────────────────────────────────────
    async create(dto: CreateInsuranceDto) {
        const existing = await prisma.insuranceProvider.findUnique({ where: { code: dto.code } });
        if (existing) throw new ConflictException(`Insurance provider with code '${dto.code}' already exists`);

        const nameExists = await prisma.insuranceProvider.findUnique({ where: { name: dto.name } });
        if (nameExists) throw new ConflictException(`Insurance provider with name '${dto.name}' already exists`);

        return prisma.insuranceProvider.create({ data: dto as any });
    }

    // ─── List (paginated) ──────────────────────────────────────────────────────
    async findAll(query: QueryInsuranceDto) {
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
        };

        const [data, total] = await prisma.$transaction([
            prisma.insuranceProvider.findMany({ where, skip, take: limit, orderBy: { name: "asc" } }),
            prisma.insuranceProvider.count({ where }),
        ]);

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    // ─── Get One ───────────────────────────────────────────────────────────────
    async findOne(id: string) {
        const provider = await prisma.insuranceProvider.findUnique({ where: { id } });
        if (!provider) throw new NotFoundException(`Insurance provider ${id} not found`);
        return provider;
    }

    // ─── Update ────────────────────────────────────────────────────────────────
    async update(id: string, dto: UpdateInsuranceDto) {
        await this.findOne(id);

        if (dto.code) {
            const clash = await prisma.insuranceProvider.findUnique({ where: { code: dto.code } });
            if (clash && clash.id !== id) throw new ConflictException(`Code '${dto.code}' already taken`);
        }
        if (dto.name) {
            const clash = await prisma.insuranceProvider.findUnique({ where: { name: dto.name } });
            if (clash && clash.id !== id) throw new ConflictException(`Name '${dto.name}' already taken`);
        }

        return prisma.insuranceProvider.update({ where: { id }, data: dto as any });
    }

    // ─── Toggle Status ──────────────────────────────────────────────────────────
    async toggleStatus(id: string) {
        const provider = await this.findOne(id);
        const newStatus = provider.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
        return prisma.insuranceProvider.update({ where: { id }, data: { status: newStatus } });
    }
}
