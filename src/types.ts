export type VehicleType = 'MOTORCYCLE' | 'CAR' | 'BUS';
export type SpotType = VehicleType;

export interface AllocationResult {
  spotId: string;
  floorId: string;
  spotCode: string;
}
