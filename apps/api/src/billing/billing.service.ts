import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { prisma, Prisma } from '@carenest/database';
import {
  CreateBillDto,
  AddBillItemDto,
  RecordPaymentDto,
  QueryBillsDto,
  BillingStatsQueryDto,
} from './dto/billing.dto';
import { BillStatus } from '@carenest/database';
import { OPVisitsService } from '../op-visits/op-visits.service';
import { nextSequenceValue } from '../common/sequence.util';

// Reusable Include Projection
const BILL_INCLUDE = {
  patient: {
    select: {
      id: true,
      uhid: true,
      firstName: true,
      lastName: true,
      phone: true,
    },
  },
  admission: {
    select: {
      id: true,
      admissionNumber: true,
      status: true,
      department: true,
    },
  },
  opVisit: {
    select: {
      id: true,
      opNumber: true,
      visitDate: true,
      department: true,
      doctor: {
        select: { id: true, name: true, consultationFee: true },
      },
    },
  },
  items: {
    orderBy: { createdAt: 'asc' as const },
  },
  payments: {
    orderBy: { paymentDate: 'desc' as const },
  },
} as const;

@Injectable()
export class BillingService {
  constructor(
    @Inject(forwardRef(() => OPVisitsService))
    private readonly opVisitsService: OPVisitsService,
  ) {}

  // ─── Create Bill ────────────────────────────────────────────────────────────
  async create(dto: CreateBillDto) {
    const patient = await prisma.patient.findUnique({
      where: { id: dto.patientId },
    });
    if (!patient)
      throw new NotFoundException(`Patient ${dto.patientId} not found`);

    if (dto.admissionId) {
      const admission = await prisma.admission.findUnique({
        where: { id: dto.admissionId },
      });
      if (!admission)
        throw new NotFoundException(`Admission ${dto.admissionId} not found`);
      if (admission.patientId !== dto.patientId) {
        throw new BadRequestException(
          'Admission does not belong to the specified patient',
        );
      }
    }

    // Prevent duplicate bill per appointment
    if (dto.appointmentId) {
      const appt = await prisma.appointment.findUnique({
        where: { id: dto.appointmentId },
      });
      if (!appt)
        throw new NotFoundException(
          `Appointment ${dto.appointmentId} not found`,
        );
      const existingBill = await prisma.bill.findUnique({
        where: { appointmentId: dto.appointmentId },
      });
      if (existingBill && existingBill.status !== 'CANCELLED') {
        throw new ConflictException(
          `A bill already exists for this appointment: ${existingBill.billNumber}`,
        );
      }
    }

    return prisma.$transaction(async (tx: any) => {
      // FIX P0-2: Bill number is now generated inside the transaction to prevent burned sequences on rollback
      const year = new Date().getFullYear();
      const seqVal = await nextSequenceValue(tx, 'bill_sequences', year);
      const billNumber = `BILL-${year}-${String(seqVal).padStart(6, '0')}`;

      let resolvedOpVisitId = dto.opVisitId;

      // FIX P0-2: If OP visit creation is needed, delegate to OPVisitsService to enforce state machine + audit
      if (!dto.admissionId && !dto.opVisitId && dto.department) {
        const opVisit = await this.opVisitsService.createWithTx(tx, {
          patientId: dto.patientId,
          appointmentId: dto.appointmentId,
          doctorId: dto.doctorId,
          department: dto.department,
          notes: dto.notes,
        });
        resolvedOpVisitId = opVisit.id;
      }

      // Fix GAP-4: Sync Appointment Status to IN_PROGRESS only if it's currently SCHEDULED
      if (dto.appointmentId) {
        const existingAppt = await tx.appointment.findUnique({
          where: { id: dto.appointmentId },
        });
        if (existingAppt && existingAppt.status === 'SCHEDULED') {
          await tx.appointment.update({
            where: { id: dto.appointmentId },
            data: { status: 'IN_PROGRESS' },
          });
        }
      }

      const newBill = await tx.bill.create({
        data: {
          billNumber,
          patientId: dto.patientId,
          admissionId: dto.admissionId,
          appointmentId: dto.appointmentId,
          opVisitId: resolvedOpVisitId,
          tariffPlanId: dto.tariffPlanId,
          notes: dto.notes,
          status: BillStatus.DRAFT,
          totalAmount: 0,
          discountAmount: 0,
          taxAmount: 0,
          netAmount: 0,
          paidAmount: 0,
          dueAmount: 0,
        },
      });

      // Point 1: Auto-add mapped Default Services (e.g., OP Consultation)
      if (resolvedOpVisitId && dto.department) {
        const autoServices = await tx.service.findMany({
          where: {
            autoAddTrigger: 'ON_OP_CREATION',
            isDefault: true,
            status: 'ACTIVE',
            departments: {
              some: { department: { name: dto.department } },
            },
          },
          orderBy: { autoAddPriority: 'asc' },
        });

        for (const autoSrv of autoServices) {
          await tx.billItem.create({
            data: {
              billId: newBill.id,
              serviceId: autoSrv.id,
              serviceName: autoSrv.name,
              serviceCode: autoSrv.code,
              quantity: 1,
              unitPrice: parseFloat(autoSrv.basePrice.toString()),
              discountPercent: 0,
              taxPercent: parseFloat(autoSrv.taxPercent.toString()),
              discountAmount: 0,
              taxAmount: 0,
              totalPrice: 0,
            },
          });
        }
        // Recalculate will return the fully mapped bill including items
        return this.recalculateBillTotals(tx, newBill.id);
      }

      return tx.bill.findUnique({
        where: { id: newBill.id },
        include: BILL_INCLUDE,
      });
    });
  }

