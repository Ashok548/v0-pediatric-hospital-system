import { Gender, PrismaClient, WardType } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

const FLOOR_DEFINITIONS = [
  {
    floorNumber: 1,
    name: 'Floor 1 - Critical Care',
    wards: [
      { name: 'NICU A', type: WardType.NICU, totalBeds: 12, prefix: 'NICU-A' },
      { name: 'PICU 1', type: WardType.PICU, totalBeds: 10, prefix: 'PICU-1' },
    ],
  },
  {
    floorNumber: 2,
    name: 'Floor 2 - Neonatal Care',
    wards: [
      { name: 'NICU B', type: WardType.NICU, totalBeds: 12, prefix: 'NICU-B' },
    ],
  },
  {
    floorNumber: 3,
    name: 'Floor 3 - Surgical Care',
    wards: [
      { name: 'Surgical Ward 1', type: WardType.SURGICAL, totalBeds: 20, prefix: 'SURG-1' },
    ],
  },
] as const;

const FIRST_NAMES = [
  'Aarav', 'Aadhya', 'Aanya', 'Advik', 'Anaya', 'Arjun', 'Diya', 'Ishaan', 'Kiara', 'Mihir',
  'Myra', 'Navya', 'Nivaan', 'Prisha', 'Rhea', 'Reyansh', 'Ruhi', 'Sai', 'Saanvi', 'Vihaan',
];

const LAST_NAMES = [
  'Reddy', 'Sharma', 'Patel', 'Rao', 'Kumar', 'Singh', 'Gupta', 'Nair', 'Iyer', 'Verma',
  'Mehta', 'Joshi', 'Das', 'Pillai', 'Kapoor', 'Jain', 'Bansal', 'Mishra', 'Yadav', 'Chopra',
];

const GUARDIAN_RELATIONSHIPS = ['Mother', 'Father', 'Grandmother', 'Grandfather', 'Guardian'] as const;
const CITIES = ['Hyderabad', 'Secunderabad', 'Warangal', 'Vijayawada', 'Visakhapatnam'] as const;
const STATES = ['Telangana', 'Andhra Pradesh'] as const;
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

function padNumber(value: number, width: number) {
  return value.toString().padStart(width, '0');
}

function createPatientDateOfBirth(index: number, total: number) {
  const referenceDate = new Date(2026, 3, 3); // Today's date for age calculation
  const percentage = (index / total) * 100;
  
  let ageInYears = 0;
  
  if (percentage < 30) {
    // 30% Newborns (0-11 months)
    const monthsOld = index % 12;
    const dob = new Date(referenceDate);
    dob.setMonth(dob.getMonth() - monthsOld);
    dob.setDate((index % 28) + 1);
    return dob;
  } else if (percentage < 60) {
    // 30% Age 2
    ageInYears = 2;
  } else {
    // 40% Gradually increasing 3-12 years
    // Map percentage [60, 100] to age [3, 12]
    const rangeProgress = (percentage - 60) / 40; // 0 to 1
    ageInYears = 3 + Math.floor(rangeProgress * 10); // 3 to 12
  }

  const dob = new Date(referenceDate);
  dob.setFullYear(dob.getFullYear() - ageInYears);
  dob.setMonth(index % 12);
  dob.setDate((index % 28) + 1);
  return dob;
}

function createBirthWeight(index: number, total: number) {
  const percentage = (index / total) * 100;
  
  // All newborns (30%) and some older kids get birth weights for data consistency
  if (percentage < 30 || index % 10 === 0) {
    return Number((1.8 + (index % 20) * 0.13).toFixed(2));
  }
  return null;
}

function createPatient(index: number, total: number) {
  const percentage = (index / total) * 100;
  const isNewborn = percentage < 30;

  const firstName = FIRST_NAMES[index % FIRST_NAMES.length];
  const lastName = LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length];
  
  // Guardian details
  const guardianFirst = FIRST_NAMES[(index + 7) % FIRST_NAMES.length];
  const guardianLast = LAST_NAMES[(index + 11) % LAST_NAMES.length];
  const guardianName = `${guardianFirst} ${guardianLast}`;
  const guardianRelationship = isNewborn ? 'Mother' : GUARDIAN_RELATIONSHIPS[index % GUARDIAN_RELATIONSHIPS.length];

  // Newborn naming convention: B/O [Mother's Name]
  const finalFirstName = isNewborn ? `B/O ${guardianName}` : firstName;

  return {
    uhid: `UHID${padNumber(index + 1, 6)}`,
    firstName: finalFirstName,
    lastName,
    gender: [Gender.MALE, Gender.FEMALE, Gender.OTHER][index % 3],
    dateOfBirth: createPatientDateOfBirth(index, total),
    bloodGroup: BLOOD_GROUPS[index % BLOOD_GROUPS.length],
    phone: `800${padNumber(index + 1, 7)}`,
    email: `patient${index + 1}@seed.local`,
    guardianName,
    guardianPhone: `810${padNumber(index + 1, 7)}`,
    guardianRelationship,
    birthWeight: createBirthWeight(index, total),
    address: `${(index % 250) + 1} Seed Street, Block ${(index % 12) + 1}`,
    city: CITIES[index % CITIES.length],
    state: STATES[index % STATES.length],
    pincode: `50${padNumber((index % 9000) + 1000, 4)}`,
    status: 'ACTIVE' as const,
  };
}

async function seedFloorsAndWards() {
  for (const floorDefinition of FLOOR_DEFINITIONS) {
    const floor = await prisma.floor.upsert({
      where: { floorNumber: floorDefinition.floorNumber },
      update: {
        name: floorDefinition.name,
        status: 'ACTIVE',
      },
      create: {
        floorNumber: floorDefinition.floorNumber,
        name: floorDefinition.name,
        status: 'ACTIVE',
      },
    });

    for (const wardDefinition of floorDefinition.wards) {
      const ward = await prisma.ward.upsert({
        where: {
          floorId_name: {
            floorId: floor.id,
            name: wardDefinition.name,
          },
        },
        update: {
          type: wardDefinition.type,
          totalBeds: wardDefinition.totalBeds,
          status: 'ACTIVE',
        },
        create: {
          floorId: floor.id,
          name: wardDefinition.name,
          type: wardDefinition.type,
          totalBeds: wardDefinition.totalBeds,
          status: 'ACTIVE',
        },
      });

      const bedRows = Array.from({ length: wardDefinition.totalBeds }, (_, index) => ({
        wardId: ward.id,
        bedNumber: `${wardDefinition.prefix}-${padNumber(index + 1, 2)}`,
        status: 'AVAILABLE' as const,
      }));

      await prisma.bed.createMany({
        data: bedRows,
        skipDuplicates: true,
      });

      console.log(`Seeded ward ${ward.name} with ${wardDefinition.totalBeds} beds`);
    }
  }
}

async function seedPatients(totalPatients: number) {
  console.log('Cleaning existing patients...');
  await prisma.patient.deleteMany({});
  
  console.log(`Generating ${totalPatients} patients...`);
  const patientRows = Array.from({ length: totalPatients }, (_, index) => createPatient(index, totalPatients));

  const result = await prisma.patient.createMany({
    data: patientRows,
    skipDuplicates: true,
  });

  console.log(`Successfully seeded ${result.count} patients.`);
}

async function main() {
  console.log('Seeding test data...');
  await seedFloorsAndWards();
  await seedPatients(1000);
  console.log('Test data seed complete.');
}

main()
  .catch((error) => {
    console.error('Test data seed failed.');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });