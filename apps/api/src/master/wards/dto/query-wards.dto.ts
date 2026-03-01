import { IsOptional, IsString, IsUUID, IsEnum, IsInt, IsPositive, Min } from "class-validator";
import { Type } from "class-transformer";

export class QueryWardsDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsUUID("4", { message: "floorId must be a valid UUID" })
    floorId?: string;

    @IsOptional()
    @IsEnum(["GENERAL", "PRIVATE", "NICU", "PICU"])
    type?: "GENERAL" | "PRIVATE" | "NICU" | "PICU";

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
