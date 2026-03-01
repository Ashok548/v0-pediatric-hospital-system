import { Injectable, UnauthorizedException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Request } from "express";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    private readonly logger = new Logger(JwtStrategy.name);

    constructor(private configService: ConfigService) {
        super({
            // Extract from HttpOnly cookie, not Authorization header
            jwtFromRequest: ExtractJwt.fromExtractors([
                (req: Request) => req?.cookies?.["access_token"] ?? null,
            ]),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>("JWT_SECRET")!,
        });
    }

    async validate(payload: { sub: string; email: string; role: string }) {
        if (!payload?.sub) {
            this.logger.warn("JWT validation failed: Missing subject (sub)");
            throw new UnauthorizedException();
        }
        this.logger.debug(`JWT validated successfully for user: ${payload.email}`);
        return { id: payload.sub, email: payload.email, role: payload.role };
    }
}
