import { Schema, model, type HydratedDocument } from "mongoose";
import { ParkingLotStatus } from "../types/enums.js";

const parkingZoneSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    capacity: { type: Number, required: true, min: 1 },
    occupied: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
    status: {
      type: String,
      enum: Object.values(ParkingLotStatus),
      required: true,
    },
  },
  { timestamps: true },
);

export type ParkingZoneDocument = HydratedDocument<{
  name: string;
  capacity: number;
  occupied: number;
  isActive: boolean;
  status: ParkingLotStatus;
  createdAt: Date;
  updatedAt: Date;
}>;

export const ParkingZone = model("ParkingZone", parkingZoneSchema);

export function computeZoneStatus(
  capacity: number,
  occupied: number,
): ParkingLotStatus {
  if (occupied >= capacity) {
    return ParkingLotStatus.FULL;
  }
  if (occupied / capacity >= 0.85) {
    return ParkingLotStatus.NEARLY_FULL;
  }
  return ParkingLotStatus.AVAILABLE;
}

export function toPublicZone(zone: ParkingZoneDocument) {
  const available = Math.max(0, zone.capacity - zone.occupied);
  const status = computeZoneStatus(zone.capacity, zone.occupied);

  return {
    id: zone._id.toString(),
    name: zone.name,
    capacity: zone.capacity,
    occupied: zone.occupied,
    available,
    isActive: zone.isActive,
    status,
    createdAt: zone.createdAt,
    updatedAt: zone.updatedAt,
  };
}

export function getOccupancyLabel(occupancyPercent: number) {
  if (occupancyPercent >= 90) return "Nearly full";
  if (occupancyPercent >= 75) return "Busy";
  if (occupancyPercent >= 50) return "Moderately busy";
  return "Low occupancy";
}
