import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { QueryUsersDto } from "./dto/query-users.dto";
export declare class UsersService {
    create(dto: CreateUserDto): Promise<any>;
    findAll(query: QueryUsersDto): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<any>;
    update(id: string, dto: UpdateUserDto): Promise<any>;
    resetPassword(id: string, dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    deactivate(id: string, currentUserId: string): Promise<any>;
    private assertUniqueEmail;
    private assertUniquePhone;
    private assertRoleExists;
}
