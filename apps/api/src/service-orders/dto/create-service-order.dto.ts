import { IsString, IsOptional, IsNotEmpty, IsInt, Min, IsEnum } from 'class-validator';

enum ServiceOrderPriority {
  NORMAL = 'NORMAL',
  URGENT = 'URGENT',
  STAT = 'STAT'
}

export class CreateServiceOrderDto {
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @IsString()
  @IsOptional()
  admissionId?: string;

  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @IsEnum(ServiceOrderPriority)
  @IsOptional()
  priority?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
