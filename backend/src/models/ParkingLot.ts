import { Schema, model, type HydratedDocument } from "mongoose";
import { ParkingLotStatus } from "../types/enums.js";

const parkingLotSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    locationDescription: { type: String, default: "" },
    totalCapacity: { type: Number, required: true, min: 0 },
    currentOccupancyEstimate: { type: Number, required: true, min: 0, default: 0 },
    status: {
      type: String,
      enum: Object.values(ParkingLotStatus),
      default: ParkingLotStatus.AVAILABLE,
    },
    countSource: { type: String, default: "GATE_EVENTS" },
    nearlyFullThresholdPct: { type: Number, default: 85 },
    lastReconciledAt: { type: Date },
    anomalyFlag: { type: Boolean, default: false },
    anomalyNote: { type: String, default: "" },
  },
  { timestamps: true },
);

export type ParkingLotDocument = HydratedDocument<{
  name: string;
  code: string;
  locationDescription: string;
  totalCapacity: number;
  currentOccupancyEstimate: number;
  status: ParkingLotStatus;
  countSource: string;
  nearlyFullThresholdPct: number;
  lastReconciledAt?: Date;
  anomalyFlag: boolean;
  anomalyNote: string;
  createdAt: Date;
  updatedAt: Date;
}>;

export const ParkingLot = model("ParkingLot", parkingLotSchema);

export function computeLotStatus(
  capacity: number,
  occupied: number,
  nearlyFullPct = 85,
): ParkingLotStatus {
  if (capacity <= 0) return ParkingLotStatus.UNKNOWN;
  if (occupied >= capacity) return ParkingLotStatus.FULL;
  if ((occupied / capacity) * 100 >= nearlyFullPct) {
    return ParkingLotStatus.NEARLY_FULL;
  }
  return ParkingLotStatus.AVAILABLE;
}

export function toPublicLot(lot: {
  _id: { toString(): string };
  name: string;
  code: string;
  locationDescription: string;
  totalCapacity: number;
  currentOccupancyEstimate: number;
  status: ParkingLotStatus;
  countSource: string;
  lastReconciledAt?: Date | null;
  anomalyFlag: boolean;
  updatedAt: Date;
}) {
  const available = Math.max(0, lot.totalCapacity - lot.currentOccupancyEstimate);
  return {
    id: lot._id.toString(),
    name: lot.name,
    code: lot.code,
    locationDescription: lot.locationDescription,
    totalCapacity: lot.totalCapacity,
    currentOccupancyEstimate: lot.currentOccupancyEstimate,
    availableEstimate: available,
    status: lot.status,
    countSource: lot.countSource,
    estimated: true,
    lastReconciledAt: lot.lastReconciledAt ?? null,
    anomalyFlag: lot.anomalyFlag,
    updatedAt: lot.updatedAt,
  };
}
