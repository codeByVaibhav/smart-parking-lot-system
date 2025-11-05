import { prisma } from '../prisma';

export async function createTicket(vehicleId: string, spotId: string) {
  return prisma.parkingTicket.create({
    data: { vehicleId, spotId },
    include: { spot: { include: { floor: true } }, vehicle: true },
  });
}

export async function getOpenTicketByVehicle(vehicleId: string) {
  return prisma.parkingTicket.findFirst({
    where: { vehicleId, closed: false },
    orderBy: { entryTime: 'desc' },
  });
}

export async function closeTicket(ticketId: string, exitTime: Date, feeCents: number) {
  return prisma.parkingTicket.update({
    where: { id: ticketId },
    data: { exitTime, feeCents, closed: true },
  });
}

export async function getTicketById(ticketId: string) {
  return prisma.parkingTicket.findUnique({ where: { id: ticketId } });
}

export async function availabilitySummary() {
  const byFloor = await prisma.floor.findMany({
    include: {
      spots: true,
    },
    orderBy: { level: 'asc' },
  });

  return byFloor.map((f: any) => {
    const total = f.spots.length;
    const available = f.spots.filter((s: any) => !s.isOccupied).length;
    const byType = {
      MOTORCYCLE: {
        total: f.spots.filter((s: any) => s.type === 'MOTORCYCLE').length,
        available: f.spots.filter((s: any) => s.type === 'MOTORCYCLE' && !s.isOccupied).length,
      },
      CAR: {
        total: f.spots.filter((s: any) => s.type === 'CAR').length,
        available: f.spots.filter((s: any) => s.type === 'CAR' && !s.isOccupied).length,
      },
      BUS: {
        total: f.spots.filter((s: any) => s.type === 'BUS').length,
        available: f.spots.filter((s: any) => s.type === 'BUS' && !s.isOccupied).length,
      },
    };
    return { floorId: f.id, level: f.level, name: f.name, total, available, byType };
  });
}

export async function adminSummary() {
  const [totalTickets, totalRevenue, openTickets] = await Promise.all([
    prisma.parkingTicket.count(),
    prisma.parkingTicket.aggregate({ _sum: { feeCents: true } }),
    prisma.parkingTicket.count({ where: { closed: false } }),
  ]);
  return {
    totalTickets,
    totalRevenueCents: totalRevenue._sum.feeCents || 0,
    openTickets,
  };
}
