import crypto from "node:crypto";
import { Schema, model, type HydratedDocument, Types } from "mongoose";
import {
  RfidCredentialStatus,
  RfidCredentialType,
} from "../types/enums.js";

const rfidSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: "Vehicle", index: true },
    credentialType: {
      type: String,
      enum: Object.values(RfidCredentialType),
      default: RfidCredentialType.UHF_STICKER,
    },
    tokenHash: { type: String, required: true, unique: true, index: true },
    displaySuffix: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(RfidCredentialStatus),
      default: RfidCredentialStatus.ACTIVE,
      index: true,
    },
    issuedAt: { type: Date, default: Date.now },
    revokedAt: { type: Date },
    revokeReason: { type: String, default: "" },
  },
  { timestamps: true },
);

export type RfidCredentialDocument = HydratedDocument<{
  ownerId: Types.ObjectId;
  vehicleId?: Types.ObjectId;
  credentialType: RfidCredentialType;
  tokenHash: string;
  displaySuffix: string;
  status: RfidCredentialStatus;
  issuedAt: Date;
  revokedAt?: Date;
  revokeReason: string;
  createdAt: Date;
  updatedAt: Date;
}>;

export const RfidCredential = model("RfidCredential", rfidSchema);

export function hashCredentialToken(raw: string) {
  return crypto.createHash("sha256").update(raw.trim().toUpperCase()).digest("hex");
}

export function displaySuffixFromRaw(raw: string) {
  const clean = raw.trim().toUpperCase();
  return clean.slice(-4);
}

export function toPublicRfid(c: {
  _id: { toString(): string };
  ownerId: { toString(): string };
  vehicleId?: { toString(): string } | null;
  credentialType: RfidCredentialType;
  displaySuffix: string;
  status: RfidCredentialStatus;
  issuedAt: Date;
  revokedAt?: Date | null;
}) {
  return {
    id: c._id.toString(),
    ownerId: c.ownerId.toString(),
    vehicleId: c.vehicleId?.toString() ?? null,
    credentialType: c.credentialType,
    displaySuffix: c.displaySuffix,
    status: c.status,
    issuedAt: c.issuedAt,
    revokedAt: c.revokedAt ?? null,
  };
}
