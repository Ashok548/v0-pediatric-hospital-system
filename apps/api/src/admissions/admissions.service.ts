import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from "@nestjs/common";
import { Prisma, prisma } from "@carenest/database";
import { OpenRouterService } from "../services/openRouterService";
import {
    buildDischargeSummaryPrompt,
    type DischargeSummaryContext,
} from "./discharge-summary-prompt";

// ─── Type aliases (pre-generation safe — string constants instead of enum refs) ─
type AdmissionStatusType = "DRAFT" | "BED_ASSIGNED" | "ADMITTED" | "DISCHARGED" | "CANCELLED";

// ─── Reusable Include Projection ───────────────────────────────────────────────
const ADMISSION_INCLUDE = {
    patient: {
        select: {
            id: true, uhid: true, firstName: true, lastName: true,
            dateOfBirth: true, gender: true, phone: true, guardianName: true,
        },
    },
    currentBed: {
        include: {
            ward: {
                select: {
                    id: true, name: true, type: true,
                    floor: { select: { id: true, name: true } },
                },
            },
        },
    },
    admittingDoctor: { select: { id: true, name: true } },
    transfers: {
        orderBy: { transferDate: "desc" as const },
        include: {
            fromBed: { select: { id: true, bedNumber: true } },
            toBed: { select: { id: true, bedNumber: true } },
        },
    },
    vitalsRecords: {
        take: 1,
        orderBy: { recordedAt: "desc" as const },
    },
} as const;

const DISCHARGE_SUMMARY_INCLUDE = {
    patient: {
        select: {
            uhid: true,
            firstName: true,
            lastName: true,
            gender: true,
            dateOfBirth: true,
            bloodGroup: true,
            guardianName: true,
            guardianPhone: true,
            allergies: true,
            birthWeight: true,
        },
    },
    admittingDoctor: { select: { name: true } },
    currentBed: {
        select: {
            bedNumber: true,
            ward: {
                select: {
                    name: true,
                    type: true,
                    floor: { select: { name: true } },
                },
            },
        },
    },
    transfers: {
        orderBy: { transferDate: "desc" as const },
        take: 20,
        include: {
            fromBed: { select: { bedNumber: true } },
            toBed: { select: { bedNumber: true } },
        },
    },
    vitalsRecords: {
        orderBy: { recordedAt: "desc" as const },
        take: 10,
    },
    nursingNotes: {
        orderBy: { recordedAt: "desc" as const },
        take: 20,
    },
    ioRecords: {
        orderBy: { recordedAt: "desc" as const },
        take: 40,
    },
    consultations: {
        orderBy: { createdAt: "desc" as const },
        take: 20,
        include: {
            doctor: { select: { name: true } },
        },
    },
    prescriptions: {
        orderBy: { orderedAt: "desc" as const },
        take: 20,
        include: {
            doctor: { select: { name: true } },
            items: {
                include: {
                    medication: {
                        select: {
                            drugName: true,
                            genericName: true,
                            form: true,
                            strength: true,
                        },
                    },
                },
            },
        },
    },
    labOrders: {
        orderBy: { orderDate: "desc" as const },
        take: 15,
        include: {
            doctor: { select: { name: true } },
            panels: {
                include: {
                    items: {
                        select: {
                            parameterName: true,
                            value: true,
                            unit: true,
                            refDisplay: true,
                            refMin: true,
                            refMax: true,
                        },
                    },
                },
            },
        },
    },
    serviceOrders: {
        orderBy: { orderDate: "desc" as const },
        take: 20,
        include: {
            service: { select: { name: true, code: true } },
            doctor: { select: { name: true } },
        },
    },
    bills: {
        orderBy: { createdAt: "desc" as const },
        take: 5,
        select: {
            billNumber: true,
            status: true,
            totalAmount: true,
            paidAmount: true,
            dueAmount: true,
            createdAt: true,
        },
    },
} as const;

type DischargeSummaryAdmission = Prisma.AdmissionGetPayload<{
    include: typeof DISCHARGE_SUMMARY_INCLUDE;
}>;

import {
    CreateAdmissionDto,
    BedTransferDto,
    DischargeClearanceDto,
    FinalizeDischargeDto,
    QueryAdmissionsDto,
} from "./dto/admissions.dto";

