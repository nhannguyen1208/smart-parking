import type { Response } from "express";

export function sendData<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({ data });
}

/** Alias used by /api/v1 routes */
export const sendSuccess = sendData;

export function sendError(
  res: Response,
  error: string,
  message: string,
  status: number,
) {
  return res.status(status).json({ error, message });
}
