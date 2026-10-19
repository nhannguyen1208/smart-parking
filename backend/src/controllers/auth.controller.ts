import bcrypt from "bcrypt";
import type { Response } from "express";
import { User, toPublicUser } from "../models/User.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { sendData, sendError } from "../utils/apiResponse.js";
import { clearAuthCookie, setAuthCookie, signToken } from "../utils/jwt.js";
import { loginSchema } from "../validators/auth.js";

export async function login(req: AuthenticatedRequest, res: Response) {
  const input = loginSchema.parse(req.body);

  const query = input.email
    ? { email: input.email.toLowerCase() }
    : { studentId: input.studentId };

  const user = await User.findOne(query).select("+passwordHash");

  if (!user) {
    return sendError(res, "INVALID_CREDENTIALS", "Invalid email or password", 401);
  }

  const validPassword = await bcrypt.compare(input.password, user.passwordHash);

  if (!validPassword) {
    return sendError(res, "INVALID_CREDENTIALS", "Invalid email or password", 401);
  }

  const token = signToken({ sub: user._id.toString(), role: user.role });
  setAuthCookie(res, token);

  return sendData(res, {
    user: toPublicUser(user),
    token,
  });
}

export async function me(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return sendError(res, "UNAUTHORIZED", "Authentication required", 401);
  }

  return sendData(res, { user: toPublicUser(req.user) });
}

export function logout(_req: AuthenticatedRequest, res: Response) {
  clearAuthCookie(res);
  return sendData(res, { success: true });
}
