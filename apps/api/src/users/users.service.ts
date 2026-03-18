import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
    ForbiddenException,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { prisma } from "@carenest/database";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { QueryUsersDto } from "./dto/query-users.dto";

const SALT_ROUNDS = 10;

// Fields returned in every user response — passwordHash is always excluded
const USER_SELECT = {
    id: true,
    name: true,
    email: true,
    phone: true,
    status: true,
    consultationFee: true,
    lastLoginAt: true,
    createdAt: true,
    updatedAt: true,
    role: { select: { id: true, name: true, description: true } },
} as const;

@Injectable()
export class UsersService {
    // ─── Create ────────────────────────────────────────────────────────────────
    async create(dto: CreateUserDto) {
        if (dto.password !== dto.confirmPassword) {
            throw new BadRequestException("Passwords do not match");
        }

        await this.assertUniqueEmail(dto.email);
        await this.assertUniquePhone(dto.phone);
        await this.assertRoleExists(dto.roleId);

        const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

        return prisma.user.create({
            data: {
                name: dto.name,
                email: dto.email,
                phone: dto.phone,
                passwordHash,
                roleId: dto.roleId,
            },
            select: USER_SELECT,
        });
    }

    // ─── List (paginated) ──────────────────────────────────────────────────────
    async findAll(query: QueryUsersDto) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const skip = (page - 1) * limit;

        const where = {
            ...(query.search && {
                OR: [
                    { name: { contains: query.search, mode: "insensitive" as const } },
                    { email: { contains: query.search, mode: "insensitive" as const } },
                ],
            }),
            ...(query.role && { role: { name: query.role } }),
            ...(query.status && { status: query.status }),
        };

        const [data, total] = await prisma.$transaction([
            prisma.user.findMany({
                where,
                select: USER_SELECT,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
            }),
            prisma.user.count({ where }),
        ]);

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    // ─── Get One ───────────────────────────────────────────────────────────────
    async findOne(id: string) {
        const user = await prisma.user.findUnique({ where: { id }, select: USER_SELECT });
        if (!user) throw new NotFoundException("User not found");
        return user;
    }

    // ─── Update ────────────────────────────────────────────────────────────────
    async update(id: string, dto: UpdateUserDto) {
        await this.findOne(id); // ensures user exists

        if (dto.phone) await this.assertUniquePhone(dto.phone, id);
        if (dto.roleId) await this.assertRoleExists(dto.roleId);

        return prisma.user.update({
            where: { id },
            data: {
                ...(dto.name && { name: dto.name }),
                ...(dto.phone && { phone: dto.phone }),
                ...(dto.roleId && { roleId: dto.roleId }),
                ...(dto.status && { status: dto.status }),
                ...(dto.consultationFee !== undefined && { consultationFee: dto.consultationFee }),
            },
            select: USER_SELECT,
        });
    }

    // ─── Reset Password ────────────────────────────────────────────────────────
    async resetPassword(id: string, dto: ResetPasswordDto) {
        if (dto.newPassword !== dto.confirmPassword) {
            throw new BadRequestException("Passwords do not match");
        }

        await this.findOne(id); // ensures user exists

        const passwordHash = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);
        await prisma.user.update({ where: { id }, data: { passwordHash } });

        return { message: "Password reset successfully" };
    }

    // ─── Deactivate ────────────────────────────────────────────────────────────
    async deactivate(id: string, currentUserId: string) {
        // Self-deactivation guard — prevents Admin from locking themselves out
        if (id === currentUserId) {
            throw new ForbiddenException("You cannot deactivate your own account");
        }

        await this.findOne(id); // ensures user exists

        return prisma.user.update({
            where: { id },
            data: { status: "INACTIVE" },
            select: USER_SELECT,
        });
    }

    // ─── Helpers ───────────────────────────────────────────────────────────────
    private async assertUniqueEmail(email: string, excludeId?: string) {
        const existing = await prisma.user.findFirst({
            where: { email, ...(excludeId && { NOT: { id: excludeId } }) },
        });
        if (existing) throw new ConflictException("Email already exists");
    }

    private async assertUniquePhone(phone: string, excludeId?: string) {
        const existing = await prisma.user.findFirst({
            where: { phone, ...(excludeId && { NOT: { id: excludeId } }) },
        });
        if (existing) throw new ConflictException("Phone number already exists");
    }

    private async assertRoleExists(roleId: number) {
        const role = await prisma.role.findUnique({ where: { id: roleId } });
        if (!role) throw new NotFoundException(`Role with id ${roleId} not found`);
    }
}
