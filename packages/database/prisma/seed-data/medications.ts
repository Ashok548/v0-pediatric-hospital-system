import { PrismaClient } from '@prisma/client';

export async function seedMedications(prisma: PrismaClient) {
  console.log('Seeding Medications...');

  const medications = [
    {
      drugName: 'Amoxicillin',
      genericName: 'Amoxicillin Trihydrate',
      form: 'Suspension',
      strength: '250mg/5ml',
      unit: 'bottles',
      unitPrice: 45.00,
      stockAvailable: 150,
      reorderLevel: 20,
    },
    {
      drugName: 'Paracetamol',
      genericName: 'Acetaminophen',
      form: 'Syrup',
      strength: '120mg/5ml',
      unit: 'bottles',
      unitPrice: 25.00,
      stockAvailable: 300,
      reorderLevel: 50,
    },
    {
      drugName: 'Azithromycin',
      genericName: 'Azithromycin Dihydrate',
      form: 'Suspension',
      strength: '200mg/5ml',
      unit: 'bottles',
      unitPrice: 65.00,
      stockAvailable: 100,
      reorderLevel: 15,
    },
    {
      drugName: 'Cetirizine',
      genericName: 'Cetirizine Hydrochloride',
      form: 'Syrup',
      strength: '5mg/5ml',
      unit: 'bottles',
      unitPrice: 35.00,
      stockAvailable: 80,
      reorderLevel: 10,
    },
    {
      drugName: 'Montelukast',
      genericName: 'Montelukast Sodium',
      form: 'Chewable Tablet',
      strength: '4mg',
      unit: 'tablets',
      unitPrice: 8.00,
      stockAvailable: 500,
      reorderLevel: 100,
    },
    {
      drugName: 'Prednisolone',
      genericName: 'Prednisolone',
      form: 'Syrup',
      strength: '5mg/5ml',
      unit: 'bottles',
      unitPrice: 55.00,
      stockAvailable: 60,
      reorderLevel: 10,
    },
    {
      drugName: 'Ondansetron',
      genericName: 'Ondansetron Hydrochloride',
      form: 'Syrup',
      strength: '4mg/5ml',
      unit: 'bottles',
      unitPrice: 90.00,
      stockAvailable: 40,
      reorderLevel: 5,
    },
    {
      drugName: 'Salbutamol Inhaler',
      genericName: 'Salbutamol Sulphate',
      form: 'MDI',
      strength: '100mcg/puff',
      unit: 'inhalers',
      unitPrice: 120.00,
      stockAvailable: 85,
      reorderLevel: 15,
    },
    {
      drugName: 'Ibuprofen',
      genericName: 'Ibuprofen',
      form: 'Suspension',
      strength: '100mg/5ml',
      unit: 'bottles',
      unitPrice: 30.00,
      stockAvailable: 120,
      reorderLevel: 25,
    },
    {
      drugName: 'Cefixime',
      genericName: 'Cefixime Trihydrate',
      form: 'Suspension',
      strength: '50mg/5ml',
      unit: 'bottles',
      unitPrice: 75.00,
      stockAvailable: 45,
      reorderLevel: 10,
    }
  ];

  let createdCount = 0;
  for (const med of medications) {
    const existingMed = await prisma.medication.findFirst({
      where: {
        drugName: med.drugName,
        form: med.form,
        strength: med.strength,
      },
    });

    if (!existingMed) {
      await prisma.medication.create({
        data: {
          ...med,
          status: 'ACTIVE',
        },
      });
      createdCount++;
    }
  }

  console.log(`Seeded ${createdCount} medications.`);
}
