import { Router } from 'express';
import { z } from 'zod';
import { upsertVehicle } from '../services/vehicleService';
import { allocateSpotAtomic, releaseSpot } from '../services/allocation';
import { createTicket, closeTicket, getOpenTicketByVehicle, availabilitySummary, adminSummary, getTicketById } from '../services/ticketService';
import { calculateFeeCents } from '../services/fee';
import { VehicleType } from '../types';

const router = Router();

const entrySchema = z.object({
  numberPlate: z.string().min(1),
  vehicleType: z.enum(['MOTORCYCLE', 'CAR', 'BUS']),
});

router.post('/entry', async (req, res, next) => {
  try {
    const { numberPlate, vehicleType } = entrySchema.parse(req.body);

    const vehicle = await upsertVehicle(numberPlate, vehicleType as VehicleType);

    // If there's an open ticket, return conflict
    const open = await getOpenTicketByVehicle(vehicle.id);
    if (open) {
      return res.status(409).json({ error: 'VehicleAlreadyParked', ticketId: open.id });
    }

    const allocation = await allocateSpotAtomic(vehicleType as VehicleType);
    if (!allocation) {
      return res.status(503).json({ error: 'NoSpotAvailable' });
    }

    const ticket = await createTicket(vehicle.id, allocation.spotId);

    return res.status(201).json({
      ticketId: ticket.id,
      vehicle: { id: vehicle.id, numberPlate: vehicle.numberPlate, type: vehicle.type },
      spot: {
        id: ticket.spotId,
        code: ticket.spot.code,
        type: ticket.spot.type,
        floor: { id: ticket.spot.floorId, name: ticket.spot.floor.name, level: ticket.spot.floor.level },
      },
      entryTime: ticket.entryTime,
    });
  } catch (err) {
    next(err);
  }
});

const exitSchema = z.object({
  ticketId: z.string().optional(),
  numberPlate: z.string().optional(),
});

router.post('/exit', async (req, res, next) => {
  try {
    const { ticketId, numberPlate } = exitSchema.parse(req.body);

    let ticket = null as any;
    if (ticketId) {
      ticket = await getTicketById(ticketId);
    }
    if (!ticket && numberPlate) {
      // find vehicle then open ticket
      // join through prisma
      const v = await (await import('../prisma')).prisma.vehicle.findUnique({ where: { numberPlate } });
      if (v) {
        ticket = await getOpenTicketByVehicle(v.id);
      }
    }

    if (!ticket || ticket.closed) {
      return res.status(404).json({ error: 'OpenTicketNotFound' });
    }

    const exitTime = new Date();

    // Calculate fee
    const vehicle = await (await import('../prisma')).prisma.vehicle.findUnique({ where: { id: ticket.vehicleId } });
    if (!vehicle) return res.status(500).json({ error: 'VehicleNotFound' });

    const fee = calculateFeeCents(vehicle.type as VehicleType, ticket.entryTime, exitTime);

    await closeTicket(ticket.id, exitTime, fee);
    await releaseSpot(ticket.spotId);

    return res.json({ ticketId: ticket.id, numberPlate: vehicle.numberPlate, feeCents: fee, exitTime });
  } catch (err) {
    next(err);
  }
});

router.get('/availability', async (_req, res, next) => {
  try {
    const data = await availabilitySummary();
    return res.json({ floors: data });
  } catch (err) {
    next(err);
  }
});

router.get('/summary', async (_req, res, next) => {
  try {
    const data = await adminSummary();
    return res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
