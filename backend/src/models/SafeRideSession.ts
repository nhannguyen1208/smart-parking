import { Schema, model, type HydratedDocument, Types } from "mongoose";

const latLngSchema = new Schema(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    label: { type: String },
  },
  { _id: false },
);

const safeRideSessionSchema = new Schema(
  {
    token: { type: String, required: true, unique: true, index: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: "Vehicle" },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    plate: { type: String, default: "" },
    riderName: { type: String, default: "" },
    startLabel: { type: String, default: "" },
    destLabel: { type: String, default: "" },
    /** Full planned route for shared map (family can open same trip) */
    route: { type: [latLngSchema], default: [] },
    progress: { type: Number, default: 0 },
    status: { type: String, default: "ACTIVE", index: true },
    expiresAt: { type: Date, required: true, index: true },
    lastLat: { type: Number },
    lastLng: { type: Number },
    lastAt: { type: Date },
  },
  { timestamps: true },
);

export type SafeRideSessionDocument = HydratedDocument<{
  token: string;
  vehicleId?: Types.ObjectId;
  ownerId: Types.ObjectId;
  plate: string;
  riderName: string;
  startLabel: string;
  destLabel: string;
  route: Array<{ latitude: number; longitude: number; label?: string }>;
  progress: number;
  status: string;
  expiresAt: Date;
  lastLat?: number | null;
  lastLng?: number | null;
  lastAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}>;

export const SafeRideSession = model("SafeRideSession", safeRideSessionSchema);

export function toPublicSafeRideSession(session: {
  token: string;
  vehicleId?: { toString(): string } | null;
  plate?: string | null;
  riderName?: string | null;
  startLabel?: string | null;
  destLabel?: string | null;
  route?: Array<{ latitude: number; longitude: number; label?: string }> | null;
  progress?: number | null;
  status: string;
  expiresAt: Date;
  lastLat?: number | null;
  lastLng?: number | null;
  lastAt?: Date | null;
  createdAt: Date;
}) {
  return {
    token: session.token,
    vehicleId: session.vehicleId?.toString() ?? null,
    plate: session.plate || "",
    name: session.riderName || "",
    riderName: session.riderName || "",
    startLabel: session.startLabel || "",
    destLabel: session.destLabel || "",
    route: Array.isArray(session.route) ? session.route : [],
    progress: typeof session.progress === "number" ? session.progress : 0,
    status: session.status,
    expiresAt: session.expiresAt.toISOString(),
    startedAt: session.createdAt.toISOString(),
    lastLocation:
      session.lastLat != null && session.lastLng != null
        ? {
            latitude: session.lastLat,
            longitude: session.lastLng,
            at: session.lastAt?.toISOString() ?? null,
          }
        : null,
    createdAt: session.createdAt.toISOString(),
  };
}
