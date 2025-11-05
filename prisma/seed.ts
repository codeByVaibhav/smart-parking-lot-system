import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const floors = [
    { level: 1, name: 'Floor 1' },
    { level: 2, name: 'Floor 2' },
    { level: 3, name: 'Floor 3' },
  ];

  for (const f of floors) {
    const floor = await prisma.floor.upsert({
      where: { level_name: { level: f.level, name: f.name } },
      update: {},
      create: { level: f.level, name: f.name },
    });

    let code = 1;
    const mkSpot = async (type: 'MOTORCYCLE' | 'CAR' | 'BUS', count: number) => {
      for (let i = 0; i < count; i++) {
        const spotCode = `${type[0]}-${String(code).padStart(3, '0')}`;
        await prisma.parkingSpot.upsert({
          where: { floorId_code: { floorId: floor.id, code: spotCode } },
          update: {},
          create: { floorId: floor.id, code: spotCode, type },
        });
        code++;
      }
    };

    await mkSpot('MOTORCYCLE', 10);
    await mkSpot('CAR', 20);
    await mkSpot('BUS', 5);
  }
}

main().then(() => prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
