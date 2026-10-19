import { Schema, model, type HydratedDocument, Types } from "mongoose";
import { GateDeviceMode } from "../types/enums.js";

const gateDeviceSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    name: { type: String, required: true },
    lotId: { type: Schema.Types.ObjectId, ref: "ParkingLot", required: true, index: true },
    type: { type: String, default: "ENTRY_EXIT" },
    mode: {
      type: String,
      enum: Object.values(GateDeviceMode),
      default: GateDeviceMode.MOCK,
    },
    enabled: { type: Boolean, default: true },
    lastHeartbeatAt: { type: Date },
    firmwareVersion: { type: String, default: "demo-1.0" },
  },
  { timestamps: true },
);

export type GateDeviceDocument = HydratedDocument<{
  code: string;
  name: string;
  lotId: Types.ObjectId;
  type: string;
  mode: GateDeviceMode;
  enabled: boolean;
  lastHeartbeatAt?: Date;
  firmwareVersion: string;
  createdAt: Date;
  updatedAt: Date;
}>;

export const GateDevice = model("GateDevice", gateDeviceSchema);

export function toPublicGate(g: {
  _id: { toString(): string };
  code: string;
  name: string;
  lotId: { toString(): string };
  type: string;
  mode: GateDeviceMode;
  enabled: boolean;
  lastHeartbeatAt?: Date | null;
  firmwareVersion: string;
}) {
  return {
    id: g._id.toString(),
    code: g.code,
    name: g.name,
    lotId: g.lotId.toString(),
    type: g.type,
    mode: g.mode,
    enabled: g.enabled,
    lastHeartbeatAt: g.lastHeartbeatAt ?? null,
    firmwareVersion: g.firmwareVersion,
  };
}
