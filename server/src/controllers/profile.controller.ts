import type { Response } from "express";
import { toPublicUser } from "../models/User.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { sendData } from "../utils/apiResponse.js";
import { getActiveMembership } from "../services/dashboard.service.js";
import { updateProfileSchema } from "../validators/auth.js";

export async function getProfile(req: AuthenticatedRequest, res: Response) {
  const user = req.user!;
  const activeMembership = await getActiveMembership(user._id.toString());

  return sendData(res, {
    user: toPublicUser(user),
    activeMembership,
  });
}

export async function updateProfile(req: AuthenticatedRequest, res: Response) {
  const input = updateProfileSchema.parse(req.body);
  const user = req.user!;

  if (input.name !== undefined) user.name = input.name;
  if (input.vehicleNumber !== undefined) user.vehicleNumber = input.vehicleNumber;
  if (input.vehicleType !== undefined) user.vehicleType = input.vehicleType;

  await user.save();

  return sendData(res, { user: toPublicUser(user) });
}
