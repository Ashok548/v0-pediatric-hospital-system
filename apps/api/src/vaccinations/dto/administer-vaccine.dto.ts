import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class AdministerVaccineDto {
    @IsString()
    @IsNotEmpty()
    dateAdministered: string;

    @IsString()
    @IsOptional()
    site?: string;

    @IsString()
    @IsOptional()
    batchNumber?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}
