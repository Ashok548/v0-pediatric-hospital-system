import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@carenest/database';
import { CreateLabOrderDto } from './dto/create-lab-order.dto';
import { UpdateLabPanelResultsDto } from './dto/update-lab-results.dto';

@Injectable()
export class LabsService {
    private async generateOrderNumber(): Promise<string> {
        const currentYear = new Date().getFullYear();
        const updateResult = await prisma.$executeRaw`
      UPDATE lab_order_sequences SET last_value = last_value + 1, updated_at = NOW() WHERE id = 1 AND year = ${currentYear}
    `;

        if (updateResult === 0) {
            await prisma.labOrderSequence.upsert({
                where: { id_year: { id: 1, year: currentYear } },
                update: { year: currentYear, lastValue: 1 },
                create: { id: 1, year: currentYear, lastValue: 1 },
            });
            const seq = await prisma.labOrderSequence.findUnique({ where: { id_year: { id: 1, year: currentYear } } });
            return `LO-${currentYear}-${String(seq!.lastValue).padStart(5, '0')}`;
        }

        const seq = await prisma.labOrderSequence.findUnique({ where: { id_year: { id: 1, year: currentYear } } });
        return `LO-${currentYear}-${String(seq!.lastValue).padStart(5, '0')}`;
    }

    async createOrder(dto: CreateLabOrderDto, doctorId: string) {
        const orderNumber = await this.generateOrderNumber();

        return prisma.labOrder.create({
            data: {
                orderNumber,
                patientId: dto.patientId,
                doctorId,
                technicianNotes: dto.technicianNotes,
                panels: {
                    create: dto.panels.map(p => ({
                        panelName: p.panelName,
                        category: p.category,
                        sampleType: p.sampleType,
                    }))
                }
            },
            include: { panels: true }
        });
    }

    async findByPatient(patientId: string) {
        return prisma.labOrder.findMany({
            where: { patientId },
            include: {
                doctor: { select: { id: true, name: true } },
                panels: { include: { items: true } }
            },
            orderBy: { orderDate: 'desc' }
        });
    }

    async findAll() {
        return prisma.labOrder.findMany({
            include: {
                doctor: { select: { id: true, name: true } },
                patient: { select: { id: true, firstName: true, lastName: true, uhid: true } },
                panels: true
            },
            orderBy: { orderDate: 'desc' }
        });
    }

    async findOne(id: string) {
        const order = await prisma.labOrder.findUnique({
            where: { id },
            include: {
                doctor: { select: { id: true, name: true } },
                patient: { select: { id: true, firstName: true, lastName: true, uhid: true } },
                panels: { include: { items: true } }
            }
        });
        if (!order) throw new NotFoundException(`Lab order ${id} not found`);
        return order;
    }

    async updatePanelResults(panelId: string, dto: UpdateLabPanelResultsDto) {
        await prisma.labResultItem.deleteMany({ where: { panelId } });

        await prisma.labResultPanel.update({
            where: { id: panelId },
            data: {
                status: 'COMPLETED',
                items: {
                    create: dto.items.map(item => ({
                        parameterName: item.parameterName,
                        value: item.value || "",
                        unit: item.unit,
                        refDisplay: item.refDisplay,
                        refMin: item.refMin !== undefined ? item.refMin : null,
                        refMax: item.refMax !== undefined ? item.refMax : null,
                        criticalMin: item.criticalMin !== undefined ? item.criticalMin : null,
                        criticalMax: item.criticalMax !== undefined ? item.criticalMax : null,
                    }))
                }
            }
        });

        const panel = await prisma.labResultPanel.findUnique({ where: { id: panelId } });
        const order = await prisma.labOrder.findUnique({
            where: { id: panel!.labOrderId },
            include: { panels: true }
        });

        // If order was PENDING, and we just added some results, it is now PARTIAL.
        // It stays PARTIAL until manually finalized by a tech.
        if (order!.status === 'PENDING') {
            await prisma.labOrder.update({ where: { id: order!.id }, data: { status: 'PARTIAL' } });
        }

        return prisma.labResultPanel.findUnique({ where: { id: panelId }, include: { items: true } });
    }

    async finalizeOrder(id: string, userId: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        return prisma.labOrder.update({
            where: { id },
            data: {
                status: 'FINALIZED',
                verifiedBy: user?.name || 'Lab Technician',
            },
            include: { panels: { include: { items: true } } }
        });
    }

    async collectSample(panelId: string) {
        return prisma.labResultPanel.update({
            where: { id: panelId },
            data: { collectedAt: new Date() }
        });
    }

    async receiveSample(panelId: string) {
        return prisma.labResultPanel.update({
            where: { id: panelId },
            data: { receivedAt: new Date() }
        });
    }
}
