import { IsOptional, IsString, IsEnum, IsInt, IsPositive, Min } from "class-validator";
import { Type } from "class-transformer";

export class QueryUsersDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    role?: string;

    @IsOptional()
    @IsEnum(["ACTIVE", "INACTIVE"])
    status?: "ACTIVE" | "INACTIVE";

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @IsPositive()
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 10;
}
