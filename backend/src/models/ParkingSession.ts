import { Schema, model, type HydratedDocument, Types } from "mongoose";
import { ParkingSessionStatus } from "../types/enums.js";

const parkingSessionSchema = new Schema(
  {
    vehicleId: { type: Schema.Types.ObjectId, ref: "Vehicle", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    lotId: { type: Schema.Types.ObjectId, ref: "ParkingLot", required: true, index: true },
    entryGateId: { type: Schema.Types.ObjectId, ref: "GateDevice" },
    exitGateId: { type: Schema.Types.ObjectId, ref: "GateDevice" },
    entryAt: { type: Date, required: true },
    exitAt: { type: Date },
    status: {
      type: String,
      enum: Object.values(ParkingSessionStatus),
      default: ParkingSessionStatus.ACTIVE,
      index: true,
    },
    credentialType: { type: String, default: "" },
    entryEventId: { type: String, default: "" },
    exitEventId: { type: String, default: "" },
    feeAmount: { type: Number },
    closeReason: { type: String, default: "" },
  },
  { timestamps: true },
);

parkingSessionSchema.index({ userId: 1, status: 1 });
parkingSessionSchema.index({ vehicleId: 1, status: 1 });

export type ParkingSessionDocument = HydratedDocument<{
  vehicleId: Types.ObjectId;
  userId: Types.ObjectId;
  lotId: Types.ObjectId;
  entryGateId?: Types.ObjectId;
  exitGateId?: Types.ObjectId;
  entryAt: Date;
  exitAt?: Date;
  status: ParkingSessionStatus;
  credentialType: string;
  entryEventId: string;
  exitEventId: string;
  feeAmount?: number;
  closeReason: string;
  createdAt: Date;
  updatedAt: Date;
}>;

export const ParkingSession = model("ParkingSession", parkingSessionSchema);

export function toPublicSession(s: {
  _id: { toString(): string };
  vehicleId: { toString(): string };
  userId: { toString(): string };
  lotId: { toString(): string };
  entryGateId?: { toString(): string } | null;
  exitGateId?: { toString(): string } | null;
  entryAt: Date;
  exitAt?: Date | null;
  status: ParkingSessionStatus;
  credentialType: string;
  feeAmount?: number | null;
  closeReason?: string | null;
}) {
  return {
    id: s._id.toString(),
    vehicleId: s.vehicleId.toString(),
    userId: s.userId.toString(),
    lotId: s.lotId.toString(),
    entryGateId: s.entryGateId?.toString() ?? null,
    exitGateId: s.exitGateId?.toString() ?? null,
    entryAt: s.entryAt,
    exitAt: s.exitAt ?? null,
    status: s.status,
    credentialType: s.credentialType,
    feeAmount: s.feeAmount ?? null,
    closeReason: s.closeReason || null,
  };
}
