import { Schema, model, type HydratedDocument } from "mongoose";
import { UserRole, UserStatus } from "../types/enums.js";

const userSchema = new Schema(
  {
    studentId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: Object.values(UserRole), required: true },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.ACTIVE,
    },
    vehicleNumber: { type: String, default: "" },
    vehicleType: { type: String, default: "" },
    /** Linked Zalo Mini App phone (84…) — shared with web identity */
    phone: { type: String, unique: true, sparse: true, trim: true },
    /** Linked Zalo user id */
    zaloUserId: { type: String, unique: true, sparse: true, trim: true },
    preferences: {
      qrTheme: { type: String, trim: true, default: undefined },
    },
  },
  { timestamps: true },
);

export type UserPreferences = {
  qrTheme?: string | null;
};

export type UserDocument = HydratedDocument<{
  studentId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  vehicleNumber: string;
  vehicleType: string;
  phone?: string | null;
  zaloUserId?: string | null;
  preferences?: UserPreferences | null;
  createdAt: Date;
  updatedAt: Date;
}>;

export const User = model("User", userSchema);

export function toPublicUser(user: {
  _id: { toString(): string };
  studentId: string;
  name: string;
  email: string;
  role: UserRole;
  status?: UserStatus;
  vehicleNumber?: string;
  vehicleType?: string;
  phone?: string | null;
  zaloUserId?: string | null;
  preferences?: UserPreferences | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user._id.toString(),
    studentId: user.studentId,
    name: user.name,
    displayName: user.name,
    email: user.email,
    role: user.role,
    status: user.status ?? UserStatus.ACTIVE,
    vehicleNumber: user.vehicleNumber,
    vehicleType: user.vehicleType,
    phone: user.phone ?? null,
    zaloUserId: user.zaloUserId ?? null,
    linkedZalo: Boolean(user.zaloUserId || user.phone),
    preferences: {
      qrTheme: user.preferences?.qrTheme ?? null,
    },
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
