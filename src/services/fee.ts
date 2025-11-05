import { config } from '../config';
import { VehicleType } from '../types';

export function calculateFeeCents(
  vehicleType: VehicleType,
  entryTime: Date,
  exitTime: Date
): number {
  const ms = Math.max(0, exitTime.getTime() - entryTime.getTime());
  const hours = Math.ceil(ms / (1000 * 60 * 60)); // round up to next hour
  const rate = config.fee[vehicleType];
  return rate.base + hours * rate.perHour;
}
