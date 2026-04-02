import { prisma } from './index.ts';

async function test() {
  try {
    const events = await prisma.outboxEvent.findMany({
      where: {
        status: { in: ['PENDING', 'FAILED'] },
        retryCount: { lt: 3 },
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });
    console.log("Success:", events);
  } catch (e) {
    console.error("Prisma error:", e.message);
  }
}

test();