  // ─── Find All (Paginated) ───────────────────────────────────────────────────
  async findAll(query: QueryBillsDto) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.patientId) where.patientId = query.patientId;
    if (query.admissionId) where.admissionId = query.admissionId;
    if (query.appointmentId) where.appointmentId = query.appointmentId;

    if (query.search) {
      where.OR = [
        { billNumber: { contains: query.search, mode: 'insensitive' } },
        {
          patient: {
            firstName: { contains: query.search, mode: 'insensitive' },
          },
        },
        {
          patient: {
            lastName: { contains: query.search, mode: 'insensitive' },
          },
        },
        { patient: { uhid: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await prisma.$transaction([
      prisma.bill.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: BILL_INCLUDE,
      }),
      prisma.bill.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ─── Get Stats ──────────────────────────────────────────────────────────────
  async getStats(query: BillingStatsQueryDto) {
    let startDate: Date;
    let endDate: Date = new Date(); // now

    if (query.period === 'today') {
      startDate = new Date();
      startDate.setUTCHours(0, 0, 0, 0);
    } else if (query.period === 'week') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - startDate.getUTCDay());
      startDate.setUTCHours(0, 0, 0, 0);
    } else if (query.period === 'month') {
      startDate = new Date();
      startDate.setUTCDate(1);
      startDate.setUTCHours(0, 0, 0, 0);
    } else if (query.period === 'custom' && query.startDate && query.endDate) {
      startDate = new Date(query.startDate);
      endDate = new Date(query.endDate);
      endDate.setUTCHours(23, 59, 59, 999);
    } else {
      // Default to today if no period specified
      startDate = new Date();
      startDate.setUTCHours(0, 0, 0, 0);
    }

    const statusFilterQuery = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    const activeDateFilter = {
      ...statusFilterQuery,
      status: { not: 'CANCELLED' as const },
    };

    const [
      totalsAgg,
      statusCountsAgg,
      opCountsAgg,
      ipCountsAgg,
      paymentModeAgg,
      allBillsCount,
    ] = await Promise.all([
      prisma.bill.aggregate({
        where: activeDateFilter,
        _sum: {
          paidAmount: true,
          dueAmount: true,
          netAmount: true,
          discountAmount: true,
        },
      }),
      prisma.bill.groupBy({
        by: ['status'],
        where: statusFilterQuery,
        _count: { id: true },
      }),
      prisma.bill.aggregate({
        where: { ...activeDateFilter, admissionId: null },
        _count: { id: true },
        _sum: { netAmount: true },
      }),
      prisma.bill.aggregate({
        where: { ...activeDateFilter, admissionId: { not: null } },
        _count: { id: true },
        _sum: { netAmount: true },
      }),
      prisma.payment.groupBy({
        by: ['paymentMode'],
        where: { paymentDate: { gte: startDate, lte: endDate } },
        _sum: { amount: true },
      }),
      prisma.bill.count({ where: statusFilterQuery }),
    ]);

    // ALERTS (Usually these span all-time not just the filtered period, but for overdue it's 48h ago)
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const [pendingSettlements, overdueBills, draftBills] = await Promise.all([
      prisma.bill.count({
        where: {
          status: { in: ['FINAL', 'PARTIALLY_PAID'] },
          admissionId: { not: null },
        },
      }),
      prisma.bill.count({
        where: {
          status: 'FINAL',
          dueAmount: { gt: 0 },
          createdAt: { lt: fortyEightHoursAgo },
        },
      }),
      prisma.bill.count({ where: { status: 'DRAFT' } }),
    ]);

    // Map Status Counts
    const counts = {
      all: allBillsCount,
      DRAFT: 0,
      FINAL: 0,
      PARTIALLY_PAID: 0,
      PAID: 0,
      CANCELLED: 0,
    };
    statusCountsAgg.forEach((item: any) => {
      if (counts[item.status as keyof typeof counts] !== undefined) {
        counts[item.status as keyof typeof counts] = item._count.id;
      }
    });

    // Map Payment Modes
    const paymentModes = {
      CASH: 0,
      CARD: 0,
      UPI: 0,
      ONLINE: 0,
      INSURANCE: 0,
      CHEQUE: 0,
    };
    paymentModeAgg.forEach((item: any) => {
      if (
        paymentModes[item.paymentMode as keyof typeof paymentModes] !==
        undefined
      ) {
        paymentModes[item.paymentMode as keyof typeof paymentModes] =
          parseFloat(item._sum.amount?.toString() || '0');
      }
    });

    return {
      totals: {
        revenue: parseFloat(totalsAgg._sum.paidAmount?.toString() || '0'),
        outstanding: parseFloat(totalsAgg._sum.dueAmount?.toString() || '0'),
        totalBilled: parseFloat(totalsAgg._sum.netAmount?.toString() || '0'),
        discount: parseFloat(totalsAgg._sum.discountAmount?.toString() || '0'),
      },
      counts,
      billTypeSplit: {
        op: {
          count: opCountsAgg._count.id,
          revenue: parseFloat(opCountsAgg._sum.netAmount?.toString() || '0'),
        },
        ip: {
          count: ipCountsAgg._count.id,
          revenue: parseFloat(ipCountsAgg._sum.netAmount?.toString() || '0'),
        },
      },
      paymentModes,
      alerts: {
        pendingSettlements,
        overdueBills,
        draftBills,
      },
    };
  }

  // ─── Find One ───────────────────────────────────────────────────────────────
  async findOne(id: string) {
    const bill = await prisma.bill.findUnique({
      where: { id },
      include: BILL_INCLUDE,
    });
    if (!bill) throw new NotFoundException(`Bill ${id} not found`);
    return bill;
  }

  // ─── Helper: Recalculate Bill Totals ────────────────────────────────────────
  private async recalculateBillTotals(tx: any, billId: string) {
    const items = await tx.billItem.findMany({ where: { billId } });

    let totalAmount = 0;
    let discountAmount = 0;
    let taxAmount = 0;
    let netAmount = 0;

    for (const item of items) {
      // Because values come back as Decimal from Prisma, convert to float for math
      const q = item.quantity;
      const up = parseFloat(item.unitPrice.toString());
      const dp = parseFloat(item.discountPercent.toString());
      const tp = parseFloat(item.taxPercent.toString());

      const itemGross = up * q;
      const itemDiscount = itemGross * (dp / 100);
      const itemPreTax = itemGross - itemDiscount;
      const itemTax = itemPreTax * (tp / 100);
      const itemNet = itemPreTax + itemTax;

      totalAmount += itemGross;
      discountAmount += itemDiscount;
      taxAmount += itemTax;
      netAmount += itemNet;

      // Update item snapshots to match final calculations
      await tx.billItem.update({
        where: { id: item.id },
        data: {
          discountAmount: itemDiscount,
          taxAmount: itemTax,
          totalPrice: itemNet,
        },
      });
    }

    const payments = await tx.payment.findMany({ where: { billId } });
    const paidAmount = payments.reduce(
      (sum: number, p: any) => sum + parseFloat(p.amount.toString()),
      0,
    );
    const dueAmount = netAmount - paidAmount;

    return tx.bill.update({
      where: { id: billId },
      data: {
        totalAmount,
        discountAmount,
        taxAmount,
        netAmount,
        paidAmount,
        dueAmount: dueAmount < 0 ? 0 : dueAmount,
      },
      include: BILL_INCLUDE,
    });
  }

  // ─── Add Item ───────────────────────────────────────────────────────────────
  async addItem(billId: string, dto: AddBillItemDto) {
    return prisma.$transaction(async (tx: any) => {
      const bill = await tx.bill.findUnique({ where: { id: billId } });
      if (!bill) throw new NotFoundException(`Bill ${billId} not found`);
      if (bill.status !== 'DRAFT') {
        throw new BadRequestException('Can only add items to DRAFT bills');
      }

      const service = await tx.service.findUnique({
        where: { id: dto.serviceId },
      });
      if (!service)
        throw new NotFoundException(`Service ${dto.serviceId} not found`);
      if (service.status !== 'ACTIVE') {
        throw new BadRequestException(`Service ${service.name} is inactive`);
      }

      // Price resolution: DTO override → tariff override → service base price
      let unitPrice =
        dto.unitPrice !== undefined
          ? dto.unitPrice
          : parseFloat(service.basePrice.toString());
      let discountPercent = dto.discountPercent ?? 0;

      if (!dto.unitPrice && bill.tariffPlanId) {
        const tariffRate = await tx.tariffRate.findUnique({
          where: {
            tariffPlanId_serviceId: {
              tariffPlanId: bill.tariffPlanId,
              serviceId: service.id,
            },
          },
        });
        if (tariffRate) {
          unitPrice = parseFloat(tariffRate.priceOverride.toString());
          // Prefer DTO discount, fallback to tariff discount
          if (dto.discountPercent === undefined && tariffRate.discountPercent) {
            discountPercent = parseFloat(tariffRate.discountPercent.toString());
          }
        }
      }

      const taxPercent = parseFloat(service.taxPercent.toString());
      const quantity = dto.quantity ?? 1;

      // FIX P0-4: Conflict throw is synchronous now (was import().then() which silently swallowed the error)
      if (service.conflictGroupCode) {
        const conflictingItems = await tx.billItem.findMany({
          where: {
            billId,
            service: { conflictGroupCode: service.conflictGroupCode },
          },
          include: { service: true },
        });
        if (conflictingItems.length > 0) {
          throw new ConflictException(
            `Cannot add ${service.name} — conflicts with existing bill item '${conflictingItems[0].serviceName}'`,
          );
        }
      }

      await tx.billItem.create({
        data: {
          billId,
          serviceId: service.id,
          serviceName: service.name,
          serviceCode: service.code,
          quantity,
          unitPrice,
          discountPercent,
          taxPercent,
          discountAmount: 0, // Calculated in recalculation
          taxAmount: 0, // Calculated in recalculation
          totalPrice: 0, // Calculated in recalculation
        },
      });

      // Point 5: Dependency Auto-Chaining (e.g., Ventilator auto-adds Monitor)
      const dependencies = await tx.serviceDependency.findMany({
        where: { serviceId: service.id, isAutoAdd: true },
        include: { dependsOn: true },
      });

      for (const dep of dependencies) {
        // Check if target is already on the bill
        const existing = await tx.billItem.findFirst({
          where: { billId, serviceId: dep.dependsOnServiceId },
        });

        if (!existing) {
          const target = dep.dependsOn;
          if (target.status === 'ACTIVE') {
            await tx.billItem.create({
              data: {
                billId,
                serviceId: target.id,
                serviceName: target.name,
                serviceCode: target.code,
                quantity: 1, // Assume 1 for auto-add dependencies
                unitPrice: parseFloat(target.basePrice.toString()),
                discountPercent: 0,
                taxPercent: parseFloat(target.taxPercent.toString()),
                discountAmount: 0,
                taxAmount: 0,
                totalPrice: 0,
              },
            });
          }
        }
      }

      return this.recalculateBillTotals(tx, billId);
    });
  }

  // ─── Remove Item ────────────────────────────────────────────────────────────
  async removeItem(billId: string, itemId: string) {
    return prisma.$transaction(async (tx: any) => {
      const bill = await tx.bill.findUnique({ where: { id: billId } });
      if (!bill) throw new NotFoundException(`Bill ${billId} not found`);
      if (bill.status !== 'DRAFT') {
        throw new BadRequestException('Can only remove items from DRAFT bills');
      }

      const item = await tx.billItem.findUnique({ where: { id: itemId } });
      if (!item || item.billId !== billId) {
        throw new NotFoundException(
          `BillItem ${itemId} not found in this bill`,
        );
      }

      await tx.billItem.delete({ where: { id: itemId } });
      return this.recalculateBillTotals(tx, billId);
    });
  }

  // ─── Finalize Bill ──────────────────────────────────────────────────────────
  async finalizeBill(id: string, userId?: string) {
    return prisma.$transaction(async (tx: any) => {
      const bill = await tx.bill.findUnique({
        where: { id },
        include: { _count: { select: { items: true } } },
      });
      if (!bill) throw new NotFoundException(`Bill ${id} not found`);
      if (bill.status !== BillStatus.DRAFT) {
        throw new BadRequestException(`Bill is already ${bill.status}`);
      }
      if (bill._count.items === 0) {
        throw new BadRequestException('Cannot finalize an empty bill');
      }

        // Bill finalization is financial only. OP visit state changes remain part
        // of the clinical workflow and must not be forced here.

      const updated = await tx.bill.update({
        where: { id },
        data: { status: BillStatus.FINAL },
        include: BILL_INCLUDE,
      });

      // Compliance: Log the finalization
      await tx.auditLog.create({
        data: {
          entity: 'Bill',
          entityId: id,
          action: 'FINALIZE',
          oldValue: BillStatus.DRAFT,
          newValue: BillStatus.FINAL,
          userId: userId ?? null,
        },
      });

      return updated;
    });
  }

  // ─── Record Payment ─────────────────────────────────────────────────────────
  async recordPayment(
    billId: string,
    dto: RecordPaymentDto,
    requestingUserId?: string,
  ) {
    return prisma.$transaction(async (tx: any) => {
      const bill = await tx.bill.findUnique({ where: { id: billId } });
      if (!bill) throw new NotFoundException(`Bill ${billId} not found`);

      if (dto.idempotencyKey) {
        const existingPayment = await tx.payment.findUnique({
          where: { idempotencyKey: dto.idempotencyKey },
        });

        if (existingPayment) {
          if (existingPayment.billId !== billId) {
            throw new ConflictException(
              'This payment idempotency key is already associated with a different bill',
            );
          }

          if (
            parseFloat(existingPayment.amount.toString()) !== dto.amount ||
            existingPayment.paymentMode !== dto.paymentMode ||
            (existingPayment.transactionRef ?? null) !==
              (dto.transactionRef ?? null)
          ) {
            throw new ConflictException(
              'This payment idempotency key was already used with different payment details',
            );
          }

          return tx.bill.findUnique({
            where: { id: billId },
            include: BILL_INCLUDE,
          });
        }
      }

      if (
        ![BillStatus.FINAL, BillStatus.PARTIALLY_PAID].includes(bill.status)
      ) {
        throw new BadRequestException(
          `Payments can only be added to FINAL or PARTIALLY_PAID bills. Status is ${bill.status}`,
        );
      }

      const dueAmount = parseFloat(bill.dueAmount.toString());
      if (dueAmount <= 0) {
        throw new BadRequestException('Bill is already fully paid');
      }

      if (dto.amount > dueAmount) {
        throw new BadRequestException(
          `Payment amount (${dto.amount}) exceeds due amount (${dueAmount})`,
        );
      }

      try {
        await tx.payment.create({
          data: {
            billId,
            amount: dto.amount,
            paymentMode: dto.paymentMode,
            transactionRef: dto.transactionRef,
            idempotencyKey: dto.idempotencyKey,
            notes: dto.notes,
            processedBy: requestingUserId,
          },
        });
      } catch (error) {
        if (
          dto.idempotencyKey &&
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          const existingPayment = await tx.payment.findUnique({
            where: { idempotencyKey: dto.idempotencyKey },
          });

          if (existingPayment?.billId === billId) {
            return tx.bill.findUnique({
              where: { id: billId },
              include: BILL_INCLUDE,
            });
          }
        }

        throw error;
      }

      const newPaidAmount = parseFloat(bill.paidAmount.toString()) + dto.amount;
      const newDueAmount =
        parseFloat(bill.netAmount.toString()) - newPaidAmount;

      // Precision issues might cause 0.00000001 due amounts, so round/check threshold
      const isFullyPaid = newDueAmount < 0.01;
      const newStatus = isFullyPaid
        ? BillStatus.PAID
        : BillStatus.PARTIALLY_PAID;

      const updated = await tx.bill.update({
        where: { id: billId },
        data: {
          paidAmount: newPaidAmount,
          dueAmount: isFullyPaid ? 0 : newDueAmount,
          status: newStatus,
        },
        include: BILL_INCLUDE,
      });

      // Compliance: Audit trail for payment events
      await tx.auditLog.create({
        data: {
          entity: 'Bill',
          entityId: billId,
          action: 'PAYMENT',
          oldValue: bill.status,
          newValue: newStatus,
          userId: requestingUserId ?? null,
        },
      });

      // Dispatch FinancialClearanceGranted when bill is fully paid
      // LabsService will listen and advance PENDING_CLEARANCE orders to AWAITING_SAMPLE
      if (isFullyPaid) {
        const lineItems = await tx.billItem.findMany({
          where: { billId },
          select: { id: true, serviceId: true },
        });
        await tx.outboxEvent.create({
          data: {
            aggregateType: 'Bill',
            aggregateId: billId,
            eventType: 'FinancialClearanceGranted',
            payload: {
              billId,
              opVisitId: bill.opVisitId,
              patientId: bill.patientId,
              clearedLineItemIds: lineItems.map((i: any) => i.id),
            },
          },
        });
      }

      return updated;
    });
  }

  // ─── Cancel Bill ────────────────────────────────────────────────────────────
  async cancelBill(id: string, userId?: string) {
    return prisma.$transaction(async (tx: any) => {
      const bill = await tx.bill.findUnique({
        where: { id },
        include: { _count: { select: { payments: true } } },
      });
      if (!bill) throw new NotFoundException(`Bill ${id} not found`);
      if (bill.status === BillStatus.CANCELLED) {
        throw new BadRequestException('Bill is already cancelled');
      }
      if (bill._count.payments > 0) {
        throw new BadRequestException(
          'Cannot cancel a bill that has payments. Void the payments first/Issue refunds.',
        );
      }

      const updated = await tx.bill.update({
        where: { id },
        data: { status: BillStatus.CANCELLED },
        include: BILL_INCLUDE,
      });

      // Compliance: Audit trail for cancellation
      await tx.auditLog.create({
        data: {
          entity: 'Bill',
          entityId: id,
          action: 'CANCEL',
          oldValue: bill.status,
          newValue: BillStatus.CANCELLED,
          userId: userId ?? null,
        },
      });

      return updated;
    });
  }
}
