import type { NextFunction, Request, Response } from "express";
import { User, type UserDocument } from "../models/User.js";
import { sendError } from "../utils/apiResponse.js";
import { TOKEN_COOKIE, verifyToken } from "../utils/jwt.js";

export type AuthenticatedRequest = Request & {
  user?: UserDocument;
  tokenPayload?: { sub: string; role: string };
};

function extractToken(req: Request) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return req.cookies?.[TOKEN_COOKIE] as string | undefined;
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const token = extractToken(req);

  if (!token) {
    return sendError(res, "UNAUTHORIZED", "Authentication required", 401);
  }

  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.sub).select("+passwordHash");

    if (!user) {
      return sendError(res, "UNAUTHORIZED", "User not found", 401);
    }

    req.user = user;
    req.tokenPayload = payload;
    next();
  } catch (error) {
    if (error instanceof Error && error.name === "TokenExpiredError") {
      return sendError(res, "EXPIRED_TOKEN", "Session expired. Please sign in again.", 401);
    }
    return sendError(res, "UNAUTHORIZED", "Invalid authentication token", 401);
  }
}

export function requireRoles(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendError(res, "FORBIDDEN", "You do not have permission to access this resource", 403);
    }
    next();
  };
}
