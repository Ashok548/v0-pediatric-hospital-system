import type { Response } from "express";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
export declare class AuthController {
    private authService;
    private readonly logger;
    constructor(authService: AuthService);
    login(req: {
        user: {
            id: string;
            email: string;
            role: {
                id: number;
                name: string;
            };
            name: string;
        };
    }, res: Response, _dto: LoginDto): {
        message: string;
        user: {
            id: string;
            name: string;
            email: string;
            role: string;
        };
    };
    logout(res: Response): {
        message: string;
    };
    getMe(user: {
        id: string;
    }): Promise<any>;
}
