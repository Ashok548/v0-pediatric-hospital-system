/**
 * Seed script: Seeds the hospital's physical bed infrastructure.
 * Mirrors the mock data from apps/web/lib/data/mock-floors.ts.
 *
 * Run with: npx ts-node packages/database/scripts/seed-beds.ts
 */

import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

async function main() {
    console.log("🏥 Seeding hospital bed infrastructure...");

    // ── Floor 1: Ground Floor – Intensive Care ─────────────────────────────────
    const groundFloor = await prisma.floor.upsert({
        where: { floorNumber: 0 },
        update: { name: "Ground Floor – Intensive Care" },
        create: { name: "Ground Floor – Intensive Care", floorNumber: 0 },
    });

    // NICU – 15 beds
    const nicuWard = await prisma.ward.upsert({
        where: { floorId_name: { floorId: groundFloor.id, name: "Neonatal ICU (NICU)" } },
        update: {},
        create: { floorId: groundFloor.id, name: "Neonatal ICU (NICU)", type: "NICU", totalBeds: 15 },
    });
    for (let i = 1; i <= 15; i++) {
        const bedNumber = `N-${String(i).padStart(2, "0")}`;
        await prisma.bed.upsert({
            where: { wardId_bedNumber: { wardId: nicuWard.id, bedNumber } },
            update: {},
            create: { wardId: nicuWard.id, bedNumber, status: "AVAILABLE" },
        });
    }

    // PICU – 10 beds
    const picuWard = await prisma.ward.upsert({
        where: { floorId_name: { floorId: groundFloor.id, name: "Pediatric ICU (PICU)" } },
        update: {},
        create: { floorId: groundFloor.id, name: "Pediatric ICU (PICU)", type: "PICU", totalBeds: 10 },
    });
    for (let i = 1; i <= 10; i++) {
        const bedNumber = `P-${String(i).padStart(2, "0")}`;
        await prisma.bed.upsert({
            where: { wardId_bedNumber: { wardId: picuWard.id, bedNumber } },
            update: {},
            create: { wardId: picuWard.id, bedNumber, status: "AVAILABLE" },
        });
    }

    console.log(`  ✔ Ground Floor: NICU (15 beds) + PICU (10 beds)`);

    // ── Floor 2: 1st Floor – General & Surgical ────────────────────────────────
    const firstFloor = await prisma.floor.upsert({
        where: { floorNumber: 1 },
        update: { name: "1st Floor – General & Surgical" },
        create: { name: "1st Floor – General & Surgical", floorNumber: 1 },
    });

    // General Ward – 20 beds
    const genWard = await prisma.ward.upsert({
        where: { floorId_name: { floorId: firstFloor.id, name: "General Pediatrics" } },
        update: {},
        create: { floorId: firstFloor.id, name: "General Pediatrics", type: "GENERAL", totalBeds: 20 },
    });
    for (let i = 1; i <= 20; i++) {
        const bedNumber = `G-${String(i).padStart(2, "0")}`;
        await prisma.bed.upsert({
            where: { wardId_bedNumber: { wardId: genWard.id, bedNumber } },
            update: {},
            create: { wardId: genWard.id, bedNumber, status: "AVAILABLE" },
        });
    }

    // Surgical Ward – 15 beds
    const surgWard = await prisma.ward.upsert({
        where: { floorId_name: { floorId: firstFloor.id, name: "Pediatric Surgery" } },
        update: {},
        create: { floorId: firstFloor.id, name: "Pediatric Surgery", type: "SURGICAL", totalBeds: 15 },
    });
    for (let i = 1; i <= 15; i++) {
        const bedNumber = `S-${String(i).padStart(2, "0")}`;
        await prisma.bed.upsert({
            where: { wardId_bedNumber: { wardId: surgWard.id, bedNumber } },
            update: {},
            create: { wardId: surgWard.id, bedNumber, status: "AVAILABLE" },
        });
    }

    console.log(`  ✔ 1st Floor: General (20 beds) + Surgical (15 beds)`);

    // ── Floor 3: 2nd Floor – Private Suites ────────────────────────────────────
    const secondFloor = await prisma.floor.upsert({
        where: { floorNumber: 2 },
        update: { name: "2nd Floor – Private Suites" },
        create: { name: "2nd Floor – Private Suites", floorNumber: 2 },
    });

    const privWard = await prisma.ward.upsert({
        where: { floorId_name: { floorId: secondFloor.id, name: "Private Rooms" } },
        update: {},
        create: { floorId: secondFloor.id, name: "Private Rooms", type: "PRIVATE", totalBeds: 12 },
    });
    for (let i = 1; i <= 12; i++) {
        const bedNumber = `R-${String(i).padStart(2, "0")}`;
        await prisma.bed.upsert({
            where: { wardId_bedNumber: { wardId: privWard.id, bedNumber } },
            update: {},
            create: { wardId: privWard.id, bedNumber, status: "AVAILABLE" },
        });
    }

    console.log(`  ✔ 2nd Floor: Private Rooms (12 beds)`);
    console.log("✅ Seed complete: 3 floors, 5 wards, 72 beds");
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
