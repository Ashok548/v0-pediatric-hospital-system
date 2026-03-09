"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LabsService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@carenest/database");
let LabsService = class LabsService {
    async generateOrderNumber() {
        const currentYear = new Date().getFullYear();
        const updateResult = await database_1.prisma.$executeRaw `
      UPDATE lab_order_sequences SET last_value = last_value + 1, updated_at = NOW() WHERE id = 1 AND year = ${currentYear}
    `;
        if (updateResult === 0) {
            await database_1.prisma.labOrderSequence.upsert({
                where: { id_year: { id: 1, year: currentYear } },
                update: { year: currentYear, lastValue: 1 },
                create: { id: 1, year: currentYear, lastValue: 1 },
            });
            const seq = await database_1.prisma.labOrderSequence.findUnique({ where: { id_year: { id: 1, year: currentYear } } });
            return `LO-${currentYear}-${String(seq.lastValue).padStart(5, '0')}`;
        }
        const seq = await database_1.prisma.labOrderSequence.findUnique({ where: { id_year: { id: 1, year: currentYear } } });
        return `LO-${currentYear}-${String(seq.lastValue).padStart(5, '0')}`;
    }
    async createOrder(dto, doctorId) {
        const orderNumber = await this.generateOrderNumber();
        return database_1.prisma.labOrder.create({
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
    async findByPatient(patientId) {
        return database_1.prisma.labOrder.findMany({
            where: { patientId },
            include: {
                doctor: { select: { id: true, name: true } },
                panels: { include: { items: true } }
            },
            orderBy: { orderDate: 'desc' }
        });
    }
    async findAll() {
        return database_1.prisma.labOrder.findMany({
            include: {
                doctor: { select: { id: true, name: true } },
                patient: { select: { id: true, firstName: true, lastName: true, uhid: true } },
                panels: true
            },
            orderBy: { orderDate: 'desc' }
        });
    }
    async findOne(id) {
        const order = await database_1.prisma.labOrder.findUnique({
            where: { id },
            include: {
                doctor: { select: { id: true, name: true } },
                patient: { select: { id: true, firstName: true, lastName: true, uhid: true } },
                panels: { include: { items: true } }
            }
        });
        if (!order)
            throw new common_1.NotFoundException(`Lab order ${id} not found`);
        return order;
    }
    async updatePanelResults(panelId, dto) {
        await database_1.prisma.labResultItem.deleteMany({ where: { panelId } });
        await database_1.prisma.labResultPanel.update({
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
        const panel = await database_1.prisma.labResultPanel.findUnique({ where: { id: panelId } });
        const order = await database_1.prisma.labOrder.findUnique({
            where: { id: panel.labOrderId },
            include: { panels: true }
        });
        if (order.status === 'PENDING') {
            await database_1.prisma.labOrder.update({ where: { id: order.id }, data: { status: 'PARTIAL' } });
        }
        return database_1.prisma.labResultPanel.findUnique({ where: { id: panelId }, include: { items: true } });
    }
    async finalizeOrder(id, userId) {
        const user = await database_1.prisma.user.findUnique({ where: { id: userId } });
        return database_1.prisma.labOrder.update({
            where: { id },
            data: {
                status: 'FINALIZED',
                verifiedBy: user?.name || 'Lab Technician',
            },
            include: { panels: { include: { items: true } } }
        });
    }
    async collectSample(panelId) {
        return database_1.prisma.labResultPanel.update({
            where: { id: panelId },
            data: { collectedAt: new Date() }
        });
    }
    async receiveSample(panelId) {
        return database_1.prisma.labResultPanel.update({
            where: { id: panelId },
            data: { receivedAt: new Date() }
        });
    }
};
exports.LabsService = LabsService;
exports.LabsService = LabsService = __decorate([
    (0, common_1.Injectable)()
], LabsService);
//# sourceMappingURL=labs.service.js.map