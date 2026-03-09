import { JwtService } from "@nestjs/jwt";
export declare class AuthService {
    private jwtService;
    private readonly logger;
    constructor(jwtService: JwtService);
    validateUser(email: string, password: string): Promise<any>;
    login(user: {
        id: string;
        email: string;
        role: {
            name: string;
        };
    }): string;
    getProfile(userId: string): Promise<any>;
    getWorkload(userId: string): Promise<{
        inpatients: number;
        labReports: number;
        prescriptionsToday: number;
        pendingReferrals: number;
    }>;
}
