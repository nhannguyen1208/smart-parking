import { Schema, model } from "mongoose";
import { ParkingEventType } from "../types/enums.js";

const parkingEventSchema = new Schema(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "ParkingSession", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    zoneId: { type: Schema.Types.ObjectId, ref: "ParkingZone", required: true },
    type: { type: String, enum: Object.values(ParkingEventType), required: true },
    recordedAt: { type: Date, required: true },
  },
  { timestamps: true },
);

export const ParkingEvent = model("ParkingEvent", parkingEventSchema);
