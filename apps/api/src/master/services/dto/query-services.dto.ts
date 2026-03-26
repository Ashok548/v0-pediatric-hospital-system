import { IsOptional, IsString, IsEnum, IsInt, IsPositive, Min } from "class-validator";
import { Type } from "class-transformer";

export class QueryServicesDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsEnum(["CONSULTATION", "LAB", "PROCEDURE", "ROOM", "MISC"])
    category?: "CONSULTATION" | "LAB" | "PROCEDURE" | "ROOM" | "MISC";

    @IsOptional()
    @IsEnum(["ACTIVE", "INACTIVE"])
    status?: "ACTIVE" | "INACTIVE";

    @IsOptional()
    @IsEnum(["OP", "IP", "BOTH"])
    careType?: "OP" | "IP" | "BOTH";

    @IsOptional()
    @IsString()
    departmentName?: string;

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
