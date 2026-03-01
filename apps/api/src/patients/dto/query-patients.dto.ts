import { IsOptional, IsInt, Min, Max, IsString, IsEnum, IsIn } from "class-validator";
import { Type } from "class-transformer";
import { UserStatus } from "@carenest/database";

export class QueryPatientsDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    // Max cap against huge payload requests
    @Max(100)
    limit?: number = 10;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsEnum(UserStatus)
    status?: UserStatus;

    @IsOptional()
    @IsIn(["updatedAt", "createdAt", "firstName", "uhid"])
    sortBy?: string = "updatedAt";

    @IsOptional()
    @IsIn(["asc", "desc"])
    order?: "asc" | "desc" = "desc";
}
