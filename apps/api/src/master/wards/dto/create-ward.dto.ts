import { IsString, IsUUID, IsInt, IsEnum, IsOptional, MinLength, Min } from "class-validator";
import { Type } from "class-transformer";

export class CreateWardDto {
    @IsUUID("4", { message: "floorId must be a valid UUID" })
    floorId: string;

    @IsString()
    @MinLength(2, { message: "Name must be at least 2 characters" })
    name: string;

    @IsEnum(["GENERAL", "PRIVATE", "NICU", "PICU"], {
        message: "type must be GENERAL, PRIVATE, NICU, or PICU",
    })
    type: "GENERAL" | "PRIVATE" | "NICU" | "PICU";

    @Type(() => Number)
    @IsInt()
    @Min(1, { message: "totalBeds must be at least 1" })
    totalBeds: number;

    @IsOptional()
    @IsEnum(["ACTIVE", "INACTIVE"])
    status?: "ACTIVE" | "INACTIVE" = "ACTIVE";
}
