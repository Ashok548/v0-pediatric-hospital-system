import { IsString, IsUUID, IsInt, IsEnum, IsOptional, MinLength, Min } from "class-validator";
import { Type } from "class-transformer";

export class UpdateWardDto {
    @IsOptional()
    @IsUUID("4", { message: "floorId must be a valid UUID" })
    floorId?: string;

    @IsOptional()
    @IsString()
    @MinLength(2)
    name?: string;

    @IsOptional()
    @IsEnum(["GENERAL", "PRIVATE", "NICU", "PICU"])
    type?: "GENERAL" | "PRIVATE" | "NICU" | "PICU";

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    totalBeds?: number;

    @IsOptional()
    @IsEnum(["ACTIVE", "INACTIVE"])
    status?: "ACTIVE" | "INACTIVE";
}
