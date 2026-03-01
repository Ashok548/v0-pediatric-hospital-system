"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const database_1 = require("@carenest/database");
const SALT_ROUNDS = 10;
const USER_SELECT = {
    id: true,
    name: true,
    email: true,
    phone: true,
    status: true,
    lastLoginAt: true,
    createdAt: true,
    updatedAt: true,
    role: { select: { id: true, name: true, description: true } },
};
let UsersService = class UsersService {
    async create(dto) {
        if (dto.password !== dto.confirmPassword) {
            throw new common_1.BadRequestException("Passwords do not match");
        }
        await this.assertUniqueEmail(dto.email);
        await this.assertUniquePhone(dto.phone);
        await this.assertRoleExists(dto.roleId);
        const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
        return database_1.prisma.user.create({
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
    async findAll(query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const skip = (page - 1) * limit;
        const where = {
            ...(query.search && {
                OR: [
                    { name: { contains: query.search, mode: "insensitive" } },
                    { email: { contains: query.search, mode: "insensitive" } },
                ],
            }),
            ...(query.role && { role: { name: query.role } }),
            ...(query.status && { status: query.status }),
        };
        const [data, total] = await database_1.prisma.$transaction([
            database_1.prisma.user.findMany({
                where,
                select: USER_SELECT,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
            }),
            database_1.prisma.user.count({ where }),
        ]);
        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findOne(id) {
        const user = await database_1.prisma.user.findUnique({ where: { id }, select: USER_SELECT });
        if (!user)
            throw new common_1.NotFoundException("User not found");
        return user;
    }
    async update(id, dto) {
        await this.findOne(id);
        if (dto.phone)
            await this.assertUniquePhone(dto.phone, id);
        if (dto.roleId)
            await this.assertRoleExists(dto.roleId);
        return database_1.prisma.user.update({
            where: { id },
            data: {
                ...(dto.name && { name: dto.name }),
                ...(dto.phone && { phone: dto.phone }),
                ...(dto.roleId && { roleId: dto.roleId }),
                ...(dto.status && { status: dto.status }),
            },
            select: USER_SELECT,
        });
    }
    async resetPassword(id, dto) {
        if (dto.newPassword !== dto.confirmPassword) {
            throw new common_1.BadRequestException("Passwords do not match");
        }
        await this.findOne(id);
        const passwordHash = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);
        await database_1.prisma.user.update({ where: { id }, data: { passwordHash } });
        return { message: "Password reset successfully" };
    }
    async deactivate(id, currentUserId) {
        if (id === currentUserId) {
            throw new common_1.ForbiddenException("You cannot deactivate your own account");
        }
        await this.findOne(id);
        return database_1.prisma.user.update({
            where: { id },
            data: { status: "INACTIVE" },
            select: USER_SELECT,
        });
    }
    async assertUniqueEmail(email, excludeId) {
        const existing = await database_1.prisma.user.findFirst({
            where: { email, ...(excludeId && { NOT: { id: excludeId } }) },
        });
        if (existing)
            throw new common_1.ConflictException("Email already exists");
    }
    async assertUniquePhone(phone, excludeId) {
        const existing = await database_1.prisma.user.findFirst({
            where: { phone, ...(excludeId && { NOT: { id: excludeId } }) },
        });
        if (existing)
            throw new common_1.ConflictException("Phone number already exists");
    }
    async assertRoleExists(roleId) {
        const role = await database_1.prisma.role.findUnique({ where: { id: roleId } });
        if (!role)
            throw new common_1.NotFoundException(`Role with id ${roleId} not found`);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)()
], UsersService);
//# sourceMappingURL=users.service.js.map