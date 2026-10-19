import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { sendData } from "../utils/apiResponse.js";
import { getParkingSummary } from "../services/dashboard.service.js";

export async function getZones(_req: AuthenticatedRequest, res: Response) {
  const summary = await getParkingSummary();
  return sendData(res, { zones: summary.zones });
}

export async function getParkingOverview(_req: AuthenticatedRequest, res: Response) {
  const summary = await getParkingSummary();
  return sendData(res, summary);
}
