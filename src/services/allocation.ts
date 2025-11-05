import { prisma } from '../prisma';
import { VehicleType, AllocationResult } from '../types';

// Map vehicle types to allowed spot types (same or larger)
const allowedSpotOrder: Record<VehicleType, Array<'MOTORCYCLE' | 'CAR' | 'BUS'>> = {
  MOTORCYCLE: ['MOTORCYCLE', 'CAR', 'BUS'],
  CAR: ['CAR', 'BUS'],
  BUS: ['BUS'],
};

export async function allocateSpotAtomic(vehicleType: VehicleType): Promise<AllocationResult | null> {
  const types = allowedSpotOrder[vehicleType];

  // Try by priority, and atomically claim using updateMany with isOccupied=false guard
  for (const t of types) {
    // Find a candidate
    const candidate = await prisma.parkingSpot.findFirst({
      where: { type: t, isOccupied: false },
      orderBy: [{ floor: { level: 'asc' } }, { code: 'asc' }],
      include: { floor: true },
    });

    if (!candidate) continue;

    // Atomically claim
    const updated = await prisma.parkingSpot.updateMany({
      where: { id: candidate.id, isOccupied: false },
      data: { isOccupied: true },
    });

    if (updated.count === 1) {
      return { spotId: candidate.id, floorId: candidate.floorId, spotCode: candidate.code };
    }

    // else: race lost; retry next
  }

  return null;
}

export async function releaseSpot(spotId: string): Promise<void> {
  await prisma.parkingSpot.update({ where: { id: spotId }, data: { isOccupied: false } });
}
