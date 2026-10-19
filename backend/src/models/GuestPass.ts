import { Schema, model, type HydratedDocument, Types } from "mongoose";
import { GuestPassStatus } from "../types/enums.js";

const guestPassSchema = new Schema(
  {
    creatorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    displayCode: { type: String, required: true },
    qrVersion: { type: Number, default: 1 },
    lotId: { type: Schema.Types.ObjectId, ref: "ParkingLot" },
    validFrom: { type: Date, required: true },
    expiresAt: { type: Date, required: true, index: true },
    maxUses: { type: Number, default: 1 },
    usedCount: { type: Number, default: 0 },
    revokedAt: { type: Date },
    status: {
      type: String,
      enum: Object.values(GuestPassStatus),
      default: GuestPassStatus.ACTIVE,
      index: true,
    },
  },
  { timestamps: true },
);

export type GuestPassDocument = HydratedDocument<{
  creatorId: Types.ObjectId;
  tokenHash: string;
  displayCode: string;
  qrVersion: number;
  lotId?: Types.ObjectId;
  validFrom: Date;
  expiresAt: Date;
  maxUses: number;
  usedCount: number;
  revokedAt?: Date;
  status: GuestPassStatus;
  createdAt: Date;
  updatedAt: Date;
}>;

export const GuestPass = model("GuestPass", guestPassSchema);
