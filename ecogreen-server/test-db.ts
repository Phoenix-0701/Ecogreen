import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const readingsCount = await prisma.sENSOR_READINGS.groupBy({
    by: ['Sensor_ID'],
    _count: {
      Sensor_ID: true
    }
  });
  console.log('Readings Count by Sensor ID:', JSON.stringify(readingsCount, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
