import {
    Injectable,
    NotFoundException,
    ConflictException,
} from "@nestjs/common";
import { prisma } from "@carenest/database";
import { CreateServiceDto } from "./dto/create-service.dto";
import { UpdateServiceDto } from "./dto/update-service.dto";
import { QueryServicesDto } from "./dto/query-services.dto";
import { STANDARD_PEDIATRIC_SERVICES } from "./services-template";

@Injectable()
export class ServicesService {

    // ─── Create ────────────────────────────────────────────────────────────────
    async create(dto: CreateServiceDto) {
        // Auto-generate code if missing (e.g., LAB-CBC)
        const code = dto.code || `${dto.category.substring(0, 3)}-${dto.name.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

        // Check for duplicate code/name within category
        const existing = await prisma.service.findFirst({
            where: {
                OR: [
                    { code: dto.code },
                    { name: dto.name, category: dto.category },
                ],
            },
        });

        if (existing) {
            throw new ConflictException(
                `Service with code '${dto.code}' or name '${dto.name}' already exists in category ${dto.category}`
            );
        }
        return prisma.service.create({
            data: { ...dto, code }
        });
    }

    // ─── Seed Template ─────────────────────────────────────────────────────────
    async seedTemplate() {
        const result = await prisma.service.createMany({
            data: STANDARD_PEDIATRIC_SERVICES as any,
            skipDuplicates: true, // Will skip if code already exists
        });

        return {
            created: result.count,
            skipped: STANDARD_PEDIATRIC_SERVICES.length - result.count,
            total: STANDARD_PEDIATRIC_SERVICES.length
        };
    }

    // ─── List (paginated) ──────────────────────────────────────────────────────
    async findAll(query: QueryServicesDto) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const skip = (page - 1) * limit;

        const where: any = {
            ...(query.search && {
                OR: [
                    { name: { contains: query.search, mode: "insensitive" as const } },
                    { code: { contains: query.search, mode: "insensitive" as const } }
                ]
            }),
            ...(query.category && { category: query.category }),
            ...(query.status && { status: query.status }),
            ...(query.careType && {
                careType: { in: [query.careType, "BOTH"] }
            }),
            ...(query.departmentName && {
                departments: {
                    some: { department: { name: query.departmentName } }
                }
            })
        };

        const [data, total, categoryGroup] = await prisma.$transaction([
            prisma.service.findMany({
                where,
                skip,
                take: limit,
                orderBy: [
                    { uiGroup: "asc" },
                    { displayOrder: "asc" },
                    { name: "asc" }
                ],
                include: {
                    departments: {
                        include: { department: true }
                    }
                }
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
        
        // Prevent deactivation if the service is used in any active tariff plan
        if (service.status === "ACTIVE") {
            const activeTariffCount = await prisma.tariffRate.count({
                where: {
                    serviceId: id,
                    tariffPlan: { status: "ACTIVE" }
                }
            });
            
            if (activeTariffCount > 0) {
                throw new ConflictException(`Cannot deactivate service: it is used in ${activeTariffCount} active tariff plan(s).`);
            }
        }
        
        const newStatus = service.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
        return prisma.service.update({
            where: { id },
            data: { status: newStatus },
        });
    }
}
