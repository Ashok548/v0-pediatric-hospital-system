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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const jwt_1 = require("@nestjs/jwt");
const database_1 = require("@carenest/database");
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const AUTH_USER_SELECT = {
    id: true,
    name: true,
    email: true,
    phone: true,
    status: true,
    lastLoginAt: true,
    failedLogins: true,
    lockedUntil: true,
    passwordHash: true,
    role: { select: { id: true, name: true } },
};
let AuthService = AuthService_1 = class AuthService {
    jwtService;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(jwtService) {
        this.jwtService = jwtService;
    }
    async validateUser(email, password) {
        this.logger.log(`Attempting to validate user: ${email}`);
        const user = await database_1.prisma.user.findUnique({
            where: { email },
            select: AUTH_USER_SELECT,
        });
        if (!user || user.status === "INACTIVE") {
            this.logger.warn(`Validation failed: User not found or inactive (${email})`);
            await bcrypt.compare(password, "$2b$10$invalidhashforconstanttimingx");
            return null;
        }
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            this.logger.warn(`Validation failed: Account locked until ${user.lockedUntil.toISOString()} (${email})`);
            throw new common_1.ForbiddenException(`Account is locked. Try again after ${user.lockedUntil.toLocaleTimeString()}`);
        }
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            const newFailedCount = user.failedLogins + 1;
            const shouldLock = newFailedCount >= MAX_FAILED_ATTEMPTS;
            this.logger.warn(`Validation failed: Invalid password (${email}). Failed attempts: ${newFailedCount}`);
            await database_1.prisma.user.update({
                where: { id: user.id },
                data: {
                    failedLogins: newFailedCount,
                    lockedUntil: shouldLock
                        ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
                        : undefined,
                },
            });
            if (shouldLock) {
                this.logger.error(`Account locked due to excessive failed attempts (${email})`);
                throw new common_1.ForbiddenException(`Account locked for ${LOCKOUT_MINUTES} minutes due to too many failed attempts`);
            }
            return null;
        }
        this.logger.log(`User validated successfully: ${email}`);
        await database_1.prisma.user.update({
            where: { id: user.id },
            data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() },
        });
        const { passwordHash, ...result } = user;
        return result;
    }
    login(user) {
        this.logger.log(`Issuing JWT token for user: ${user.email}`);
        const payload = { sub: user.id, email: user.email, role: user.role.name };
        return this.jwtService.sign(payload);
    }
    async getProfile(userId) {
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                status: true,
                lastLoginAt: true,
                role: { select: { id: true, name: true } },
            },
        });
        if (!user)
            throw new common_1.UnauthorizedException();
        return user;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map