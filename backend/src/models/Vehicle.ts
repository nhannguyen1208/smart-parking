import { Schema, model, type HydratedDocument, Types } from "mongoose";
import { VehicleStatus } from "../types/enums.js";

const vehicleSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    plateNumber: { type: String, required: true, trim: true, uppercase: true },
    plateNormalized: { type: String, required: true, unique: true, index: true },
    vehicleType: { type: String, default: "motorcycle" },
    make: { type: String, default: "" },
    color: { type: String, default: "" },
    status: {
      type: String,
      enum: Object.values(VehicleStatus),
      default: VehicleStatus.ACTIVE,
    },
    primary: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type VehicleDocument = HydratedDocument<{
  ownerId: Types.ObjectId;
  plateNumber: string;
  plateNormalized: string;
  vehicleType: string;
  make: string;
  color: string;
  status: VehicleStatus;
  primary: boolean;
  createdAt: Date;
  updatedAt: Date;
}>;

export const Vehicle = model("Vehicle", vehicleSchema);

export function normalizePlate(plate: string) {
  return plate.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

export function toPublicVehicle(v: VehicleDocument) {
  return {
    id: v._id.toString(),
    ownerId: v.ownerId.toString(),
    plateNumber: v.plateNumber,
    vehicleType: v.vehicleType,
    make: v.make,
    color: v.color,
    status: v.status,
    primary: v.primary,
  };
}
