const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
async function main() { 
  const p = await prisma.patient.findFirst(); 
  const doc = await prisma.user.findFirst({where: {role: 'DOCTOR'}}); 
  console.log('PATIENT:', p?.id); 
  console.log('DOCTOR:', doc?.id); 
} 
main().catch(console.error).finally(()=>prisma.$disconnect());
