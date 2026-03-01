import { IsOptional, IsString, IsInt, Min } from "class-validator"
import { Type } from "class-transformer"

export class QueryNicuDto {
    @IsOptional()
    @IsString()
    search?: string

    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    limit?: number

    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    page?: number
}
