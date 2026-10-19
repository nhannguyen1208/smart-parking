import { Schema, model, type HydratedDocument, Types } from "mongoose";
import { GateEventSource, GateEventType } from "../types/enums.js";

const gateEventSchema = new Schema(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    gateId: { type: Schema.Types.ObjectId, ref: "GateDevice", required: true, index: true },
    lotId: { type: Schema.Types.ObjectId, ref: "ParkingLot", required: true, index: true },
    eventType: {
      type: String,
      enum: Object.values(GateEventType),
      required: true,
    },
    occurredAt: { type: Date, required: true, index: true },
    credentialHash: { type: String, default: "" },
    vehicleId: { type: Schema.Types.ObjectId, ref: "Vehicle", index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    result: { type: String, default: "" },
    reason: { type: String, default: "" },
    source: {
      type: String,
      enum: Object.values(GateEventSource),
      default: GateEventSource.DEMO,
    },
    processedAt: { type: Date, default: Date.now },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

export type GateEventDocument = HydratedDocument<{
  eventId: string;
  gateId: Types.ObjectId;
  lotId: Types.ObjectId;
  eventType: GateEventType;
  occurredAt: Date;
  credentialHash: string;
  vehicleId?: Types.ObjectId;
  userId?: Types.ObjectId;
  result: string;
  reason: string;
  source: GateEventSource;
  processedAt: Date;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}>;

export const GateEvent = model("GateEvent", gateEventSchema);
