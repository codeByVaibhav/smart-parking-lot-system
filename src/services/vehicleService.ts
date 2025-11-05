import { prisma } from '../prisma';
import { VehicleType } from '../types';

export async function upsertVehicle(numberPlate: string, type: VehicleType) {
  return prisma.vehicle.upsert({
    where: { numberPlate },
    update: { type },
    create: { numberPlate, type },
  });
}

export async function getVehicleByNumber(numberPlate: string) {
  return prisma.vehicle.findUnique({ where: { numberPlate } });
}
