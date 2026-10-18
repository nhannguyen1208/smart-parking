import { Schema, model } from "mongoose";
import { IoTDeviceStatus } from "../types/enums.js";

const iotDeviceSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    deviceId: { type: String, required: true, unique: true, trim: true },
    zoneId: { type: Schema.Types.ObjectId, ref: "ParkingZone" },
    status: {
      type: String,
      enum: Object.values(IoTDeviceStatus),
      default: IoTDeviceStatus.OFFLINE,
    },
    lastSeenAt: { type: Date },
  },
  { timestamps: true },
);

export const IoTDevice = model("IoTDevice", iotDeviceSchema);
