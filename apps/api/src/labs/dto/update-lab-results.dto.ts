import { IsNotEmpty, IsString, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateLabItemDto {
    @IsString()
    @IsOptional()
    id?: string;

    @IsString()
    @IsNotEmpty()
    parameterName: string;

    @IsString()
    @IsOptional()
    value?: string;

    @IsString()
    @IsNotEmpty()
    unit: string;

    @IsString()
    @IsNotEmpty()
    refDisplay: string;

    @IsOptional()
    refMin?: number;

    @IsOptional()
    refMax?: number;

    @IsOptional()
    criticalMin?: number;

    @IsOptional()
    criticalMax?: number;
}

export class UpdateLabPanelResultsDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateLabItemDto)
    items: UpdateLabItemDto[];
}
