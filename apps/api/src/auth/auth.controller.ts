import {
    Controller,
    Post,
    Get,
    Body,
    Req,
    Res,
    UseGuards,
    HttpCode,
    HttpStatus,
    Logger,
} from "@nestjs/common";
import type { Response } from "express";
import { AuthService } from "./auth.service";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { Public } from "./decorators/public.decorator";
import { CurrentUser } from "./decorators/current-user.decorator";
import { LoginDto } from "./dto/login.dto";

const COOKIE_NAME = "access_token";
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 12 * 60 * 60 * 1000, // 12 hours
    path: "/",
};

@Controller("auth")
export class AuthController {
    private readonly logger = new Logger(AuthController.name);

    constructor(private authService: AuthService) { }

    @Public()
    @UseGuards(LocalAuthGuard)
    @Post("login")
    @HttpCode(HttpStatus.OK)
    login(
        @Req() req: { user: { id: string; email: string; role: { id: number; name: string }; name: string } },
        @Res({ passthrough: true }) res: Response,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        @Body() _dto: LoginDto // Triggers class-validator before LocalAuthGuard
    ) {
        this.logger.log(`Login request received for user: ${req.user.email}`);
        const token = this.authService.login(req.user);
        res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
        this.logger.log(`Login successful, cookie set for user: ${req.user.email}`);
        return {
            message: "Login successful",
            user: {
                id: req.user.id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role.name,
            },
        };
    }

    @UseGuards(JwtAuthGuard)
    @Post("logout")
    @HttpCode(HttpStatus.OK)
    logout(@Res({ passthrough: true }) res: Response) {
        res.clearCookie(COOKIE_NAME, { path: "/" });
        return { message: "Logged out successfully" };
    }

    @UseGuards(JwtAuthGuard)
    @Get("me")
    getMe(@CurrentUser() user: { id: string }) {
        return this.authService.getProfile(user.id);
    }
}
