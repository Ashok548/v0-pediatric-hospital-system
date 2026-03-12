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

    // 3. Seed Services
    console.log("💉 Seeding services...");
    const { seedServices } = await import("./seed-data/services.js");
    let serviceCount = 0;
    
    for (const service of seedServices) {
        // Generate a simple code if not provided (e.g., first 3 letters of category + index)
        const prefix = service.category.substring(0, 3).toUpperCase();
        const code = `${prefix}-${String(serviceCount + 1).padStart(3, '0')}`;
        
        await prisma.service.upsert({
            where: { name_category: { name: service.name, category: service.category } },
            update: { billingType: service.billingType },
            create: {
                code: code,
                name: service.name,
                category: service.category,
                billingType: service.billingType,
                basePrice: 0.00,
                taxPercent: 0,
                status: "ACTIVE",
            },
        });
        serviceCount++;
    }
    console.log(`✅ Seeded ${serviceCount} services.`);

    // 4. Seed Medications
    console.log("💊 Seeding medications...");
    const { seedMedications } = await import("./seed-data/medications.js");
    await seedMedications(prisma);

    console.log("✨ Seed complete.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
