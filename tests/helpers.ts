import { prisma } from '../src/prisma';

export async function resetDb() {
  // Order matters due to FKs
  await prisma.parkingTicket.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.parkingSpot.updateMany({ data: { isOccupied: false } });
}
