import { Schema, model } from "mongoose";
import { ParkingSessionStatus } from "../types/enums.js";

const parkingSessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    zoneId: { type: Schema.Types.ObjectId, ref: "ParkingZone", required: true },
    entryTime: { type: Date, required: true },
    exitTime: { type: Date },
    status: {
      type: String,
      enum: Object.values(ParkingSessionStatus),
      required: true,
    },
  },
  { timestamps: true },
);

export const ParkingSession = model("ParkingSession", parkingSessionSchema);
