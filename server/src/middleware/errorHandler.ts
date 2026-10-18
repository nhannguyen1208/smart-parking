import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { sendError } from "../utils/apiResponse.js";

export function notFoundHandler(_req: Request, res: Response) {
  sendError(res, "NOT_FOUND", "Resource not found", 404);
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof ZodError) {
    const message = error.errors.map((issue) => issue.message).join(", ");
    return sendError(res, "VALIDATION_ERROR", message, 400);
  }

  if (error && typeof error === "object" && "code" in error) {
    const mongoError = error as { code?: number; keyPattern?: Record<string, unknown> };
    if (mongoError.code === 11000) {
      const field = Object.keys(mongoError.keyPattern ?? {})[0] ?? "field";
      return sendError(
        res,
        "DUPLICATE_ENTRY",
        `A record with this ${field} already exists`,
        409,
      );
    }
  }

  console.error(error);
  return sendError(res, "INTERNAL_ERROR", "An unexpected error occurred", 500);
}
