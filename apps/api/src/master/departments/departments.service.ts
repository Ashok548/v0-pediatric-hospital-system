import {
    Injectable,
    NotFoundException,
    ConflictException,
} from "@nestjs/common";
import { prisma } from "@carenest/database";
import { CreateDepartmentDto } from "./dto/create-department.dto";
import { UpdateDepartmentDto } from "./dto/update-department.dto";
import { QueryDepartmentsDto } from "./dto/query-departments.dto";

@Injectable()
export class DepartmentsService {

    // ─── Create ────────────────────────────────────────────────────────────────
    async create(dto: CreateDepartmentDto) {
        await this.assertUniqueDeptName(dto.name);
        return prisma.department.create({ data: dto });
    }

    // ─── List (paginated) ──────────────────────────────────────────────────────
    async findAll(query: QueryDepartmentsDto) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const skip = (page - 1) * limit;

        const where = {
            ...(query.search && {
                OR: [
                    { name: { contains: query.search, mode: "insensitive" as const } },
                    { description: { contains: query.search, mode: "insensitive" as const } },
                ],
            }),
            ...(query.status && { status: query.status }),
        };

        const [data, total] = await prisma.$transaction([
            prisma.department.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: "asc" },
            }),
            prisma.department.count({ where }),
        ]);

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    // ─── Get One ───────────────────────────────────────────────────────────────
    async findOne(id: string) {
        const dept = await prisma.department.findUnique({ where: { id } });
        if (!dept) throw new NotFoundException(`Department ${id} not found`);
        return dept;
    }

    // ─── Update ────────────────────────────────────────────────────────────────
    async update(id: string, dto: UpdateDepartmentDto) {
        await this.findOne(id);
        if (dto.name) await this.assertUniqueDeptName(dto.name, id);
        return prisma.department.update({ where: { id }, data: dto });
    }

    // ─── Soft Delete ───────────────────────────────────────────────────────────
    async softDelete(id: string) {
        await this.findOne(id);
        // Future-safe: check if any users / doctors are assigned to this department
        // const userCount = await prisma.user.count({ where: { departmentId: id } });
        // if (userCount > 0) throw new ConflictException(...);
        return prisma.department.update({
            where: { id },
            data: { status: "INACTIVE" },
        });
    }

    // ─── Helpers ───────────────────────────────────────────────────────────────
    private async assertUniqueDeptName(name: string, excludeId?: string) {
        const existing = await prisma.department.findFirst({
            where: {
                name: { equals: name, mode: "insensitive" },
                ...(excludeId && { NOT: { id: excludeId } }),
            },
        });
        if (existing) {
            throw new ConflictException(`Department named "${name}" already exists`);
        }
    }
}
