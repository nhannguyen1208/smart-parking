import type { Response } from "express";
import { ParkingZone, toPublicZone } from "../models/ParkingZone.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { sendData } from "../utils/apiResponse.js";
import { getParkingSummary } from "../services/dashboard.service.js";

export async function getZones(_req: AuthenticatedRequest, res: Response) {
  const zones = await ParkingZone.find({ isActive: true }).sort({ name: 1 });
  return sendData(res, { zones: zones.map(toPublicZone) });
}

export async function getParkingOverview(_req: AuthenticatedRequest, res: Response) {
  const summary = await getParkingSummary();
  return sendData(res, summary);
}
