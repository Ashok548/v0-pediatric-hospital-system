import { PrismaClient } from "../generated/prisma/index.js";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

const ROLES = [
    { name: "ADMIN", description: "System Administrator — full access" },
    { name: "DOCTOR", description: "Physician — can view and manage clinical data" },
    { name: "NURSE", description: "Nursing staff — patient care and vitals" },
    { name: "RECEPTIONIST", description: "Front desk — appointments and admissions" },
    { name: "BILLING", description: "Billing department — invoicing and payments" },
];

const USERS = [
    { name: "System Admin", email: "admin@carenest.com", phone: "9000000001", password: "Admin@1234", roleName: "ADMIN" },
    { name: "Dr. Priya Reddy", email: "doctor@carenest.com", phone: "9000000002", password: "Doctor@1234", roleName: "DOCTOR" },
    { name: "Nurse Anita", email: "nurse@carenest.com", phone: "9000000003", password: "Nurse@1234", roleName: "NURSE" },
    { name: "Reception Desk", email: "reception@carenest.com", phone: "9000000004", password: "Recept@1234", roleName: "RECEPTIONIST" },
    { name: "Billing Staff", email: "billing@carenest.com", phone: "9000000005", password: "Billing@1234", roleName: "BILLING" },
];

async function main() {
    console.log("🌱 Seeding database...");

    // 1. Seed roles
    const roleMap: Record<string, number> = {};
    for (const role of ROLES) {
        const r = await prisma.role.upsert({
            where: { name: role.name },
            update: { description: role.description },
            create: role,
        });
        roleMap[role.name] = r.id;
        console.log(`✅ Role: ${role.name} (id=${r.id})`);
    }

    // 2. Seed users
    for (const user of USERS) {
        const passwordHash = await bcrypt.hash(user.password, SALT_ROUNDS);
        await prisma.user.upsert({
            where: { email: user.email },
            update: {},
            create: {
                name: user.name,
                email: user.email,
                phone: user.phone,
                passwordHash,
                roleId: roleMap[user.roleName],
                status: "ACTIVE",
            },
        });
        console.log(`✅ User: ${user.email} (${user.roleName})`);
    }

    // 3. Seed Departments
    console.log("🏥 Seeding departments...");
    const { seedDepartments } = await import("./seed-data/departments.js");
    const deptMap: Record<string, string> = {};
    for (const dept of seedDepartments) {
        const d = await prisma.department.upsert({
            where: { name: dept.name },
            update: { description: dept.description },
            create: { name: dept.name, description: dept.description, status: "ACTIVE" }
        });
        deptMap[dept.name] = d.id;
        console.log(`✅ Department: ${dept.name}`);
    }

    // 4. Seed Services
    console.log("💉 Seeding services...");
    const { seedServices } = await import("./seed-data/services.js");
    let serviceCount = 0;
    
    for (const service of seedServices) {
        // Generate a simple code if not provided (e.g., first 3 letters of category + index)
        const prefix = service.category.substring(0, 3).toUpperCase();
        const safeName = service.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 5).toUpperCase();
        const code = `${prefix}-${safeName}-${String(Date.now() + serviceCount).slice(-4)}`;
        
        const serviceData = {
            code: code,
            name: service.name,
            category: service.category,
            billingType: service.billingType,
            basePrice: service.basePrice || 0.00,
            taxPercent: 0,
            status: "ACTIVE" as const,
            // Phase 1 Advanced Fields
            careType: (service as any).careType || "BOTH",
            isRecurring: (service as any).isRecurring || false,
            recurrenceUnit: (service as any).recurrenceUnit || null,
            intent: (service as any).intent || "FACILITY_CHARGE",
            autoAddTrigger: (service as any).autoAddTrigger || "NONE",
            isDefault: (service as any).isDefault || false,
            uiGroup: (service as any).uiGroup || "General",
            displayOrder: (service as any).displayOrder || 100,
            autoAddPriority: (service as any).autoAddPriority || 100,
            conflictGroupCode: (service as any).conflictGroupCode || null,
        };

        const dbService = await prisma.service.upsert({
            where: { name_category: { name: service.name, category: service.category } },
            update: {
                ...serviceData,
                departments: {
                    deleteMany: {},
                    create: ((service as any).departmentNames || []).map((deptName: string) => ({
                        department: { connect: { id: deptMap[deptName] } }
                    }))
                }
            },
            create: {
                ...serviceData,
                departments: {
                    create: ((service as any).departmentNames || []).map((deptName: string) => ({
                        department: { connect: { id: deptMap[deptName] } }
                    }))
                }
            },
        });
        serviceCount++;
    }
    console.log(`✅ Seeded ${serviceCount} services.`);

    // 4a. Seed Service Dependencies
    console.log("🔗 Linking service dependencies...");
    
    // Example: Mechanical Ventilator depends on Multiparameter Monitor
    const ventilator = await prisma.service.findFirst({ where: { name: "Mechanical Ventilator", category: "RESPIRATORY" } });
    const monitor = await prisma.service.findFirst({ where: { name: "Multiparameter Monitor", category: "MONITORING" } });

    if (ventilator && monitor) {
        await prisma.serviceDependency.upsert({
            where: {
                serviceId_dependsOnServiceId: {
                    serviceId: ventilator.id,
                    dependsOnServiceId: monitor.id
                }
            },
            update: {},
            create: {
                serviceId: ventilator.id,
                dependsOnServiceId: monitor.id,
                isAutoAdd: true
            }
        });
        console.log(`✅ Linked: Ventilator automatically adds Monitor`);
    }

    // 5. Seed Medications
    console.log("💊 Seeding medications...");
    const { seedMedications } = await import("./seed-data/medications.js");
    await seedMedications(prisma);

    // 6. Seed Lab Master Data
    console.log("🧪 Seeding Lab Master Data...");
    const { labMasterData } = await import("./seed-data/lab-master.js");
    
    // Clear existing to avoid duplicates if needed, or use upsert
    // For profiles and parameters, we'll clear and recreate for simplicity in seed
    await prisma.labTestParameter.deleteMany({});
    await prisma.labTestProfile.deleteMany({});

    for (const profile of labMasterData) {
        await prisma.labTestProfile.create({
            data: {
                panelName: profile.panelName,
                category: profile.category,
                sampleType: profile.sampleType,
                parameters: {
                    create: profile.parameters.map((p, index) => ({
                        parameterName: p.parameterName,
                        unit: p.unit,
                        refDisplay: p.refDisplay,
                        refMin: p.refMin,
                        refMax: p.refMax,
                        displayOrder: index
                    }))
                }
            }
        });
        console.log(`✅ Lab Profile: ${profile.panelName}`);
    }

    console.log("✨ Seed complete.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