@Injectable()
export class AdmissionsService {
    constructor(private readonly openRouterService: OpenRouterService) { }

    // ─── Atomic Bill Number Generator (shared with auto-bill creation) ────────
    private async generateBillNumber(tx: any): Promise<string> {
        const year = new Date().getFullYear();

        const updated = await tx.$executeRaw`
            UPDATE bill_sequences
            SET last_value = last_value + 1, updated_at = NOW()
            WHERE id = 1 AND year = ${year}
        `;

        if (updated === 0) {
            await tx.billSequence.upsert({
                where: { id_year: { id: 1, year } },
                update: { year, lastValue: 1 },
                create: { id: 1, year, lastValue: 1 },
            });
        }

        const seq = await tx.billSequence.findUnique({
            where: { id_year: { id: 1, year } },
        });

        return `BILL-${year}-${String(seq!.lastValue).padStart(6, "0")}`;
    }

    // Auto-create one draft bill per admission if it doesn't exist already.
    private async createDraftBillForAdmission(tx: any, patientId: string, admissionId: string) {
        const existingBill = await tx.bill.findFirst({
            where: { admissionId },
            select: { id: true },
        });

        if (existingBill) {
            return;
        }

        const billNumber = await this.generateBillNumber(tx);

        await tx.bill.create({
            data: {
                billNumber,
                patientId,
                admissionId,
                status: "DRAFT" as any,
                totalAmount: 0,
                discountAmount: 0,
                taxAmount: 0,
                netAmount: 0,
                paidAmount: 0,
                dueAmount: 0,
                notes: "Auto-created on admission",
            },
        });
    }

    // ─── Atomic Admission Number Generator ─────────────────────────────────────
    private async generateAdmissionNumber(): Promise<string> {
        const year = new Date().getFullYear();

        const updated = await prisma.$executeRaw`
            UPDATE admission_sequences
            SET last_value = last_value + 1, updated_at = NOW()
            WHERE id = 1 AND year = ${year}
        `;

        if (updated === 0) {
            await prisma.admissionSequence.upsert({
                where: { id_year: { id: 1, year } },
                update: { year, lastValue: 1 },
                create: { id: 1, year, lastValue: 1 },
            });
        }

        const seq = await prisma.admissionSequence.findUnique({
            where: { id_year: { id: 1, year } },
        });

        return `ADM-${year}-${String(seq!.lastValue).padStart(6, "0")}`;
    }

    // ─── Create Admission ───────────────────────────────────────────────────────
    async create(dto: CreateAdmissionDto, requestingUserId?: string) {
        const patient = await prisma.patient.findUnique({ where: { id: dto.patientId } });
        if (!patient) throw new NotFoundException(`Patient ${dto.patientId} not found`);

        // Prevent duplicate active admissions
        const existing = await prisma.admission.findFirst({
            where: {
                patientId: dto.patientId,
                status: { in: ["ADMITTED", "BED_ASSIGNED", "DRAFT"] as AdmissionStatusType[] },
            },
        });
        if (existing) {
            throw new ConflictException(
                `Patient already has an active admission (${existing.admissionNumber})`
            );
        }

        if (dto.bedId) return this.createWithBed(dto);

        const admissionNumber = await this.generateAdmissionNumber();
        return prisma.$transaction(async (tx: any) => {
            const admission = await tx.admission.create({
                data: {
                    admissionNumber,
                    patientId: dto.patientId,
                    admissionType: dto.admissionType as any,
                    priority: (dto.priority ?? "NORMAL") as any,
                    department: dto.department,
                    admittingDoctorId: dto.admittingDoctorId ?? null,
                    admissionDate: new Date(dto.admissionDate),
                    expectedDischarge: dto.expectedDischarge ? new Date(dto.expectedDischarge) : null,
                    initialDiagnosis: dto.initialDiagnosis ?? null,
                    gestationalAge: dto.gestationalAge ?? null,
                    nicuRiskLevel: dto.nicuRiskLevel ?? null,
                    status: "DRAFT" as any,
                },
                include: ADMISSION_INCLUDE,
            });

            await this.createDraftBillForAdmission(tx, dto.patientId, admission.id);
            return admission;
        });
    }

