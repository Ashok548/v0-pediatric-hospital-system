import {
    Injectable,
    UnauthorizedException,
    ForbiddenException,
    Logger,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { JwtService } from "@nestjs/jwt";
import { prisma } from "@carenest/database";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

// Reusable select to always include role name and exclude passwordHash
const AUTH_USER_SELECT = {
    id: true,
    name: true,
    email: true,
    phone: true,
    status: true,
    lastLoginAt: true,
    failedLogins: true,
    lockedUntil: true,
    passwordHash: true, // needed for bcrypt compare — stripped before returning
    role: { select: { id: true, name: true } },
} as const;

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(private jwtService: JwtService) { }

    async validateUser(email: string, password: string) {
        this.logger.log(`Attempting to validate user: ${email}`);

        const user = await prisma.user.findUnique({
            where: { email },
            select: AUTH_USER_SELECT,
        });

        if (!user || user.status === "INACTIVE") {
            this.logger.warn(`Validation failed: User not found or inactive (${email})`);
            await bcrypt.compare(password, "$2b$10$invalidhashforconstanttimingx");
            return null;
        }

        // Check lockout
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            this.logger.warn(`Validation failed: Account locked until ${user.lockedUntil.toISOString()} (${email})`);
            throw new ForbiddenException(
                `Account is locked. Try again after ${user.lockedUntil.toLocaleTimeString()}`
            );
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            const newFailedCount = user.failedLogins + 1;
            const shouldLock = newFailedCount >= MAX_FAILED_ATTEMPTS;

            this.logger.warn(`Validation failed: Invalid password (${email}). Failed attempts: ${newFailedCount}`);

            await prisma.user.update({
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
                throw new ForbiddenException(
                    `Account locked for ${LOCKOUT_MINUTES} minutes due to too many failed attempts`
                );
            }

            return null;
        }

        // Successful login — reset failure counter and update lastLoginAt
        this.logger.log(`User validated successfully: ${email}`);
        await prisma.user.update({
            where: { id: user.id },
            data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() },
        });

        const { passwordHash, ...result } = user;
        return result;
    }

    login(user: { id: string; email: string; role: { name: string } }) {
        this.logger.log(`Issuing JWT token for user: ${user.email}`);
        // Include role name (not id) in JWT payload for guard checks
        const payload = { sub: user.id, email: user.email, role: user.role.name };
        return this.jwtService.sign(payload);
    }

    async getProfile(userId: string) {
        const user = await prisma.user.findUnique({
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
        if (!user) throw new UnauthorizedException();
        return user;
    }
}
