import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const devices = await prisma.dEVICES.findMany({
    include: { actuators: true },
  });

  console.log(`🔍 Found ${devices.length} devices in the database.`);

  for (const device of devices) {
    const hasFan = device.actuators.some((a) => a.type === 'fan');
    if (!hasFan) {
      console.log(`⚙️ Device ${device.name} (${device.Device_ID}) is missing a Fan actuator. Creating one...`);
      const newActuator = await prisma.aCTUATORS.create({
        data: {
          Device_ID: device.Device_ID,
          name: 'Quạt thông gió',
          type: 'fan',
          pin_connection: 25,
        },
      });
      console.log(`✅ Successfully created Fan actuator:`, newActuator);
    } else {
      console.log(`👍 Device ${device.name} already has a Fan actuator.`);
    }
  }

  const allActuators = await prisma.aCTUATORS.findMany();
  console.log('\n--- ALL ACTUATORS AFTER MIGRATION ---');
  console.log(allActuators);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
