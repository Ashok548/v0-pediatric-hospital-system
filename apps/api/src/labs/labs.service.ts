import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@carenest/database';
import { LabOrderStatus, LabPanelStatus } from '@carenest/database';
import { CreateLabOrderDto } from './dto/create-lab-order.dto';
import { UpdateLabPanelResultsDto } from './dto/update-lab-results.dto';

// ─── Panel state machine ──────────────────────────────────────────────────────
const PANEL_ALLOWED_TRANSITIONS: Record<string, LabPanelStatus[]> = {
    [LabPanelStatus.PENDING]:          [LabPanelStatus.SAMPLE_COLLECTED, LabPanelStatus.SAMPLE_REJECTED],
    [LabPanelStatus.SAMPLE_COLLECTED]: [LabPanelStatus.PROCESSING, LabPanelStatus.SAMPLE_REJECTED],
    [LabPanelStatus.SAMPLE_REJECTED]:  [LabPanelStatus.SAMPLE_COLLECTED],  // re-collect
    [LabPanelStatus.PROCESSING]:       [LabPanelStatus.COMPLETED],
    [LabPanelStatus.COMPLETED]:        [LabPanelStatus.VERIFIED],
    [LabPanelStatus.VERIFIED]:         [],
};

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
        }

        const seq = await prisma.labOrderSequence.findUnique({ where: { id_year: { id: 1, year: currentYear } } });
        return `LO-${currentYear}-${String(seq!.lastValue).padStart(5, '0')}`;
    }

    async createOrder(dto: CreateLabOrderDto, doctorId: string) {
        // FIX #6: opVisitId is now also a valid anchor for OP walk-in patients
        if (!dto.admissionId && !dto.appointmentId && !dto.opVisitId) {
            throw new BadRequestException('A lab order must be linked to an admission, appointment, or OP visit.');
        }
        if (dto.admissionId && dto.appointmentId) {
            throw new BadRequestException('A lab order cannot be linked to both an admission and an appointment.');
        }

        const patientType = dto.admissionId ? 'INPATIENT' : 'OUTPATIENT';

        // Pre-compute parameters to keep transaction payload synchronous
        const panelCreateData = await Promise.all(dto.panels.map(async p => {
            let parameters: any[] = [];
            if (p.testProfileId) {
                parameters = await prisma.labTestParameter.findMany({
                    where: { profileId: p.testProfileId, isActive: true },
                    orderBy: { displayOrder: 'asc' }
                });
            }
            return {
                panelName: p.panelName,
                category: p.category,
                sampleType: p.sampleType,
                testProfileId: p.testProfileId,
                status: LabPanelStatus.PENDING,
                items: {
                    create: parameters.map(param => ({
                        testParameterId: param.id,
                        parameterName: param.parameterName,
                        unit: param.unit,
                        refDisplay: param.refDisplay,
                        refMin: param.refMin,
                        refMax: param.refMax,
                        criticalMin: param.criticalMin,
                        criticalMax: param.criticalMax,
                    }))
                }
            };
        }));

        return prisma.$transaction(async (tx: any) => {
            const currentYear = new Date().getFullYear();
            const updateResult = await tx.$executeRaw`
                UPDATE lab_order_sequences SET last_value = last_value + 1, updated_at = NOW() WHERE id = 1 AND year = ${currentYear}
            `;

            if (updateResult === 0) {
                await tx.labOrderSequence.upsert({
                    where: { id_year: { id: 1, year: currentYear } },
                    update: { year: currentYear, lastValue: 1 },
                    create: { id: 1, year: currentYear, lastValue: 1 },
                });
            }

            const seq = await tx.labOrderSequence.findUnique({ where: { id_year: { id: 1, year: currentYear } } });
            const orderNumber = `LO-${currentYear}-${String(seq!.lastValue).padStart(5, '0')}`;

            return tx.labOrder.create({
                data: {
                    orderNumber,
                    patientId: dto.patientId,
                    admissionId: dto.admissionId,
                    appointmentId: dto.appointmentId,
                    opVisitId: dto.opVisitId,
                    patientType,
                    doctorId,
                    status: LabOrderStatus.AWAITING_SAMPLE,
                    technicianNotes: dto.technicianNotes,
                    panels: {
                        create: panelCreateData
                    }
                },
                include: {
                    panels: { include: { items: true } }
                }
            });
        });
    }

    async findByPatient(patientId: string, queryPage: string | number = 1, queryLimit: string | number = 50) {
        const page = Number(queryPage);
        const limit = Number(queryLimit);
        const skip = (page - 1) * limit;

        const [data, total] = await prisma.$transaction([
            prisma.labOrder.findMany({
                where: { patientId },
                skip,
                take: limit,
                include: {
                    doctor: { select: { id: true, name: true } },
                    panels: { include: { items: true } },
                    admission: true,
                    appointment: { include: { doctor: { select: { name: true } } } }
                },
                orderBy: { orderDate: 'desc' }
            }),
            prisma.labOrder.count({ where: { patientId } })
        ]);

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    // FIX #14: Added pagination to prevent full-table scans
    async findAll(queryPage: string | number = 1, queryLimit: string | number = 50) {
        const page = Number(queryPage);
        const limit = Number(queryLimit);
        const skip = (page - 1) * limit;

        const [data, total] = await prisma.$transaction([
            prisma.labOrder.findMany({
                skip,
                take: limit,
                include: {
                    doctor: { select: { id: true, name: true } },
                    patient: { select: { id: true, firstName: true, lastName: true, uhid: true } },
                    panels: true,
                    admission: true,
                    appointment: { include: { doctor: { select: { name: true } } } }
                },
                orderBy: { orderDate: 'desc' }
            }),
            prisma.labOrder.count()
        ]);

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async findOne(id: string) {
        const order = await prisma.labOrder.findUnique({
            where: { id },
            include: {
                doctor: { select: { id: true, name: true } },
                patient: { select: { id: true, firstName: true, lastName: true, uhid: true } },
                panels: { include: { items: true } },
                admission: true,
                appointment: { include: { doctor: { select: { name: true } } } },
                verifiedBy: { select: { id: true, name: true } }
            }
        });
        if (!order) throw new NotFoundException(`Lab order ${id} not found`);
        return order;
    }

    async findByAdmission(admissionId: string, queryPage: string | number = 1, queryLimit: string | number = 50) {
        const page = Number(queryPage);
        const limit = Number(queryLimit);
        const skip = (page - 1) * limit;

        const [data, total] = await prisma.$transaction([
            prisma.labOrder.findMany({
                where: { admissionId },
                skip,
                take: limit,
                include: {
                    doctor: { select: { id: true, name: true } },
                    panels: { include: { items: true } },
                    admission: true
                },
                orderBy: { orderDate: 'desc' }
            }),
            prisma.labOrder.count({ where: { admissionId } })
        ]);

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    // ─── Panel guard helper ───────────────────────────────────────────────────────
    private assertPanelTransition(current: LabPanelStatus, next: LabPanelStatus) {
        const allowed = PANEL_ALLOWED_TRANSITIONS[current] ?? [];
        if (!allowed.includes(next)) {
            throw new BadRequestException(`Cannot transition panel from ${current} to ${next}`);
        }
    }

    // FIX #8: collectSample now has prior-state guard and updates order status atomically
    async collectSample(panelId: string) {
        return prisma.$transaction(async (tx: any) => {
            const panel = await tx.labResultPanel.findUnique({ where: { id: panelId } });
            if (!panel) throw new NotFoundException(`Panel ${panelId} not found`);
            this.assertPanelTransition(panel.status as LabPanelStatus, LabPanelStatus.SAMPLE_COLLECTED);

            const updatedPanel = await tx.labResultPanel.update({
                where: { id: panelId },
                data: {
                    collectedAt: new Date(),
                    status: LabPanelStatus.SAMPLE_COLLECTED
                }
            });

            const order = await tx.labOrder.findUnique({ where: { id: panel.labOrderId } });
            if (order && order.status === LabOrderStatus.AWAITING_SAMPLE) {
                await tx.labOrder.update({
                    where: { id: order.id },
                    data: { status: LabOrderStatus.PROCESSING }
                });
            }

            return updatedPanel;
        });
    }

    // FIX #8: receiveSample now has prior-state guard and updates order status atomically
    async receiveSample(panelId: string) {
        return prisma.$transaction(async (tx: any) => {
            const panel = await tx.labResultPanel.findUnique({ where: { id: panelId } });
            if (!panel) throw new NotFoundException(`Panel ${panelId} not found`);
            this.assertPanelTransition(panel.status as LabPanelStatus, LabPanelStatus.PROCESSING);

            const updatedPanel = await tx.labResultPanel.update({
                where: { id: panelId },
                data: {
                    receivedAt: new Date(),
                    status: LabPanelStatus.PROCESSING
                }
            });

            const order = await tx.labOrder.findUnique({ where: { id: panel.labOrderId } });
            if (order && order.status === LabOrderStatus.AWAITING_SAMPLE) {
                await tx.labOrder.update({
                    where: { id: order.id },
                    data: { status: LabOrderStatus.PROCESSING }
                });
            }

            return updatedPanel;
        });
    }

    async updatePanelResults(panelId: string, dto: UpdateLabPanelResultsDto) {
        return prisma.$transaction(async (tx: any) => {
            const panel = await tx.labResultPanel.findUnique({ where: { id: panelId } });
            if (!panel) throw new NotFoundException(`Panel ${panelId} not found`);

            // FIX #1: synchronous guard using imported BadRequestException
            this.assertPanelTransition(panel.status as LabPanelStatus, LabPanelStatus.COMPLETED);

            await tx.labResultItem.deleteMany({ where: { panelId } });

            await tx.labResultPanel.update({
                where: { id: panelId },
                data: {
                    status: LabPanelStatus.COMPLETED,
                    items: {
                        create: dto.items.map(item => ({
                            parameterName: item.parameterName,
                            value: item.value || '',
                            unit: item.unit,
                            refDisplay: item.refDisplay,
                            refMin: item.refMin ?? null,
                            refMax: item.refMax ?? null,
                            criticalMin: item.criticalMin ?? null,
                            criticalMax: item.criticalMax ?? null,
                        }))
                    }
                }
            });

            // FIX #2: read panels inside the SAME transaction → consistent data
            const order = await tx.labOrder.findUnique({
                where: { id: panel.labOrderId },
                include: { panels: true }
            });

            const allCompleted = order!.panels.every(
                (p: any) => p.id === panelId
                    ? true  // this panel is being updated to COMPLETED right now
                    : ([LabPanelStatus.COMPLETED, LabPanelStatus.VERIFIED] as string[]).includes(p.status as string)
            );

            await tx.labOrder.update({
                where: { id: order!.id },
                data: { status: allCompleted ? LabOrderStatus.RESULT_ENTERED : LabOrderStatus.PARTIAL }
            });

            return tx.labResultPanel.findUnique({ where: { id: panelId }, include: { items: true } });
        });
    }

    // FIX #7: finalizeOrder now validates all panels are COMPLETED before allowing VERIFIED inside a transaction
    async finalizeOrder(id: string, userId: string) {
        return prisma.$transaction(async (tx: any) => {
            const order = await tx.labOrder.findUnique({
                where: { id },
                include: { panels: true }
            });
            if (!order) throw new NotFoundException(`Lab order ${id} not found`);

            const allPanelsCompleted = order.panels.every(
                (p: any) => ([LabPanelStatus.COMPLETED, LabPanelStatus.VERIFIED] as string[]).includes(p.status as string)
            );
            if (!allPanelsCompleted) {
                throw new BadRequestException('Cannot finalize: one or more panels still have pending results.');
            }

            return tx.labOrder.update({
                where: { id },
                data: {
                    status: LabOrderStatus.VERIFIED,
                    verifiedById: userId,
                },
                include: {
                    panels: { include: { items: true } },
                    verifiedBy: { select: { id: true, name: true } }
                }
            });
        });
    }

    // FIX #3: rejectSample is now fully atomic in a single transaction
    async rejectSample(panelId: string, reason: string, userId: string) {
        return prisma.$transaction(async (tx: any) => {
            const panel = await tx.labResultPanel.findUnique({ where: { id: panelId } });
            if (!panel) throw new NotFoundException(`Panel ${panelId} not found`);

            this.assertPanelTransition(panel.status as LabPanelStatus, LabPanelStatus.SAMPLE_REJECTED);

            const updated = await tx.labResultPanel.update({
                where: { id: panelId },
                data: {
                    status: LabPanelStatus.SAMPLE_REJECTED,
                    collectedAt: null,
                    receivedAt: null,
                }
            });

            const order = await tx.labOrder.findUnique({
                where: { id: panel.labOrderId },
                include: { panels: true }
            });

            const hasCompleted = order!.panels.some(
                (p: any) => p.id !== panelId && ([LabPanelStatus.COMPLETED, LabPanelStatus.VERIFIED] as string[]).includes(p.status as string)
            );
            const hasProcessing = order!.panels.some(
                (p: any) => p.id !== panelId && ([LabPanelStatus.PROCESSING, LabPanelStatus.SAMPLE_COLLECTED] as string[]).includes(p.status as string)
            );

            let newOrderStatus: LabOrderStatus = LabOrderStatus.AWAITING_SAMPLE;
            if (hasCompleted) newOrderStatus = LabOrderStatus.PARTIAL;
            else if (hasProcessing) newOrderStatus = LabOrderStatus.PROCESSING;

            await tx.labOrder.update({
                where: { id: panel.labOrderId },
                data: { status: newOrderStatus }
            });

            await tx.auditLog.create({
                data: {
                    entity: 'LabResultPanel',
                    entityId: panelId,
                    action: 'SAMPLE_REJECTED',
                    oldValue: panel.status,
                    newValue: `${LabPanelStatus.SAMPLE_REJECTED} (Reason: ${reason})`,
                    userId,
                }
            });

            return updated;
        });
    }
}
