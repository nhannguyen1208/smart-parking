import { Schema, model, type HydratedDocument } from "mongoose";
import { ParkingZoneStatus } from "../types/enums.js";

const parkingZoneSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    capacity: { type: Number, required: true, min: 1 },
    occupied: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
    status: {
      type: String,
      enum: Object.values(ParkingZoneStatus),
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
  status: ParkingZoneStatus;
  createdAt: Date;
  updatedAt: Date;
}>;

export const ParkingZone = model("ParkingZone", parkingZoneSchema);

export function computeZoneStatus(
  capacity: number,
  occupied: number,
): ParkingZoneStatus {
  if (occupied >= capacity) {
    return ParkingZoneStatus.FULL;
  }
  if (occupied / capacity >= 0.85) {
    return ParkingZoneStatus.NEAR_FULL;
  }
  return ParkingZoneStatus.AVAILABLE;
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
