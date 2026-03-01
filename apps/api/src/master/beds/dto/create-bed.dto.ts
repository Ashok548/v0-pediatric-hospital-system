import { IsString, IsUUID, IsEnum, IsOptional, MinLength } from "class-validator";

export class CreateBedDto {
    @IsUUID("4", { message: "wardId must be a valid UUID" })
    wardId: string;

    @IsString()
    @MinLength(1, { message: "bedNumber cannot be empty" })
    bedNumber: string;

    @IsOptional()
    @IsEnum(["AVAILABLE", "OCCUPIED", "CLEANING", "RESERVED", "MAINTENANCE"], {
        message: "status must be a valid BedStatus",
    })
    status?: "AVAILABLE" | "OCCUPIED" | "CLEANING" | "RESERVED" | "MAINTENANCE" = "AVAILABLE";
}
