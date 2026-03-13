import { Injectable } from '@nestjs/common';
import { prisma } from '@carenest/database';
import { Prisma } from '@carenest/database';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';

@Injectable()
export class ServiceOrdersService {
    private async generateOrderNumber(): Promise<string> {
        const currentYear = new Date().getFullYear();
        return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const updateResult = await tx.$executeRaw`
                UPDATE service_order_sequences SET last_value = last_value + 1, updated_at = NOW() WHERE id = 1 AND year = ${currentYear}
            `;
            if (updateResult === 0) {
                await tx.serviceOrderSequence.upsert({
                    where: { id_year: { id: 1, year: currentYear } },
                    update: { year: currentYear, lastValue: 1 },
                    create: { id: 1, year: currentYear, lastValue: 1 },
                });
            }
            const seq = await tx.serviceOrderSequence.findUnique({ where: { id_year: { id: 1, year: currentYear } } });
            return `SRV-${currentYear}-${String(seq!.lastValue).padStart(5, '0')}`;
        });
    }

    async createOrder(dto: CreateServiceOrderDto, doctorId: string) {
        const orderNumber = await this.generateOrderNumber();
        return prisma.serviceOrder.create({
            data: {
                orderNumber,
                patientId: dto.patientId,
                admissionId: dto.admissionId,
                serviceId: dto.serviceId,
                quantity: dto.quantity || 1,
                priority: dto.priority || 'NORMAL',
                notes: dto.notes,
                doctorId,
                status: 'PENDING'
            },
            include: { service: true }
        });
    }

    async findByAdmission(admissionId: string) {
        return prisma.serviceOrder.findMany({
            where: { admissionId },
            include: {
                service: true,
                doctor: { select: { id: true, name: true } }
            },
            orderBy: { orderDate: 'desc' }
        });
    }
}
