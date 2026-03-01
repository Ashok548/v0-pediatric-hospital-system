import {
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { prisma } from "@carenest/database";
import { CreateServiceDto } from "./dto/create-service.dto";
import { UpdateServiceDto } from "./dto/update-service.dto";
import { QueryServicesDto } from "./dto/query-services.dto";

@Injectable()
export class ServicesService {

    // ─── Create ────────────────────────────────────────────────────────────────
    async create(dto: CreateServiceDto) {
        return prisma.service.create({ data: dto });
    }

    // ─── List (paginated) ──────────────────────────────────────────────────────
    async findAll(query: QueryServicesDto) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const skip = (page - 1) * limit;

        const where = {
            ...(query.search && {
                name: { contains: query.search, mode: "insensitive" as const },
            }),
            ...(query.category && { category: query.category }),
            ...(query.status && { status: query.status }),
        };

        const [data, total] = await prisma.$transaction([
            prisma.service.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: "asc" },
            }),
            prisma.service.count({ where }),
        ]);

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    // ─── Get One ───────────────────────────────────────────────────────────────
    async findOne(id: string) {
        const service = await prisma.service.findUnique({ where: { id } });
        if (!service) throw new NotFoundException(`Service ${id} not found`);
        return service;
    }

    // ─── Update ────────────────────────────────────────────────────────────────
    async update(id: string, dto: UpdateServiceDto) {
        await this.findOne(id);
        return prisma.service.update({ where: { id }, data: dto });
    }

    // ─── Soft Delete ───────────────────────────────────────────────────────────
    async softDelete(id: string) {
        await this.findOne(id);
        // Future-safe: check if referenced in bill_items before deactivating
        // const billedCount = await prisma.billItem.count({ where: { serviceId: id } });
        // if (billedCount > 0) throw new ConflictException(
        //     "Cannot deactivate: service has existing bill records"
        // );
        return prisma.service.update({
            where: { id },
            data: { status: "INACTIVE" },
        });
    }
}
