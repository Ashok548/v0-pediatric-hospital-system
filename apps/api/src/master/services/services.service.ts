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
        // Auto-generate code if missing (e.g., LAB-CBC)
        const code = dto.code || `${dto.category.substring(0, 3)}-${dto.name.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

        const existing = await prisma.service.findUnique({
            where: { name_category: { name: dto.name, category: dto.category } }
        });
        if (existing) {
            import('@nestjs/common').then(m => { throw new m.ConflictException(`Service with name '${dto.name}' already exists in category '${dto.category}'`) });
        }

        return prisma.service.create({
            data: { ...dto, code }
        });
    }

    // ─── List (paginated) ──────────────────────────────────────────────────────
    async findAll(query: QueryServicesDto) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const skip = (page - 1) * limit;

        const where = {
            ...(query.search && {
                OR: [
                    { name: { contains: query.search, mode: "insensitive" as const } },
                    { code: { contains: query.search, mode: "insensitive" as const } }
                ]
            }),
            ...(query.category && { category: query.category }),
            ...(query.status && { status: query.status }),
        };

        const [data, total, categoryGroup] = await prisma.$transaction([
            prisma.service.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: "asc" },
            }),
            prisma.service.count({ where }),
            prisma.service.groupBy({
                by: ['category'],
                _count: { id: true }
            })
        ]);

        const categoryCounts = categoryGroup.reduce((acc: Record<string, number>, curr: any) => {
            acc[curr.category] = curr._count.id;
            return acc;
        }, {});

        return { data, total, page, limit, totalPages: Math.ceil(total / limit), categoryCounts };
    }

    // ─── Get One ───────────────────────────────────────────────────────────────
    async findOne(id: string) {
        const service = await prisma.service.findUnique({ where: { id } });
        if (!service) throw new NotFoundException(`Service ${id} not found`);
        return service;
    }

    // ─── Update ────────────────────────────────────────────────────────────────
    async update(id: string, dto: UpdateServiceDto) {
        const service = await this.findOne(id);

        if (dto.name || dto.category) {
            const newName = dto.name || service.name;
            const newCategory = dto.category || service.category;
            const existing = await prisma.service.findUnique({
                where: { name_category: { name: newName, category: newCategory } }
            });
            if (existing && existing.id !== id) {
                import('@nestjs/common').then(m => { throw new m.ConflictException(`Service with name '${newName}' already exists in category '${newCategory}'`) });
            }
        }

        return prisma.service.update({ where: { id }, data: dto });
    }

    // ─── Toggle Status ───────────────────────────────────────────────────────────
    async softDelete(id: string) {
        const service = await this.findOne(id);
        // Future-safe: check if referenced in bill_items before deactivating
        // const billedCount = await prisma.billItem.count({ where: { serviceId: id } });
        // if (billedCount > 0) throw new ConflictException(
        //     "Cannot deactivate: service has existing bill records"
        // );
        const newStatus = service.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
        return prisma.service.update({
            where: { id },
            data: { status: newStatus },
        });
    }
}