    // ─── Create With Atomic Bed Assignment (concurrency safe) ──────────────────
    private async createWithBed(dto: CreateAdmissionDto) {
        const admissionNumber = await this.generateAdmissionNumber();

        return prisma.$transaction(async (tx: any) => {
            // Re-fetch inside transaction = optimistic lock
            const bed = await tx.bed.findUnique({ where: { id: dto.bedId } });
            if (!bed) throw new NotFoundException(`Bed ${dto.bedId} not found`);
            if (bed.status !== "AVAILABLE") {
                throw new ConflictException(
                    `Bed ${bed.bedNumber} is no longer available (status: ${bed.status}). Please select another.`
                );
            }

            await tx.bed.update({ where: { id: dto.bedId }, data: { status: "OCCUPIED" } });

            const admission = await tx.admission.create({
                data: {
                    admissionNumber,
                    patientId: dto.patientId,
                    admissionType: dto.admissionType,
                    priority: dto.priority ?? "NORMAL",
                    department: dto.department,
                    admittingDoctorId: dto.admittingDoctorId ?? null,
                    admissionDate: new Date(dto.admissionDate),
                    expectedDischarge: dto.expectedDischarge ? new Date(dto.expectedDischarge) : null,
                    initialDiagnosis: dto.initialDiagnosis ?? null,
                    gestationalAge: dto.gestationalAge ?? null,
                    nicuRiskLevel: dto.nicuRiskLevel ?? null,
                    status: "ADMITTED",
                    currentBedId: dto.bedId,
                    transfers: {
                        create: { fromBedId: null, toBedId: dto.bedId!, reason: "Initial admission" },
                    },
                },
                include: ADMISSION_INCLUDE,
            });

            await this.createDraftBillForAdmission(tx, dto.patientId, admission.id);
            return admission;
        });
    }

