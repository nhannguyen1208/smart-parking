import { Schema, model, type HydratedDocument } from "mongoose";
import { UserRole } from "../types/enums.js";

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
    vehicleNumber: { type: String, default: "" },
    vehicleType: { type: String, default: "" },
  },
  { timestamps: true },
);

export type UserDocument = HydratedDocument<{
  studentId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  vehicleNumber: string;
  vehicleType: string;
  createdAt: Date;
  updatedAt: Date;
}>;

export const User = model("User", userSchema);

export function toPublicUser(user: UserDocument) {
  return {
    id: user._id.toString(),
    studentId: user.studentId,
    name: user.name,
    email: user.email,
    role: user.role,
    vehicleNumber: user.vehicleNumber,
    vehicleType: user.vehicleType,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
