import { IsString, IsNotEmpty, IsOptional, IsNumber, IsIn } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateNursingNoteDto {
    @IsString()
    @IsNotEmpty()
    noteType: string;

    @IsString()
    @IsNotEmpty()
    content: string;

    @IsString()
    @IsOptional()
    @IsIn(['NORMAL', 'URGENT', 'CRITICAL'])
    priority?: string = 'NORMAL';

    @IsString()
    @IsOptional()
    @IsIn(['MORNING', 'AFTERNOON', 'NIGHT'])
    shiftPeriod?: string;
}

export class UpdateNursingNoteDto extends PartialType(CreateNursingNoteDto) { }

export class CreateIoRecordDto {
    @IsString()
    @IsNotEmpty()
    @IsIn(['INTAKE', 'OUTPUT'])
    ioType: string;

    @IsString()
    @IsNotEmpty()
    route: string;

    @IsNumber()
    @IsNotEmpty()
    volumeMl: number;

    @IsString()
    @IsOptional()
    notes?: string;
}

export class UpdateIoRecordDto {
    @IsString()
    @IsOptional()
    @IsIn(['INTAKE', 'OUTPUT'])
    ioType?: string;

    @IsString()
    @IsOptional()
    route?: string;

    @IsNumber()
    @IsOptional()
    volumeMl?: number;

    @IsString()
    @IsOptional()
    notes?: string;
}