    // ─── List (paginated + filtered) ────────────────────────────────────────────
    async findAll(query: QueryAdmissionsDto) {
        const page = Number(query.page ?? 1);
        const limit = Number(query.limit ?? 10);
        const skip = (page - 1) * limit;

        const where: any = {};
        if (query.status) where.status = query.status;
        if (query.department) where.department = query.department;
        if (query.patientId) where.patientId = query.patientId;
        if (query.search) {
            where.OR = [
                { admissionNumber: { contains: query.search, mode: "insensitive" } },
                { patient: { firstName: { contains: query.search, mode: "insensitive" } } },
                { patient: { lastName: { contains: query.search, mode: "insensitive" } } },
                { patient: { uhid: { contains: query.search, mode: "insensitive" } } },
            ];
        }

        const [data, total] = await prisma.$transaction([
            prisma.admission.findMany({
                where, skip, take: limit,
                orderBy: { admissionDate: "desc" },
                include: ADMISSION_INCLUDE,
            }),
            prisma.admission.count({ where }),
        ]);

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    // ─── Get One ────────────────────────────────────────────────────────────────
    async findOne(id: string) {
        const admission = await prisma.admission.findUnique({
            where: { id }, include: ADMISSION_INCLUDE,
        });
        if (!admission) throw new NotFoundException(`Admission ${id} not found`);
        return admission;
    }

    // ─── Patient Admission History ──────────────────────────────────────────────
    async findByPatient(patientId: string) {
        const patient = await prisma.patient.findUnique({ where: { id: patientId } });
        if (!patient) throw new NotFoundException(`Patient ${patientId} not found`);
        return prisma.admission.findMany({
            where: { patientId },
            orderBy: { admissionDate: "desc" },
            include: ADMISSION_INCLUDE,
        });
    }

    // ─── Bed Transfer ───────────────────────────────────────────────────────────
    async transferBed(id: string, dto: BedTransferDto, requestingUserId?: string) {
        return prisma.$transaction(async (tx: any) => {
            const admission = await tx.admission.findUnique({ where: { id } });
            if (!admission) throw new NotFoundException(`Admission ${id} not found`);
            if (admission.status !== "ADMITTED") {
                throw new BadRequestException("Can only transfer beds for actively admitted patients");
            }

            // Fetch new bed with ward so we can derive the target department
            const newBed = await tx.bed.findUnique({
                where: { id: dto.toBedId },
                include: { ward: true },
            });
            if (!newBed) throw new NotFoundException(`Bed ${dto.toBedId} not found`);
            if (newBed.status !== "AVAILABLE") {
                throw new ConflictException(`Bed ${newBed.bedNumber} is not available (${newBed.status})`);
            }

            // Department is derived from the target ward's type (e.g. "NICU", "GENERAL")
            const fromDepartment: string | null = admission.department ?? null;
            const toDepartment: string = newBed.ward.type;

            // Cross-department transfers require an explicit reason
            if (fromDepartment && fromDepartment !== toDepartment && !dto.reason?.trim()) {
                throw new BadRequestException(
                    `A reason is required when transferring between departments (${fromDepartment} → ${toDepartment})`
                );
            }

            const oldBedId = admission.currentBedId;
            if (oldBedId) {
                await tx.bed.update({ where: { id: oldBedId }, data: { status: "CLEANING" } });
                const deptNote =
                    fromDepartment && fromDepartment !== toDepartment
                        ? ` (department change: ${fromDepartment} → ${toDepartment})`
                        : "";
                await tx.bedActivityLog.create({
                    data: {
                        bedId: oldBedId,
                        action: "MARKED_CLEANING",
                        notes: `Patient transferred to bed ${newBed.bedNumber}${deptNote}`,
                        performedBy: requestingUserId ?? null,
                    },
                });
            }

            await tx.bed.update({ where: { id: dto.toBedId }, data: { status: "OCCUPIED" } });

            return tx.admission.update({
                where: { id },
                data: {
                    currentBedId: dto.toBedId,
                    // Sync the admission's department to reflect the new ward type
                    department: toDepartment,
                    transfers: {
                        create: {
                            fromBedId: oldBedId ?? null,
                            toBedId: dto.toBedId,
                            fromDepartment,
                            toDepartment,
                            reason: dto.reason ?? null,
                            transferredBy: requestingUserId ?? null,
                        },
                    },
                },
                include: ADMISSION_INCLUDE,
            });
        });
    }

    // ─── Discharge Clearance ────────────────────────────────────────────────────
    async updateDischargeClearance(id: string, dto: DischargeClearanceDto, requestingUserId?: string) {
        const admission = await this.findOne(id);
        if (admission.status === "DISCHARGED") {
            throw new BadRequestException("Patient is already discharged");
        }

        const now = new Date();
        const update: any = { dischargeStatus: "IN_PROGRESS" };

        if (dto.step === "clinical") {
            Object.assign(update, {
                clinicalCleared: true, clinicalNote: dto.note ?? null,
                clinicalClearedAt: now, clinicalClearedBy: requestingUserId ?? null,
            });
        } else if (dto.step === "pharmacy") {
            Object.assign(update, {
                pharmacyCleared: true,
                pharmacyClearedAt: now, pharmacyClearedBy: requestingUserId ?? null,
            });
        } else if (dto.step === "billing") {
            Object.assign(update, {
                billingCleared: true,
                billingClearedAt: now, billingClearedBy: requestingUserId ?? null,
            });
        }

        return prisma.admission.update({ where: { id }, data: update, include: ADMISSION_INCLUDE });
    }

    // ─── Generate AI Discharge Summary ────────────────────────────────────────
    async generateDischargeSummary(id: string, dischargeType?: string) {
        const admission = await this.collectDischargeSummaryData(id);

        if (admission.status !== "ADMITTED") {
            throw new BadRequestException("Discharge summary can only be generated for active admissions");
        }

        if (!admission.clinicalCleared) {
            throw new BadRequestException("Clinical clearance pending");
        }

        const context = this.toDischargeSummaryContext(admission);
        // Override with the doctor's current selection (not yet persisted to DB)
        if (dischargeType) {
            context.admission.dischargeType = dischargeType;
        }
        const { systemPrompt, userPrompt } = buildDischargeSummaryPrompt(context);
        const summary = await this.openRouterService.generateDischargeSummary(systemPrompt, userPrompt);
        return { summary };
    }

    // ─── Finalize Discharge ─────────────────────────────────────────────────────
    async finalizeDischarge(id: string, dto: FinalizeDischargeDto, requestingUserId?: string) {
        return prisma.$transaction(async (tx: any) => {
            const admission = await tx.admission.findUnique({ where: { id } });
            if (!admission) throw new NotFoundException(`Admission ${id} not found`);
            if (!admission.clinicalCleared) throw new BadRequestException("Clinical clearance pending");
            if (!admission.pharmacyCleared) throw new BadRequestException("Pharmacy clearance pending");
            if (!admission.billingCleared) throw new BadRequestException("Billing clearance pending");

            if (admission.currentBedId) {
                await tx.bed.update({ where: { id: admission.currentBedId }, data: { status: "CLEANING" } });
                await tx.bedActivityLog.create({
                    data: {
                        bedId: admission.currentBedId,
                        action: "MARKED_CLEANING",
                        notes: `Patient discharged (${dto.dischargeType})`,
                        performedBy: requestingUserId ?? null,
                    },
                });
                await tx.bedTransfer.create({
                    data: {
                        admissionId: id,
                        fromBedId: admission.currentBedId,
                        toBedId: null,
                        reason: `Discharge: ${dto.dischargeType}`,
                        transferredBy: requestingUserId ?? null,
                    },
                });
            }

            return tx.admission.update({
                where: { id },
                data: {
                    status: "DISCHARGED",
                    dischargeStatus: "COMPLETED",
                    dischargeType: dto.dischargeType,
                    dischargeSummary: dto.dischargeSummary ?? null,
                    dischargeDate: new Date(),
                    currentBedId: null,
                },
                include: ADMISSION_INCLUDE,
            });
        });
    }

    private async collectDischargeSummaryData(id: string): Promise<DischargeSummaryAdmission> {
        const admission = await prisma.admission.findUnique({
            where: { id },
            include: DISCHARGE_SUMMARY_INCLUDE,
        });

        if (!admission) {
            throw new NotFoundException(`Admission ${id} not found`);
        }

        return admission;
    }

    private toDischargeSummaryContext(admission: DischargeSummaryAdmission): DischargeSummaryContext {
        return {
            patient: {
                uhid: admission.patient.uhid,
                fullName: `${admission.patient.firstName} ${admission.patient.lastName}`.trim(),
                gender: admission.patient.gender,
                dateOfBirth: admission.patient.dateOfBirth.toISOString(),
                bloodGroup: admission.patient.bloodGroup,
                guardianName: admission.patient.guardianName,
                guardianPhone: admission.patient.guardianPhone,
                allergies: admission.patient.allergies,
                birthWeight: this.toText(admission.patient.birthWeight),
            },
            admission: {
                admissionNumber: admission.admissionNumber,
                admissionDate: admission.admissionDate.toISOString(),
                department: admission.department,
                admissionType: admission.admissionType,
                priority: admission.priority,
                status: admission.status,
                initialDiagnosis: admission.initialDiagnosis,
                clinicalNote: admission.clinicalNote,
                dischargeType: admission.dischargeType,
                gestationalAge: admission.gestationalAge,
                nicuRiskLevel: admission.nicuRiskLevel,
                admittingDoctorName: admission.admittingDoctor?.name ?? null,
                currentBed: admission.currentBed
                    ? {
                        bedNumber: admission.currentBed.bedNumber,
                        wardName: admission.currentBed.ward.name,
                        wardType: admission.currentBed.ward.type,
                        floorName: admission.currentBed.ward.floor.name,
                    }
                    : null,
            },
            transfers: admission.transfers.map((transfer) => ({
                transferDate: transfer.transferDate.toISOString(),
                reason: transfer.reason,
                fromBed: transfer.fromBed?.bedNumber ?? null,
                toBed: transfer.toBed?.bedNumber ?? null,
            })),
            vitals: admission.vitalsRecords.map((vital) => ({
                recordedAt: vital.recordedAt.toISOString(),
                heartRate: vital.heartRate,
                spo2: vital.spo2,
                temperature: this.toText(vital.temperature),
                respRate: vital.respRate,
                bpSystolic: vital.bpSystolic,
                bpDiastolic: vital.bpDiastolic,
                weight: this.toText(vital.weight),
                notes: vital.notes,
                isCritical: vital.isCritical,
                alertMessage: vital.alertMessage,
            })),
            nursingNotes: admission.nursingNotes.map((note) => ({
                recordedAt: note.recordedAt.toISOString(),
                noteType: note.noteType,
                priority: note.priority,
                shiftPeriod: note.shiftPeriod,
                content: note.content,
                recordedBy: note.recordedBy,
            })),
            ioRecords: admission.ioRecords.map((record) => ({
                recordedAt: record.recordedAt.toISOString(),
                ioType: record.ioType,
                route: record.route,
                volumeMl: record.volumeMl,
                notes: record.notes,
                recordedBy: record.recordedBy,
            })),
            consultations: admission.consultations.map((consultation) => ({
                createdAt: consultation.createdAt.toISOString(),
                doctorName: consultation.doctor?.name ?? null,
                chiefComplaint: consultation.chiefComplaint,
                historyOfIllness: consultation.historyOfIllness,
                examinationNotes: consultation.examinationNotes,
                diagnosis: consultation.diagnosis,
                plan: consultation.plan,
            })),
            prescriptions: admission.prescriptions
                .filter((p) => p.status !== 'CANCELLED')
                .map((prescription) => ({
                orderedAt: prescription.orderedAt.toISOString(),
                status: prescription.status,
                doctorName: prescription.doctor?.name ?? null,
                notes: prescription.notes,
                items: prescription.items.map((item) => ({
                    medicationName: item.medication.drugName,
                    genericName: item.medication.genericName,
                    form: item.medication.form,
                    strength: item.medication.strength,
                    dose: item.dose,
                    frequency: item.frequency,
                    duration: item.duration,
                    prescribedQty: item.prescribedQty,
                    dispensedQty: item.dispensedQty,
                    instructions: item.instructions,
                })),
            })),
            labOrders: admission.labOrders
                .filter((order) => order.status === 'COMPLETED' || order.status === 'VERIFIED')
                .map((order) => ({
                orderDate: order.orderDate.toISOString(),
                status: order.status,
                doctorName: order.doctor?.name ?? null,
                panels: order.panels.map((panel) => ({
                    panelName: panel.panelName,
                    category: panel.category,
                    sampleType: panel.sampleType,
                    status: panel.status,
                    collectedAt: panel.collectedAt?.toISOString() ?? null,
                    items: panel.items.map((item) => ({
                        parameterName: item.parameterName,
                        value: item.value,
                        unit: item.unit,
                        refDisplay: item.refDisplay,
                        refMin: item.refMin,
                        refMax: item.refMax,
                    })),
                })),
            })),
            serviceOrders: admission.serviceOrders.map((order) => ({
                orderDate: order.orderDate.toISOString(),
                status: order.status,
                priority: order.priority,
                quantity: order.quantity,
                serviceName: order.service.name,
                serviceCode: order.service.code,
                doctorName: order.doctor?.name ?? null,
                notes: order.notes,
                completedAt: order.completedAt?.toISOString() ?? null,
            })),
            bills: admission.bills.map((bill) => ({
                billNumber: bill.billNumber,
                status: bill.status,
                totalAmount: this.toText(bill.totalAmount) ?? "0",
                paidAmount: this.toText(bill.paidAmount) ?? "0",
                dueAmount: this.toText(bill.dueAmount) ?? "0",
                createdAt: bill.createdAt.toISOString(),
            })),
        };
    }

    private toText(value: unknown): string | null {
        if (value == null) {
            return null;
        }
        return String(value);
    }

    // ─── Cancel ─────────────────────────────────────────────────────────────────
    async cancel(id: string) {
        return prisma.$transaction(async (tx: any) => {
            const admission = await tx.admission.findUnique({ where: { id } });
            if (!admission) throw new NotFoundException(`Admission ${id} not found`);
            if (admission.status === "DISCHARGED") {
                throw new BadRequestException("Cannot cancel a discharged admission");
            }
            if (admission.currentBedId) {
                await tx.bed.update({
                    where: { id: admission.currentBedId }, data: { status: "AVAILABLE" },
                });
            }
            return tx.admission.update({
                where: { id },
                data: { status: "CANCELLED", currentBedId: null },
                include: ADMISSION_INCLUDE,
            });
        });
    }
}
